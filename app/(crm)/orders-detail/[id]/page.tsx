"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { StatusBadge } from "@/components/status-badge"
import { ArrowLeft, Plus, Trash2, Wrench, Clock, ShieldCheck, Loader2, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { useOrders } from "@/lib/orders-context"
import { useNotifications } from "@/lib/notifications-context"
import { useCrm } from "@/lib/crm-context"
import { useInventory } from "@/lib/inventory-context"

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
  items: Array<{ id: number; name: string; quantity: number; price: number; type?: "SERVICE" | "PART" }>
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
  const { refreshOrders } = useOrders()
  const { fetchNotifications } = useNotifications()
  const { refreshData: refreshCrmData } = useCrm()
  const { inventory, fetchInventory } = useInventory()

  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [catalogServices, setCatalogServices] = useState<{ id: number, name: string, price: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [itemForm, setItemForm] = useState<{ id?: number, name: string; price: string; quantity: string; type: "SERVICE" | "PART" }>({
    name: "", price: "", quantity: "1", type: "SERVICE"
  })
  const [draftItems, setDraftItems] = useState<Array<{ id: string, name: string; price: string; quantity: string; type: "SERVICE" | "PART", partId?: number, serviceId?: number }>>([])
  const [serviceComboboxOpen, setServiceComboboxOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assignForm, setAssignForm] = useState({ mechanicId: "", managerId: "" })

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)

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

  const fetchCatalogServices = async () => {
    try {
      const { data } = await api.get('/catalog/services').catch(() => ({ data: [] }))
      setCatalogServices(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch catalog services", error)
    }
  }

  useEffect(() => {
    setIsLoading(true)
    const promises = [fetchOrderDetails()]
    if (canAssign) promises.push(fetchEmployees())
    if (canManageItems) {
      promises.push(fetchCatalogServices())
    }

    Promise.all(promises).finally(() => setIsLoading(false))
  }, [orderId, canAssign, canManageItems])

  const handleAddToDraft = () => {
    if (!itemForm.name || !itemForm.price || !itemForm.quantity) return

    // Перевірка наявності на складі при додаванні запчастини
    if (itemForm.type === "PART") {
      const part = inventory.find(p => p.name === itemForm.name)
      if (part && Number(itemForm.quantity) > part.stockQuantity) {
        toast({ title: `Недостатньо на складі (залишок: ${part.stockQuantity} шт.)`, variant: "destructive" })
        return
      }
    }

    setDraftItems([...draftItems, {
      ...itemForm,
      id: Math.random().toString(),
      partId: itemForm.type === "PART" ? itemForm.id : undefined,
      serviceId: itemForm.type === "SERVICE" ? itemForm.id : undefined,
    }])
    setItemForm({ name: "", price: "", quantity: "1", type: itemForm.type })
    setSearchQuery("")
  }

  const handleRemoveFromDraft = (id: string) => {
    setDraftItems(draftItems.filter(i => i.id !== id))
  }

  const handleSaveAllItems = async () => {
    const itemsToSave = [...draftItems]
    // Якщо форма частково заповнена (назва, ціна, кількість), додамо її також як позицію
    if (itemForm.name && itemForm.price && itemForm.quantity) {
      itemsToSave.push({
        ...itemForm,
        id: Math.random().toString(),
        partId: itemForm.type === "PART" ? itemForm.id : undefined,
        serviceId: itemForm.type === "SERVICE" ? itemForm.id : undefined,
      })
    }

    if (itemsToSave.length === 0) {
      toast({ title: "Заповніть дані позиції або додайте до списку", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      for (const item of itemsToSave) {
        const payload: any = {
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity),
          type: item.type,
          mechanicId: user?.role === "MECHANIC" ? user?.id : order?.mechanic?.id,
        }

        if (item.partId) payload.partId = item.partId
        if (item.serviceId) payload.serviceId = item.serviceId

        await api.post(`/orders/${orderId}/items`, payload)
      }
      await fetchOrderDetails()
      refreshOrders()
      refreshCrmData()
      fetchInventory()
      setItemModalOpen(false)
      setDraftItems([])
      setItemForm({ name: "", price: "", quantity: "1", type: "SERVICE" })
      setSearchQuery("")

      const count = itemsToSave.length
      toast({ title: count > 1 ? `Додано ${count} позицій` : "Позицію додано", variant: "success" })
      fetchNotifications()
    } catch (error) {
      toast({ title: "Не вдалося додати деякі позиції", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmRemoveItem = (itemId: number) => {
    setItemToDelete(itemId)
    setDeleteModalOpen(true)
  }

  const handleRemoveItem = async () => {
    if (!itemToDelete) return
    setIsSubmitting(true)
    try {
      await api.delete(`/orders/${orderId}/items/${itemToDelete}`)
      await fetchOrderDetails()
      refreshOrders()
      refreshCrmData()
      fetchInventory()
      toast({ title: "Позицію видалено", variant: "success" })
      fetchNotifications()
    } catch (error) {
      toast({ title: "Не вдалося видалити позицію", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
      setDeleteModalOpen(false)
      setItemToDelete(null)
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
      toast({ title: "Будь ласка, оберіть менеджера або механіка.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      await api.patch(`/orders/${orderId}/assign`, payload)
      await fetchOrderDetails()
      setAssignModalOpen(false)
      refreshOrders()
      refreshCrmData()
      toast({ title: "Команду призначено", variant: "success" })
      fetchNotifications()
    } catch (error) {
      toast({ title: "Не вдалося призначити команду", variant: "destructive" })
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

  const serviceItems = order.items.filter(i => i.type === "SERVICE" || !i.type) // Defaulting to SERVICE if type is missing for old data
  const partItems = order.items.filter(i => i.type === "PART")

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
                  <CardTitle className="text-lg">Деталізація замовлення</CardTitle>
                  <CardDescription>Перелік робіт та запчастин</CardDescription>
                </div>
                {canManageItems && (
                  <Button size="sm" onClick={() => setItemModalOpen(true)} className="gap-1">
                    <Plus className="size-3" /> Додати позицію
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {/* Таблиця послуг */}
                <div className="bg-secondary/20 px-6 py-2 border-b border-border">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">🛠 Виконані Роботи (Послуги)</h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="pl-6 w-1/2">Назва послуги</TableHead>
                      <TableHead className="text-right">К-сть / Години</TableHead>
                      <TableHead className="text-right">Ціна</TableHead>
                      <TableHead className="text-right">Сума</TableHead>
                      {canManageItems && <TableHead className="w-12 pr-6"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serviceItems.map((item) => (
                      <TableRow key={item.id} className="border-border transition-colors hover:bg-muted/50">
                        <TableCell className="pl-6 font-medium">{item.name}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{item.quantity}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{Number(item.price).toLocaleString()} ₴</TableCell>
                        <TableCell className="text-right font-medium text-foreground">
                          {(Number(item.price) * item.quantity).toLocaleString()} ₴
                        </TableCell>
                        {canManageItems && (
                          <TableCell className="pr-6 text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => confirmRemoveItem(item.id)}>
                              <Trash2 className="size-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {serviceItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={canManageItems ? 5 : 4} className="py-6 text-center text-sm text-muted-foreground">
                          Послуг ще не додано.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* Таблиця запчастин */}
                <div className="bg-secondary/20 px-6 py-2 border-y border-border mt-4">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">📦 Використані Запчастини та Матеріали</h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="pl-6 w-1/2">Назва деталі / артикул</TableHead>
                      <TableHead className="text-right">К-сть</TableHead>
                      <TableHead className="text-right">Ціна</TableHead>
                      <TableHead className="text-right">Сума</TableHead>
                      {canManageItems && <TableHead className="w-12 pr-6"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partItems.map((item) => (
                      <TableRow key={item.id} className="border-border transition-colors hover:bg-muted/50">
                        <TableCell className="pl-6 font-medium">{item.name}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{item.quantity}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{Number(item.price).toLocaleString()} ₴</TableCell>
                        <TableCell className="text-right font-medium text-foreground">
                          {(Number(item.price) * item.quantity).toLocaleString()} ₴
                        </TableCell>
                        {canManageItems && (
                          <TableCell className="pr-6 text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => confirmRemoveItem(item.id)}>
                              <Trash2 className="size-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {partItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={canManageItems ? 5 : 4} className="py-6 text-center text-sm text-muted-foreground">
                          Запчастин ще не додано.
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
        <Dialog
          open={itemModalOpen}
          onOpenChange={(open) => {
            setItemModalOpen(open)
            if (!open) {
              setDraftItems([])
              setItemForm({ name: "", price: "", quantity: "1", type: "SERVICE" })
              setSearchQuery("")
            }
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Додати послугу або запчастину</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2 mb-2">
                <Label>Тип позиції</Label>
                <RadioGroup
                  value={itemForm.type}
                  onValueChange={(val: "SERVICE" | "PART") => setItemForm({ ...itemForm, type: val })}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2 bg-secondary/30 p-2 rounded-md border border-border flex-1">
                    <RadioGroupItem value="SERVICE" id="r-service" />
                    <Label htmlFor="r-service" className="cursor-pointer flex-1">🛠 Робота (Послуга)</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-secondary/30 p-2 rounded-md border border-border flex-1">
                    <RadioGroupItem value="PART" id="r-part" />
                    <Label htmlFor="r-part" className="cursor-pointer flex-1">📦 Запчастина</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="i-name">{itemForm.type === "SERVICE" ? "Назва послуги" : "Назва запчастини (артикул)"}</Label>
                <Popover open={serviceComboboxOpen} onOpenChange={setServiceComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={serviceComboboxOpen}
                      className="w-full justify-between font-normal text-left px-3 shadow-none h-auto min-h-10 py-2"
                    >
                      <span className="whitespace-normal break-words flex-1 pr-2">{itemForm.name || (itemForm.type === "SERVICE" ? "Оберіть або введіть послугу..." : "Введіть назву запчастини...")}</span>
                      <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" style={{ width: "var(--radix-popover-trigger-width)" }}>
                    <Command>
                      <CommandInput
                        placeholder="Пошук..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      <CommandList>
                        <CommandEmpty className="py-4 px-2 text-center text-sm text-muted-foreground">
                          Не знайдено серед існуючих.<br />
                          {itemForm.type === "SERVICE" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2 text-primary w-full"
                              onClick={() => {
                                setItemForm({ ...itemForm, name: searchQuery })
                                setServiceComboboxOpen(false)
                                setSearchQuery("")
                              }}
                            >
                              <Plus className="mr-1 size-4" /> Додати &quot;{searchQuery}&quot;
                            </Button>
                          ) : (
                            <span className="text-xs text-destructive mt-2 block">Запчастину потрібно спочатку додати на склад!</span>
                          )}
                        </CommandEmpty>
                        <CommandGroup>
                          {searchQuery && itemForm.type === "SERVICE" && !catalogServices.some(s => s.name.toLowerCase() === searchQuery.toLowerCase()) && (
                            <CommandItem
                              value={searchQuery}
                              onSelect={() => {
                                setItemForm({ ...itemForm, name: searchQuery })
                                setServiceComboboxOpen(false)
                                setSearchQuery("")
                              }}
                            >
                              <Plus className="mr-2 size-4" />
                              Створити &quot;{searchQuery}&quot;
                            </CommandItem>
                          )}

                          {/* Мапінг послуг */}
                          {itemForm.type === "SERVICE" && catalogServices.map((catalogItem) => (
                            <CommandItem
                              key={`service-${catalogItem.id}`}
                              value={catalogItem.name}
                              onSelect={() => {
                                setItemForm({ ...itemForm, id: catalogItem.id, name: catalogItem.name, price: String(catalogItem.price || 0) })
                                setServiceComboboxOpen(false)
                                setSearchQuery("")
                              }}
                              className="items-start py-2"
                            >
                              <Check className={cn("mr-2 size-4 shrink-0 mt-0.5", itemForm.name === catalogItem.name ? "opacity-100" : "opacity-0")} />
                              <span className="flex-1 whitespace-normal break-words text-left leading-tight pr-2">{catalogItem.name}</span>
                              <span className="shrink-0 font-medium whitespace-nowrap">{catalogItem.price} ₴</span>
                            </CommandItem>
                          ))}

                          {/* Мапінг запчастин зі складу */}
                          {itemForm.type === "PART" && inventory.map((invItem) => (
                            <CommandItem
                              key={`inv-${invItem.id}`}
                              value={`${invItem.sku || ''} ${invItem.name}`}
                              onSelect={() => {
                                setItemForm({ ...itemForm, id: invItem.id, name: invItem.name, price: String(invItem.retailPrice || 0) })
                                setServiceComboboxOpen(false)
                                setSearchQuery("")
                              }}
                              disabled={invItem.stockQuantity <= 0}
                              className="items-start py-2"
                            >
                              <Check className={cn("mr-2 size-4 shrink-0 mt-0.5", itemForm.name === invItem.name ? "opacity-100" : "opacity-0")} />
                              <div className="flex flex-col flex-1 pl-1 overflow-hidden pr-2">
                                <span className={cn("whitespace-normal break-words text-left leading-tight text-sm", invItem.stockQuantity <= 0 && "text-muted-foreground line-through")}>
                                  {invItem.sku && <span className="text-muted-foreground mr-1 text-xs font-normal">[{invItem.sku}]</span>}
                                  {invItem.name}
                                </span>
                              </div>
                              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 shrink-0 mt-0.5">
                                <span className="font-medium whitespace-nowrap">{invItem.retailPrice} ₴</span>
                                <Badge variant={invItem.stockQuantity > 0 ? "secondary" : "destructive"} className="text-[10px] w-14 justify-center px-1">
                                  {invItem.stockQuantity} шт
                                </Badge>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="i-price">Ціна продажу (₴)</Label>
                  <Input id="i-price" type="number" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} disabled={itemForm.type === "PART" && !!itemForm.name} placeholder="0.00" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="i-qty">Кількість</Label>
                  <Input id="i-qty" type="number" min="1" value={itemForm.quantity} onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })} />
                </div>
              </div>

              <div className="flex justify-end mt-1">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddToDraft}
                  disabled={!itemForm.name || !itemForm.price || !itemForm.quantity}
                  className="gap-2 h-8 text-xs"
                >
                  <Plus className="size-3" /> Додати до списку
                </Button>
              </div>

              {draftItems.length > 0 && (
                <div className="mt-2 border-t pt-4 space-y-3">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Список для збереження ({draftItems.length})</Label>
                  <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                    {draftItems.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm border p-2.5 rounded-md bg-secondary/10 gap-3">
                        <div className="flex flex-col gap-0.5 flex-1 w-full m-0 min-w-0">
                          <span className="font-semibold leading-tight whitespace-normal break-words">{item.name}</span>
                          <span className="text-[10px] text-muted-foreground font-medium uppercase mt-1">
                            {item.type === "SERVICE" ? "🛠 Послуга" : "📦 Запчастина"}
                          </span>
                        </div>
                        <div className="flex justify-between sm:justify-end w-full sm:w-auto items-center gap-3 shrink-0">
                          <span className="text-muted-foreground text-xs tabular-nums whitespace-nowrap">{item.quantity} шт x {item.price} ₴</span>
                          <span className="font-bold text-sm w-[70px] text-right tabular-nums whitespace-nowrap">{(Number(item.quantity) * Number(item.price)).toLocaleString()} ₴</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0" onClick={() => handleRemoveFromDraft(item.id)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setItemModalOpen(false)} disabled={isSubmitting}>Скасувати</Button>
              <Button onClick={handleSaveAllItems} disabled={isSubmitting}>
                {isSubmitting ? "Додавання..." : (draftItems.length > 0 || itemForm.name ? `Зберегти всі позиції` : "Додати позицію")}
              </Button>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Видалення позиції</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Ви впевнені, що хочете видалити цю позицію із замовлення? Цю дію не можна буде скасувати.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={isSubmitting}>Скасувати</Button>
            <Button variant="destructive" onClick={handleRemoveItem} disabled={isSubmitting}>
              {isSubmitting ? "Видалення..." : "Видалити"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}