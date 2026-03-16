"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useInventory } from "@/lib/inventory-context"
import { Loader2, AlertTriangle, PackageSearch } from "lucide-react"

export function InventoryStatus() {
  const { inventory, isLoading } = useInventory()

  const lowStockItems = useMemo(() => {
    return inventory
      .filter((item) => {
        const threshold = item.minStockLevel || 5
        return item.stockQuantity <= threshold
      })
      .sort((a, b) => a.stockQuantity - b.stockQuantity)
      .slice(0, 5) // Show top 5 lowest
  }, [inventory])

  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Складські залишки (Критичні)</CardTitle>
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
    <Card className="border-border bg-card h-full">
      <CardHeader className="pb-3 border-b border-border">
        <CardTitle className="text-sm font-medium text-foreground flex items-center justify-between">
          <span>Складські запаси</span>
          <span className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            <AlertTriangle className="size-3" />
            Мало на складі
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[288px] overflow-auto">
          {lowStockItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
              <PackageSearch className="size-10 mb-3 opacity-20" />
              <p className="text-sm">Всі запаси в нормі.</p>
              <p className="text-xs mt-1">Немає товарів, яких залишилося мало.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {lowStockItems.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.sku ? `SKU: ${item.sku}` : "Без SKU"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-destructive flex items-center gap-1.5 justify-end">
                      {item.stockQuantity} шт
                    </p>
                    {item.minStockLevel && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Мін: {item.minStockLevel}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
