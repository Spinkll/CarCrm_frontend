"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { useCrm } from "@/lib/crm-context"
import { ClipboardList, CalendarDays, Clock, Wrench, CheckCircle2 } from "lucide-react"

export function MechanicDashboard() {
  const { filteredOrders, filteredAppointments, customers, vehicles } = useCrm()

  const activeOrders = filteredOrders.filter(
    (o) => o.status === "in-progress" || o.status === "pending"
  )
  const completedOrders = filteredOrders.filter((o) => o.status === "completed")

  const todayStr = new Date().toISOString().split("T")[0]
  const todayAppointments = filteredAppointments.filter((a) => a.date === todayStr)

  const kpis = [
    { label: "Active Orders", value: activeOrders.length, icon: ClipboardList },
    { label: "Completed", value: completedOrders.length, icon: CheckCircle2 },
    { label: "Today's Appointments", value: todayAppointments.length, icon: CalendarDays },
    { label: "Total Assigned", value: filteredOrders.length, icon: Wrench },
  ]

  return (
    <div className="space-y-6">
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
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">My Active Orders</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="pl-6 text-muted-foreground">Order</TableHead>
                  <TableHead className="text-muted-foreground">Customer</TableHead>
                  <TableHead className="text-muted-foreground">Vehicle</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="pr-6 text-right text-muted-foreground">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeOrders.map((order) => {
                  const customer = customers.find((c) => c.id === order.customerId)
                  const vehicle = vehicles.find((v) => v.id === order.vehicleId)
                  return (
                    <TableRow key={order.id} className="border-border">
                      <TableCell className="pl-6 font-medium font-mono text-foreground">{order.id}</TableCell>
                      <TableCell className="text-foreground">{customer?.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "N/A"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="pr-6 text-right font-medium text-foreground">
                        ${order.totalCost.toLocaleString()}
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
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">{"Today's Appointments"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayAppointments.length === 0 && (
                <div className="flex flex-col items-center py-8 text-muted-foreground">
                  <CalendarDays className="size-8" />
                  <p className="mt-2 text-sm">No appointments today</p>
                </div>
              )}
              {todayAppointments
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((appt) => {
                  const customer = customers.find((c) => c.id === appt.customerId)
                  const vehicle = vehicles.find((v) => v.id === appt.vehicleId)
                  return (
                    <div
                      key={appt.id}
                      className="flex items-center gap-4 rounded-lg border border-border bg-secondary/50 p-3"
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Clock className="size-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">{appt.time} - {customer?.name}</p>
                          <StatusBadge status={appt.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "N/A"} - {appt.service}
                        </p>
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
