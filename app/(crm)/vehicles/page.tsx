"use client"

import { useState, useEffect, useMemo } from "react"
import { useSettings } from "@/lib/settings-context"
import { formatAppDate, cn } from "@/lib/utils"
import { useRouter, useSearchParams } from "next/navigation"
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
import { useOrders } from "@/lib/orders-context"
import { toast } from "@/hooks/use-toast"
import { carBrandsAndModels, carYears } from "@/lib/cars"
import { useTranslation } from "@/hooks/use-translation"

export default function VehiclesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { vehicles, addVehicle, isLoading: isVehiclesLoading } = useVehicles()
  const { customers } = useCrm()
  const { orders, fetchOrders, isLoading: isOrdersLoading } = useOrders()
  const { t } = useTranslation()


  const isLoading = isVehiclesLoading || isOrdersLoading

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const { settings } = useSettings()

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

  const uniqueBrands = Object.keys(carBrandsAndModels).sort();

  const matchedBrandKey = Object.keys(carBrandsAndModels).find(
    (b) => b.toLowerCase() === form.brand?.toLowerCase()
  );

  const uniqueModels = matchedBrandKey
    ? carBrandsAndModels[matchedBrandKey].sort()
    : [];

  const uniqueYears = carYears;
  const openFromQuery = searchParams.get("new") === "1"
  const returnTo = searchParams.get("returnTo")

  const role = user?.role?.toLowerCase()
  const canAssignOwner = role === "admin" || role === "manager"

  // Дозволяємо створювати авто всім, крім механіків
  const canCreateVehicle = role === "client" || role === "admin" || role === "manager"

  useEffect(() => {
    if (!canCreateVehicle || !openFromQuery) return
    if (role === "client" && !user?.isVerified) return

    setOpen(true)
  }, [canCreateVehicle, openFromQuery, role, user?.isVerified])

  if (!user) return null

  const filtered = vehicles.filter(
    (v: any) => {
      // Якщо це клієнт, показуємо тільки його авто
      if (role === "client" && v.userId !== user.id) return false;

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
      toast({ 
        title: t("fillRequired", "vehicles"), 
        description: t("fillRequiredDesc", "vehicles"), 
        variant: "destructive" 
      });
      return;
    }

    if (canAssignOwner && !form.userId) {
      toast({ title: t("selectOwnerError", "vehicles"), variant: "destructive" });
      return;
    }

    const isValidBrand = Object.keys(carBrandsAndModels).find(
      (b) => b.toLowerCase() === form.brand.toLowerCase()
    );
    if (!isValidBrand) {
      toast({ 
        title: t("invalidBrand", "vehicles"), 
        description: t("invalidBrandDesc", "vehicles"), 
        variant: "destructive" 
      });
      return;
    }

    const isValidModel = carBrandsAndModels[isValidBrand].find(
      (m) => m.toLowerCase() === form.model.toLowerCase()
    );
    if (!isValidModel) {
      toast({ 
        title: t("invalidBrand", "vehicles"), 
        description: t("invalidModelDesc", "vehicles"), 
        variant: "destructive" 
      });
      return;
    }

    if (form.year && !carYears.includes(String(form.year))) {
      toast({ 
        title: t("invalidBrand", "vehicles"), 
        description: t("invalidYearDesc", "vehicles"), 
        variant: "destructive" 
      });
      return;
    }

    setIsSubmitting(true)

    const ownerId = canAssignOwner ? Number(form.userId) : user?.id

    const payload = {
      brand: isValidBrand,
      model: isValidModel,
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
      toast({ title: t("addSuccess", "vehicles"), variant: "success" })
      if (returnTo) {
        router.push(returnTo)
      }
    } else {
      toast({ title: typeof result.error === 'string' ? result.error : JSON.stringify(result.error), variant: "destructive" })
    }
  }

  // Динамічні заголовки (для зручності)
  const pageTitle = role === "client" 
    ? t("myGarage", "vehicles") 
    : (role === "mechanic" ? t("mechanicTitle", "vehicles") : t("title", "vehicles"))

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PageHeader title={pageTitle} description={t("description", "vehicles")} />

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder={t("searchPlaceholder", "vehicles")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md bg-card"
          />
          {canCreateVehicle && (
            <Button
              onClick={() => {
                if (role === "client" && !user?.isVerified) {
                  toast({
                    title: t("verificationRequired", "vehicles"),
                    description: t("verificationRequiredDesc", "vehicles"),
                    variant: "destructive"
                  });
                  return;
                }
                setOpen(true);
              }}
            >
              <Plus className="mr-2 size-4" />
              {t("addVehicle", "vehicles")}
            </Button>
          )}
        </div>

        <Card className={cn("border-border bg-card", settings.showTableBorders && "table-bordered")}>
          <CardContent className="p-0">

            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="pl-6 text-muted-foreground">{t("car", "requests")}</TableHead>
                    <TableHead className="text-muted-foreground">{t("plate", "vehicles")}</TableHead>
                    {role !== "client" && <TableHead className="text-muted-foreground">{t("owner", "vehicles")}</TableHead>}
                    <TableHead className="text-muted-foreground">{t("color", "vehicles")}</TableHead>
                    <TableHead className="text-muted-foreground">{t("mileage", "vehicles")}</TableHead>
                    <TableHead className="pr-6 text-muted-foreground">{t("serviceHistory", "vehicles")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(
                    (currentPage - 1) * settings.tableRowsPerPage,
                    currentPage * settings.tableRowsPerPage
                  ).map((vehicle: any) => {
                    const owner = customers.find(c => c.id === vehicle.userId)

                    const vehicleOrders = orders.filter((o: any) => o.carId === vehicle.id)
                    const lastOrder = [...vehicleOrders].sort((a, b) =>
                      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    )[0]

                    return (
                      <TableRow
                        key={vehicle.id}
                        className="border-border cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => router.push(`/vehicles/${vehicle.id}`)}
                      >
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
                              <span className="text-xs text-muted-foreground italic">{t("noOwner", "vehicles")}</span>
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
                            <span className="text-sm text-foreground capitalize">{vehicle.color || t("unknownColor", "vehicles")}</span>
                          </div>
                        </TableCell>

                        <TableCell className="text-foreground">
                          {vehicle.mileage?.toLocaleString()} {t("km", "customers")}
                        </TableCell>

                        <TableCell className="pr-6">
                          {vehicleOrders.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <Wrench className="size-3 text-primary" />
                                <span className="text-sm font-medium text-foreground">
                                  {vehicleOrders.length} {vehicleOrders.length === 1 ? t("visit", "vehicles") : t("visits", "vehicles")}
                                </span>
                              </div>
                              {lastOrder && (
                                <span className="text-xs text-muted-foreground">
                                  {t("lastVisit", "vehicles")}: {formatAppDate(lastOrder.createdAt, settings.dateFormat)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">{t("noHistory", "vehicles")}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={role !== "client" ? 6 : 5} className="py-12 text-center text-muted-foreground">
                        {t("notFound", "vehicles")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}

            {/* Пагінація */}
            {!isLoading && filtered.length > settings.tableRowsPerPage && (
              <div className="flex items-center justify-between border-t border-border px-6 py-3">
                <span className="text-xs text-muted-foreground">
                  {(currentPage - 1) * settings.tableRowsPerPage + 1}–{Math.min(currentPage * settings.tableRowsPerPage, filtered.length)} {t("of", "customers")} {filtered.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="h-7 text-xs">
                    {t("prev", "customers")}
                  </Button>
                  <span className="text-xs text-muted-foreground">{currentPage} / {Math.max(1, Math.ceil(filtered.length / settings.tableRowsPerPage))}</span>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(Math.max(1, Math.ceil(filtered.length / settings.tableRowsPerPage)), p + 1))} disabled={currentPage >= Math.ceil(filtered.length / settings.tableRowsPerPage)} className="h-7 text-xs">
                    {t("next", "customers")}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("newVehicle", "vehicles")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">

            {canAssignOwner && (
              <div className="grid gap-2">
                <Label>{t("assignOwner", "vehicles")}</Label>
                <Select
                  value={form.userId}
                  onValueChange={(v) => setForm({ ...form, userId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectOwner", "vehicles")} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.firstName} {c.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="v-brand">{t("brand", "vehicles")}</Label>
                <Input
                  id="v-brand"
                  list="brands-list"
                  autoComplete="off"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="Toyota"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="v-model">{t("model", "vehicles")}</Label>
                <Input
                  id="v-model"
                  list="models-list"
                  autoComplete="off"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="Camry"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="v-year">{t("year", "vehicles")}</Label>
                <Input
                  id="v-year"
                  type="number"
                  list="years-list"
                  autoComplete="off"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  placeholder="2024"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="v-color">{t("color", "vehicles")}</Label>
                <Input
                  id="v-color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  placeholder={t("color", "vehicles")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="v-plate">{t("plate", "vehicles")}</Label>
                <LicensePlateInput
                  id="v-plate"
                  value={form.plate}
                  onValueChange={(val) => setForm({ ...form, plate: val.toUpperCase() })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="v-vin">{t("vin", "vehicles")}</Label>
                <VinInput
                  id="v-vin"
                  value={form.vin}
                  onValueChange={(val) => setForm({ ...form, vin: val.toUpperCase() })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="v-mileage">{t("mileage", "vehicles")}</Label>
              <Input
                id="v-mileage"
                type="number"
                value={form.mileage}
                onChange={(e) => setForm({ ...form, mileage: e.target.value })}
                placeholder="0"
              />
            </div>

            <datalist id="brands-list">
              {uniqueBrands.map((brand) => (
                <option key={brand} value={brand} />
              ))}
            </datalist>
            <datalist id="models-list">
              {uniqueModels.map((model) => (
                <option key={model} value={model} />
              ))}
            </datalist>
            <datalist id="years-list">
              {uniqueYears.map((year) => (
                <option key={year} value={year} />
              ))}
            </datalist>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>{t("cancel")}</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              {isSubmitting ? t("adding", "vehicles") : t("addVehicle", "vehicles")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
