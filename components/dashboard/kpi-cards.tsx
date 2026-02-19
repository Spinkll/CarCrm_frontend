"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, Car, ClipboardList, DollarSign, TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { useCrm } from "@/lib/crm-context"
import { useMemo } from "react"

export function KpiCards() {
  const { customers, vehicles, orders, isLoading } = useCrm()

  // Використовуємо useMemo, щоб не перераховувати при кожному рендері
  const stats = useMemo(() => {
    // 1. Рахуємо дохід (тільки завершені замовлення)
    // Додаємо Number(), бо з бази Decimal часто приходить як рядок
    const revenue = orders
      .filter((o) => o.status?.toLowerCase() === "completed")
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)

    // 2. Рахуємо активні замовлення (всі, крім завершених та скасованих)
    const active = orders.filter((o) => {
      const s = o.status?.toLowerCase()
      return s === "in_progress" || s === "pending" || s === "received"
    }).length

    return { revenue, active }
  }, [orders])

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
      label: "Total Customers",
      value: customers.length.toString(),
      change: "+12%", // Можна винести в бекенд пізніше
      trend: "up" as const,
      icon: Users,
    },
    {
      label: "Vehicles Registered",
      value: vehicles.length.toString(),
      change: "+8%",
      trend: "up" as const,
      icon: Car,
    },
    {
      label: "Active Orders",
      value: stats.active.toString(),
      change: "-3%",
      trend: "down" as const,
      icon: ClipboardList,
    },
    {
      label: "Total Revenue",
      value: `$${stats.revenue.toLocaleString()}`,
      change: "+18%",
      trend: "up" as const,
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