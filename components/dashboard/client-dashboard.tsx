"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { useAuth } from "@/lib/auth-context"
import { useOrders, type Order } from "@/lib/orders-context"
import { useVehicles, type Car as VehicleType } from "@/lib/vehicles-context"
import { useAppointments } from "@/lib/appointments-context"
import { Car, ClipboardList, CalendarDays, DollarSign, Clock, Loader2, PlusCircle, Wrench } from "lucide-react"
import { useMemo } from "react"

import { useSettings } from "@/lib/settings-context"
import { translations } from "@/lib/translations"

export function ClientDashboard() {
  const { user } = useAuth()
  const { orders = [], isLoading: ordersLoading } = useOrders()
  const { vehicles = [], isLoading: vehiclesLoading } = useVehicles()
  const { appointments = [], isLoading: appointmentsLoading } = useAppointments()
  const { settings } = useSettings()

  const t = translations[settings.language].dashboard.client

  const isLoading = ordersLoading || vehiclesLoading || appointmentsLoading

  const filteredOrders = useMemo(() => {
    if (!user) return []
    return orders.filter((o: Order) => o.customerId === user.id || o.car?.userId === user.id)
  }, [orders, user])

  const filteredVehicles = useMemo(() => {
    if (!user) return []
    return vehicles.filter((v: VehicleType) => v.userId === user.id)
  }, [vehicles, user])

  const totalSpent = useMemo(() => {
    return filteredOrders
      .filter((o: Order) => o.status?.toLowerCase() === "completed" || o.status?.toLowerCase() === "paid")
      .reduce((sum, o: Order) => sum + Number(o.totalAmount || 0), 0)
  }, [filteredOrders])

  const activeOrdersCount = useMemo(() => {
    const activeStatuses = ["in_progress", "pending", "received", "scheduled", "confirmed", "waiting_parts"]
    return filteredOrders.filter((o: Order) =>
      activeStatuses.includes(o.status?.toLowerCase())
    ).length
  }, [filteredOrders])

  const upcomingAppointments = useMemo(() => {
    return [...appointments]
      .filter((a) => !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(a.status))
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
  }, [appointments])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  const kpis = [
    { label: t.myVehicles, value: filteredVehicles.length, icon: Car },
    { label: t.activeOrders, value: activeOrdersCount, icon: ClipboardList },
    { label: t.plannedVisits, value: upcomingAppointments.length, icon: CalendarDays },
    { label: t.totalSpent, value: `${totalSpent.toLocaleString()} ₴`, icon: DollarSign },
  ]

  const locale = settings.language === "uk" ? "uk-UA" : "en-US"

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

      <Card className="border-border bg-card shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">{t.quickActionTitle}</p>
            <p className="text-sm text-muted-foreground">
              {t.quickActionDesc} {filteredVehicles.length === 0
                ? t.noVehicleDesc
                : t.hasVehicleDesc}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="gap-2">
              <Link href="/orders?new=1">
                <PlusCircle className="size-4" />
                {t.createRequest}
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link href={filteredVehicles.length === 0 ? "/vehicles?new=1&returnTo=%2Forders%3Fnew%3D1" : "/vehicles"}>
                <Car className="size-4" />
                {filteredVehicles.length === 0 ? t.addVehicle : t.myVehiclesBtn}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Секція автомобілів */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">{t.myVehiclesTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredVehicles.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-muted-foreground opacity-50">
                  <Car className="size-8" />
                  <p className="mt-2 text-sm">{t.noVehicles}</p>
                </div>
              ) : (
                filteredVehicles.map((vehicle: VehicleType) => (
                  <Link
                    key={vehicle.id}
                    href={`/vehicles/${vehicle.id}`}
                    className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3 transition-colors hover:bg-secondary/50 cursor-pointer"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Car className="size-5 text-primary" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-medium text-foreground">
                        {vehicle.year} {vehicle.brand} {vehicle.model}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase">
                        {vehicle.plate} • {vehicle.mileage?.toLocaleString()} {t.km}
                      </p>
                    </div>
                    <div
                      className="size-4 shrink-0 rounded-full border border-black/10 shadow-sm"
                      style={{ backgroundColor: vehicle.color?.toLowerCase() || '#ccc' }}
                      title={vehicle.color}
                    />
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Секція записів */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">{t.nextVisitsTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingAppointments.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-muted-foreground opacity-50">
                  <CalendarDays className="size-8" />
                  <p className="mt-2 text-sm">{t.noVisits}</p>
                </div>
              ) : (
                upcomingAppointments.slice(0, 5).map((appt) => {
                  const vehicle = appt.order?.car
                  const mechanic = appt.order?.mechanic
                  const description = appt.order?.description || t.service
                  const dateObj = new Date(appt.scheduledAt)
                  const formattedDate = dateObj.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
                  const formattedTime = dateObj.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })

                  return (
                    <div key={appt.id} className="flex items-center gap-4 rounded-lg border border-border bg-secondary/30 p-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Clock className="size-5 text-primary" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-foreground">{description}</p>
                          <StatusBadge status={appt.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {vehicle ? `${vehicle.brand} ${vehicle.model} • ${vehicle.plate}` : t.noVehicleData}
                        </p>
                        {mechanic && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Wrench className="size-3.5 shrink-0" />
                            <span>{t.mechanic}: {mechanic.firstName} {mechanic.lastName}</span>
                          </div>
                        )}
                        <div className="mt-1 flex items-center gap-3 text-[10px] font-medium text-muted-foreground uppercase">
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
                              ~{appt.estimatedMin} {t.min}
                            </span>
                          )}
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
          <CardTitle className="text-sm font-medium text-foreground">{t.historyTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-muted-foreground opacity-50">
              <ClipboardList className="size-8" />
              <p className="mt-2 text-sm">{t.noHistory}</p>
            </div>
          ) : (
            [...filteredOrders]
              .sort((a, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 5)
              .map((order: Order) => {
                const vehicle = filteredVehicles.find((v: VehicleType) => v.id === order.carId)
                return (
                  <Link
                    key={order.id}
                    href={`/orders-detail/${order.id}`}
                    className="mb-3 flex items-center justify-between gap-4 rounded-lg border border-border bg-secondary/30 p-3 transition-colors hover:bg-secondary/50 cursor-pointer last:mb-0"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <ClipboardList className="size-5 text-primary" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="truncate text-sm font-medium text-foreground">{order.description || t.serviceDefault}</p>
                        <p className="text-xs text-muted-foreground">
                          {vehicle ? `${vehicle.brand} ${vehicle.model}` : t.vehicleDefault} • {new Date(order.createdAt).toLocaleDateString(locale)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <StatusBadge status={order.status} />
                      {order.review && (
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                          Відгук залишено
                        </Badge>
                      )}
                      <span className="text-sm font-bold text-foreground whitespace-nowrap">
                        {Number(order.totalAmount || 0).toLocaleString()} ₴
                      </span>
                    </div>
                  </Link>
                )
              })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
