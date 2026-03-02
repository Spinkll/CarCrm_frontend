"use client"

import { useState, useEffect } from "react"
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
import { uk } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { StatusBadge } from "@/components/status-badge"
import { Plus, ChevronDown, Eye, CalendarIcon } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useOrders } from "@/lib/orders-context"
import { useVehicles } from "@/lib/vehicles-context"
import { useAppointments } from "@/lib/appointments-context"
import { useCrm } from "@/lib/crm-context"
import { useNotifications } from "@/lib/notifications-context"

// ДОБАВЛЯЕМ ИМПОРТ НОВОГО ХУКА ЗАЯВОК:
import { useServiceRequests } from "@/lib/service-requests-context"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

const statusTranslations: Record<string, string> = {
  PENDING: "Очікує",
  CONFIRMED: "Підтверджено",
  IN_PROGRESS: "В процесі",
  WAITING_PARTS: "Очікування запчастин",
  COMPLETED: "Виконано",
  PAID: "Оплачено",
  CANCELLED: "Скасовано",
}

export default function OrdersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { orders, createOrder, updateStatus, isLoading } = useOrders()
  const { vehicles } = useVehicles()
  const { customers, refreshData } = useCrm()

  const { createRequest } = useServiceRequests()
  const { appointments, fetchAppointments, getAvailableSlots, updateStatus: updateAppointmentStatus } = useAppointments()
  const { fetchNotifications } = useNotifications()

  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState("all")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    vehicleId: "",
    description: "",
    services: "",
    estimatedDate: "",
    estimatedTime: "",
  })

  // Стан для календаря (клієнта)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("")
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)

  // Доступні слоти часу (наприклад, з 9:00 до 17:00)
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

      // Скидаємо вибраний час, якщо він тепер не доступний
      if (selectedTimeSlot && !slots.includes(selectedTimeSlot)) {
        setSelectedTimeSlot("")
      }
    }
    fetchSlots()
  }, [selectedDate, getAvailableSlots])

  if (!user) return null

  const role = user.role?.toUpperCase() || "CLIENT"
  const canCreateOrders = role === "CLIENT" || role === "ADMIN" || role === "MANAGER"
  const canEditOrderStatus = role === "ADMIN" || role === "MECHANIC" || role === "MANAGER"

  const tabStatusMap: Record<string, string[]> = {
    all: [],
    pending: ["PENDING"],
    in_progress: ["IN_PROGRESS", "CONFIRMED", "WAITING_PARTS"],
    completed: ["COMPLETED", "PAID"],
  }

  const filtered = tab === "all"
    ? orders
    : orders.filter((o) => (tabStatusMap[tab] || []).includes(o.status))

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  // ПОЛНОСТЬЮ ОБНОВЛЕННАЯ ФУНКЦИЯ SUBMIT
  async function handleSubmit() {
    if (!form.vehicleId || !form.description) return
    if (role !== "CLIENT" && (!form.estimatedDate || !form.estimatedTime)) {
      toast({ title: "Будь ласка, вкажіть дату та час запису", variant: "destructive" })
      return
    }
    setIsSubmitting(true)

    // --- ЛОГИКА ДЛЯ КЛИЕНТА (СОЗДАЕТ ServiceRequest) ---
    if (role === "CLIENT") {
      let scheduledAt
      if (selectedDate && selectedTimeSlot) {
        const dateStr = format(selectedDate, "yyyy-MM-dd")
        scheduledAt = new Date(`${dateStr}T${selectedTimeSlot}:00`).toISOString()
      }

      const result = await createRequest(Number(form.vehicleId), form.description, scheduledAt);

      setIsSubmitting(false);

      if (result.success) {
        setForm({ vehicleId: "", description: "", services: "", estimatedDate: "", estimatedTime: "" });
        setSelectedDate(undefined);
        setSelectedTimeSlot("");
        setOpen(false);
        toast({ title: "Заявку надіслано", description: "Менеджер зв'яжеться з вами.", variant: "success" });
      } else {
        toast({ title: result.error || "Не вдалося надіслати заявку", variant: "destructive" });
      }

      return; // Выходим из функции, чтобы заказ не создавался!
    }

    // --- ЛОГИКА ДЛЯ МЕНЕДЖЕРА/АДМИНА (СОЗДАЕТ ПРЯМОЙ ЗАКАЗ) ---
    const payload: any = {
      vehicleId: Number(form.vehicleId),
      description: form.description,
    }

    // Дата + час для створення запису в календарі
    payload.scheduledAt = new Date(`${form.estimatedDate}T${form.estimatedTime}:00`).toISOString()

    const result = await createOrder(payload)

    setIsSubmitting(false)

    if (result.success) {
      setForm({ vehicleId: "", description: "", services: "", estimatedDate: "", estimatedTime: "" })
      setOpen(false)
      toast({ title: "Замовлення створено", variant: "success" })
      await Promise.all([fetchAppointments(), fetchNotifications()])
    } else {
      toast({ title: result.error || "Не вдалося створити замовлення", variant: "destructive" })
    }
  }

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "PENDING").length,
    inProgress: orders.filter((o) => ["IN_PROGRESS", "CONFIRMED", "WAITING_PARTS"].includes(o.status)).length,
    completed: orders.filter((o) => ["COMPLETED", "PAID"].includes(o.status)).length,
  }

  const descriptions: Record<string, string> = {
    ADMIN: "Управління замовленнями та заявками на сервіс",
    MANAGER: "Управління замовленнями та заявками на сервіс",
    MECHANIC: "Призначені вам замовлення на ремонт",
    CLIENT: "Відстеження ваших заявок на сервіс",
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PageHeader
        title={role === "CLIENT" ? "Мої замовлення" : "Замовлення сервісу"}
        description={descriptions[role] || "Замовлення"}
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={tab} onValueChange={setTab} className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="all">
                Всі <span className="ml-1.5 text-xs text-muted-foreground">({statusCounts.all})</span>
              </TabsTrigger>
              <TabsTrigger value="in_progress">
                В роботі <span className="ml-1.5 text-xs text-muted-foreground">({statusCounts.inProgress})</span>
              </TabsTrigger>
              <TabsTrigger value="completed">
                Завершені <span className="ml-1.5 text-xs text-muted-foreground">({statusCounts.completed})</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {canCreateOrders && (
            <Button
              onClick={() => {
                if (role === "CLIENT" && !user?.isVerified) {
                  toast({
                    title: "Необхідна верифікація",
                    description: "Будь ласка, підтвердіть вашу електронну пошту, щоб залишити заявку.",
                    variant: "destructive"
                  });
                  return;
                }
                setOpen(true);
              }}
              className="w-full sm:w-auto gap-2 shadow-sm"
            >
              <Plus className="size-4" />
              {role === "CLIENT" ? "Залишити заявку" : "Нове замовлення"}
            </Button>
          )}
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsContent value={tab} className="m-0">
            <Card className="border-border bg-card">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-8 text-center text-muted-foreground">Завантаження замовлень...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="pl-6 text-muted-foreground">№ Замовлення</TableHead>
                        <TableHead className="text-muted-foreground">Автомобіль</TableHead>
                        {role !== "CLIENT" && <TableHead className="text-muted-foreground">Клієнт</TableHead>}
                        <TableHead className="text-muted-foreground">Опис</TableHead>
                        <TableHead className="text-muted-foreground">Статус</TableHead>
                        <TableHead className="text-muted-foreground">Сума</TableHead>
                        <TableHead className="pr-6 text-right text-muted-foreground"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sorted.map((order) => {
                        const vehicleData = order.car || vehicles.find(v => v.id === order.carId)
                        const customer = customers.find(c => c.id === vehicleData?.userId)

                        return (
                          <TableRow key={order.id} className="border-border group">
                            <TableCell className="pl-6 font-medium font-mono text-foreground">
                              #{order.id}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {vehicleData
                                ? `${vehicleData.brand} ${vehicleData.model} (${vehicleData.plate || 'Немає номерів'})`
                                : `Авто #${order.carId || order.vehicleId}`}
                            </TableCell>

                            {role !== "CLIENT" && (
                              <TableCell className="text-foreground">
                                {customer ? `${customer.firstName} ${customer.lastName}` : "Невідомо"}
                              </TableCell>
                            )}

                            <TableCell className="max-w-48 truncate text-foreground" title={order.description}>
                              {order.description}
                            </TableCell>
                            <TableCell>
                              {canEditOrderStatus ? (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="inline-flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
                                      <StatusBadge status={order.status.toLowerCase()} />
                                      <ChevronDown className="size-3 text-muted-foreground" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start" className="w-48">
                                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                      Змінити статус
                                    </div>
                                    {["CONFIRMED", "IN_PROGRESS", "WAITING_PARTS", "COMPLETED", "CANCELLED"]
                                      .filter((s) => s !== order.status)
                                      .map((status) => (
                                        <DropdownMenuItem
                                          key={status}
                                          onClick={async () => {
                                            await updateStatus(order.id, status)

                                            // Синхронізація статусу запису в календарі
                                            const orderToApptStatus: Record<string, string> = {
                                              CONFIRMED: "CONFIRMED",
                                              IN_PROGRESS: "ARRIVED",
                                              COMPLETED: "COMPLETED",
                                              PAID: "COMPLETED",
                                              CANCELLED: "CANCELLED",
                                            }
                                            const apptStatus = orderToApptStatus[status]
                                            if (apptStatus) {
                                              const relatedAppt = appointments.find(a => a.orderId === order.id)
                                              if (relatedAppt && relatedAppt.status !== apptStatus) {
                                                await updateAppointmentStatus(relatedAppt.id, apptStatus)
                                              }
                                            }

                                            refreshData()
                                            fetchNotifications()
                                            toast({ title: "Статус оновлено", variant: "success" })
                                          }}
                                          className="cursor-pointer"
                                        >
                                          {statusTranslations[status] || status}
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
                                Деталі
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      {sorted.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={role !== "CLIENT" ? 7 : 6} className="py-12 text-center text-muted-foreground">
                            Замовлень не знайдено
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
              <DialogTitle>{role === "CLIENT" ? "Залишити заявку на сервіс" : "Створити замовлення"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">

              <div className="grid gap-2">
                <Label>Автомобіль</Label>
                <Select
                  value={form.vehicleId}
                  onValueChange={(v) => setForm({ ...form, vehicleId: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Оберіть автомобіль" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => {
                      const owner = customers.find(c => c.id === v.userId)
                      const ownerStr = owner ? ` - ${owner.firstName} ${owner.lastName}` : ''
                      return (
                        <SelectItem key={v.id} value={v.id.toString()}>
                          {v.brand} {v.model} ({v.plate}){ownerStr}
                        </SelectItem>
                      )
                    })}
                    {vehicles.length === 0 && (
                      <div className="p-2 text-sm text-muted-foreground">Транспортних засобів не знайдено. Додайте авто спочатку.</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="o-desc">
                  {role === "CLIENT" ? "Опишіть проблему" : "Опис / Скарги клієнта"}
                </Label>
                <Textarea
                  id="o-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={role === "CLIENT" ? "Наприклад: Скриплять гальма, потрібна заміна мастила..." : "Скарги клієнта або необхідний сервіс..."}
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="o-date">
                  {role === "CLIENT" ? "Бажана дата та час (необов'язково)" : "Дата запису *"}
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
                          {selectedDate ? format(selectedDate, "PPP", { locale: uk }) : <span>Оберіть дату</span>}
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
                        />
                      </PopoverContent>
                    </Popover>

                    {selectedDate && (
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {isLoadingSlots ? (
                          <div className="col-span-full py-4 text-center text-xs text-muted-foreground">
                            Завантаження вільних годин...
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
                Скасувати
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Обробка..." : (role === "CLIENT" ? "Відправити заявку" : "Створити замовлення")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}