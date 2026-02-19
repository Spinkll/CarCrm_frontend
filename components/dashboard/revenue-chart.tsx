"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { useCrm } from "@/lib/crm-context"
import { useMemo } from "react"
import { Loader2 } from "lucide-react"

export function RevenueChart() {
  const { orders, isLoading } = useCrm()

  const chartData = useMemo(() => {
    const dataMap = new Map<string, { month: string; revenue: number }>()
    const now = new Date()

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${d.getMonth()}` 
      const monthName = d.toLocaleString('en-US', { month: 'short' }) 
      
      dataMap.set(key, { month: monthName, revenue: 0 })
    }

    if (orders && orders.length > 0) {
      orders.forEach((order) => {
        if (order.status?.toLowerCase() === "completed") {
          const d = new Date(order.createdAt)
          const key = `${d.getFullYear()}-${d.getMonth()}`
          
          if (dataMap.has(key)) {
            const current = dataMap.get(key)!
            current.revenue += Number(order.totalAmount || 0)
          }
        }
      })
    }

    return Array.from(dataMap.values())
  }, [orders])

  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">
            Monthly Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-72 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground">
          Monthly Revenue (Last 6 Months)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.26 0.01 260)" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="oklch(0.60 0.01 260)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="oklch(0.60 0.01 260)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
              />
              <Tooltip
                cursor={{ fill: "oklch(0.22 0.005 260 / 0.5)" }}
                contentStyle={{
                  backgroundColor: "oklch(0.17 0.005 260)",
                  border: "1px solid oklch(0.26 0.01 260)",
                  borderRadius: "8px",
                  color: "oklch(0.95 0 0)",
                  fontSize: 13,
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
              />
              <Bar dataKey="revenue" fill="oklch(0.65 0.18 220)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}