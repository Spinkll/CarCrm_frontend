"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { useCrm } from "@/lib/crm-context"
import { ClipboardList, CalendarDays, Clock, Wrench, CheckCircle2, Loader2 } from "lucide-react"
import { useMemo } from "react"

export function MechanicDashboard() {
  const { filteredOrders, filteredAppointments, customers, vehicles, isLoading } = useCrm()

  // 1. Фільтрація замовлень (враховуємо можливий регістр з БД)
  const activeOrders = useMemo(() => {
    return filteredOrders.filter((o) => {
      const s = o.status?.toLowerCase()
      return s === "in_progress" || s === "pending" || s === "received"
    })
  }, [filteredOrders])

  const completedOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.status?.toLowerCase() === "completed")
  }, [filteredOrders])

  // 2. Сьогоднішні записи
  const todayAppointments = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0]
    return filteredAppointments.filter((a) => a.date === todayStr)
  }, [filteredAppointments])

  const kpis = [
    { label: "Active Orders", value: activeOrders.length, icon: ClipboardList },
    { label: "Completed", value: completedOrders.length, icon: CheckCircle2 },
    { label: "Today's Appointments", value: todayAppointments.length, icon: CalendarDays },
    { label: "Total Assigned", value: filteredOrders.length, icon: Wrench },
  ]

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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Orders Table */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">My Active Orders</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="pl-6 text-muted-foreground">ID</TableHead>
                    <TableHead className="text-muted-foreground">Customer</TableHead>
                    <TableHead className="text-muted-foreground">Vehicle</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="pr-6 text-right text-muted-foreground">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeOrders.map((order) => {
                    const vehicle = vehicles.find((v) => v.id === order.carId)
                    const customer = customers.find((c) => c.id === (vehicle?.userId || order.car?.userId))
                    
                    return (
                      <TableRow key={order.id} className="border-border">
                        <TableCell className="pl-6 font-medium font-mono text-foreground text-xs">
                          #{order.id}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {customer ? `${customer.firstName} ${customer.lastName}` : "Unknown"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {vehicle ? `${vehicle.brand} ${vehicle.model}` : "N/A"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="pr-6 text-right font-medium text-foreground">
                          ${Number(order.totalAmount || 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {activeOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        No active orders assigned to you
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Today's Appointments */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayAppointments.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-muted-foreground">
                  <CalendarDays className="size-8 opacity-20" />
                  <p className="mt-2 text-sm">No appointments for today</p>
                </div>
              ) : (
                todayAppointments
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((appt) => {
                    const vehicle = vehicles.find((v) => v.id === appt.carId)
                    const customer = customers.find((c) => c.id === vehicle?.userId)
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
                              {appt.time} - {customer ? `${customer.firstName}` : "Customer"}
                            </p>
                            <StatusBadge status={appt.status} />
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {vehicle ? `${vehicle.brand} ${vehicle.model}` : "Unknown Car"} — {appt.service}
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
    </div>
  )
}