"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, Car, ClipboardList, DollarSign, TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { useCrm } from "@/lib/crm-context"
import { useOrders } from "@/lib/orders-context"
import { useVehicles } from "@/lib/vehicles-context"
import { useEffect, useMemo } from "react"
import { format, subDays, isWithinInterval, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, startOfDay } from "date-fns"
import { Area, AreaChart, ResponsiveContainer } from "recharts"

export function KpiCards() {
  const { customers, isLoading: isCrmLoading, refreshData } = useCrm()
  const { vehicles, isLoading: isVehiclesLoading } = useVehicles()
  const { orders, fetchOrders, isLoading: isOrdersLoading } = useOrders()

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const isLoading = isCrmLoading || isVehiclesLoading || isOrdersLoading

  useEffect(() => {
    refreshData()
  }, [refreshData])

  const stats = useMemo(() => {
    const now = new Date()
    const currentMonthStart = startOfMonth(now)
    const currentMonthEnd = endOfMonth(now)
    const prevMonthStart = startOfMonth(subMonths(now, 1))
    const prevMonthEnd = endOfMonth(subMonths(now, 1))

    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? "+100%" : "0%"
      const change = ((current - previous) / previous) * 100
      const formattedChange = change % 1 === 0 ? change.toFixed(0) : change.toFixed(1)
      return `${change > 0 ? '+' : ''}${formattedChange}%`
    }

    // Sparkline data: last 7 days buckets
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const day = startOfDay(subDays(now, 6 - i))
      const dayEnd = new Date(day.getTime() + 86400000 - 1)
      return { day, dayEnd, label: format(day, "dd") }
    })

    // Customers
    const currentCustomers = customers.filter(c =>
      c.createdAt && isWithinInterval(new Date(c.createdAt), { start: currentMonthStart, end: currentMonthEnd })
    ).length
    const prevCustomers = customers.filter(c =>
      c.createdAt && isWithinInterval(new Date(c.createdAt), { start: prevMonthStart, end: prevMonthEnd })
    ).length
    const customersSparkline = last7Days.map(d => ({
      v: customers.filter(c => c.createdAt && isWithinInterval(new Date(c.createdAt), { start: d.day, end: d.dayEnd })).length,
    }))

    // Vehicles
    const currentVehicles = vehicles.filter((v: any) =>
      v.createdAt && isWithinInterval(new Date(v.createdAt), { start: currentMonthStart, end: currentMonthEnd })
    ).length
    const prevVehicles = vehicles.filter((v: any) =>
      v.createdAt && isWithinInterval(new Date(v.createdAt), { start: prevMonthStart, end: prevMonthEnd })
    ).length
    const vehiclesSparkline = last7Days.map(d => ({
      v: vehicles.filter((v: any) => v.createdAt && isWithinInterval(new Date(v.createdAt), { start: d.day, end: d.dayEnd })).length,
    }))

    // Orders
    const active = orders.filter((o) => {
      const s = o.status?.toLowerCase()
      return s === "in_progress" || s === "pending" || s === "received" || s === "waiting_parts" || s === "confirmed"
    }).length
    const currentOrders = orders.filter(o => new Date(o.createdAt) >= currentMonthStart).length
    const prevOrders = orders.filter(o => {
      const d = new Date(o.createdAt)
      return d >= prevMonthStart && d <= prevMonthEnd
    }).length
    const ordersSparkline = last7Days.map(d => ({
      v: orders.filter(o => isWithinInterval(new Date(o.createdAt), { start: d.day, end: d.dayEnd })).length,
    }))

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

    const revenueSparkline = last7Days.map(d => ({
      v: orders
        .filter(o => (o.status === "COMPLETED" || o.status === "PAID") && isWithinInterval(new Date((o as any).updatedAt || o.createdAt), { start: d.day, end: d.dayEnd }))
        .reduce((s, o) => s + Number(o.totalAmount || 0), 0),
    }))

    return {
      active,
      currentRevenue,
      customersTrend: { value: calculateTrend(currentCustomers, prevCustomers), direction: currentCustomers >= prevCustomers ? "up" as const : "down" as const },
      vehiclesTrend: { value: calculateTrend(currentVehicles, prevVehicles), direction: currentVehicles >= prevVehicles ? "up" as const : "down" as const },
      ordersTrend: { value: calculateTrend(currentOrders, prevOrders), direction: currentOrders >= prevOrders ? "up" as const : "down" as const },
      revenueTrend: { value: calculateTrend(currentRevenue, prevRevenue), direction: currentRevenue >= prevRevenue ? "up" as const : "down" as const },
      customersSparkline,
      vehiclesSparkline,
      ordersSparkline,
      revenueSparkline,
    }
  }, [customers, vehicles, orders])

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border bg-card animate-pulse">
            <CardContent className="p-5 h-28 flex items-center justify-center">
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
      sparkline: stats.customersSparkline,
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.08)",
      accent: "rgba(59,130,246,0.15)",
    },
    {
      label: "Зареєстровано авто",
      value: vehicles.length.toString(),
      change: stats.vehiclesTrend.value,
      trend: stats.vehiclesTrend.direction,
      icon: Car,
      sparkline: stats.vehiclesSparkline,
      color: "#8b5cf6",
      bg: "rgba(139,92,246,0.08)",
      accent: "rgba(139,92,246,0.15)",
    },
    {
      label: "Активні замовлення",
      value: stats.active.toString(),
      change: stats.ordersTrend.value,
      trend: stats.ordersTrend.direction,
      icon: ClipboardList,
      sparkline: stats.ordersSparkline,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.08)",
      accent: "rgba(245,158,11,0.15)",
    },
    {
      label: "Дохід за місяць",
      value: `${stats.currentRevenue.toLocaleString()} ₴`,
      change: stats.revenueTrend.value,
      trend: stats.revenueTrend.direction,
      icon: DollarSign,
      sparkline: stats.revenueSparkline,
      color: "#10b981",
      bg: "rgba(16,185,129,0.08)",
      accent: "rgba(16,185,129,0.15)",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const isUp = kpi.trend === "up"
        const TrendIcon = isUp ? TrendingUp : TrendingDown
        const trendColor = isUp ? "#10b981" : "#ef4444"

        return (
          <div
            key={kpi.label}
            className="relative overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group"
          >
            {/* top accent bar */}
            <div
              className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
              style={{ background: kpi.color }}
            />

            <div className="p-5">
              {/* header row */}
              <div className="flex items-start justify-between mb-3">
                <div
                  className="flex size-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
                  style={{ background: kpi.bg }}
                >
                  <kpi.icon className="size-5" style={{ color: kpi.color }} />
                </div>

                <div
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: isUp ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                    color: trendColor,
                  }}
                >
                  <TrendIcon className="size-3" />
                  <span>{kpi.change}</span>
                </div>
              </div>

              {/* value */}
              <p className="text-2xl font-bold text-foreground tracking-tight leading-none mb-1">
                {kpi.value}
              </p>
              <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
            </div>

            {/* sparkline */}
            <div className="h-14 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={kpi.sparkline} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`grad-${kpi.label}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={kpi.color} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={kpi.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={kpi.color}
                    strokeWidth={1.5}
                    fill={`url(#grad-${kpi.label})`}
                    dot={false}
                    isAnimationActive={true}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
      })}
    </div>
  )
}
