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
import { useCrm } from "@/lib/crm-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ServiceOrderStatus } from "@/lib/data"

export default function OrdersPage() {
  const {
    serviceOrders,
    customers,
    vehicles,
    addServiceOrder,
    updateOrderStatus,
  } = useCrm()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState("all")
  const [form, setForm] = useState({
    customerId: "",
    vehicleId: "",
    description: "",
    services: "",
    totalCost: "",
    assignedMechanic: "",
  })

  const filtered =
    tab === "all"
      ? serviceOrders
      : serviceOrders.filter((o) => o.status === tab)

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const customerVehicles = vehicles.filter(
    (v) => v.customerId === form.customerId
  )

  function handleSubmit() {
    if (!form.customerId || !form.vehicleId || !form.description) return
    addServiceOrder({
      id: `SO${String(serviceOrders.length + 1).padStart(3, "0")}`,
      customerId: form.customerId,
      vehicleId: form.vehicleId,
      status: "pending",
      description: form.description,
      services: form.services.split(",").map((s) => s.trim()).filter(Boolean),
      totalCost: parseFloat(form.totalCost) || 0,
      createdAt: new Date().toISOString().split("T")[0],
      completedAt: null,
      assignedMechanic: form.assignedMechanic,
    })
    setForm({ customerId: "", vehicleId: "", description: "", services: "", totalCost: "", assignedMechanic: "" })
    setOpen(false)
  }

  const statusCounts = {
    all: serviceOrders.length,
    pending: serviceOrders.filter((o) => o.status === "pending").length,
    "in-progress": serviceOrders.filter((o) => o.status === "in-progress").length,
    completed: serviceOrders.filter((o) => o.status === "completed").length,
    cancelled: serviceOrders.filter((o) => o.status === "cancelled").length,
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PageHeader title="Service Orders" description="Manage work orders and service requests">
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="size-4" />
          New Order
        </Button>
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
            <TabsTrigger value="in-progress">
              In Progress <span className="ml-1.5 text-xs text-muted-foreground">({statusCounts["in-progress"]})</span>
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed <span className="ml-1.5 text-xs text-muted-foreground">({statusCounts.completed})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tab}>
            <Card className="border-border bg-card">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="pl-6 text-muted-foreground">Order ID</TableHead>
                      <TableHead className="text-muted-foreground">Customer</TableHead>
                      <TableHead className="text-muted-foreground">Vehicle</TableHead>
                      <TableHead className="text-muted-foreground">Description</TableHead>
                      <TableHead className="text-muted-foreground">Mechanic</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground">Cost</TableHead>
                      <TableHead className="pr-6 text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((order) => {
                      const customer = customers.find(
                        (c) => c.id === order.customerId
                      )
                      const vehicle = vehicles.find(
                        (v) => v.id === order.vehicleId
                      )
                      return (
                        <TableRow key={order.id} className="border-border">
                          <TableCell className="pl-6 font-medium font-mono text-foreground">
                            {order.id}
                          </TableCell>
                          <TableCell className="text-foreground">
                            {customer?.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {vehicle
                              ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                              : "N/A"}
                          </TableCell>
                          <TableCell className="max-w-48 truncate text-foreground">
                            {order.description}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {order.assignedMechanic}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={order.status} />
                          </TableCell>
                          <TableCell className="font-medium text-foreground">
                            ${order.totalCost.toLocaleString()}
                          </TableCell>
                          <TableCell className="pr-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                                  Update <ChevronDown className="size-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {(["pending", "in-progress", "completed", "cancelled"] as ServiceOrderStatus[])
                                  .filter((s) => s !== order.status)
                                  .map((status) => (
                                    <DropdownMenuItem
                                      key={status}
                                      onClick={() => updateOrderStatus(order.id, status)}
                                      className="capitalize"
                                    >
                                      {status.replace("-", " ")}
                                    </DropdownMenuItem>
                                  ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {sorted.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                          No orders found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Service Order</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Customer</Label>
              <Select
                value={form.customerId}
                onValueChange={(v) =>
                  setForm({ ...form, customerId: v, vehicleId: "" })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Vehicle</Label>
              <Select
                value={form.vehicleId}
                onValueChange={(v) => setForm({ ...form, vehicleId: v })}
                disabled={!form.customerId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={form.customerId ? "Select vehicle" : "Select customer first"} />
                </SelectTrigger>
                <SelectContent>
                  {customerVehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.year} {v.make} {v.model} ({v.licensePlate})
                    </SelectItem>
                  ))}
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
                placeholder="Oil Change, Tire Rotation, Brake Inspection"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="o-cost">Estimated Cost ($)</Label>
                <Input
                  id="o-cost"
                  value={form.totalCost}
                  onChange={(e) => setForm({ ...form, totalCost: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="o-mech">Assigned Mechanic</Label>
                <Input
                  id="o-mech"
                  value={form.assignedMechanic}
                  onChange={(e) => setForm({ ...form, assignedMechanic: e.target.value })}
                  placeholder="Mike Torres"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Create Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
