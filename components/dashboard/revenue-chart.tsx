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
import { monthlyRevenue } from "@/lib/data"

export function RevenueChart() {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground">
          Monthly Revenue
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyRevenue} barSize={32}>
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
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
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
