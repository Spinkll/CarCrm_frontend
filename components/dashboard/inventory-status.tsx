"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useInventory } from "@/lib/inventory-context"
import { Loader2, AlertTriangle, PackageSearch } from "lucide-react"
import { cn } from "@/lib/utils"

export function InventoryStatus() {
  const { inventory, isLoading } = useInventory()

  const criticalItems = useMemo(() => {
    return inventory
      .filter((item) => {
        // Порогове значення: або індивідуальне minStockLevel, або стандартно 5
        const threshold = item.minStockLevel !== null ? item.minStockLevel : 5
        return item.stockQuantity <= threshold
      })
      .sort((a, b) => {
        // Спочатку ті, де 0 (абсолютно відсутні)
        if (a.stockQuantity === 0 && b.stockQuantity !== 0) return -1
        if (a.stockQuantity !== 0 && b.stockQuantity === 0) return 1
        return a.stockQuantity - b.stockQuantity
      })
      .slice(0, 8) // Показуємо трохи більше критичних позицій
  }, [inventory])

  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Стан складу</CardTitle>
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
    <Card className="border-border bg-card h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-border">
        <CardTitle className="text-sm font-medium text-foreground flex items-center justify-between">
          <span>Критичні залишки</span>
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded">
            Потребують уваги
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <div className="h-full overflow-auto scrollbar-thin">
          {criticalItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
              <PackageSearch className="size-10 mb-3 opacity-20 text-primary" />
              <p className="text-sm font-medium">Запаси в нормі</p>
              <p className="text-xs mt-1 text-muted-foreground/60">Критично малих залишків не виявлено.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {criticalItems.map((item) => {
                const isOutOfStock = item.stockQuantity <= 0
                return (
                  <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-secondary/30 transition-colors group">
                    <div className="min-w-0 pr-4">
                      <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded tabular-nums">
                          {item.sku || "Без SKU"}
                        </span>
                        {isOutOfStock && (
                          <span className="text-[10px] font-bold text-destructive uppercase tracking-tighter animate-pulse">
                            Відсутня
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={cn(
                        "text-sm font-bold flex items-center gap-1.5 justify-end tabular-nums",
                        isOutOfStock ? "text-destructive" : "text-amber-500"
                      )}>
                        {item.stockQuantity} шт
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                         Мін: {item.minStockLevel ?? 5}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
