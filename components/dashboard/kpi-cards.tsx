"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, Car, ClipboardList, DollarSign, TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { useCrm } from "@/lib/crm-context"
import { useMemo, useEffect } from "react"

export function KpiCards() {
  const { customers, vehicles, orders, isLoading, refreshData } = useCrm()

  // Автоматично оновлюємо дані при поверненні на дашборд
  useEffect(() => {
    refreshData()
  }, [refreshData])

  const stats = useMemo(() => {
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

    // Допоміжна функція для обчислення відсотків
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? "+100%" : "0%"
      const change = ((current - previous) / previous) * 100
      // Округлюємо до 1 знака після коми, якщо число не ціле
      const formattedChange = change % 1 === 0 ? change.toFixed(0) : change.toFixed(1)
      return `${change > 0 ? '+' : ''}${formattedChange}%`
    }

    // 1. Клієнти (Нових цього місяця vs Минулого)
    const currentCustomers = customers.filter(c => new Date(c.createdAt) >= currentMonthStart).length
    const previousCustomers = customers.filter(c => {
      const d = new Date(c.createdAt)
      return d >= previousMonthStart && d <= previousMonthEnd
    }).length
    const cChangeStr = calculateTrend(currentCustomers, previousCustomers)

    // 2. Авто (Нових цього місяця vs Минулого)
    const currentVehicles = vehicles.filter(v => v.createdAt && new Date(v.createdAt) >= currentMonthStart).length
    const previousVehicles = vehicles.filter(v => {
      if (!v.createdAt) return false
      const d = new Date(v.createdAt)
      return d >= previousMonthStart && d <= previousMonthEnd
    }).length
    const vChangeStr = calculateTrend(currentVehicles, previousVehicles)

    // 3. Замовлення (Активні зараз, але тренд по створенню нових)
    const active = orders.filter((o) => {
      const s = o.status?.toLowerCase()
      return s === "in_progress" || s === "pending" || s === "received" || s === "confirmed" || s === "waiting_parts"
    }).length

    const currentCreatedOrders = orders.filter(o => new Date(o.createdAt) >= currentMonthStart).length
    const previousCreatedOrders = orders.filter(o => {
      const d = new Date(o.createdAt)
      return d >= previousMonthStart && d <= previousMonthEnd
    }).length
    const oChangeStr = calculateTrend(currentCreatedOrders, previousCreatedOrders)

    // 4. Дохід (Зароблене цього місяця vs Минулого)
    const currentRevenue = orders
      .filter(o => {
        const s = o.status?.toLowerCase()
        return (s === "completed" || s === "paid") && new Date(o.createdAt) >= currentMonthStart
      })
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)

    const previousRevenue = orders
      .filter(o => {
        const s = o.status?.toLowerCase()
        if (s !== "completed" && s !== "paid") return false
        const d = new Date(o.createdAt)
        return d >= previousMonthStart && d <= previousMonthEnd
      })
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)

    const rChangeStr = calculateTrend(currentRevenue, previousRevenue)

    return {
      active,
      currentRevenue,
      customersTrend: { value: cChangeStr, direction: currentCustomers >= previousCustomers ? "up" as const : "down" as const },
      vehiclesTrend: { value: vChangeStr, direction: currentVehicles >= previousVehicles ? "up" as const : "down" as const },
      ordersTrend: { value: oChangeStr, direction: currentCreatedOrders >= previousCreatedOrders ? "up" as const : "down" as const },
      revenueTrend: { value: rChangeStr, direction: currentRevenue >= previousRevenue ? "up" as const : "down" as const },
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
      label: "Всього клієнтів",
      value: customers.length.toString(),
      change: stats.customersTrend.value,
      trend: stats.customersTrend.direction,
      icon: Users,
    },
    {
      label: "Зареєстровано авто",
      value: vehicles.length.toString(),
      change: stats.vehiclesTrend.value,
      trend: stats.vehiclesTrend.direction,
      icon: Car,
    },
    {
      label: "Активні замовлення",
      value: stats.active.toString(),
      change: stats.ordersTrend.value,
      trend: stats.ordersTrend.direction,
      icon: ClipboardList,
    },
    {
      label: "Дохід за цей місяць",
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