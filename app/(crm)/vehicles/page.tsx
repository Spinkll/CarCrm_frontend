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
import { Plus, Car } from "lucide-react"
import { useCrm } from "@/lib/crm-context"

export default function VehiclesPage() {
  const { vehicles, customers, serviceOrders, addVehicle } = useCrm()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [form, setForm] = useState({
    customerId: "",
    make: "",
    model: "",
    year: "",
    vin: "",
    licensePlate: "",
    color: "",
    mileage: "",
  })

  const filtered = vehicles.filter(
    (v) =>
      `${v.make} ${v.model}`.toLowerCase().includes(search.toLowerCase()) ||
      v.licensePlate.toLowerCase().includes(search.toLowerCase()) ||
      v.vin.toLowerCase().includes(search.toLowerCase())
  )

  function handleSubmit() {
    if (!form.make || !form.model || !form.customerId) return
    addVehicle({
      id: `V${String(vehicles.length + 1).padStart(3, "0")}`,
      customerId: form.customerId,
      make: form.make,
      model: form.model,
      year: parseInt(form.year) || new Date().getFullYear(),
      vin: form.vin,
      licensePlate: form.licensePlate,
      color: form.color,
      mileage: parseInt(form.mileage) || 0,
    })
    setForm({ customerId: "", make: "", model: "", year: "", vin: "", licensePlate: "", color: "", mileage: "" })
    setOpen(false)
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PageHeader title="Vehicles" description="Track all registered vehicles">
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="size-4" />
          Add Vehicle
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <Card className="border-border bg-card">
          <CardContent className="p-0">
            <div className="border-b border-border p-4">
              <Input
                placeholder="Search by make, model, plate, or VIN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-md bg-secondary"
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="pl-6 text-muted-foreground">Vehicle</TableHead>
                  <TableHead className="text-muted-foreground">Owner</TableHead>
                  <TableHead className="text-muted-foreground">License Plate</TableHead>
                  <TableHead className="text-muted-foreground">Mileage</TableHead>
                  <TableHead className="text-muted-foreground">Color</TableHead>
                  <TableHead className="pr-6 text-muted-foreground">Service History</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((vehicle) => {
                  const owner = customers.find((c) => c.id === vehicle.customerId)
                  const orderCount = serviceOrders.filter(
                    (o) => o.vehicleId === vehicle.id
                  ).length
                  return (
                    <TableRow key={vehicle.id} className="border-border">
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                            <Car className="size-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </p>
                            <p className="text-xs text-muted-foreground">{vehicle.vin}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">{owner?.name || "N/A"}</TableCell>
                      <TableCell>
                        <span className="rounded-md bg-secondary px-2 py-1 text-sm font-mono text-foreground">
                          {vehicle.licensePlate}
                        </span>
                      </TableCell>
                      <TableCell className="text-foreground">
                        {vehicle.mileage.toLocaleString()} mi
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block size-3 rounded-full border border-border"
                            style={{
                              backgroundColor:
                                vehicle.color.toLowerCase() === "white"
                                  ? "#e5e5e5"
                                  : vehicle.color.toLowerCase() === "silver"
                                    ? "#a8a8a8"
                                    : vehicle.color.toLowerCase(),
                            }}
                          />
                          <span className="text-sm text-foreground">{vehicle.color}</span>
                        </div>
                      </TableCell>
                      <TableCell className="pr-6 text-muted-foreground">
                        {orderCount} order{orderCount !== 1 ? "s" : ""}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      No vehicles found
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
            <DialogTitle>Add New Vehicle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Owner</Label>
              <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v })}>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="v-make">Make</Label>
                <Input id="v-make" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} placeholder="Toyota" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="v-model">Model</Label>
                <Input id="v-model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Camry" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="v-year">Year</Label>
                <Input id="v-year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="2024" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="v-color">Color</Label>
                <Input id="v-color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="Silver" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="v-plate">License Plate</Label>
              <Input id="v-plate" value={form.licensePlate} onChange={(e) => setForm({ ...form, licensePlate: e.target.value })} placeholder="ABC-1234" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="v-vin">VIN</Label>
              <Input id="v-vin" value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} placeholder="1HGBH41JXMN109186" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="v-mileage">Mileage</Label>
              <Input id="v-mileage" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} placeholder="0" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Add Vehicle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
