"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/status-badge"
import { Plus, ChevronDown } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useOrders } from "@/lib/orders-context" 
import { useVehicles } from "@/lib/vehicles-context" 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function OrdersPage() {
  const { user } = useAuth()
  const { orders, createOrder, updateStatus, isLoading } = useOrders()
  const { vehicles } = useVehicles()
  
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState("all")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    vehicleId: "",
    description: "",
    services: "", 
    totalCost: "",
    estimatedDate: "",
  })

  if (!user) return null

  const role = user.role
  const canCreateOrders = role === "CLIENT" || role === "ADMIN" || role === "MANAGER"
  const canEditOrderStatus = role === "ADMIN" || role === "MECHANIC" || role === "MANAGER"

  const filtered = tab === "all"
      ? orders
      : orders.filter((o) => o.status === tab.toUpperCase())

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  async function handleSubmit() {
    if (!form.vehicleId || !form.description) return
    setIsSubmitting(true)

    const selectedVehicle = vehicles.find(v => v.id.toString() === form.vehicleId)
    
    // Логика определения ID клиента
    const customerId = role === "CLIENT" ? user!.id : (selectedVehicle?.userId || user!.id)

    const result = await createOrder({
      // 👇 Если это КЛИЕНТ, мы не шлем customerId (бекенд возьмет из токена)
      // Если АДМИН - шлем.
      customerId: role === "ADMIN" || role === "MANAGER" ? Number(customerId) : undefined,
      
      vehicleId: Number(form.vehicleId),
      description: form.description,
      
      services: form.services.split(",").map(s => s.trim()).filter(Boolean),
      totalCost: parseFloat(form.totalCost) || 0,
    })

    setIsSubmitting(false)

    if (result.success) {
      setForm({ vehicleId: "", description: "", services: "", totalCost: "", estimatedDate: "" })
      setOpen(false)
    } else {
        alert(result.error) 
    }
  }

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "PENDING").length,
    inProgress: orders.filter((o) => o.status === "IN_PROGRESS").length,
    completed: orders.filter((o) => o.status === "COMPLETED").length,
    cancelled: orders.filter((o) => o.status === "CANCELLED").length,
  }

  const descriptions: Record<string, string> = {
    ADMIN: "Manage work orders and service requests",
    MANAGER: "Manage work orders and service requests",
    MECHANIC: "Your assigned work orders",
    CLIENT: "Track your service requests",
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PageHeader title={role === "CLIENT" ? "My Orders" : "Service Orders"} description={descriptions[role] || "Orders"}>
        {canCreateOrders && (
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="size-4" />
            {role === "CLIENT" ? "Request Service" : "New Order"}
          </Button>
        )}
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">
              All <span className="ml-1.5 text-xs text-muted-foreground">({statusCounts.all})</span>
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending <span className="ml-1.5 text-xs text-muted-foreground">({statusCounts.pending})</span>
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              In Progress <span className="ml-1.5 text-xs text-muted-foreground">({statusCounts.inProgress})</span>
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed <span className="ml-1.5 text-xs text-muted-foreground">({statusCounts.completed})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tab}>
            <Card className="border-border bg-card">
              <CardContent className="p-0">
                {isLoading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading orders...</div>
                ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="pl-6 text-muted-foreground">Order ID</TableHead>
                      <TableHead className="text-muted-foreground">Vehicle</TableHead>
                      <TableHead className="text-muted-foreground">Description</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground">Cost</TableHead>
                      {canEditOrderStatus && (
                        <TableHead className="pr-6 text-muted-foreground">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((order) => {
                      
                        const vehicleData = order.car                      
                      return (
                        <TableRow key={order.id} className="border-border">
                          <TableCell className="pl-6 font-medium font-mono text-foreground">
                            #{order.id}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {vehicleData
                              ? `${vehicleData.brand} ${vehicleData.model} (${vehicleData.plate || 'No Plate'})`
                              : `Vehicle #${order.vehicleId}`}
                          </TableCell>
                          <TableCell className="max-w-48 truncate text-foreground">
                            {order.description}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={order.status.toLowerCase()} />
                          </TableCell>
                          <TableCell className="font-medium text-foreground">
                            ${Number(order.totalAmount || 0).toLocaleString()}
                          </TableCell>
                          {canEditOrderStatus && (
                            <TableCell className="pr-6">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                                    Update <ChevronDown className="size-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]
                                    .filter((s) => s !== order.status)
                                    .map((status) => (
                                      <DropdownMenuItem
                                        key={status}
                                        onClick={() => updateStatus(order.id, status)}
                                        className="capitalize"
                                      >
                                        {status.toLowerCase().replace("_", " ")}
                                      </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                        </TableRow>
                      )
                    })}
                    {sorted.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                          No orders found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {canCreateOrders && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{role === "CLIENT" ? "Request Service" : "Create Service Order"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              
              {/* ВИБІР МАШИНИ */}
              <div className="grid gap-2">
                <Label>Vehicle</Label>
                <Select
                  value={form.vehicleId}
                  onValueChange={(v) => setForm({ ...form, vehicleId: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Показуємо машини, які завантажив useVehicles */}
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id.toString()}>
                        {v.brand} {v.model} ({v.plate})
                      </SelectItem>
                    ))}
                    {vehicles.length === 0 && (
                        <div className="p-2 text-sm text-muted-foreground">No vehicles found. Add a vehicle first.</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="o-desc">Description</Label>
                <Textarea
                  id="o-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the service needed..."
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="o-services">Services (comma separated)</Label>
                <Input
                  id="o-services"
                  value={form.services}
                  onChange={(e) => setForm({ ...form, services: e.target.value })}
                  placeholder="Oil Change, Tire Rotation"
                />
              </div>

              {/* Поля вартості тільки для Адміна/Менеджера */}
              {(role === "ADMIN" || role === "MANAGER") && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="o-cost">Estimated Cost ($)</Label>
                    <Input
                      id="o-cost"
                      type="number"
                      value={form.totalCost}
                      onChange={(e) => setForm({ ...form, totalCost: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : (role === "CLIENT" ? "Submit Request" : "Create Order")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}