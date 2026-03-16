"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { useCrm } from "@/lib/crm-context"
import { useOrders } from "@/lib/orders-context"
import { useAppointments } from "@/lib/appointments-context"
import { useNotifications } from "@/lib/notifications-context"
import { useEffect, useMemo } from "react"
import { toast } from "@/hooks/use-toast"
import {
  ClipboardList,
  CalendarDays,
  Clock,
  Wrench,
  CheckCircle2,
  Loader2,
  Play,
  CircleCheckBig,
  Eye,
  Car,
} from "lucide-react"

export function MechanicDashboard() {
  const router = useRouter()
  const { filteredAppointments, customers, isLoading: isCrmLoading, refreshData: refreshCrm } = useCrm()
  const { orders, fetchOrders, updateStatus: updateOrderStatus, isLoading: isOrdersLoading } = useOrders()
  const { appointments, updateStatus: updateAppointmentStatus } = useAppointments()
  const { fetchNotifications } = useNotifications()

  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null)

  const isLoading = isCrmLoading || isOrdersLoading

  // Local calculation of mechanic's assigned orders (exclude permanently closed)
  const mechanicOrders = useMemo(() => {
    return orders.filter(o => o.status !== "COMPLETED" && o.status !== "PAID" && o.status !== "CANCELLED")
  }, [orders])

  // Active orders
  const activeOrders = useMemo(() => {
    return mechanicOrders.filter((o) => {
      const s = o.status?.toLowerCase()
      return s === "in_progress" || s === "pending" || s === "received" || s === "waiting_parts" || s === "confirmed"
    })
  }, [mechanicOrders])

  const completedOrders = useMemo(() => {
    // For KPIs we can check all orders, not just mechanicOrders since mechanicOrders excludes completed ones now
    return orders.filter((o) => o.status?.toLowerCase() === "completed" || o.status?.toLowerCase() === "paid")
  }, [orders])

  // Today's appointments
  const todayAppointments = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0]
    return filteredAppointments.filter((a) => {
      const apptDate = a.scheduledAt?.split("T")[0]
      return apptDate === todayStr
    })
  }, [filteredAppointments])

  const kpis = [
    { label: "В роботі", value: activeOrders.length, icon: ClipboardList },
    { label: "Завершено (Усі)", value: completedOrders.length, icon: CheckCircle2 },
    { label: "Записи на сьогодні", value: todayAppointments.length, icon: CalendarDays },
    { label: "Відкриті замовлення", value: mechanicOrders.length, icon: Wrench },
  ]

  // Quick status change handler
  const handleQuickStatus = async (orderId: number, newStatus: string) => {
    setUpdatingOrderId(orderId)
    try {
      await updateOrderStatus(orderId, newStatus)

      // Sync appointment status
      const orderToApptStatus: Record<string, string> = {
        IN_PROGRESS: "ARRIVED",
        COMPLETED: "COMPLETED",
      }
      const apptStatus = orderToApptStatus[newStatus]
      if (apptStatus) {
        const relatedAppt = appointments.find(a => a.orderId === orderId)
        if (relatedAppt && relatedAppt.status !== apptStatus) {
          await updateAppointmentStatus(relatedAppt.id, apptStatus)
        }
      }

      fetchOrders(true)
      refreshCrm()
      fetchNotifications()

      const statusMessages: Record<string, string> = {
        IN_PROGRESS: "Роботу розпочато",
        COMPLETED: "Роботу завершено",
      }
      toast({ title: statusMessages[newStatus] || "Статус оновлено", variant: "success" })
    } catch {
      toast({ title: "Не вдалося оновити статус", variant: "destructive" })
    } finally {
      setUpdatingOrderId(null)
    }
  }

  // What action button to show for each order
  const getActionButton = (order: any) => {
    const status = order.status?.toUpperCase()
    const isUpdating = updatingOrderId === order.id

    if (status === "PENDING" || status === "CONFIRMED" || status === "RECEIVED") {
      return (
        <Button
          size="sm"
          className="gap-1.5 text-xs h-7 bg-primary hover:bg-primary/90 shadow-sm"
          onClick={(e) => { e.stopPropagation(); handleQuickStatus(order.id, "IN_PROGRESS") }}
          disabled={isUpdating}
        >
          {isUpdating ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3" />}
          Почати
        </Button>
      )
    }

    if (status === "IN_PROGRESS" || status === "WAITING_PARTS") {
      return (
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs h-7 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 shadow-sm dark:text-emerald-400 dark:hover:text-emerald-300"
          onClick={(e) => { e.stopPropagation(); handleQuickStatus(order.id, "COMPLETED") }}
          disabled={isUpdating}
        >
          {isUpdating ? <Loader2 className="size-3 animate-spin" /> : <CircleCheckBig className="size-3" />}
          Завершити
        </Button>
      )
    }

    return null
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-border bg-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <kpi.icon className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Orders - card-based for quick actions */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-sm font-medium text-foreground">Мої активні замовлення</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          {activeOrders.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <CheckCircle2 className="size-8 opacity-20" />
              <p className="mt-2 text-sm">У вас немає активних замовлень 🎉</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeOrders.map((order) => {
                const vehicle = order.car
                const customer = customers.find((c) => c.id === vehicle?.userId)

                return (
                  <div
                    key={order.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-secondary/20 p-3 transition-colors hover:bg-secondary/40 cursor-pointer group"
                    onClick={() => router.push(`/orders-detail/${order.id}`)}
                  >
                    {/* Car icon */}
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Car className="size-5 text-primary" />
                    </div>

                    {/* Order info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-mono font-semibold text-primary/80">#{order.id}</span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">
                        {vehicle ? `${vehicle.brand} ${vehicle.model}` : "Немає даних"}
                        {customer ? ` — ${customer.firstName} ${customer.lastName}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {order.description || "Без опису"}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0 mr-1">
                      <p className="text-sm font-bold text-foreground">
                        {Number(order.totalAmount || 0).toLocaleString()} ₴
                      </p>
                    </div>

                    {/* Quick action button */}
                    <div className="shrink-0">
                      {getActionButton(order) || (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1 text-xs h-7"
                          onClick={(e) => { e.stopPropagation(); router.push(`/orders-detail/${order.id}`) }}
                        >
                          <Eye className="size-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Schedule */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">Розклад на сьогодні</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {todayAppointments.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-muted-foreground">
                <CalendarDays className="size-8 opacity-20" />
                <p className="mt-2 text-sm">На сьогодні записів немає</p>
              </div>
            ) : (
              todayAppointments
                .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
                .map((appt) => {
                  const car = appt.order?.car
                  const customer = car?.user
                  const timeStr = appt.scheduledAt ? new Date(appt.scheduledAt).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" }) : ""
                  return (
                    <div
                      key={appt.id}
                      className="flex items-center gap-4 rounded-lg border border-border bg-secondary/30 p-3"
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Clock className="size-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {timeStr} - {customer ? `${customer.firstName}` : "Клієнт"}
                          </p>
                          <StatusBadge status={appt.status} />
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {car ? `${car.brand} ${car.model}` : "Невідоме авто"} — {appt.order?.description || "Без опису"}
                        </p>
                      </div>
                    </div>
                  )
                })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}