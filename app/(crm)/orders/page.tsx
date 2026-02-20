"use client"

import { useState } from "react"
import { useRouter } from "next/navigation" 
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
import { Plus, ChevronDown, Eye } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useOrders } from "@/lib/orders-context" 
import { useVehicles } from "@/lib/vehicles-context" 
import { useCrm } from "@/lib/crm-context"

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
  const { customers } = useCrm()
  
  // ДОСТАЕМ ФУНКЦИЮ СОЗДАНИЯ ЗАЯВКИ
  const { createRequest } = useServiceRequests() 
  
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState("all")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    vehicleId: "",
    description: "",
    services: "", 
    estimatedDate: "",
  })

  if (!user) return null

  const role = user.role?.toUpperCase() || "CLIENT"
  const canCreateOrders = role === "CLIENT" || role === "ADMIN" || role === "MANAGER"
  const canEditOrderStatus = role === "ADMIN" || role === "MECHANIC" || role === "MANAGER"

  const filtered = tab === "all"
      ? orders
      : orders.filter((o) => o.status === tab.toUpperCase())

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  // ПОЛНОСТЬЮ ОБНОВЛЕННАЯ ФУНКЦИЯ SUBMIT
  async function handleSubmit() {
    if (!form.vehicleId || !form.description) return
    setIsSubmitting(true)

    // --- ЛОГИКА ДЛЯ КЛИЕНТА (СОЗДАЕТ ServiceRequest) ---
    if (role === "CLIENT") {
      // Если клиент выбрал дату, добавляем её в причину обращения
      let reason = form.description;
      if (form.estimatedDate) {
        reason = `Бажана дата: ${form.estimatedDate}\n\n${form.description}`;
      }

      const result = await createRequest(Number(form.vehicleId), reason);

      setIsSubmitting(false);

      if (result.success) {
        setForm({ vehicleId: "", description: "", services: "", estimatedDate: "" });
        setOpen(false);
        alert("Вашу заявку успішно надіслано! Менеджер зв'яжеться з вами.");
      } else {
        alert(result.error || "Не вдалося надіслати заявку");
      }
      
      return; // Выходим из функции, чтобы заказ не создавался!
    }

    // --- ЛОГИКА ДЛЯ МЕНЕДЖЕРА/АДМИНА (СОЗДАЕТ ПРЯМОЙ ЗАКАЗ) ---
    const finalDescription = form.services.trim() 
      ? `${form.description}\n\nПослуги до виконання: ${form.services}` 
      : form.description;

    const payload: any = {
      vehicleId: Number(form.vehicleId),
      description: finalDescription,
    }

    // Если менеджер выбрал дату, она пойдет в Appointment (согласно нашему бекенду OrdersService)
    if (form.estimatedDate) {
      payload.scheduledAt = new Date(form.estimatedDate).toISOString()
    }

    const result = await createOrder(payload)

    setIsSubmitting(false)

    if (result.success) {
      setForm({ vehicleId: "", description: "", services: "", estimatedDate: "" })
      setOpen(false)
    } else {
      alert(result.error || "Не вдалося створити замовлення") 
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
      >
        {canCreateOrders && (
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="size-4" />
            {role === "CLIENT" ? "Залишити заявку" : "Нове замовлення"}
          </Button>
        )}
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">
              Всі <span className="ml-1.5 text-xs text-muted-foreground">({statusCounts.all})</span>
            </TabsTrigger>
            <TabsTrigger value="pending">
              Очікують <span className="ml-1.5 text-xs text-muted-foreground">({statusCounts.pending})</span>
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              В роботі <span className="ml-1.5 text-xs text-muted-foreground">({statusCounts.inProgress})</span>
            </TabsTrigger>
            <TabsTrigger value="completed">
              Завершені <span className="ml-1.5 text-xs text-muted-foreground">({statusCounts.completed})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tab}>
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
                      <TableHead className="pr-6 text-right text-muted-foreground">Дії</TableHead>
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
                            <StatusBadge status={order.status.toLowerCase()} />
                          </TableCell>
                          <TableCell className="font-medium text-foreground">
                            {Number(order.totalAmount || 0).toLocaleString()} ₴
                          </TableCell>
                          
                          <TableCell className="pr-6 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                                  Дії <ChevronDown className="size-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => router.push(`/orders-detail/${order.id}`)} className="font-medium cursor-pointer">
                                  <Eye className="size-4 mr-2" />
                                  Деталі
                                </DropdownMenuItem>
                                
                                {canEditOrderStatus && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                      Змінити статус
                                    </div>
                                    {["PENDING", "CONFIRMED", "IN_PROGRESS", "WAITING_PARTS", "COMPLETED", "PAID", "CANCELLED"]
                                      .filter((s) => s !== order.status)
                                      .map((status) => (
                                        <DropdownMenuItem
                                          key={status}
                                          onClick={() => updateStatus(order.id, status)}
                                          className="capitalize cursor-pointer"
                                        >
                                          {statusTranslations[status] || status}
                                        </DropdownMenuItem>
                                      ))}
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
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
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id.toString()}>
                        {v.brand} {v.model} ({v.plate})
                      </SelectItem>
                    ))}
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
                  {role === "CLIENT" ? "Бажана дата (необов'язково)" : "Запланована дата (необов'язково)"}
                </Label>
                <Input
                  id="o-date"
                  type="date"
                  value={form.estimatedDate}
                  onChange={(e) => setForm({ ...form, estimatedDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]} // Не разрешаем выбирать прошедшие дни
                />
              </div>

              {(role === "ADMIN" || role === "MANAGER") && (
                <div className="grid gap-2">
                  <Label htmlFor="o-services">Швидкі послуги (через кому)</Label>
                  <Input
                    id="o-services"
                    value={form.services}
                    onChange={(e) => setForm({ ...form, services: e.target.value })}
                    placeholder="Заміна мастила, Діагностика"
                  />
                  <p className="text-xs text-muted-foreground">
                    Це буде додано до опису. Ви зможете додати точні позиції/запчастини та ціни пізніше в деталях замовлення.
                  </p>
                </div>
              )}
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