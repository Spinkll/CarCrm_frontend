"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCrm } from "@/lib/crm-context"
import { useOrders } from "@/lib/orders-context"
import { Loader2 } from "lucide-react"
import { useEffect, useMemo } from "react"

export function ServiceBreakdown() {
  const { orders, fetchOrders, isLoading: isOrdersLoading } = useOrders()

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Динамічно рахуємо статистику на основі реальних замовлень
  const breakdownData = useMemo(() => {
    if (!orders || orders.length === 0) return []

    const serviceMap = new Map<string, { name: string; count: number; revenue: number }>()

    // Агрегуємо реальні послуги з масиву `services` (strings або objects)
    orders.forEach((o) => {
      const status = o.status?.toLowerCase()
      const isRevenueCounted = status === "completed" || status === "paid"

      if (o.services && Array.isArray(o.services)) {
        o.services.forEach((item: any) => {
          // Рахуємо тільки послуги, пропускаємо запчастини
          if (item.type === "PART") return

          const rawName = item.name || "Невідома послуга"
          const name = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase().trim()

          if (!serviceMap.has(name)) {
            serviceMap.set(name, { name, count: 0, revenue: 0 })
          }

          const entry = serviceMap.get(name)!
          entry.count += Number(item.quantity) || 1

          if (isRevenueCounted) {
            entry.revenue += (Number(item.price) || 0) * (Number(item.quantity) || 1)
          }
        })
      }
    })

    // Перетворюємо Map в масив, сортуємо за кількістю (від більшого до меншого) і беремо топ-5
    return Array.from(serviceMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [orders])

  const maxCount = breakdownData.length > 0 ? Math.max(...breakdownData.map((s) => s.count)) : 1

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Популярні послуги (Топ-5)</CardTitle>
      </CardHeader>
      <CardContent>
        {isOrdersLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : breakdownData.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Дані про послуги наразі відсутні.
          </div>
        ) : (
          <div className="space-y-4">
            {breakdownData.map((service) => (
              <div key={service.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground truncate pr-4">{service.name}</span>
                  <div className="flex shrink-0 items-center gap-3 text-muted-foreground">
                    <span className="text-xs">
                      {service.count} {service.count === 1 ? 'раз' : service.count >= 2 && service.count <= 4 ? 'рази' : 'разів'}
                    </span>
                    <span className="font-bold text-foreground">
                      {service.revenue.toLocaleString()} ₴
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