"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSettings } from "@/lib/settings-context"
import { formatAppDate } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { uk, enUS } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { StatusBadge } from "@/components/status-badge"
import { KanbanBoard } from "@/components/dashboard/kanban-board"
import { Plus, ChevronDown, Eye, CalendarIcon, LayoutList, KanbanSquare, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useOrders } from "@/lib/orders-context"
import { useVehicles } from "@/lib/vehicles-context"
import { useAppointments } from "@/lib/appointments-context"
import { useCrm } from "@/lib/crm-context"
import { useNotifications } from "@/lib/notifications-context"
import { useServiceRequests } from "@/lib/service-requests-context"
import { useTranslation } from "@/hooks/use-translation"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function OrdersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { settings } = useSettings()
  const { orders, createOrder, updateStatus, isLoading: isOrdersLoading, fetchOrders } = useOrders()
  const { vehicles, isLoading: isVehiclesLoading } = useVehicles()
  const { customers, refreshData: refreshCrm } = useCrm()
  const { t, lang } = useTranslation()

  const { createRequest } = useServiceRequests()
  const { fetchAppointments, getAvailableSlots } = useAppointments()
  const { fetchNotifications } = useNotifications()

  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState("all")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isLoading = isOrdersLoading || isVehiclesLoading
  const [currentPage, setCurrentPage] = useState(1)

  const dateLocale = lang === "uk" ? uk : enUS

  const [viewMode, setViewMode] = useState<"table" | "kanban">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("orders_view_mode") as "table" | "kanban") || "table"
    }
    return "table"
  })

  const handleViewModeChange = useCallback((mode: "table" | "kanban") => {
    setViewMode(mode)
    localStorage.setItem("orders_view_mode", mode)
  }, [])

  const [form, setForm] = useState({
    vehicleId: "",
    description: "",
    mileage: "",
    services: "",
    estimatedDate: "",
    estimatedTime: "",
  })

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("")
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)

  const timeSlots = [
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"
  ]

  useEffect(() => {
    async function fetchSlots() {
      if (!selectedDate) {
        setAvailableSlots([])
        return
      }
      setIsLoadingSlots(true)
      const dateStr = format(selectedDate, "yyyy-MM-dd")
      const slots = await getAvailableSlots(dateStr)
      setAvailableSlots(slots)
      setIsLoadingSlots(false)

      if (selectedTimeSlot && !slots.includes(selectedTimeSlot)) {
        setSelectedTimeSlot("")
      }
    }
    fetchSlots()
  }, [selectedDate, getAvailableSlots])

  const role = user?.role?.toUpperCase() || "CLIENT"

  const roleFilteredOrders = useMemo(() => {
    if (role === "ADMIN" || role === "MANAGER") return orders
    if (role === "MECHANIC") return orders.filter(o => o.mechanic?.id === user?.id)
    return orders.filter(o => o.car?.userId === user?.id || (vehicles.find(v => v.id === o.carId)?.userId === user?.id))
  }, [orders, role, user?.id, vehicles])

  const availableVehicles = useMemo(() => {
    if (role === "ADMIN" || role === "MANAGER") return vehicles
    return vehicles.filter(v => v.userId === user?.id)
  }, [vehicles, role, user?.id])

  const canCreateOrders = role === "CLIENT" || role === "ADMIN" || role === "MANAGER"
  const canEditOrderStatus = role === "ADMIN" || role === "MANAGER" || role === "MECHANIC"

  const tabStatusMap: Record<string, string[]> = {
    all: [],
    pending: ["PENDING"],
    in_progress: ["IN_PROGRESS", "CONFIRMED", "WAITING_PARTS"],
    completed: ["COMPLETED", "PAID"],
  }

  const filtered = tab === "all"
    ? roleFilteredOrders
    : roleFilteredOrders.filter((o) => (tabStatusMap[tab] || []).includes(o.status))

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const totalPages = Math.max(1, Math.ceil(sorted.length / settings.tableRowsPerPage))
  const paginatedOrders = sorted.slice(
    (currentPage - 1) * settings.tableRowsPerPage,
    currentPage * settings.tableRowsPerPage
  )

  useEffect(() => { setCurrentPage(1) }, [tab])

  async function handleSubmit() {
    if (!form.vehicleId || !form.description || !form.mileage) {
      toast({ title: t("fillRequired", "orders"), variant: "destructive" })
      return
    }
    if (role !== "CLIENT" && (!form.estimatedDate || !form.estimatedTime)) {
      toast({ title: t("selectDateTime", "orders"), variant: "destructive" })
      return
    }
    setIsSubmitting(true)

    if (role === "CLIENT") {
      let scheduledAt
      if (selectedDate && selectedTimeSlot) {
        const dateStr = format(selectedDate, "yyyy-MM-dd")
        scheduledAt = new Date(`${dateStr}T${selectedTimeSlot}:00`).toISOString()
      }

      const result = await createRequest(Number(form.vehicleId), form.description, Number(form.mileage), scheduledAt);

      setIsSubmitting(false);

      if (result.success) {
        setForm({ vehicleId: "", description: "", mileage: "", services: "", estimatedDate: "", estimatedTime: "" });
        setSelectedDate(undefined);
        setSelectedTimeSlot("");
        setOpen(false);
        toast({ title: t("requestSent", "orders"), description: t("requestSentDesc", "orders"), variant: "success" });
      } else {
        toast({ title: result.error || t("requestFailed", "orders"), variant: "destructive" });
      }

      return;
    }

    const payload: any = {
      vehicleId: Number(form.vehicleId),
      description: form.description,
      mileage: Number(form.mileage),
    }

    payload.scheduledAt = new Date(`${form.estimatedDate}T${form.estimatedTime}:00`).toISOString()

    const result = await createOrder(payload)

    setIsSubmitting(false)

    if (result.success) {
      setForm({ vehicleId: "", description: "", mileage: "", services: "", estimatedDate: "", estimatedTime: "" })
      setOpen(false)
      toast({ title: t("orderCreated", "orders"), variant: "success" })
      await fetchNotifications()
    } else {
      toast({ title: result.error || t("orderFailed", "orders"), variant: "destructive" })
    }
  }

  const statusCounts = {
    all: roleFilteredOrders.length,
    pending: roleFilteredOrders.filter((o: any) => o.status === "PENDING").length,
    inProgress: roleFilteredOrders.filter((o: any) => ["IN_PROGRESS", "CONFIRMED", "WAITING_PARTS"].includes(o.status)).length,
    completed: roleFilteredOrders.filter((o: any) => ["COMPLETED", "PAID"].includes(o.status)).length,
  }

  const descriptions: Record<string, string> = {
    ADMIN: t("descriptionStaff", "orders"),
    MANAGER: t("descriptionStaff", "orders"),
    MECHANIC: t("descriptionMechanic", "orders"),
    CLIENT: t("descriptionClient", "orders"),
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PageHeader
        title={role === "CLIENT" ? t("myOrders", "orders") : t("title", "orders")}
        description={descriptions[role] || t("orders", "common")}
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {viewMode === "table" && (
              <Tabs value={tab} onValueChange={setTab} className="w-full sm:w-auto">
                <TabsList>
                  <TabsTrigger value="all">
                    {t("all", "orders")} <span className="ml-1.5 text-xs text-muted-foreground">({statusCounts.all})</span>
                  </TabsTrigger>
                  <TabsTrigger value="in_progress">
                    {t("inProgress", "orders")} <span className="ml-1.5 text-xs text-muted-foreground">({statusCounts.inProgress})</span>
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    {t("completed", "orders")} <span className="ml-1.5 text-xs text-muted-foreground">({statusCounts.completed})</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
              <button
                onClick={() => handleViewModeChange("table")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${viewMode === "table"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <LayoutList className="size-3.5" />
                {t("tableView", "orders")}
              </button>
              <button
                onClick={() => handleViewModeChange("kanban")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${viewMode === "kanban"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <KanbanSquare className="size-3.5" />
                {t("kanbanView", "orders")}
              </button>
            </div>

            {canCreateOrders && (
              <Button
                onClick={() => {
                  if (role === "CLIENT" && !user?.isVerified) {
                    toast({
                      title: t("verificationRequired", "vehicles"),
                      description: t("verificationRequiredDesc", "vehicles"),
                      variant: "destructive"
                    });
                    return;
                  }
                  setOpen(true);
                }}
                className="w-full sm:w-auto gap-2 shadow-sm"
              >
                <Plus className="size-4" />
                {role === "CLIENT" ? t("leaveRequest", "orders") : t("newOrder", "orders")}
              </Button>
            )}
          </div>
        </div>

        {viewMode === "kanban" ? (
          <div className="flex-1" style={{ height: "calc(100vh - 220px)" }}>
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">{t("loading", "orders")}</div>
            ) : (
              <KanbanBoard
                orders={orders}
                vehicles={vehicles}
                customers={customers}
                updateStatus={updateStatus}
                canDrag={canEditOrderStatus}
              />
            )}
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsContent value={tab} className="m-0">
              <Card className={cn("border-border bg-card", settings.showTableBorders && "table-bordered")}>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="p-8 text-center text-muted-foreground">{t("loading", "orders")}</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="pl-6 text-muted-foreground">{t("orderNo", "orders")}</TableHead>
                          <TableHead className="text-muted-foreground">{t("vehicle", "orders")}</TableHead>
                          {role !== "CLIENT" && <TableHead className="text-muted-foreground">{t("customer", "orders")}</TableHead>}
                          {role !== "CLIENT" && <TableHead className="text-muted-foreground">{t("manager", "orders")}</TableHead>}
                          {role !== "CLIENT" && <TableHead className="text-muted-foreground">{t("mechanic", "orders")}</TableHead>}
                          <TableHead className="text-muted-foreground">{t("description", "orders")}</TableHead>
                          <TableHead className="text-muted-foreground">{t("status", "orders")}</TableHead>
                          <TableHead className="text-muted-foreground">{t("amount", "orders")}</TableHead>
                          <TableHead className="pr-6 text-right text-muted-foreground"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedOrders.map((order) => {
                          const vehicleData = order.car || vehicles.find(v => v.id === order.carId)
                          const customer = customers.find(c => c.id === vehicleData?.userId)

                          return (
                            <TableRow key={order.id} className="border-border group">
                              <TableCell className="pl-6 font-medium font-mono text-foreground">
                                #{order.id}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {vehicleData
                                  ? `${vehicleData.brand} ${vehicleData.model} (${vehicleData.plate || t("noNumbers", "orders")})`
                                  : `${t("car", "requests")} #${order.carId || order.vehicleId}`}
                              </TableCell>

                              {role !== "CLIENT" && (
                                <TableCell className="text-foreground">
                                  {customer ? `${customer.firstName} ${customer.lastName}` : t("unknown", "orders")}
                                </TableCell>
                              )}

                              {role !== "CLIENT" && (
                                <TableCell className="text-muted-foreground text-xs">
                                  {order.manager ? `${order.manager.firstName} ${order.manager.lastName}` : "—"}
                                </TableCell>
                              )}

                              {role !== "CLIENT" && (
                                <TableCell className="text-muted-foreground text-xs">
                                  {order.mechanic ? `${order.mechanic.firstName} ${order.mechanic.lastName}` : "—"}
                                </TableCell>
                              )}

                              <TableCell className="max-w-48 truncate text-foreground" title={order.description}>
                                {order.description}
                              </TableCell>
                              <TableCell>
                                {canEditOrderStatus && order.status !== "PAID" && order.status !== "CANCELLED" ? (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button className="inline-flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
                                        <StatusBadge status={order.status.toLowerCase()} />
                                        <ChevronDown className="size-3 text-muted-foreground" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-48">
                                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                        {t("changeStatus", "orders")}
                                      </div>
                                      {["CONFIRMED", "IN_PROGRESS", "WAITING_PARTS", "COMPLETED", "CANCELLED"]
                                        .filter((s) => s !== order.status)
                                        .map((status) => (
                                          <DropdownMenuItem
                                            key={status}
                                            onClick={async () => {
                                              await updateStatus(order.id, status)

                                              fetchOrders(true)
                                              refreshCrm()
                                              fetchNotifications()
                                              toast({ title: t("statusUpdatedSuccess", "orders"), variant: "success" })
                                            }}
                                            className="cursor-pointer"
                                          >
                                            {t(`status_${status}`, "search") || status}
                                          </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                ) : (
                                  <StatusBadge status={order.status.toLowerCase()} />
                                )}
                              </TableCell>
                              <TableCell className="font-medium text-foreground">
                                {Number(order.totalAmount || 0).toLocaleString()} ₴
                              </TableCell>

                              <TableCell className="pr-6 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-1.5 text-xs"
                                  onClick={() => router.push(`/orders-detail/${order.id}`)}
                                >
                                  <Eye className="size-4" />
                                  {t("details", "orders")}
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        {paginatedOrders.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={role !== "CLIENT" ? 9 : 6} className="py-12 text-center text-muted-foreground">
                              {t("notFound", "orders")}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                  {!isLoading && sorted.length > settings.tableRowsPerPage && (
                    <div className="flex items-center justify-between border-t border-border px-6 py-3">
                      <span className="text-xs text-muted-foreground">
                        {(currentPage - 1) * settings.tableRowsPerPage + 1}–{Math.min(currentPage * settings.tableRowsPerPage, sorted.length)} {t("of", "customers")} {sorted.length}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="h-7 text-xs">
                          {t("prev", "customers")}
                        </Button>
                        <span className="text-xs text-muted-foreground">{currentPage} / {totalPages}</span>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="h-7 text-xs">
                          {t("next", "customers")}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {canCreateOrders && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{role === "CLIENT" ? t("newRequestTitle", "orders") : t("newOrderTitle", "orders")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">

              <div className="grid gap-2">
                <Label>{t("vehicle", "orders")}</Label>
                <Select
                  value={form.vehicleId}
                  onValueChange={(v) => setForm({ ...form, vehicleId: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("selectVehiclePlaceholder", "orders")} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVehicles.map((v) => {
                      const owner = customers.find(c => c.id === v.userId)
                      const ownerStr = (owner && (role === "ADMIN" || role === "MANAGER")) ? ` - ${owner.firstName} ${owner.lastName}` : ''
                      return (
                        <SelectItem key={v.id} value={v.id.toString()}>
                          {v.brand} {v.model} ({v.plate}){ownerStr}
                        </SelectItem>
                      )
                    })}
                    {availableVehicles.length === 0 && (
                      <div className="p-2 text-sm text-muted-foreground">{t("vehiclesNotFound", "orders")}</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="o-desc">
                  {role === "CLIENT" ? t("describeProblem", "orders") : t("describeProblemStaff", "orders")}
                </Label>
                <Textarea
                  id="o-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={role === "CLIENT" ? t("describeProblemPlaceholder", "orders") : t("describeProblemStaffPlaceholder", "orders")}
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="o-mileage">{t("mileage", "orders")}</Label>
                <Input
                  id="o-mileage"
                  type="number"
                  value={form.mileage}
                  onChange={(e) => setForm({ ...form, mileage: e.target.value })}
                  placeholder={t("mileagePlaceholder", "orders")}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="o-date">
                  {role === "CLIENT" ? t("desiredDate", "orders") : t("dateLabel", "orders")}
                </Label>
                {role === "CLIENT" ? (
                  <div className="grid gap-4">
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP", { locale: dateLocale }) : <span>{t("selectDate", "orders")}</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            setSelectedDate(date)
                            setCalendarOpen(false)
                          }}
                          disabled={(date) => {
                            const today = new Date()
                            today.setHours(0, 0, 0, 0)
                            return date < today
                          }}
                          initialFocus
                          locale={dateLocale}
                        />
                      </PopoverContent>
                    </Popover>

                    {selectedDate && (
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {isLoadingSlots ? (
                          <div className="col-span-full py-4 text-center text-xs text-muted-foreground">
                            {t("loadingSlots", "orders")}
                          </div>
                        ) : (
                          timeSlots.map((time) => {
                            const isAvailable = availableSlots.includes(time)

                            return (
                              <Button
                                key={time}
                                type="button"
                                variant={selectedTimeSlot === time ? "default" : "outline"}
                                className={cn(
                                  "text-xs relative overflow-hidden",
                                  !isAvailable && "opacity-50 line-through text-muted-foreground bg-muted hover:bg-muted/80"
                                )}
                                disabled={!isAvailable}
                                onClick={() => setSelectedTimeSlot(time)}
                              >
                                {time}
                              </Button>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      id="o-date"
                      type="date"
                      value={form.estimatedDate}
                      onChange={(e) => setForm({ ...form, estimatedDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                    <Input
                      id="o-time"
                      type="time"
                      value={form.estimatedTime}
                      onChange={(e) => setForm({ ...form, estimatedTime: e.target.value })}
                      placeholder="Час"
                      required
                    />
                  </div>
                )}
              </div>

            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                {t("cancel", "common")}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                {isSubmitting ? t("processing", "orders") : (role === "CLIENT" ? t("leaveRequest", "orders") : t("newOrder", "orders"))}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}