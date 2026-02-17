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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Mail, Phone, MapPin } from "lucide-react"
import { useCrm } from "@/lib/crm-context"

export default function CustomersPage() {
  const { customers, vehicles, serviceOrders, addCustomer } = useCrm()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  })

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  )

  function handleSubmit() {
    if (!form.name || !form.email) return
    addCustomer({
      id: `C${String(customers.length + 1).padStart(3, "0")}`,
      name: form.name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      createdAt: new Date().toISOString().split("T")[0],
      totalSpent: 0,
      visitCount: 0,
    })
    setForm({ name: "", email: "", phone: "", address: "" })
    setOpen(false)
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PageHeader title="Customers" description="Manage your customer database">
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="size-4" />
          Add Customer
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <Card className="border-border bg-card">
          <CardContent className="p-0">
            <div className="border-b border-border p-4">
              <Input
                placeholder="Search customers by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-md bg-secondary"
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="pl-6 text-muted-foreground">Customer</TableHead>
                  <TableHead className="text-muted-foreground">Contact</TableHead>
                  <TableHead className="text-muted-foreground">Vehicles</TableHead>
                  <TableHead className="text-muted-foreground">Orders</TableHead>
                  <TableHead className="text-muted-foreground">Total Spent</TableHead>
                  <TableHead className="pr-6 text-muted-foreground">Since</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((customer) => {
                  const vehicleCount = vehicles.filter(
                    (v) => v.customerId === customer.id
                  ).length
                  const orderCount = serviceOrders.filter(
                    (o) => o.customerId === customer.id
                  ).length
                  return (
                    <TableRow key={customer.id} className="border-border">
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                            {customer.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{customer.name}</p>
                            <p className="text-xs text-muted-foreground">{customer.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-sm text-foreground">
                            <Mail className="size-3 text-muted-foreground" />
                            {customer.email}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="size-3" />
                            {customer.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">{vehicleCount}</TableCell>
                      <TableCell className="text-foreground">{orderCount}</TableCell>
                      <TableCell className="font-medium text-foreground">
                        ${customer.totalSpent.toLocaleString()}
                      </TableCell>
                      <TableCell className="pr-6 text-muted-foreground">{customer.createdAt}</TableCell>
                    </TableRow>
                  )
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      No customers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john@email.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(555) 000-0000"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="123 Main Street, City, State"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Add Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
