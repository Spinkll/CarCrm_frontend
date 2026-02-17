"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { useCrm } from "@/lib/crm-context"
import { Car, ClipboardList, CalendarDays, DollarSign, Clock } from "lucide-react"

export function ClientDashboard() {
  const { filteredOrders, filteredVehicles, filteredAppointments, customers } = useCrm()

  const totalSpent = filteredOrders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + o.totalCost, 0)

  const activeOrders = filteredOrders.filter(
    (o) => o.status === "in-progress" || o.status === "pending"
  )

  const upcomingAppointments = filteredAppointments
    .filter((a) => a.status !== "cancelled" && a.status !== "completed")
    .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())

  const kpis = [
    { label: "My Vehicles", value: filteredVehicles.length, icon: Car },
    { label: "Active Orders", value: activeOrders.length, icon: ClipboardList },
    { label: "Upcoming Appointments", value: upcomingAppointments.length, icon: CalendarDays },
    { label: "Total Spent", value: `$${totalSpent.toLocaleString()}`, icon: DollarSign },
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
        {/* My Vehicles */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">My Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredVehicles.length === 0 && (
                <div className="flex flex-col items-center py-8 text-muted-foreground">
                  <Car className="size-8" />
                  <p className="mt-2 text-sm">No vehicles registered</p>
                </div>
              )}
              {filteredVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 p-3"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Car className="size-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {vehicle.licensePlate} - {vehicle.mileage.toLocaleString()} mi
                    </p>
                  </div>
                  <div
                    className="size-4 rounded-full border border-border"
                    style={{
                      backgroundColor:
                        vehicle.color.toLowerCase() === "white"
                          ? "#e5e5e5"
                          : vehicle.color.toLowerCase() === "silver"
                            ? "#a8a8a8"
                            : vehicle.color.toLowerCase(),
                    }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingAppointments.length === 0 && (
                <div className="flex flex-col items-center py-8 text-muted-foreground">
                  <CalendarDays className="size-8" />
                  <p className="mt-2 text-sm">No upcoming appointments</p>
                </div>
              )}
              {upcomingAppointments.slice(0, 5).map((appt) => {
                const vehicle = filteredVehicles.find((v) => v.id === appt.vehicleId)
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
                        <p className="text-sm font-medium text-foreground">{appt.service}</p>
                        <StatusBadge status={appt.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "N/A"}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="size-3" />
                          {appt.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {appt.time}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">My Service History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredOrders.length === 0 && (
              <div className="flex flex-col items-center py-8 text-muted-foreground">
                <ClipboardList className="size-8" />
                <p className="mt-2 text-sm">No service orders yet</p>
              </div>
            )}
            {filteredOrders
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 6)
              .map((order) => {
                const vehicle = filteredVehicles.find((v) => v.id === order.vehicleId)
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <ClipboardList className="size-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{order.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "N/A"} - {order.createdAt}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={order.status} />
                      <span className="font-medium text-foreground">${order.totalCost.toLocaleString()}</span>
                    </div>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
