"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { useCrm } from "@/lib/crm-context"

export function RecentOrders() {
  const { serviceOrders, customers, vehicles } = useCrm()

  const recent = [...serviceOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground">
          Recent Service Orders
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="pl-6 text-muted-foreground">Order</TableHead>
              <TableHead className="text-muted-foreground">Customer</TableHead>
              <TableHead className="text-muted-foreground">Vehicle</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="pr-6 text-right text-muted-foreground">Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recent.map((order) => {
              const customer = customers.find((c) => c.id === order.customerId)
              const vehicle = vehicles.find((v) => v.id === order.vehicleId)
              return (
                <TableRow key={order.id} className="border-border">
                  <TableCell className="pl-6 font-medium text-foreground">{order.id}</TableCell>
                  <TableCell className="text-foreground">{customer?.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "N/A"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="pr-6 text-right font-medium text-foreground">
                    ${order.totalCost.toLocaleString()}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
