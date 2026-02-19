"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCrm } from "@/lib/crm-context"
import { useMemo } from "react"
import { Loader2 } from "lucide-react"

export function ServiceBreakdown() {
  const { orders, isLoading } = useCrm()

  // Динамічно рахуємо статистику на основі реальних замовлень
  const breakdownData = useMemo(() => {
    if (!orders || orders.length === 0) return []

    const serviceMap = new Map<string, { name: string; count: number; revenue: number }>()

    orders.forEach((order) => {
      // Якщо у тебе є окреме поле для типу послуги, заміни description на нього
      // Робимо trim і capitalize, щоб "Oil change" і "oil change" рахувались як одне
      const rawName = order.description || "General Service"
      const name = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase().trim()

      if (!serviceMap.has(name)) {
        serviceMap.set(name, { name, count: 0, revenue: 0 })
      }

      const entry = serviceMap.get(name)!
      entry.count += 1
      // Додаємо в дохід тільки завершені замовлення (або можеш прибрати цю перевірку, якщо хочеш бачити потенційний дохід)
      if (order.status?.toLowerCase() === "completed") {
        entry.revenue += Number(order.totalAmount || 0)
      }
    })

    // Перетворюємо Map в масив, сортуємо за кількістю (від більшого до меншого) і беремо топ-5
    return Array.from(serviceMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [orders])

  const maxCount = breakdownData.length > 0 ? Math.max(...breakdownData.map((s) => s.count)) : 1

  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground">
          Top Services Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        {breakdownData.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No service data available yet.
          </div>
        ) : (
          <div className="space-y-4">
            {breakdownData.map((service) => (
              <div key={service.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground truncate pr-4">{service.name}</span>
                  <div className="flex shrink-0 items-center gap-3 text-muted-foreground">
                    <span className="text-xs">{service.count} jobs</span>
                    <span className="font-bold text-foreground">
                      ${service.revenue.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500 ease-in-out"
                    style={{ width: `${(service.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}