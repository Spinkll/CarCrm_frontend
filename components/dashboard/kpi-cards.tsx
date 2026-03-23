"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, Car, ClipboardList, DollarSign, TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { useCrm } from "@/lib/crm-context"
import { useOrders } from "@/lib/orders-context"
import { useVehicles } from "@/lib/vehicles-context"
import { useEffect, useMemo } from "react"
import { format, subDays, isWithinInterval, startOfMonth, endOfMonth } from "date-fns"

import { useSettings } from "@/lib/settings-context"
import { translations } from "@/lib/translations"

export function KpiCards() {
  const { customers, isLoading: isCrmLoading, refreshData } = useCrm()
  const { vehicles, isLoading: isVehiclesLoading } = useVehicles()
  const { orders, fetchOrders, isLoading: isOrdersLoading } = useOrders()
  const { settings } = useSettings()

  const t = translations[settings.language].dashboard.kpi
  const tCommon = translations[settings.language].common

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const isLoading = isCrmLoading || isVehiclesLoading || isOrdersLoading

  // Автоматично оновлюємо дані при поверненні на дашборд
  useEffect(() => {
    refreshData()
  }, [refreshData])

  const stats = useMemo(() => {
    const now = new Date()
    const currentMonthStart = startOfMonth(now)
    const currentMonthEnd = endOfMonth(now)
    const prevMonthStart = startOfMonth(subDays(currentMonthStart, 1))
    const prevMonthEnd = endOfMonth(subDays(currentMonthStart, 1))

    // Допоміжна функція для обчислення відсотків
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? "+100%" : "0%"
      const change = ((current - previous) / previous) * 100
      // Округлюємо до 1 знака після коми, якщо число не ціле
      const formattedChange = change % 1 === 0 ? change.toFixed(0) : change.toFixed(1)
      return `${change > 0 ? '+' : ''}${formattedChange}%`
    }

    // 1. Клієнти (Нових цього місяця vs Минулого)
    const currentCustomers = customers.filter(c =>
      c.createdAt && isWithinInterval(new Date(c.createdAt), { start: currentMonthStart, end: currentMonthEnd })
    ).length
    const prevCustomers = customers.filter(c =>
      c.createdAt && isWithinInterval(new Date(c.createdAt), { start: prevMonthStart, end: prevMonthEnd })
    ).length
    const cChangeStr = calculateTrend(currentCustomers, prevCustomers)

    // 2. Авто (Нових цього місяця vs Минулого)
    const currentVehicles = vehicles.filter((v: any) =>
      v.createdAt && isWithinInterval(new Date(v.createdAt), { start: currentMonthStart, end: currentMonthEnd })
    ).length
    const prevVehicles = vehicles.filter((v: any) =>
      v.createdAt && isWithinInterval(new Date(v.createdAt), { start: prevMonthStart, end: prevMonthEnd })
    ).length
    const vChangeStr = calculateTrend(currentVehicles, prevVehicles)

    // 3. Замовлення (Активні зараз, але тренд по створенню нових)
    const active = orders.filter((o) => {
      const s = o.status?.toLowerCase()
      return s === "in_progress" || s === "pending" || s === "received" || s === "waiting_parts" || s === "confirmed"
    }).length
    const currentOrders = orders.filter(o => new Date(o.createdAt) >= currentMonthStart).length
    const prevOrders = orders.filter(o => {
      const d = new Date(o.createdAt)
      return d >= prevMonthStart && d <= prevMonthEnd
    }).length
    const oChangeStr = calculateTrend(currentOrders, prevOrders)

    // Revenue
    const currentRevenue = orders
      .filter(o => o.status === "COMPLETED" || o.status === "PAID")
      .filter(o => {
        const d = new Date((o as any).updatedAt || o.createdAt)
        return d >= currentMonthStart && d <= currentMonthEnd
      })
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)

    const prevRevenue = orders
      .filter(o => o.status === "COMPLETED" || o.status === "PAID")
      .filter(o => {
        const d = new Date((o as any).updatedAt || o.createdAt)
        return d >= prevMonthStart && d <= prevMonthEnd
      })
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)
    const rChangeStr = calculateTrend(currentRevenue, prevRevenue)

    return {
      active,
      currentRevenue,
      customersTrend: { value: cChangeStr, direction: currentCustomers >= prevCustomers ? "up" as const : "down" as const },
      vehiclesTrend: { value: vChangeStr, direction: currentVehicles >= prevVehicles ? "up" as const : "down" as const },
      ordersTrend: { value: oChangeStr, direction: currentOrders >= prevOrders ? "up" as const : "down" as const },
      revenueTrend: { value: rChangeStr, direction: currentRevenue >= prevRevenue ? "up" as const : "down" as const },
    }
  }, [customers, vehicles, orders])

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border bg-card animate-pulse">
            <CardContent className="p-5 h-24 flex items-center justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const kpis = [
    {
      label: t.totalCustomers,
      value: customers.length.toString(),
      change: stats.customersTrend.value,
      trend: stats.customersTrend.direction,
      icon: Users,
    },
    {
      label: t.registeredVehicles,
      value: vehicles.length.toString(),
      change: stats.vehiclesTrend.value,
      trend: stats.vehiclesTrend.direction,
      icon: Car,
    },
    {
      label: t.activeOrders,
      value: stats.active.toString(),
      change: stats.ordersTrend.value,
      trend: stats.ordersTrend.direction,
      icon: ClipboardList,
    },
    {
      label: t.monthlyRevenue,
      value: `${stats.currentRevenue.toLocaleString()} ₴`,
      change: stats.revenueTrend.value,
      trend: stats.revenueTrend.direction,
      icon: DollarSign,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="border-border bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <kpi.icon className="size-5 text-primary" />
              </div>
              <div className="flex items-center gap-1 text-xs font-medium">
                {kpi.trend === "up" ? (
                  <TrendingUp className="size-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="size-3 text-destructive" />
                )}
                <span className={kpi.trend === "up" ? "text-emerald-500" : "text-destructive"}>
                  {kpi.change}
                </span>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-foreground tracking-tight">{kpi.value}</p>
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}