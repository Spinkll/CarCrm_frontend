"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { VinInput } from "@/components/ui/vin-input"
import { LicensePlateInput } from "@/components/ui/license-plate-input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useSettings } from "@/lib/settings-context"
import { formatAppDate, cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { useVehicles } from "@/lib/vehicles-context"
import { useCrm } from "@/lib/crm-context"
import { useOrders } from "@/lib/orders-context"
import { api } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { carBrandsAndModels, carYears } from "@/lib/cars"
import { useTranslation } from "@/hooks/use-translation"
import { Car, Check, Loader2, Plus, RefreshCw, SearchCheck, SearchX, User, Wrench } from "lucide-react"

type VinDecodeStatus = "idle" | "loading" | "success" | "error" | "not_found"
type VehicleDataMode = "select" | "manual"
type VehicleCreateStep = 1 | 2 | 3 | 4

function normalizeBrandName(brand: string) {
  const normalized = brand.trim().toLowerCase()
  return Object.keys(carBrandsAndModels).find((item) => item.toLowerCase() === normalized) || brand.trim()
}

function normalizeModelName(brand: string, model: string) {
  const normalizedBrand = normalizeBrandName(brand)
  const models = carBrandsAndModels[normalizedBrand]
  if (!models) return model.trim()

  const normalizedModel = model.trim().toLowerCase()
  return models.find((item) => item.toLowerCase() === normalizedModel) || model.trim()
}

function extractVinDecodedData(payload: any) {
  const source = payload?.data ?? payload?.result ?? payload ?? {}
  const brand = source.brand || source.make || source.manufacturer || source.mark || ""
  const model = source.model || source.modelName || source.vehicleModel || ""
  const yearRaw = source.year || source.modelYear || source.productionYear || source.manufactureYear || ""
  const color = source.color || source.exteriorColor || ""
  const engine = source.engine || source.engineVolume || source.displacement || source.engineDisplacement || ""
  const fuelType = source.fuelType || source.fuel || source.fuelName || ""
  const bodyClass = source.bodyClass || source.bodyType || source.vehicleType || ""

  return {
    brand: brand ? normalizeBrandName(String(brand)) : "",
    model: brand && model ? normalizeModelName(String(brand), String(model)) : model ? String(model).trim() : "",
    year: yearRaw ? String(yearRaw) : "",
    color: color ? String(color).trim() : "",
    engine: engine ? String(engine).trim() : "",
    fuelType: fuelType ? String(fuelType).trim() : "",
    bodyClass: bodyClass ? String(bodyClass).trim() : "",
  }
}

const initialForm = {
  brand: "",
  model: "",
  year: "",
  vin: "",
  plate: "",
  color: "",
  mileage: "",
  engine: "",
  fuelType: "",
  bodyClass: "",
  userId: "",
}

export default function VehiclesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { settings } = useSettings()
  const { vehicles, addVehicle, isLoading: isVehiclesLoading } = useVehicles()
  const { customers } = useCrm()
  const { orders, isLoading: isOrdersLoading } = useOrders()
  const { t } = useTranslation()

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [currentStep, setCurrentStep] = useState<VehicleCreateStep>(1)
  const [vinDecodeStatus, setVinDecodeStatus] = useState<VinDecodeStatus>("idle")
  const [vinDecodeMessage, setVinDecodeMessage] = useState("")
  const [decodedVin, setDecodedVin] = useState("")
  const [vehicleDataMode, setVehicleDataMode] = useState<VehicleDataMode>("select")
  const [form, setForm] = useState(initialForm)

  const isLoading = isVehiclesLoading || isOrdersLoading
  const normalizedVin = form.vin.trim().toUpperCase()
  const role = user?.role?.toLowerCase()
  const canAssignOwner = role === "admin" || role === "manager"
  const canCreateVehicle = role === "client" || role === "admin" || role === "manager"
  const openFromQuery = searchParams.get("new") === "1"
  const returnTo = searchParams.get("returnTo")

  const uniqueBrands = Object.keys(carBrandsAndModels).sort()
  const matchedBrandKey = Object.keys(carBrandsAndModels).find((item) => item.toLowerCase() === form.brand.trim().toLowerCase())
  const uniqueModels = matchedBrandKey ? carBrandsAndModels[matchedBrandKey].sort() : []
  const isKnownBrand = Boolean(matchedBrandKey)
  const isKnownModel = Boolean(matchedBrandKey && carBrandsAndModels[matchedBrandKey]?.some((item) => item.toLowerCase() === form.model.trim().toLowerCase()))

  const steps = [
    { id: 1 as VehicleCreateStep, title: canAssignOwner ? "Клієнт" : "Власник" },
    { id: 2 as VehicleCreateStep, title: "VIN" },
    { id: 3 as VehicleCreateStep, title: "Авто" },
    { id: 4 as VehicleCreateStep, title: "Додатково" },
  ]

  useEffect(() => {
    if (!canCreateVehicle || !openFromQuery) return
    if (role === "client" && !user?.isVerified) return
    setOpen(true)
  }, [canCreateVehicle, openFromQuery, role, user?.isVerified])

  useEffect(() => {
    if (open) return
    setCurrentStep(1)
    setVinDecodeStatus("idle")
    setVinDecodeMessage("")
    setDecodedVin("")
    setVehicleDataMode("select")
    setForm(initialForm)
  }, [open])

  async function decodeVin(vin: string, force = false) {
    const normalized = vin.trim().toUpperCase()
    if (normalized.length !== 17) return
    if (!force && decodedVin === normalized) return

    setVinDecodeStatus("loading")
    setVinDecodeMessage("Шукаємо дані автомобіля за VIN...")

    try {
      const { data } = await api.get(`/cars/decode-vin/${normalized}`)
      if (normalized !== form.vin.trim().toUpperCase()) return

      const decoded = extractVinDecodedData(data)
      const hasUsefulData = Boolean(decoded.brand || decoded.model || decoded.year || decoded.color || decoded.engine || decoded.fuelType || decoded.bodyClass)

      if (!hasUsefulData) {
        setVinDecodeStatus("not_found")
        setVinDecodeMessage("Дані за цим VIN не знайдено. Ви можете продовжити і заповнити автомобіль вручну.")
        setDecodedVin(normalized)
        setCurrentStep((prev) => (prev < 3 ? 3 : prev))
        return
      }

      setForm((current) => ({
        ...current,
        brand: decoded.brand || current.brand,
        model: decoded.model || current.model,
        year: decoded.year || current.year,
        color: decoded.color || current.color,
        engine: decoded.engine || current.engine,
        fuelType: decoded.fuelType || current.fuelType,
        bodyClass: decoded.bodyClass || current.bodyClass,
      }))

      const shouldUseManualMode =
        !decoded.brand ||
        !Object.keys(carBrandsAndModels).some((item) => item.toLowerCase() === decoded.brand.toLowerCase()) ||
        (decoded.model && decoded.brand && !carBrandsAndModels[normalizeBrandName(decoded.brand)]?.some((item) => item.toLowerCase() === decoded.model.toLowerCase()))

      setVehicleDataMode(shouldUseManualMode ? "manual" : "select")
      setVinDecodeStatus("success")
      setVinDecodeMessage("Дані підтягнуто з VIN. За потреби ви можете їх відредагувати вручну.")
      setDecodedVin(normalized)
      setCurrentStep((prev) => (prev < 3 ? 3 : prev))
    } catch (error: any) {
      if (normalized !== form.vin.trim().toUpperCase()) return
      const message = error.response?.data?.message
      setVinDecodeStatus("error")
      setVinDecodeMessage(
        Array.isArray(message)
          ? message[0]
          : typeof message === "string" && message.trim().length > 0
            ? message
            : "Не вдалося отримати дані з VIN. Ви можете продовжити заповнення вручну."
      )
      setDecodedVin(normalized)
    }
  }

  useEffect(() => {
    if (!open) return
    if (normalizedVin.length !== 17) {
      setVinDecodeStatus("idle")
      setVinDecodeMessage("")
      setDecodedVin("")
      return
    }
    if (decodedVin === normalizedVin) return

    const timeoutId = window.setTimeout(() => {
      void decodeVin(normalizedVin)
    }, 500)

    return () => window.clearTimeout(timeoutId)
  }, [decodedVin, normalizedVin, open])

  if (!user) return null

  const filtered = vehicles.filter((vehicle: any) => {
    if (role === "client" && vehicle.userId !== user.id) return false

    const owner = customers.find((customer) => customer.id === vehicle.userId)
    const ownerName = owner ? `${owner.firstName} ${owner.lastName}`.toLowerCase() : ""
    const searchLower = search.toLowerCase()

    return (
      `${vehicle.brand} ${vehicle.model}`.toLowerCase().includes(searchLower) ||
      (vehicle.plate && vehicle.plate.toLowerCase().includes(searchLower)) ||
      vehicle.vin.toLowerCase().includes(searchLower) ||
      ownerName.includes(searchLower)
    )
  })

  function validateStep(step: VehicleCreateStep) {
    if (step === 1 && canAssignOwner && !form.userId) {
      toast({ title: t("selectOwnerError", "vehicles"), variant: "destructive" })
      return false
    }

    if (step === 2 && normalizedVin.length !== 17) {
      toast({
        title: "VIN має містити 17 символів",
        description: "Використовуйте лише латинські літери та цифри без I, O, Q.",
        variant: "destructive",
      })
      return false
    }

    if (step === 3) {
      if (!form.brand || !form.model || !form.plate) {
        toast({
          title: t("fillRequired", "vehicles"),
          description: t("fillRequiredDesc", "vehicles"),
          variant: "destructive",
        })
        return false
      }

      if (vehicleDataMode === "select") {
        const validBrand = Object.keys(carBrandsAndModels).find((item) => item.toLowerCase() === form.brand.toLowerCase())
        if (!validBrand) {
          toast({
            title: t("invalidBrand", "vehicles"),
            description: t("invalidBrandDesc", "vehicles"),
            variant: "destructive",
          })
          return false
        }

        const validModel = carBrandsAndModels[validBrand].find((item) => item.toLowerCase() === form.model.toLowerCase())
        if (!validModel) {
          toast({
            title: t("invalidBrand", "vehicles"),
            description: t("invalidModelDesc", "vehicles"),
            variant: "destructive",
          })
          return false
        }
      }

      if (form.year && !/^\d{4}$/.test(String(form.year))) {
        toast({
          title: t("invalidBrand", "vehicles"),
          description: t("invalidYearDesc", "vehicles"),
          variant: "destructive",
        })
        return false
      }
    }

    return true
  }

  async function handleSubmit() {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return

    let brandToSave = form.brand.trim()
    let modelToSave = form.model.trim()

    if (vehicleDataMode === "select") {
      const validBrand = Object.keys(carBrandsAndModels).find((item) => item.toLowerCase() === form.brand.toLowerCase())
      const validModel = validBrand ? carBrandsAndModels[validBrand].find((item) => item.toLowerCase() === form.model.toLowerCase()) : null
      if (validBrand) brandToSave = validBrand
      if (validModel) modelToSave = validModel
    }

    setIsSubmitting(true)
    const ownerId = canAssignOwner ? Number(form.userId) : user!.id
    const payload = {
      brand: brandToSave,
      model: modelToSave,
      year: parseInt(form.year) || new Date().getFullYear(),
      vin: normalizedVin,
      plate: form.plate.toUpperCase(),
      color: form.color,
      mileage: parseInt(form.mileage) || 0,
      engine: form.engine.trim() || undefined,
      fuelType: form.fuelType.trim() || undefined,
      bodyClass: form.bodyClass.trim() || undefined,
      userId: ownerId,
    }

    const result = await addVehicle(payload as any)
    setIsSubmitting(false)

    if (!result.success) {
      toast({
        title: typeof result.error === "string" ? result.error : JSON.stringify(result.error),
        variant: "destructive",
      })
      return
    }

    setOpen(false)
    toast({ title: t("addSuccess", "vehicles"), variant: "success" })
    if (returnTo) router.push(returnTo)
  }

  const pageTitle = role === "client" ? t("myGarage", "vehicles") : role === "mechanic" ? t("mechanicTitle", "vehicles") : t("title", "vehicles")
  const selectedOwner = canAssignOwner ? customers.find((customer) => String(customer.id) === form.userId) : user

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PageHeader title={pageTitle} description={t("description", "vehicles")} />

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder={t("searchPlaceholder", "vehicles")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="max-w-md bg-card"
          />
          {canCreateVehicle && (
            <Button
              onClick={() => {
                if (role === "client" && !user?.isVerified) {
                  toast({
                    title: t("verificationRequired", "vehicles"),
                    description: t("verificationRequiredDesc", "vehicles"),
                    variant: "destructive",
                  })
                  return
                }
                setOpen(true)
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
                    <TableHead className="text-muted-foreground">{t("car", "requests")}</TableHead>
                    <TableHead className="text-muted-foreground">{t("plate", "vehicles")}</TableHead>
                    {role !== "client" && <TableHead className="text-muted-foreground">{t("owner", "vehicles")}</TableHead>}
                    <TableHead className="text-muted-foreground">{t("color", "vehicles")}</TableHead>
                    <TableHead className="text-muted-foreground">{t("mileage", "vehicles")}</TableHead>
                    <TableHead className="text-muted-foreground">{t("serviceHistory", "vehicles")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice((currentPage - 1) * settings.tableRowsPerPage, currentPage * settings.tableRowsPerPage).map((vehicle: any) => {
                    const owner = customers.find((customer) => customer.id === vehicle.userId)
                    const vehicleOrders = orders.filter((order: any) => order.carId === vehicle.id)
                    const lastOrder = [...vehicleOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

                    return (
                      <TableRow
                        key={vehicle.id}
                        className="cursor-pointer border-border transition-colors hover:bg-muted/50"
                        onClick={() => router.push(`/vehicles/${vehicle.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                              <Car className="size-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{vehicle.year} {vehicle.brand} {vehicle.model}</p>
                              <p className="text-xs uppercase text-muted-foreground">{vehicle.vin}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="rounded-md bg-secondary px-2 py-1 text-sm font-mono uppercase tracking-widest text-foreground">{vehicle.plate}</span>
                        </TableCell>
                        {role !== "client" && (
                          <TableCell>
                            {owner ? (
                              <div className="flex items-center gap-2">
                                <User className="size-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-foreground">{owner.firstName} {owner.lastName}</span>
                              </div>
                            ) : (
                              <span className="text-xs italic text-muted-foreground">{t("noOwner", "vehicles")}</span>
                            )}
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full border border-black/20 shadow-sm" style={{ backgroundColor: vehicle.color || "#ccc" }} />
                            <span className="text-sm capitalize text-foreground">{vehicle.color || t("unknownColor", "vehicles")}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">{vehicle.mileage?.toLocaleString()} {t("km", "customers")}</TableCell>
                        <TableCell>
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
                            <span className="text-xs italic text-muted-foreground">{t("noHistory", "vehicles")}</span>
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

            {!isLoading && filtered.length > settings.tableRowsPerPage && (
              <div className="flex items-center justify-between border-t border-border px-6 py-3">
                <span className="text-xs text-muted-foreground">
                  {(currentPage - 1) * settings.tableRowsPerPage + 1}–{Math.min(currentPage * settings.tableRowsPerPage, filtered.length)} {t("of", "customers")} {filtered.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage <= 1} className="h-7 text-xs">
                    {t("prev", "customers")}
                  </Button>
                  <span className="text-xs text-muted-foreground">{currentPage} / {Math.max(1, Math.ceil(filtered.length / settings.tableRowsPerPage))}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((page) => Math.min(Math.max(1, Math.ceil(filtered.length / settings.tableRowsPerPage)), page + 1))}
                    disabled={currentPage >= Math.ceil(filtered.length / settings.tableRowsPerPage)}
                    className="h-7 text-xs"
                  >
                    {t("next", "customers")}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("newVehicle", "vehicles")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 pr-1">
            <div className="rounded-lg border border-border bg-secondary/20 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">Крок {currentStep} з {steps.length}</p>
                <p className="text-xs text-muted-foreground">{steps.find((step) => step.id === currentStep)?.title}</p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {steps.map((step) => {
                  const isActive = step.id === currentStep
                  const isDone = step.id < currentStep
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setCurrentStep(step.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-md border px-3 py-2 text-left transition-colors",
                        isActive ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-accent/50"
                      )}
                    >
                      <span className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                        isDone ? "border-primary bg-primary text-primary-foreground" : isActive ? "border-primary text-primary" : "border-muted-foreground/40 text-muted-foreground"
                      )}>
                        {isDone ? <Check className="size-3" /> : step.id}
                      </span>
                      <span className="truncate text-xs font-medium text-foreground">{step.title}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {currentStep === 1 && (
              <div className="grid gap-4">
                {canAssignOwner ? (
                  <div className="grid gap-2">
                    <Label>{t("assignOwner", "vehicles")}</Label>
                    <Select value={form.userId} onValueChange={(value) => setForm((current) => ({ ...current, userId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectOwner", "vehicles")} />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={String(customer.id)}>
                            {customer.firstName} {customer.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Спочатку обираємо власника, а вже потім працюємо з VIN та характеристиками авто.</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-card p-4">
                    <p className="mb-1 text-sm font-medium text-foreground">Авто буде прив'язане до вашого профілю</p>
                    <p className="text-sm text-muted-foreground">{selectedOwner?.firstName} {selectedOwner?.lastName}</p>
                  </div>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="v-vin">{t("vin", "vehicles")}</Label>
                    <span className={cn("text-xs", normalizedVin.length === 17 ? "text-primary" : "text-muted-foreground")}>
                      {normalizedVin.length}/17
                    </span>
                  </div>
                  <VinInput
                    id="v-vin"
                    value={form.vin}
                    onValueChange={(value) => {
                      setForm((current) => ({ ...current, vin: value }))
                      if (value.length < 17) {
                        setVinDecodeStatus("idle")
                        setVinDecodeMessage("")
                        setDecodedVin("")
                      }
                    }}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">Доступні лише латинські літери та цифри. Символи I, O, Q автоматично відсікаються.</p>
                    <Button type="button" variant="outline" size="sm" onClick={() => void decodeVin(form.vin, true)} disabled={normalizedVin.length !== 17 || vinDecodeStatus === "loading"}>
                      {vinDecodeStatus === "loading" ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                      Оновити з VIN
                    </Button>
                  </div>
                </div>

                {vinDecodeStatus !== "idle" && (
                  <Alert variant={vinDecodeStatus === "error" ? "destructive" : "default"}>
                    {vinDecodeStatus === "loading" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : vinDecodeStatus === "success" ? (
                      <SearchCheck className="size-4" />
                    ) : (
                      <SearchX className="size-4" />
                    )}
                    <AlertTitle>
                      {vinDecodeStatus === "loading" && "Пошук по VIN"}
                      {vinDecodeStatus === "success" && "Дані знайдено"}
                      {vinDecodeStatus === "not_found" && "Дані не знайдено"}
                      {vinDecodeStatus === "error" && "Помилка декодування VIN"}
                    </AlertTitle>
                    <AlertDescription>{vinDecodeMessage}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="grid gap-4">
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/20 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">Дані автомобіля</p>
                    <p className="text-xs text-muted-foreground">
                      {vehicleDataMode === "select" ? "Основний режим: вибір марки, моделі та року зі списку." : "Ручний режим: якщо VIN не розшифрувався або авто нестандартне."}
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setVehicleDataMode((current) => current === "select" ? "manual" : "select")}>
                    {vehicleDataMode === "select" ? "Ввести вручну" : "Обрати зі списку"}
                  </Button>
                </div>

                {vehicleDataMode === "select" ? (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label>{t("brand", "vehicles")}</Label>
                        <Select value={isKnownBrand ? form.brand : ""} onValueChange={(value) => setForm((current) => ({ ...current, brand: value, model: "" }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Оберіть марку" />
                          </SelectTrigger>
                          <SelectContent>
                            {uniqueBrands.map((brand) => (
                              <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>{t("model", "vehicles")}</Label>
                        <Select value={isKnownModel ? form.model : ""} onValueChange={(value) => setForm((current) => ({ ...current, model: value }))} disabled={!matchedBrandKey}>
                          <SelectTrigger>
                            <SelectValue placeholder={matchedBrandKey ? "Оберіть модель" : "Спочатку оберіть марку"} />
                          </SelectTrigger>
                          <SelectContent>
                            {uniqueModels.map((model) => (
                              <SelectItem key={model} value={model}>{model}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label>{t("year", "vehicles")}</Label>
                        <Select value={form.year} onValueChange={(value) => setForm((current) => ({ ...current, year: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Оберіть рік" />
                          </SelectTrigger>
                          <SelectContent>
                            {carYears.map((year) => (
                              <SelectItem key={year} value={year}>{year}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="v-color">{t("color", "vehicles")}</Label>
                        <Input id="v-color" value={form.color} onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))} placeholder={t("color", "vehicles")} />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="v-brand">{t("brand", "vehicles")}</Label>
                        <Input id="v-brand" list="brands-list" autoComplete="off" value={form.brand} onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))} placeholder="Toyota" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="v-model">{t("model", "vehicles")}</Label>
                        <Input id="v-model" list="models-list" autoComplete="off" value={form.model} onChange={(event) => setForm((current) => ({ ...current, model: event.target.value }))} placeholder="Camry" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="v-year">{t("year", "vehicles")}</Label>
                        <Input id="v-year" type="number" list="years-list" autoComplete="off" value={form.year} onChange={(event) => setForm((current) => ({ ...current, year: event.target.value }))} placeholder="2024" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="v-color-manual">{t("color", "vehicles")}</Label>
                        <Input id="v-color-manual" value={form.color} onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))} placeholder={t("color", "vehicles")} />
                      </div>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="v-plate">{t("plate", "vehicles")}</Label>
                    <LicensePlateInput id="v-plate" value={form.plate} onValueChange={(value) => setForm((current) => ({ ...current, plate: value.toUpperCase() }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="v-mileage">{t("mileage", "vehicles")}</Label>
                    <Input id="v-mileage" type="number" value={form.mileage} onChange={(event) => setForm((current) => ({ ...current, mileage: event.target.value }))} placeholder="0" />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="v-engine">Об'єм двигуна</Label>
                  <Input id="v-engine" value={form.engine} onChange={(event) => setForm((current) => ({ ...current, engine: event.target.value }))} placeholder="2.0" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="v-fuel-type">Тип палива</Label>
                  <Input id="v-fuel-type" value={form.fuelType} onChange={(event) => setForm((current) => ({ ...current, fuelType: event.target.value }))} placeholder="Бензин" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="v-body-class">Тип кузова</Label>
                  <Input id="v-body-class" value={form.bodyClass} onChange={(event) => setForm((current) => ({ ...current, bodyClass: event.target.value }))} placeholder="Седан" />
                </div>
                <div className="rounded-lg border border-border bg-secondary/20 p-4 text-sm">
                  <p className="mb-3 font-medium text-foreground">Підсумок перед створенням</p>
                  <div className="grid grid-cols-1 gap-2 text-muted-foreground sm:grid-cols-2">
                    <p><span className="text-foreground">Власник:</span> {selectedOwner ? `${selectedOwner.firstName} ${selectedOwner.lastName}` : "—"}</p>
                    <p><span className="text-foreground">VIN:</span> {normalizedVin || "—"}</p>
                    <p><span className="text-foreground">Авто:</span> {[form.brand, form.model].filter(Boolean).join(" ") || "—"}</p>
                    <p><span className="text-foreground">Номер:</span> {form.plate || "—"}</p>
                  </div>
                </div>
              </div>
            )}

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
              {carYears.map((year) => (
                <option key={year} value={year} />
              ))}
            </datalist>
          </div>

          <DialogFooter>
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                  {t("cancel")}
                </Button>
                <Button variant="outline" onClick={() => setCurrentStep((step) => Math.max(1, step - 1) as VehicleCreateStep)} disabled={isSubmitting || currentStep === 1}>
                  Назад
                </Button>
              </div>
              {currentStep < 4 ? (
                <Button
                  onClick={() => {
                    if (!validateStep(currentStep)) return
                    setCurrentStep((step) => Math.min(4, step + 1) as VehicleCreateStep)
                  }}
                  disabled={isSubmitting}
                >
                  Далі
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  {isSubmitting ? t("adding", "vehicles") : t("addVehicle", "vehicles")}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

