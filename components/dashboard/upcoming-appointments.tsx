"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, Clock, Loader2 } from "lucide-react"
import { StatusBadge } from "@/components/status-badge"
import { useAppointments } from "@/lib/appointments-context"
import { useSettings } from "@/lib/settings-context"
import { formatAppDate } from "@/lib/utils"

export function UpcomingAppointments() {
  // Використовуємо новий хук для записів
  const { appointments, isLoading } = useAppointments()
  const { settings } = useSettings()

  // 1. Фільтруємо та сортуємо записи за новим полем scheduledAt
  const upcoming = [...appointments]
    .filter((a) => {
      const s = a.status?.toUpperCase() || ""
      // Відкидаємо завершені, скасовані та ті, де клієнт не з'явився
      return s !== "CANCELLED" && s !== "COMPLETED" && s !== "NO_SHOW"
    })
    .sort((a, b) => {
      // Сортуємо за датою (від найближчих)
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    })
    .slice(0, 4)

  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">
            Майбутні візити
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
          Майбутні візити
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Немає запланованих зустрічей на найближчий час.
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((appt) => {
              // 2. Дістаємо авто та власника через вкладений об'єкт order
              const vehicle = appt.order?.car
              const customer = vehicle?.user
              const description = appt.order?.description || "Сервісне обслуговування"
              
              // 3. Форматуємо дату та час з scheduledAt
              const dateObj = new Date(appt.scheduledAt)
              const formattedDate = formatAppDate(appt.scheduledAt, settings.dateFormat)
              const formattedTime = dateObj.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })

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
                        {customer ? `${customer.firstName} ${customer.lastName}` : "Клієнт невідомий"}
                      </p>
                      <StatusBadge status={appt.status} />
                    </div>
                    <p className="text-xs text-muted-foreground truncate" title={description}>
                      {vehicle ? `${vehicle.brand} ${vehicle.model}` : "Авто не вказано"} • {description}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-3" />
                        {formattedDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {formattedTime}
                      </span>
                      {appt.estimatedMin && (
                        <span className="flex items-center gap-1">
                          ~{appt.estimatedMin} хв
                        </span>
                      )}
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