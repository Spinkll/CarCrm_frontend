"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { StatusBadge } from "@/components/status-badge"
import { useCrm } from "@/lib/crm-context"
import { useOrders } from "@/lib/orders-context"
import { useMemo } from "react"
import {
  ClipboardList,
  CalendarDays,
  Clock,
  Wrench,
  CheckCircle2,
  Loader2,
  Eye,
  Car,
  Star,
} from "lucide-react"

import { useSettings } from "@/lib/settings-context"
import { translations } from "@/lib/translations"

import { useAuth } from "@/lib/auth-context"

export function MechanicDashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const { filteredAppointments, customers, isLoading: isCrmLoading } = useCrm()
  const { orders, isLoading: isOrdersLoading } = useOrders()
  const { settings } = useSettings()

  const t = translations[settings.language].dashboard.mechanic

  const isLoading = isCrmLoading || isOrdersLoading

  // Local calculation of mechanic's assigned orders (exclude permanently closed)
  const mechanicOrders = useMemo(() => {
    return orders.filter(o =>
      o.mechanic?.id === user?.id &&
      o.status !== "COMPLETED" &&
      o.status !== "PAID" &&
      o.status !== "CANCELLED"
    )
  }, [orders, user?.id])

  // Active orders
  const activeOrders = useMemo(() => {
    return mechanicOrders.filter((o) => {
      const s = o.status?.toLowerCase()
      return s === "in_progress" || s === "pending" || s === "received" || s === "waiting_parts" || s === "confirmed"
    })
  }, [mechanicOrders])

  const completedOrders = useMemo(() => {
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

  // Calculate mechanic rating
  const mechanicRating = useMemo(() => {
    const reviews = orders
      .filter((o) => o.mechanic?.id === user?.id && o.review)
      .map((o) => o.review?.rating || 0)

    if (reviews.length === 0) return null

    const sum = reviews.reduce((a, b) => a + b, 0)
    return (sum / reviews.length).toFixed(1)
  }, [orders, user?.id])

  const kpis = [
    { label: t.myRating, value: mechanicRating ? `${mechanicRating}/5.0` : "—", icon: Star, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: t.kpiWork, value: activeOrders.length, icon: ClipboardList, color: "text-primary", bg: "bg-primary/10" },
    { label: t.kpiCompletedAll, value: completedOrders.length, icon: CheckCircle2, color: "text-primary", bg: "bg-primary/10" },
    { label: t.kpiTodayAppts, value: todayAppointments.length, icon: CalendarDays, color: "text-primary", bg: "bg-primary/10" },
    { label: t.kpiOpenOrders, value: mechanicOrders.length, icon: Wrench, color: "text-primary", bg: "bg-primary/10" },
  ]

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  const locale = settings.language === "uk" ? "uk-UA" : "en-US"

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-border bg-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className={cn("flex size-10 items-center justify-center rounded-lg", kpi.bg)}>
                  <kpi.icon className={cn("size-5", kpi.color)} />
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
          <CardTitle className="text-sm font-medium text-foreground">{t.activeOrdersTitle}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          {activeOrders.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <CheckCircle2 className="size-8 opacity-20" />
              <p className="mt-2 text-sm">{t.noActiveOrders}</p>
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
                        {vehicle ? `${vehicle.brand} ${vehicle.model}` : t.noData}
                        {customer ? ` — ${customer.firstName} ${customer.lastName}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {order.description || t.noDescription}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0 mr-1">
                      <p className="text-sm font-bold text-foreground">
                        {Number(order.totalAmount || 0).toLocaleString()} ₴
                      </p>
                    </div>

                    {/* View details button */}
                    <div className="shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-xs h-7"
                        onClick={(e) => { e.stopPropagation(); router.push(`/orders-detail/${order.id}`) }}
                      >
                        <Eye className="size-3" />
                      </Button>
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
          <CardTitle className="text-sm font-medium text-foreground">{t.todayScheduleTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {todayAppointments.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-muted-foreground">
                <CalendarDays className="size-8 opacity-20" />
                <p className="mt-2 text-sm">{t.noScheduleToday}</p>
              </div>
            ) : (
              todayAppointments
                .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
                .map((appt) => {
                  const car = appt.order?.car
                  const customer = car?.user
                  const timeStr = appt.scheduledAt ? new Date(appt.scheduledAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }) : ""
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
                            {timeStr} - {customer ? `${customer.firstName}` : t.client}
                          </p>
                          <StatusBadge status={appt.status} />
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {car ? `${car.brand} ${car.model}` : t.unknownVehicle} — {appt.order?.description || t.noDescription}
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