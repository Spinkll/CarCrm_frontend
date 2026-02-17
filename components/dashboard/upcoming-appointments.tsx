"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, Clock } from "lucide-react"
import { StatusBadge } from "@/components/status-badge"
import { useCrm } from "@/lib/crm-context"

export function UpcomingAppointments() {
  const { appointments, customers, vehicles } = useCrm()

  const upcoming = [...appointments]
    .filter((a) => a.status !== "cancelled" && a.status !== "completed")
    .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
    .slice(0, 4)

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground">
          Upcoming Appointments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcoming.map((appt) => {
            const customer = customers.find((c) => c.id === appt.customerId)
            const vehicle = vehicles.find((v) => v.id === appt.vehicleId)
            return (
              <div
                key={appt.id}
                className="flex items-center gap-4 rounded-lg border border-border bg-secondary/50 p-3"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <CalendarDays className="size-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{customer?.name}</p>
                    <StatusBadge status={appt.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "N/A"} - {appt.service}
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
  )
}
