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
import { VinInput } from "@/components/ui/vin-input"
import { LicensePlateInput } from "@/components/ui/license-plate-input"
import { Label } from "@/components/ui/label"
import { Plus, Car, User, Loader2, Wrench } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useVehicles } from "@/lib/vehicles-context"
import { useCrm } from "@/lib/crm-context"
import { toast } from "@/hooks/use-toast"

export default function VehiclesPage() {
  const { user } = useAuth()
  const { vehicles, addVehicle, isLoading } = useVehicles()
  const { customers, filteredOrders } = useCrm()

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
    userId: "",
  })

  if (!user) return null

  const role = user.role?.toLowerCase()
  const canAssignOwner = role === "admin" || role === "manager"

  // Дозволяємо створювати авто всім, крім механіків
  const canCreateVehicle = role === "client" || role === "admin" || role === "manager"

  const filtered = vehicles.filter(
    (v: any) => {
      const owner = customers.find(c => c.id === v.userId)
      const ownerName = owner ? `${owner.firstName} ${owner.lastName}`.toLowerCase() : ""
      const searchLower = search.toLowerCase()

      return (
        `${v.brand} ${v.model}`.toLowerCase().includes(searchLower) ||
        (v.plate && v.plate.toLowerCase().includes(searchLower)) ||
        v.vin.toLowerCase().includes(searchLower) ||
        ownerName.includes(searchLower)
      )
    }
  )

  async function handleSubmit() {
    if (!form.brand || !form.model || !form.plate || !form.vin) {
      toast({ title: "Будь ласка, заповніть усі обов'язкові поля", description: "Марка, Модель, Номер, VIN", variant: "destructive" });
      return;
    }

    if (canAssignOwner && !form.userId) {
      toast({ title: "Будь ласка, оберіть власника для цього автомобіля", variant: "destructive" });
      return;
    }

    setIsSubmitting(true)

    const ownerId = canAssignOwner ? Number(form.userId) : user?.id

    const payload = {
      brand: form.brand,
      model: form.model,
      year: parseInt(form.year) || new Date().getFullYear(),
      vin: form.vin,
      plate: form.plate.toUpperCase(),
      color: form.color,
      mileage: parseInt(form.mileage) || 0,
      userId: ownerId,
    }

    const result = await addVehicle(payload as any)

    setIsSubmitting(false)

    if (result.success) {
      setForm({ brand: "", model: "", year: "", vin: "", plate: "", color: "", mileage: "", userId: "" })
      setOpen(false)
      toast({ title: "Автомобіль додано", variant: "success" })
    } else {
      toast({ title: typeof result.error === 'string' ? result.error : JSON.stringify(result.error), variant: "destructive" })
    }
  }

  // Динамічні заголовки (для зручності)
  const pageTitle = role === "client" ? "Мій гараж" : (role === "mechanic" ? "Автомобілі в ремонті" : "Автомобілі")

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PageHeader title={pageTitle} description="Управління транспортними засобами" />

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder="Пошук за маркою, моделлю, номером, VIN або власником..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md bg-card"
          />
          {canCreateVehicle && (
            <Button
              onClick={() => {
                if (role === "client" && !user?.isVerified) {
                  toast({
                    title: "Необхідна верифікація",
                    description: "Будь ласка, підтвердіть вашу електронну пошту, щоб додати автомобіль.",
                    variant: "destructive"
                  });
                  return;
                }
                setOpen(true);
              }}
            >
              <Plus className="mr-2 size-4" />
              Додати авто
            </Button>
          )}
        </div>

        <Card className="border-border bg-card">
          <CardContent className="p-0">

            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="pl-6 text-muted-foreground">Автомобіль</TableHead>
                    <TableHead className="text-muted-foreground">Номерний знак</TableHead>
                    {role !== "client" && <TableHead className="text-muted-foreground">Власник</TableHead>}
                    <TableHead className="text-muted-foreground">Колір</TableHead>
                    <TableHead className="text-muted-foreground">Пробіг</TableHead>
                    <TableHead className="pr-6 text-muted-foreground">Історія сервісу</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((vehicle: any) => {
                    const owner = customers.find(c => c.id === vehicle.userId)

                    const vehicleOrders = filteredOrders.filter(o => o.carId === vehicle.id)
                    const lastOrder = [...vehicleOrders].sort((a, b) =>
                      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    )[0]

                    return (
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
                              <p className="text-xs text-muted-foreground uppercase">{vehicle.vin}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="rounded-md bg-secondary px-2 py-1 text-sm font-mono text-foreground uppercase tracking-widest">
                            {vehicle.plate}
                          </span>
                        </TableCell>

                        {role !== "client" && (
                          <TableCell>
                            {owner ? (
                              <div className="flex items-center gap-2">
                                <User className="size-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-foreground">
                                  {owner.firstName} {owner.lastName}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Без власника</span>
                            )}
                          </TableCell>
                        )}

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full border border-black/20 shadow-sm"
                              style={{ backgroundColor: vehicle.color || '#ccc' }}
                              title={vehicle.color}
                            />
                            <span className="text-sm text-foreground capitalize">{vehicle.color || 'Невідомо'}</span>
                          </div>
                        </TableCell>

                        <TableCell className="text-foreground">
                          {vehicle.mileage?.toLocaleString()} км
                        </TableCell>

                        <TableCell className="pr-6">
                          {vehicleOrders.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <Wrench className="size-3 text-primary" />
                                <span className="text-sm font-medium text-foreground">
                                  {vehicleOrders.length} {vehicleOrders.length === 1 ? 'візит' : 'візитів'}
                                </span>
                              </div>
                              {lastOrder && (
                                <span className="text-xs text-muted-foreground">
                                  Останній: {new Date(lastOrder.createdAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Немає історії</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={role !== "client" ? 6 : 5} className="py-12 text-center text-muted-foreground">
                        Автомобілів за вашим запитом не знайдено
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
            <DialogTitle>Додати новий автомобіль</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">

            {canAssignOwner && (
              <div className="grid gap-2">
                <Label>Призначити клієнту</Label>
                <Select
                  value={form.userId}
                  onValueChange={(v) => setForm({ ...form, userId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть клієнта..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.firstName} {c.lastName} ({c.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
                  placeholder="Чорний"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="v-plate">Номерний знак</Label>
                <LicensePlateInput
                  id="v-plate"
                  value={form.plate}
                  onValueChange={(val) => setForm({ ...form, plate: val.toUpperCase() })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="v-vin">VIN-код</Label>
                <VinInput
                  id="v-vin"
                  value={form.vin}
                  onValueChange={(val) => setForm({ ...form, vin: val.toUpperCase() })}
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
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>Скасувати</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              {isSubmitting ? "Додавання..." : "Додати авто"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}