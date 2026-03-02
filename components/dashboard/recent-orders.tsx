"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { useCrm } from "@/lib/crm-context"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function RecentOrders() {
  const { orders, customers, vehicles, isLoading } = useCrm()
  const router = useRouter()

  // 1. Використовуємо правильну назву стейту 'orders'
  // 2. Сортуємо та обрізаємо масив
  const recent = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground">
          Останні замовлення
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="pl-6 text-muted-foreground">№</TableHead>
                <TableHead className="text-muted-foreground">Клієнт</TableHead>
                <TableHead className="text-muted-foreground">Автомобіль</TableHead>
                <TableHead className="text-muted-foreground">Статус</TableHead>
                <TableHead className="pr-6 text-right text-muted-foreground">Сума</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Замовлень не знайдено
                  </TableCell>
                </TableRow>
              ) : (
                recent.map((order) => {
                  const vehicle = order.car || vehicles.find((v) => v.id === order.carId)
                  const customer = customers.find((c) =>
                    c.id === vehicle?.userId
                  )

                  return (
                    <TableRow
                      key={order.id}
                      className="border-border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => router.push(`/orders-detail/${order.id}`)}
                    >
                      <TableCell className="pl-6 font-mono text-xs font-medium text-foreground">
                        #{order.id}
                      </TableCell>
                      <TableCell className="text-foreground text-sm">
                        {customer ? `${customer.firstName} ${customer.lastName}` : "Невідомо"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {vehicle ? `${vehicle.brand} ${vehicle.model}` : "Невідоме авто"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="pr-6 text-right font-medium text-foreground text-sm">
                        {Number(order.totalAmount || 0).toLocaleString()} ₴
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}