"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { useCrm } from "@/lib/crm-context"
import { Car, ClipboardList, CalendarDays, DollarSign, Clock, Loader2 } from "lucide-react"
import { useMemo } from "react"

export function ClientDashboard() {
  const { filteredOrders, filteredVehicles, filteredAppointments, isLoading } = useCrm()

  const totalSpent = useMemo(() => {
    return filteredOrders
      .filter((o) => o.status?.toLowerCase() === "completed" || o.status?.toLowerCase() === "paid")
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)
  }, [filteredOrders])

  // 2. Активні замовлення (додаємо статус 'received' та 'pending')
  const activeOrdersCount = useMemo(() => {
    const activeStatuses = ["in_progress", "pending", "received", "scheduled", "confirmed", "waiting_parts"]
    return filteredOrders.filter((o) => 
      activeStatuses.includes(o.status?.toLowerCase())
    ).length
  }, [filteredOrders])

  // 3. Сортування майбутніх візитів
  const upcomingAppointments = useMemo(() => {
    return [...filteredAppointments]
      .filter((a) => !["cancelled", "completed"].includes(a.status?.toLowerCase()))
      .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
  }, [filteredAppointments])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  const kpis = [
    { label: "Мої автомобілі", value: filteredVehicles.length, icon: Car },
    { label: "Активні замовлення", value: activeOrdersCount, icon: ClipboardList },
    { label: "Заплановані візити", value: upcomingAppointments.length, icon: CalendarDays },
    { label: "Всього витрачено", value: `${totalSpent.toLocaleString()} ₴`, icon: DollarSign },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-border bg-card shadow-sm">
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
        {/* Секція автомобілів */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Мої автомобілі</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredVehicles.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-muted-foreground opacity-50">
                  <Car className="size-8" />
                  <p className="mt-2 text-sm">Немає зареєстрованих автомобілів</p>
                </div>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Car className="size-5 text-primary" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-medium text-foreground">
                        {vehicle.year} {vehicle.brand} {vehicle.model}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase">
                        {vehicle.plate} • {vehicle.mileage?.toLocaleString()} км
                      </p>
                    </div>
                    <div
                      className="size-4 shrink-0 rounded-full border border-black/10 shadow-sm"
                      style={{ backgroundColor: vehicle.color?.toLowerCase() || '#ccc' }}
                      title={vehicle.color}
                    />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Секція записів */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Наступні візити</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingAppointments.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-muted-foreground opacity-50">
                  <CalendarDays className="size-8" />
                  <p className="mt-2 text-sm">Немає запланованих візитів</p>
                </div>
              ) : (
                upcomingAppointments.slice(0, 5).map((appt) => {
                  const vehicle = filteredVehicles.find((v) => v.id === appt.carId)
                  return (
                    <div key={appt.id} className="flex items-center gap-4 rounded-lg border border-border bg-secondary/30 p-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Clock className="size-5 text-primary" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-foreground">{appt.service}</p>
                          <StatusBadge status={appt.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {vehicle ? `${vehicle.brand} ${vehicle.model}` : "Дані про авто відсутні"}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-[10px] font-medium text-muted-foreground uppercase">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="size-3" />
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
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Історія обслуговування */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">Історія обслуговування</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-muted-foreground opacity-50">
                <ClipboardList className="size-8" />
                <p className="mt-2 text-sm">Історія обслуговування порожня</p>
              </div>
            ) : (
              [...filteredOrders]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((order) => {
                  const vehicle = filteredVehicles.find((v) => v.id === order.carId)
                  return (
                    <div key={order.id} className="flex items-center justify-between gap-4 rounded-lg border border-border bg-secondary/30 p-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <ClipboardList className="size-5 text-primary" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="truncate text-sm font-medium text-foreground">{order.description || "Обслуговування авто"}</p>
                          <p className="text-xs text-muted-foreground">
                            {vehicle ? `${vehicle.brand} ${vehicle.model}` : "Автомобіль"} • {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <StatusBadge status={order.status} />
                        <span className="text-sm font-bold text-foreground whitespace-nowrap">
                          {Number(order.totalAmount || 0).toLocaleString()} ₴
                        </span>
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