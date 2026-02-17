"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, Car, ClipboardList, DollarSign, TrendingUp, TrendingDown } from "lucide-react"
import { useCrm } from "@/lib/crm-context"

export function KpiCards() {
  const { customers, vehicles, serviceOrders } = useCrm()

  const totalRevenue = serviceOrders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + o.totalCost, 0)

  const activeOrders = serviceOrders.filter(
    (o) => o.status === "in-progress" || o.status === "pending"
  ).length

  const kpis = [
    {
      label: "Total Customers",
      value: customers.length.toString(),
      change: "+12%",
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
      value: activeOrders.toString(),
      change: "-3%",
      trend: "down" as const,
      icon: ClipboardList,
    },
    {
      label: "Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      change: "+18%",
      trend: "up" as const,
      icon: DollarSign,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="border-border bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <kpi.icon className="size-5 text-primary" />
              </div>
              <div className="flex items-center gap-1 text-xs font-medium">
                {kpi.trend === "up" ? (
                  <TrendingUp className="size-3 text-success" />
                ) : (
                  <TrendingDown className="size-3 text-destructive" />
                )}
                <span className={kpi.trend === "up" ? "text-success" : "text-destructive"}>
                  {kpi.change}
                </span>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
