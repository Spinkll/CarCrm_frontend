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
import { Plus, Car } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useVehicles } from "@/lib/vehicles-context"

export default function VehiclesPage() {
  const { user } = useAuth()
  const { vehicles, addVehicle, isLoading } = useVehicles()

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    brand: "",
    model: "",
    year: "",
    vin: "",
    plate: "",  
    color: "",
    mileage: "",
  })

  if (!user) return null

  const filtered = vehicles.filter(
    (v: any) =>
      `${v.brand} ${v.model}`.toLowerCase().includes(search.toLowerCase()) ||
      (v.plate && v.plate.toLowerCase().includes(search.toLowerCase())) ||
      v.vin.toLowerCase().includes(search.toLowerCase())
  )

  async function handleSubmit() {
    if (!form.brand || !form.model || !form.plate || !form.vin) {
        alert("Please fill in all required fields");
        return;
    }
    
    setIsSubmitting(true)

    const payload = {
      brand: form.brand,
      model: form.model,
      year: parseInt(form.year) || new Date().getFullYear(),
      vin: form.vin,
      plate: form.plate,
      color: form.color, 
      mileage: parseInt(form.mileage) || 0, 
    }

    const result = await addVehicle(payload as any)

    setIsSubmitting(false)

    if (result.success) {
      setForm({ brand: "", model: "", year: "", vin: "", plate: "", color: "", mileage: "" })
      setOpen(false)
    } else {
      alert(typeof result.error === 'string' ? result.error : JSON.stringify(result.error))
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PageHeader title="Vehicles" description="Manage your vehicles">
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
                placeholder="Search by brand, model, plate or VIN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-md bg-secondary"
              />
            </div>
            
            {isLoading ? (
               <div className="p-8 text-center text-muted-foreground">Loading vehicles...</div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="pl-6 text-muted-foreground">Транспортний засіб</TableHead>
                  <TableHead className="text-muted-foreground">Номерний знак</TableHead>
                  <TableHead className="text-muted-foreground">Колір</TableHead>
                  <TableHead className="text-muted-foreground">Пробіг</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((vehicle: any) => (
                    <TableRow key={vehicle.id} className="border-border">
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                            <Car className="size-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {vehicle.year} {vehicle.brand} {vehicle.model}
                            </p>
                            <p className="text-xs text-muted-foreground">{vehicle.vin}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="rounded-md bg-secondary px-2 py-1 text-sm font-mono text-foreground">
                          {vehicle.plate}
                        </span>
                      </TableCell>
                      <TableCell>
                         <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full border border-gray-500" style={{ backgroundColor: vehicle.color }}></div>
                            <span className="text-sm text-foreground">{vehicle.color}</span>
                         </div>
                      </TableCell>
                      <TableCell className="text-foreground">
                        {vehicle.mileage?.toLocaleString()} km
                      </TableCell>
                    </TableRow>
                  )
                )}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                      No vehicles found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Додати транспортний засіб</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="v-brand">Марка</Label>
                <Input 
                  id="v-brand" 
                  value={form.brand} 
                  onChange={(e) => setForm({ ...form, brand: e.target.value })} 
                  placeholder="Toyota" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="v-model">Модель</Label>
                <Input 
                  id="v-model" 
                  value={form.model} 
                  onChange={(e) => setForm({ ...form, model: e.target.value })} 
                  placeholder="Camry" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="v-year">Рік</Label>
                  <Input 
                    id="v-year" 
                    type="number"
                    value={form.year} 
                    onChange={(e) => setForm({ ...form, year: e.target.value })} 
                    placeholder="2024" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="v-color">Колір</Label>
                  <Input 
                    id="v-color" 
                    value={form.color} 
                    onChange={(e) => setForm({ ...form, color: e.target.value })} 
                    placeholder="Black" 
                  />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="v-plate">Номерний знак</Label>
                    <Input 
                        id="v-plate" 
                        value={form.plate} 
                        onChange={(e) => setForm({ ...form, plate: e.target.value })} 
                        placeholder="AР 7777 АР" 
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="v-vin">VIN</Label>
                    <Input 
                        id="v-vin" 
                        value={form.vin} 
                        onChange={(e) => setForm({ ...form, vin: e.target.value })} 
                        placeholder="17 символів" 
                    />
                </div>
            </div>
            
            <div className="grid gap-2">
                <Label htmlFor="v-mileage">Пробіг (км)</Label>
                <Input 
                    id="v-mileage" 
                    type="number"
                    value={form.mileage} 
                    onChange={(e) => setForm({ ...form, mileage: e.target.value })} 
                    placeholder="0" 
                />
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Vehicle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}