"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StatusBadge } from "@/components/status-badge"
import { ArrowLeft, Plus, Trash2, Wrench, Clock, ShieldCheck, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"

// Локальні типи
interface OrderDetails {
  id: number
  status: string
  description: string
  totalAmount: number
  scheduledAt: string | null
  createdAt: string
  car: { brand: string; model: string; plate: string; vin: string; year: number }
  manager: { id: number; firstName: string; lastName: string } | null
  mechanic: { id: number; firstName: string; lastName: string } | null
  items: Array<{ id: number; name: string; quantity: number; price: number }>
  history: Array<{ id: number; action: string; comment: string; timestamp: string; changedBy: { firstName: string; lastName: string } }>
}

// Словник для перекладу дій в історії
const actionTranslations: Record<string, string> = {
  ORDER_CREATED: "Створено замовлення",
  STATUS_CHANGE: "Зміна статусу",
  ASSIGNMENT_CHANGE: "Зміна команди",
  ITEM_ADDED: "Додано позицію",
  ITEM_REMOVED: "Видалено позицію",
}

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  
  const orderId = Number(params.id)
  
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [itemForm, setItemForm] = useState({ name: "", price: "", quantity: "1" })

  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assignForm, setAssignForm] = useState({ mechanicId: "", managerId: "" })

  const role = user?.role?.toUpperCase() || "CLIENT"
  
  // ЗМІНЕНО ТУТ: Додано MECHANIC до прав управління позиціями
  const canManageItems = role === "ADMIN" || role === "MANAGER" || role === "MECHANIC"
  const canAssign = role === "ADMIN" || role === "MANAGER"

  const managers = employees.filter(e => e.role === "MANAGER" || e.role === "ADMIN")
  const mechanics = employees.filter(e => e.role === "MECHANIC")

  const fetchOrderDetails = async () => {
    try {
      const { data } = await api.get(`/orders/${orderId}`)
      setOrder(data)
    } catch (error) {
      console.error("Failed to fetch order", error)
    }
  }

  const fetchEmployees = async () => {
    try {
      const { data } = await api.get('/users/employees').catch(() => ({ data: [] }))
      setEmployees(data)
    } catch (error) {
      console.error("Failed to fetch employees", error)
    }
  }

  useEffect(() => {
    setIsLoading(true)
    Promise.all([fetchOrderDetails(), canAssign ? fetchEmployees() : Promise.resolve()])
      .finally(() => setIsLoading(false))
  }, [orderId, canAssign])

  const handleAddItem = async () => {
    if (!itemForm.name || !itemForm.price || !itemForm.quantity) return
    setIsSubmitting(true)
    try {
      await api.post(`/orders/${orderId}/items`, {
        name: itemForm.name,
        price: Number(itemForm.price),
        quantity: Number(itemForm.quantity),
      })
      await fetchOrderDetails()
      setItemModalOpen(false)
      setItemForm({ name: "", price: "", quantity: "1" })
    } catch (error) {
      alert("Не вдалося додати позицію")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveItem = async (itemId: number) => {
    if (!confirm("Ви впевнені, що хочете видалити цю позицію?")) return
    try {
      await api.delete(`/orders/${orderId}/items/${itemId}`)
      await fetchOrderDetails()
    } catch (error) {
      alert("Не вдалося видалити позицію")
    }
  }

  const handleAssign = async () => {
    const payload: any = {}
    
    if (assignForm.managerId && assignForm.managerId !== "none") {
      payload.managerId = Number(assignForm.managerId)
    }
    if (assignForm.mechanicId && assignForm.mechanicId !== "none") {
      payload.mechanicId = Number(assignForm.mechanicId)
    }

    if (Object.keys(payload).length === 0) {
      alert("Будь ласка, оберіть менеджера або механіка.")
      return
    }

    setIsSubmitting(true)
    try {
      await api.patch(`/orders/${orderId}/assign`, payload)
      await fetchOrderDetails()
      setAssignModalOpen(false)
    } catch (error) {
      alert("Не вдалося призначити команду")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openAssignModal = () => {
    setAssignForm({
      managerId: order?.manager?.id ? String(order.manager.id) : "none",
      mechanicId: order?.mechanic?.id ? String(order.mechanic.id) : "none"
    })
    setAssignModalOpen(true)
  }

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>
  }

  if (!order) {
    return <div className="p-8 text-center text-muted-foreground">Замовлення не знайдено або доступ заборонено.</div>
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PageHeader title={`Замовлення #${order.id}`} description="Деталі замовлення та історія сервісу">
        <Button variant="outline" onClick={() => router.push('/orders')} className="gap-2">
          <ArrowLeft className="size-4" /> До списку замовлень
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          <div className="col-span-1 lg:col-span-2 space-y-6">
            <Card className="border-border bg-card">
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Дані автомобіля</CardTitle>
                    <CardDescription>
                      {order.car.year} {order.car.brand} {order.car.model} — {order.car.plate || "Немає номерів"}
                    </CardDescription>
                  </div>
                  <StatusBadge status={order.status.toLowerCase()} />
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Скарги клієнта / Опис</h4>
                  <p className="text-sm text-foreground bg-secondary/30 p-3 rounded-md border border-border whitespace-pre-wrap">
                    {order.description || "Опис відсутній."}
                  </p>
                </div>
                {order.scheduledAt && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="size-4 text-primary" />
                    <span>Заплановано на: <strong className="text-foreground">{new Date(order.scheduledAt).toLocaleDateString()}</strong></span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
                <div>
                  <CardTitle className="text-lg">Послуги та Запчастини</CardTitle>
                  <CardDescription>Перелік робіт та деталей у цьому замовленні</CardDescription>
                </div>
                {canManageItems && (
                  <Button size="sm" onClick={() => setItemModalOpen(true)} className="gap-1">
                    <Plus className="size-3" /> Додати позицію
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="pl-6">Послуга / Запчастина</TableHead>
                      <TableHead className="text-right">К-сть</TableHead>
                      <TableHead className="text-right">Ціна</TableHead>
                      <TableHead className="text-right">Сума</TableHead>
                      {canManageItems && <TableHead className="w-12 pr-6"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.id} className="border-border">
                        <TableCell className="pl-6 font-medium">{item.name}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{item.quantity}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{Number(item.price).toLocaleString()} ₴</TableCell>
                        <TableCell className="text-right font-medium text-foreground">
                          {(Number(item.price) * item.quantity).toLocaleString()} ₴
                        </TableCell>
                        {canManageItems && (
                          <TableCell className="pr-6 text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveItem(item.id)}>
                              <Trash2 className="size-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {order.items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={canManageItems ? 5 : 4} className="py-8 text-center text-muted-foreground">
                          Жодної послуги чи запчастини ще не додано.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-1 space-y-6">
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Загальна вартість</p>
                    <p className="text-3xl font-bold text-foreground">
                      {Number(order.totalAmount).toLocaleString()} ₴
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm">Призначена команда</CardTitle>
                  {canAssign && (
                    <Button variant="ghost" size="sm" onClick={openAssignModal} className="h-8 text-xs">
                      Змінити
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                    <ShieldCheck className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Менеджер</p>
                    <p className="text-sm font-medium text-foreground">
                      {order.manager ? `${order.manager.firstName} ${order.manager.lastName}` : "Не призначено"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-secondary">
                    <Wrench className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Механік</p>
                    <p className="text-sm font-medium text-foreground">
                      {order.mechanic ? `${order.mechanic.firstName} ${order.mechanic.lastName}` : "Не призначено"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm">Історія замовлення</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                  {order.history.map((log) => (
                    <div key={log.id} className="relative flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-semibold text-foreground">
                            {actionTranslations[log.action] || log.action}
                          </p>
                          <span className="text-[10px] text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{log.comment}</p>
                        <p className="text-[10px] text-muted-foreground italic mt-1 text-right">Автор: {log.changedBy.firstName}</p>
                      </div>
                    </div>
                  ))}
                  {order.history.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center">Історія порожня.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {canManageItems && (
        <Dialog open={itemModalOpen} onOpenChange={setItemModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Додати послугу або запчастину</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="i-name">Назва / Опис</Label>
                <Input id="i-name" value={itemForm.name} onChange={(e) => setItemForm({...itemForm, name: e.target.value})} placeholder="Напр. Масляний фільтр, Діагностика" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="i-price">Ціна (₴)</Label>
                  <Input id="i-price" type="number" value={itemForm.price} onChange={(e) => setItemForm({...itemForm, price: e.target.value})} placeholder="0.00" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="i-qty">Кількість</Label>
                  <Input id="i-qty" type="number" min="1" value={itemForm.quantity} onChange={(e) => setItemForm({...itemForm, quantity: e.target.value})} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setItemModalOpen(false)} disabled={isSubmitting}>Скасувати</Button>
              <Button onClick={handleAddItem} disabled={isSubmitting}>{isSubmitting ? "Додавання..." : "Додати позицію"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {canAssign && (
        <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Призначити команду</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              
              <div className="grid gap-2">
                <Label>Менеджер</Label>
                <Select value={assignForm.managerId} onValueChange={(v) => setAssignForm({ ...assignForm, managerId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть менеджера" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="italic text-muted-foreground">Нікого (Зняти призначення)</SelectItem>
                    {managers.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.firstName} {m.lastName}
                      </SelectItem>
                    ))}
                    {managers.length === 0 && <div className="p-2 text-xs text-muted-foreground">Менеджерів не знайдено.</div>}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Механік</Label>
                <Select value={assignForm.mechanicId} onValueChange={(v) => setAssignForm({ ...assignForm, mechanicId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть механіка" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="italic text-muted-foreground">Нікого (Зняти призначення)</SelectItem>
                    {mechanics.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.firstName} {m.lastName}
                      </SelectItem>
                    ))}
                    {mechanics.length === 0 && <div className="p-2 text-xs text-muted-foreground">Механіків не знайдено.</div>}
                  </SelectContent>
                </Select>
              </div>

            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignModalOpen(false)} disabled={isSubmitting}>Скасувати</Button>
              <Button onClick={handleAssign} disabled={isSubmitting}>{isSubmitting ? "Збереження..." : "Зберегти призначення"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}