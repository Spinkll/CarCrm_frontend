"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useOrders } from "@/lib/orders-context"
import { useEmployees } from "@/lib/employees-context"
import { Loader2 } from "lucide-react"
import { useSettings } from "@/lib/settings-context"
import { translations } from "@/lib/translations"

export function MechanicProductivityChart() {
  const { orders, isLoading: isOrdersLoading } = useOrders()
  const { employees, isLoading: isEmployeesLoading } = useEmployees()
  const { settings } = useSettings()

  const t = translations[settings.language].dashboard.charts

  const chartData = useMemo(() => {
    const mechanics = employees.filter((e) => e.role === "MECHANIC")
    const dataMap = new Map<number, { name: string; completed: number; arrived: number; scheduled: number }>()

    mechanics.forEach((m) => {
      dataMap.set(m.id, {
        name: `${m.firstName} ${m.lastName}`,
        completed: 0,
        arrived: 0,
        scheduled: 0,
      })
    })

    orders.forEach((order) => {
      const mechanicId = order.mechanic?.id
      if (mechanicId && dataMap.has(mechanicId)) {
        const currentData = dataMap.get(mechanicId)!
        
        // Мапінг статусів замовлення на категорії графіка
        if (order.status === "COMPLETED" || order.status === "PAID") {
          currentData.completed += 1
        } else if (order.status === "IN_PROGRESS" || order.status === "WAITING_PARTS") {
          currentData.arrived += 1
        } else if (order.status === "PENDING" || order.status === "CONFIRMED") {
          currentData.scheduled += 1
        }
      }
    })

    return Array.from(dataMap.values())
  }, [orders, employees])

  if (isOrdersLoading || isEmployeesLoading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">{t.mechanicProductivity}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center">
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
          {t.mechanicLoad}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          {chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              {t.noMechanicData}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.26 0.01 260)" vertical={false} />
                <XAxis
                  dataKey="name"
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
                  allowDecimals={false}
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
                />
                <Legend iconType="circle" />
                <Bar dataKey="scheduled" name={t.statusWaiting} stackId="a" fill="oklch(0.80 0.15 90)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="arrived" name={t.statusInProgress} stackId="a" fill="oklch(0.65 0.18 220)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="completed" name={t.statusCompleted} stackId="a" fill="oklch(0.65 0.15 150)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
