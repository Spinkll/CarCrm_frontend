"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, Clock, Loader2 } from "lucide-react"
import { StatusBadge } from "@/components/status-badge"
import { useCrm } from "@/lib/crm-context"

export function UpcomingAppointments() {
  const { appointments, customers, vehicles, isLoading } = useCrm()

  // 1. Нормалізуємо статуси (бо з бази вони можуть прийти як CANCELLED чи COMPLETED)
  const upcoming = [...appointments]
    .filter((a) => {
      const s = a.status?.toLowerCase() || ""
      return s !== "cancelled" && s !== "completed"
    })
    .sort((a, b) => {
      // Запобіжник: якщо date або time прийдуть пустими з бази, не даємо сортуванню впасти
      const dateA = new Date(`${a.date}T${a.time || '00:00'}`).getTime()
      const dateB = new Date(`${b.date}T${b.time || '00:00'}`).getTime()
      return dateA - dateB
    })
    .slice(0, 4)

  // 2. Додаємо стан завантаження
  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">
            Upcoming Appointments
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground">
          Upcoming Appointments
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No upcoming appointments scheduled.
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((appt) => {
              // 3. Зв'язки за ключами бази даних (carId -> userId)
              const vehicle = vehicles.find((v) => v.id === appt.carId)
              const customer = customers.find((c) => c.id === vehicle?.userId)
              
              return (
                <div
                  key={appt.id}
                  className="flex items-center gap-4 rounded-lg border border-border bg-secondary/30 p-3 transition-colors hover:bg-secondary/50"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <CalendarDays className="size-5 text-primary" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {/* 4. Використовуємо firstName та lastName */}
                        {customer ? `${customer.firstName} ${customer.lastName}` : "Unknown Client"}
                      </p>
                      <StatusBadge status={appt.status} />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {/* 5. Використовуємо brand замість make */}
                      {vehicle ? `${vehicle.year} ${vehicle.brand} ${vehicle.model}` : "N/A"} • {appt.service}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-3" />
                        {/* 6. Форматуємо дату для читабельності */}
                        {new Date(appt.date).toLocaleDateString()}
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
        )}
      </CardContent>
    </Card>
  )
}