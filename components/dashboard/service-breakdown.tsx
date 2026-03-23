"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useOrders } from "@/lib/orders-context"
import { Loader2 } from "lucide-react"
import { useEffect, useMemo } from "react"
import { useSettings } from "@/lib/settings-context"
import { translations } from "@/lib/translations"
export function ServiceBreakdown() {
  const { orders, fetchOrders, isLoading: isOrdersLoading } = useOrders()
  const { settings } = useSettings()

  const t = translations[settings.language].dashboard.charts

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Динамічно рахуємо статистику на основі реальних замовлень
  const breakdownData = useMemo(() => {
    if (!orders || orders.length === 0) return []

    const serviceMap = new Map<string, { name: string; count: number; revenue: number }>()

    // Агрегуємо реальні послуги з масиву `items` або `services`
    orders.forEach((o: any) => {
      const status = o.status?.toLowerCase()
      const isRevenueCounted = status === "completed" || status === "paid"

      // Перевіряємо обидва можливі поля для послуг
      const items = o.items || o.services

      if (items && Array.isArray(items)) {
        items.forEach((item: any) => {
          // Якщо це рядок (старий формат), перетворюємо в об'єкт
          const isString = typeof item === 'string'
          
          // Рахуємо тільки послуги, пропускаємо запчастини
          // Якщо це рядок, вважаємо це послугою
          if (!isString && item.type === "PART") return

          const rawName = isString ? item : (item.name || t.unknownService)
          const name = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase().trim()

          if (!serviceMap.has(name)) {
            serviceMap.set(name, { name, count: 0, revenue: 0 })
          }

          const entry = serviceMap.get(name)!
          entry.count += isString ? 1 : (Number(item.quantity) || 1)

          if (isRevenueCounted) {
            entry.revenue += isString ? 0 : ((Number(item.price) || 0) * (Number(item.quantity) || 1))
          }
        })
      }
    })

    // Перетворюємо Map в масив, сортуємо за кількістю (від більшого до меншого) і беремо топ-5
    return Array.from(serviceMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [orders, t.unknownService])

  const maxCount = breakdownData.length > 0 ? Math.max(...breakdownData.map((s) => s.count)) : 1

  const getPluralTimes = (count: number) => {
    if (settings.language === "en") return count === 1 ? t.times1 : t.times24
    // Simple logic for Top-5
    if (count % 10 === 1 && count % 100 !== 11) return t.times1
    if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return t.times24
    return t.times5plus
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{t.popularServices}</CardTitle>
      </CardHeader>
      <CardContent>
        {isOrdersLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : breakdownData.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {t.noServiceData}
          </div>
        ) : (
          <div className="space-y-4">
            {breakdownData.map((service) => (
              <div key={service.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground truncate pr-4">{service.name}</span>
                  <div className="flex shrink-0 items-center gap-3 text-muted-foreground">
                    <span className="text-xs">
                      {service.count} {getPluralTimes(service.count)}
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