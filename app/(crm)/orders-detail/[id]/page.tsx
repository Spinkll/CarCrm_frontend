"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
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
import { ArrowLeft, Plus, Trash2, Wrench, Clock, ShieldCheck, Loader2, Check, ChevronsUpDown, ChevronDown, Banknote, CreditCard, Wallet, FileDown, ClipboardList, Package, AlertTriangle, User, Phone, Mail, MapPin, Landmark } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn, formatAppDate } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { useOrders } from "@/lib/orders-context"
import { useNotifications } from "@/lib/notifications-context"
import { useCrm } from "@/lib/crm-context"
import { useInventory } from "@/lib/inventory-context"
import { useCompanySettings } from "@/lib/company-settings-context"
import { useSettings } from "@/lib/settings-context"
import { useTranslation } from "@/hooks/use-translation"

// Локальні типи
interface OrderDetails {
  id: number
  status: string
  description: string
  totalAmount: number
  scheduledAt: string | null
  createdAt: string
  car: { brand: string; model: string; plate: string; vin: string; year: number; userId: number }
  customer?: { firstName: string; lastName: string; phone: string; email: string }
  manager: { id: number; firstName: string; lastName: string } | null
  mechanic: { id: number; firstName: string; lastName: string } | null
  items: Array<{ id: number; name: string; quantity: number; price: number; type?: "SERVICE" | "PART" }>
  history: Array<{ id: number; action: string; comment: string; timestamp: string; changedBy: { firstName: string; lastName: string } }>
}

interface Payment {
  id: number
  amount: number
  method: "CASH" | "CARD" | "TRANSFER"
  createdAt: string
}

function OrderStepper({ currentStatus }: { currentStatus: string }) {
  const { t } = useTranslation()

  const steps = [
    { key: "CONFIRMED", label: t("status_CONFIRMED", "search"), icon: Check },
    { key: "IN_PROGRESS", label: t("status_IN_PROGRESS", "search"), icon: Wrench },
    { key: "COMPLETED", label: t("status_COMPLETED", "search"), icon: ClipboardList },
    { key: "PAID", label: t("status_PAID", "search"), icon: Banknote },
  ]

  const getStatusIndex = (status: string) => {
    if (status === "PENDING" || status === "CONFIRMED") return 0
    if (status === "IN_PROGRESS" || status === "WAITING_PARTS") return 1
    if (status === "COMPLETED") return 2
    if (status === "PAID") return 3
    return -1
  }

  const currentIndex = getStatusIndex(currentStatus)
  const isWaiting = currentStatus === "WAITING_PARTS"

  if (currentStatus === "CANCELLED") {
    return (
      <div className="mb-8 bg-destructive/5 border border-destructive/20 p-4 rounded-xl flex items-center justify-center gap-3 shadow-sm">
        <AlertTriangle className="size-5 text-destructive" />
        <p className="font-bold text-destructive uppercase tracking-widest text-sm">{t("orderCancelled", "orderDetails")}</p>
      </div>
    )
  }

  return (
    <div className="mb-10 w-full px-2 sm:px-6">
      <div className="relative flex justify-between items-start max-w-3xl mx-auto">
        {/* Background Line */}
        <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-secondary -z-0" />
        
        {/* Active Line Progress */}
        <div 
          className="absolute top-5 left-[10%] h-0.5 bg-primary transition-all duration-700 ease-in-out -z-0" 
          style={{ width: `${currentIndex >= 0 ? (currentIndex / (steps.length - 1)) * 80 : 0}%` }}
        />

        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex || (currentStatus === "PAID" && idx === 3)
          const isActive = idx === currentIndex
          const isStepWaiting = isWaiting && step.key === "IN_PROGRESS"
          const Icon = step.icon

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10 w-16 sm:w-24">
              <div 
                className={cn(
                  "size-10 sm:size-11 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                  isCompleted ? "bg-primary border-primary text-primary-foreground shadow-sm" : 
                  isActive ? "bg-card border-primary text-primary shadow-[0_0_20px_rgba(var(--primary),0.2)] ring-4 ring-primary/5" : 
                  "bg-card border-secondary text-muted-foreground"
                )}
              >
                {isCompleted && idx !== 3 ? <Check className="size-5 sm:size-6" /> : <Icon className="size-5 sm:size-5" />}
                
                {isStepWaiting && (
                  <div className="absolute -top-1 -right-1 size-5 bg-amber-500 rounded-full flex items-center justify-center border-2 border-card shadow-sm">
                    <AlertTriangle className="size-2.5 text-white" />
                  </div>
                )}
              </div>
              
              <div className="mt-3 text-center">
                <p className={cn(
                  "text-[9px] sm:text-[11px] font-bold uppercase tracking-tight transition-colors",
                  isActive ? "text-primary" : isCompleted ? "text-foreground/70" : "text-muted-foreground"
                )}>
                  {step.label}
                </p>
                {isStepWaiting && (
                  <p className="text-[8px] sm:text-[9px] text-amber-600 font-extrabold uppercase mt-1 leading-none animate-pulse">
                    {t("waitingParts", "orderDetails")}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function getDocumentFileName(companyName: string | undefined, documentType: "receipt-order" | "work-order", orderId: number) {
  const normalizedCompanyName = (companyName || "sto").trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "") || "sto"
  return `${normalizedCompanyName}-${documentType}-${orderId}.pdf`
}

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { companySettings } = useCompanySettings()
  const { t } = useTranslation()

  const orderId = Number(params.id)
  const { updateStatus: updateOrderStatus, refreshOrders } = useOrders()
  const { fetchNotifications } = useNotifications()
  const { refreshData: refreshCrmData } = useCrm()
  const { inventory, fetchInventory } = useInventory()
  const { customers, appointments } = useCrm()
  const { settings } = useSettings()

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

  // Payment state
  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD">("CASH")
  const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false)
  const [isReceiptDownloading, setIsReceiptDownloading] = useState(false)
  const [isWorkOrderDownloading, setIsWorkOrderDownloading] = useState(false)

  const paymentMethodLabels: Record<string, { label: string; icon: React.ElementType }> = {
    CASH: { label: t("cash", "orderDetails"), icon: Banknote },
    CARD: { label: t("card", "orderDetails"), icon: CreditCard },
  }

  const role = user?.role?.toUpperCase() || "CLIENT"

  const isOrderClosed = order?.status === "COMPLETED" || order?.status === "PAID" || order?.status === "CANCELLED"
  const canManageItems = (role === "ADMIN" || role === "MANAGER" || role === "MECHANIC") && !isOrderClosed
  const canAssign = role === "ADMIN" || role === "MANAGER"
  const canEditStatus = (role === "ADMIN" || role === "MANAGER" || role === "MECHANIC") && order?.status !== "PAID" && order?.status !== "CANCELLED"

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

  const fetchPayments = async () => {
    try {
      const { data } = await api.get(`/payments/order/${orderId}`)
      setPayments(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch payments", error)
      setPayments([])
    }
  }

  const handlePayment = async () => {
    if (!order) return
    setIsPaymentSubmitting(true)
    try {
      if (role === "CLIENT" && paymentMethod === "CARD") {
        // Stripe Checkout redirect
        const { data } = await api.post(`/stripe/generate/${orderId}`)
        window.location.href = data.url
        return
      }

      await api.post(`/payments/order/${orderId}`, {
        method: paymentMethod,
        amount: Number(order.totalAmount),
      })
      await Promise.all([fetchOrderDetails(), fetchPayments()])
      refreshOrders()
      refreshCrmData()
      fetchNotifications()
      setPaymentModalOpen(false)
      toast({ title: t("paymentRecorded", "orderDetails"), description: `${t("paymentMethod", "common")}: ${paymentMethodLabels[paymentMethod].label}`, variant: "success" })
    } catch (error: any) {
      const msg = error.response?.data?.message || t("error", "common")
      toast({ title: Array.isArray(msg) ? msg[0] : msg, variant: "destructive" })
      setIsPaymentSubmitting(false)
    }
  }

  const handleDownloadReceipt = async () => {
    setIsReceiptDownloading(true)
    try {
      const response = await api.get(`payments/order/${orderId}/receipt`, {
        responseType: 'blob',
      })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = getDocumentFileName(companySettings.shortName || companySettings.companyName, "receipt-order", orderId)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast({ title: t("receiptDownloaded", "orderDetails"), variant: "success" })
    } catch (error: any) {
      const msg = error.response?.data?.message || t("error", "common")
      toast({ title: Array.isArray(msg) ? msg[0] : msg, variant: "destructive" })
    } finally {
      setIsReceiptDownloading(false)
    }
  }

  const handleDownloadWorkOrder = async () => {
    setIsWorkOrderDownloading(true)
    try {
      const response = await api.get(`/orders/${orderId}/work-order`, {
        responseType: 'blob',
      })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = getDocumentFileName(companySettings.shortName || companySettings.companyName, "work-order", orderId)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast({ title: t("workOrderDownloaded", "orderDetails"), variant: "success" })
    } catch (error: any) {
      const msg = error.response?.data?.message || t("error", "common")
      toast({ title: Array.isArray(msg) ? msg[0] : msg, variant: "destructive" })
    } finally {
      setIsWorkOrderDownloading(false)
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

  const hasToastedRef = useRef(false)
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const sessionId = searchParams.get("session_id");
    if (paymentStatus && !hasToastedRef.current) {
      if (paymentStatus === "success" && sessionId) {
        // Верифікація оплати через Stripe
        api.post(`/stripe/verify/${sessionId}`)
          .then(() => {
            toast({ title: t("paymentSuccess", "orderDetails"), description: t("paymentSuccessDesc", "orderDetails"), variant: "success" })
            fetchOrderDetails()
            fetchPayments()
            refreshOrders()
            refreshCrmData()
            fetchNotifications()
          })
          .catch(() => {
            toast({ title: t("paymentError", "orderDetails"), description: t("paymentErrorDesc", "orderDetails"), variant: "destructive" })
          })
      } else if (paymentStatus === "cancel") {
        toast({ title: t("paymentCancelled", "orderDetails"), description: t("paymentCancelledDesc", "orderDetails"), variant: "destructive" })
      } else if (paymentStatus === "error") {
        toast({ title: t("paymentFail", "orderDetails"), description: t("paymentFailDesc", "orderDetails"), variant: "destructive" })
      }
      hasToastedRef.current = true;
      router.replace(`/orders-detail/${orderId}`)
    }
  }, [searchParams, orderId, router, t])

  useEffect(() => {
    if (!order) setIsLoading(true)
    
    const promises = [fetchOrderDetails(), fetchPayments()]
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
        toast({ title: `${t("outOfStock", "orderDetails")} (${t("left", "orderDetails")}: ${part.stockQuantity} ${t("pcs", "orderDetails")})`, variant: "destructive" })
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
      toast({ title: t("fillRequired", "orders"), variant: "destructive" })
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
      toast({ title: count > 1 ? `${t("itemsAdded", "orderDetails")} (${count})` : t("itemAdded", "orderDetails"), variant: "success" })
      fetchNotifications()
    } catch (error) {
      toast({ title: t("error", "common"), variant: "destructive" })
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
      toast({ title: t("itemRemoved", "orderDetails"), variant: "success" })
      fetchNotifications()
    } catch (error) {
      toast({ title: t("error", "common"), variant: "destructive" })
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
      toast({ title: t("fillRequired", "orders"), variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      await api.patch(`/orders/${orderId}/assign`, payload)
      await fetchOrderDetails()
      setAssignModalOpen(false)
      refreshOrders()
      refreshCrmData()
      toast({ title: t("teamAssigned", "orderDetails"), variant: "success" })
      fetchNotifications()
    } catch (error) {
      toast({ title: t("error", "common"), variant: "destructive" })
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

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return
    setIsSubmitting(true)
    try {
      await updateOrderStatus(order.id, newStatus)
      await fetchOrderDetails()
      refreshOrders()
      refreshCrmData()
      fetchNotifications()
      toast({ title: t("statusUpdatedSuccess", "orders"), variant: "success" })
    } catch (error) {
      toast({ title: t("error", "common"), variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>
  }

  if (!order) {
    return <div className="p-8 text-center text-muted-foreground">{t("notFound", "orders")}</div>
  }

  const serviceItems = order.items.filter(i => i.type === "SERVICE" || !i.type) 
  const partItems = order.items.filter(i => i.type === "PART")

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PageHeader title={`${t("orderDetails", "common")} #${order.id}`} description={t("description", "orderDetails")}>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadWorkOrder}
            disabled={isWorkOrderDownloading}
            className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-4"
          >
            {isWorkOrderDownloading ? (
              <Loader2 className="size-3 sm:size-4 animate-spin" />
            ) : (
              <ClipboardList className="size-3 sm:size-4" />
            )}
            <span className="hidden sm:inline">{isWorkOrderDownloading ? t("loading", "common") : t("workOrder", "orderDetails")}</span>
          </Button>
          <Button 
            type="button"
            variant="outline" 
            onClick={() => router.push('/orders')} 
            className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-4"
          >
            <ArrowLeft className="size-3 sm:size-4" />
            <span className="hidden sm:inline">{t("backToList", "orderDetails")}</span>
            <span className="sm:hidden">{t("prev", "customers")}</span>
          </Button>
        </div>
      </PageHeader>

      <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
        {/* Візуальний прогрес */}
        <OrderStepper currentStatus={order.status} />

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">

          <div className="col-span-1 lg:col-span-2 space-y-4 sm:space-y-6">
            <Card className="border-border bg-card">
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base sm:text-lg">{t("carData", "orderDetails")}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm break-words">
                      {order.car.year} {order.car.brand} {order.car.model} — {order.car.plate || t("noNumbers", "orders")}
                    </CardDescription>
                  </div>
                  {canEditStatus ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button 
                          type="button"
                          className="inline-flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity outline-none"
                        >
                          <StatusBadge status={order.status.toLowerCase()} />
                          <ChevronDown className="size-3 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          {t("changeStatus", "orders")}
                        </div>
                        {["CONFIRMED", "IN_PROGRESS", "WAITING_PARTS", "COMPLETED", "CANCELLED"]
                           .filter((s) => s !== order.status)
                           .map((status) => (
                             <DropdownMenuItem
                               key={status}
                               onSelect={() => handleStatusChange(status)}
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
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">{t("customerComplaints", "orderDetails")}</h4>
                  <p className="text-sm text-foreground bg-secondary/30 p-3 rounded-md border border-border whitespace-pre-wrap">
                    {order.description || t("noDescription", "orderDetails")}
                  </p>
                </div>
                {order.scheduledAt && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="size-4 text-primary" />
                    <span>{t("scheduledFor", "orderDetails")} <strong className="text-foreground">{formatAppDate(order.scheduledAt, settings.dateFormat)}</strong></span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-border gap-2">
                <div>
                  <CardTitle className="text-base sm:text-lg">{t("orderDetail", "orderDetails")}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">{t("worksAndParts", "orderDetails")}</CardDescription>
                </div>
                {canManageItems && (
                  <Button 
                    type="button"
                    size="sm" 
                    onClick={() => setItemModalOpen(true)} 
                    className="gap-1 text-xs sm:text-sm w-full sm:w-auto"
                  >
                    <Plus className="size-3" /> {t("addPosition", "orderDetails")}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {/* Таблиця послуг */}
                <div className="bg-secondary/20 px-3 sm:px-6 py-2 border-b border-border">
                  <h3 className="text-xs sm:text-sm font-semibold uppercase text-muted-foreground tracking-wider">🛠 {t("doneWorks", "orderDetails")}</h3>
                </div>
                <div className="overflow-x-auto">
                  <Table className="min-w-[480px]">
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="pl-3 sm:pl-6 w-1/2 text-xs sm:text-sm">{t("serviceName", "orderDetails")}</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">{t("quantity", "orderDetails")}</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">{t("price", "orderDetails")}</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">{t("total", "orderDetails")}</TableHead>
                        {canManageItems && <TableHead className="w-10 sm:w-12 pr-3 sm:pr-6"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {serviceItems.map((item) => (
                        <TableRow key={item.id} className="border-border transition-colors hover:bg-muted/50">
                          <TableCell className="pl-3 sm:pl-6 font-medium text-xs sm:text-sm">{item.name}</TableCell>
                          <TableCell className="text-right text-muted-foreground text-xs sm:text-sm">{item.quantity}</TableCell>
                          <TableCell className="text-right text-muted-foreground text-xs sm:text-sm">{Number(item.price).toLocaleString()} ₴</TableCell>
                          <TableCell className="text-right font-medium text-foreground text-xs sm:text-sm">
                            {(Number(item.price) * item.quantity).toLocaleString()} ₴
                          </TableCell>
                          {canManageItems && (
                            <TableCell className="pr-3 sm:pr-6 text-right">
                              <Button 
                                type="button"
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:bg-destructive/10" 
                                onClick={() => confirmRemoveItem(item.id)}
                              >
                                <Trash2 className="size-3.5 sm:size-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                      {serviceItems.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={canManageItems ? 5 : 4} className="py-4 sm:py-6 text-center text-xs sm:text-sm text-muted-foreground">
                            {t("noServices", "orderDetails")}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Таблиця запчастин */}
                <div className="bg-secondary/20 px-3 sm:px-6 py-2 border-y border-border mt-4">
                  <h3 className="text-xs sm:text-sm font-semibold uppercase text-muted-foreground tracking-wider">📦 {t("partsAndMaterials", "orderDetails")}</h3>
                </div>
                <div className="overflow-x-auto">
                  <Table className="min-w-[480px]">
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="pl-3 sm:pl-6 w-1/2 text-xs sm:text-sm">{t("partName", "orderDetails")}</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">{t("quantity", "orderDetails")}</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">{t("price", "orderDetails")}</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">{t("total", "orderDetails")}</TableHead>
                        {canManageItems && <TableHead className="w-10 sm:w-12 pr-3 sm:pr-6"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partItems.map((item) => (
                        <TableRow key={item.id} className="border-border transition-colors hover:bg-muted/50">
                          <TableCell className="pl-3 sm:pl-6 font-medium text-xs sm:text-sm">{item.name}</TableCell>
                          <TableCell className="text-right text-muted-foreground text-xs sm:text-sm">{item.quantity}</TableCell>
                          <TableCell className="text-right text-muted-foreground text-xs sm:text-sm">{Number(item.price).toLocaleString()} ₴</TableCell>
                          <TableCell className="text-right font-medium text-foreground text-xs sm:text-sm">
                            {(Number(item.price) * item.quantity).toLocaleString()} ₴
                          </TableCell>
                          {canManageItems && (
                            <TableCell className="pr-3 sm:pr-6 text-right">
                              <Button 
                                type="button"
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:bg-destructive/10" 
                                onClick={() => confirmRemoveItem(item.id)}
                              >
                                <Trash2 className="size-3.5 sm:size-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                      {partItems.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={canManageItems ? 5 : 4} className="py-4 sm:py-6 text-center text-xs sm:text-sm text-muted-foreground">
                            {t("noParts", "orderDetails")}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-1 space-y-4 sm:space-y-6">
            <Card className="border-border bg-card">
              <CardContent className="p-4 sm:p-6">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">{t("totalCost", "orderDetails")}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-foreground">
                      {Number(order.totalAmount).toLocaleString()} ₴
                    </p>
                  </div>
                </div>

                {/* Payment summary */}
                {(payments.length > 0 || order.status === "COMPLETED" || order.status === "PAID") && (
                  <div className="mt-4 pt-4 border-t border-border space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("paid", "orderDetails")}</span>
                      <span className={cn("font-semibold", order.status === "PAID" ? "text-success" : "text-foreground")}>
                        {payments.reduce((s, p) => s + Number(p.amount), 0).toLocaleString()} ₴
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", order.status === "PAID" ? "bg-success" : "bg-primary")}
                        style={{ width: `${Math.min(100, Number(order.totalAmount) > 0 ? (payments.reduce((s, p) => s + Number(p.amount), 0) / Number(order.totalAmount)) * 100 : 0)}%` }}
                      />
                    </div>
                    {order.status === "PAID" ? (
                      <>
                        <p className="text-xs text-success font-medium flex items-center gap-1">
                          <Check className="size-3" /> {t("orderFullyPaid", "orderDetails")}
                        </p>
                        <Button 
                          type="button"
                          variant="outline" 
                          className="w-full gap-2 mt-2 border-primary/20 hover:bg-primary/5 text-primary"
                          onClick={handleDownloadReceipt}
                          disabled={isReceiptDownloading}
                        >
                          {isReceiptDownloading ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <FileDown className="size-4" />
                          )}
                          {isReceiptDownloading ? t("loading", "common") : t("receipt", "inventory")}
                        </Button>
                      </>
                    ) : (
                      <Button 
                        type="button"
                        className="w-full gap-2 mt-2" 
                        onClick={() => setPaymentModalOpen(true)}
                        disabled={order.status === "CANCELLED" || (role === "CLIENT" && order.status !== "COMPLETED")}
                      >
                        <Banknote className="size-4" /> {t("payOrder", "orderDetails")}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="pb-2 flex flex-row items-center justify-between border-b border-border">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("team", "orderDetails")}</CardTitle>
                {canAssign && (
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={openAssignModal}>
                    <Plus className="size-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <User className="size-4.5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground leading-none mb-1">{t("manager", "orders")}</p>
                    <p className="text-sm font-medium text-foreground">
                      {order.manager ? `${order.manager.firstName} ${order.manager.lastName}` : t("notAssigned", "orderDetails")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-secondary/80 flex items-center justify-center text-foreground border border-border">
                    <Wrench className="size-4.5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground leading-none mb-1">{t("mechanic", "orders")}</p>
                    <p className="text-sm font-medium text-foreground">
                      {order.mechanic ? `${order.mechanic.firstName} ${order.mechanic.lastName}` : t("notAssigned", "orderDetails")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="pb-2 border-b border-border">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Clock className="size-4" /> {t("history", "orderDetails")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 max-h-[400px] overflow-auto">
                <div className="space-y-4">
                  {order.history && order.history.length > 0 ? (
                    order.history.map((item, idx) => (
                      <div key={item.id} className="relative pl-6 pb-2 last:pb-0">
                        {idx !== order.history.length - 1 && (
                          <div className="absolute left-2 top-2 bottom-0 w-0.5 bg-border" />
                        )}
                        <div className="absolute left-0 top-1.5 size-4 rounded-full bg-secondary border-2 border-border" />
                        <div className="space-y-1">
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-xs font-bold text-foreground leading-none pt-0.5">
                              {t(`status_${item.action}`, "orderDetails") || item.action}
                            </p>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {formatAppDate(item.timestamp, settings.dateFormat)}
                            </span>
                          </div>
                          {item.comment && (
                            <p className="text-xs text-muted-foreground italic break-words">{item.comment}</p>
                          )}
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <User className="size-2.5" /> {item.changedBy.firstName} {item.changedBy.lastName}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">{t("noHistory", "orderDetails")}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      <Dialog open={itemModalOpen} onOpenChange={setItemModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-5 text-primary" /> {t("addPositionTitle", "orderDetails")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("positionType", "orderDetails")}</Label>
                <RadioGroup 
                  value={itemForm.type} 
                  onValueChange={(v: "SERVICE" | "PART") => {
                    setItemForm({ ...itemForm, type: v, name: "", price: "", id: undefined })
                    setSearchQuery("")
                  }}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="SERVICE" id="t-service" />
                    <Label htmlFor="t-service" className="cursor-pointer font-normal">{t("service", "orderDetails")}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PART" id="t-part" />
                    <Label htmlFor="t-part" className="cursor-pointer font-normal">{t("part", "orderDetails")}</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>{t("name", "orderDetails")}</Label>
                <Popover open={serviceComboboxOpen} onOpenChange={setServiceComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={serviceComboboxOpen}
                      className="w-full justify-between font-normal"
                    >
                      {itemForm.name || (itemForm.type === "SERVICE" ? t("selectFromCatalog", "orderDetails") : t("selectFromInventory", "orderDetails"))}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder={t("searchPlaceholder", "search")} 
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      <CommandList>
                        <CommandEmpty>{t("nothingFound", "search")}</CommandEmpty>
                        <CommandGroup>
                        {itemForm.type === "SERVICE" ? (
                          catalogServices.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map((service) => (
                            <CommandItem
                              key={service.id}
                              value={service.name}
                              onSelect={() => {
                                setItemForm({ ...itemForm, id: service.id, name: service.name, price: String(service.price) })
                                setServiceComboboxOpen(false)
                              }}
                            >
                              <div className="flex flex-col">
                                <span>{service.name}</span>
                                <span className="text-xs text-muted-foreground">{service.price.toLocaleString()} ₴</span>
                              </div>
                            </CommandItem>
                          ))
                        ) : (
                          inventory.filter(p => (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())))).map((part) => (
                            <CommandItem
                              key={part.id}
                              value={part.name}
                              onSelect={() => {
                                setItemForm({ ...itemForm, id: part.id, name: part.name, price: String(part.salePrice) })
                                setServiceComboboxOpen(false)
                              }}
                              disabled={part.stockQuantity <= 0}
                            >
                              <div className="flex justify-between items-center w-full">
                                <div className="flex flex-col">
                                  <span>{part.name} {part.sku && <span className="text-[10px] text-muted-foreground ml-1">({part.sku})</span>}</span>
                                  <span className="text-xs text-muted-foreground">{part.salePrice.toLocaleString()} ₴</span>
                                </div>
                                <Badge variant={part.stockQuantity > 0 ? "secondary" : "destructive"} className="text-[10px]">
                                  {part.stockQuantity} {t("pcs", "orderDetails")}
                                </Badge>
                              </div>
                            </CommandItem>
                          ))
                        )}
                          <CommandItem
                            onSelect={() => {
                              setItemForm({ ...itemForm, name: searchQuery, id: undefined })
                              setServiceComboboxOpen(false)
                            }}
                            className="bg-primary/5 text-primary border-t border-border mt-1 font-medium"
                          >
                            <Plus className="mr-2 h-4 w-4" /> {t("add", "common")}: {searchQuery || t("new", "inventory")}
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("price", "orderDetails")} (₴)</Label>
                  <Input 
                    type="number" 
                    value={itemForm.price} 
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("quantity", "orderDetails")}</Label>
                  <Input 
                    type="number" 
                    value={itemForm.quantity} 
                    onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                    min="1"
                  />
                </div>
              </div>
            </div>

            <Button type="button" variant="secondary" onClick={handleAddToDraft} className="w-full gap-2">
              <Plus className="size-4" /> {t("addToDraft", "orderDetails")}
            </Button>

            {draftItems.length > 0 && (
              <div className="border border-border rounded-lg bg-secondary/20 overflow-hidden">
                <div className="bg-secondary/40 px-4 py-2 text-xs font-bold uppercase tracking-wider border-b border-border">
                  {t("common", "dashboard")}
                </div>
                <div className="max-h-[160px] overflow-auto">
                  {draftItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-2 border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <div className="min-w-0 mr-4">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {item.quantity} x {Number(item.price).toLocaleString()} ₴ = {(Number(item.price) * Number(item.quantity)).toLocaleString()} ₴
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="size-8 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveFromDraft(item.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setItemModalOpen(false)
              setDraftItems([])
              setItemForm({ name: "", price: "", quantity: "1", type: "SERVICE" })
            }}>
              {t("cancel", "common")}
            </Button>
            <Button onClick={handleSaveAllItems} disabled={isSubmitting || (draftItems.length === 0 && !itemForm.name)}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              {t("savePositions", "orderDetails")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Item Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
               <AlertTriangle className="size-5" /> {t("deletePositionTitle", "orderDetails")}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-foreground">
            {t("deletePositionConfirm", "orderDetails")}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              {t("cancel", "common")}
            </Button>
            <Button variant="destructive" onClick={handleRemoveItem} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              {t("delete", "common")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Team Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" /> {t("assignModalTitle", "orderDetails")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="s-manager">{t("manager", "orders")}</Label>
              <Select value={assignForm.managerId} onValueChange={(v) => setAssignForm({...assignForm, managerId: v})}>
                <SelectTrigger id="s-manager">
                  <SelectValue placeholder={t("selectManager", "orderDetails")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("none", "orderDetails")}</SelectItem>
                  {managers.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.firstName} {m.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-mechanic">{t("mechanic", "orders")}</Label>
              <Select value={assignForm.mechanicId} onValueChange={(v) => setAssignForm({...assignForm, mechanicId: v})}>
                <SelectTrigger id="s-mechanic">
                  <SelectValue placeholder={t("selectMechanic", "orderDetails")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("none", "orderDetails")}</SelectItem>
                  {mechanics.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.firstName} {m.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
              {t("cancel", "common")}
            </Button>
            <Button onClick={handleAssign} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              {t("save", "common")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
               <Banknote className="size-5 text-primary" /> {t("payOrder", "orderDetails")}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="space-y-3">
              <Label>{t("selectPaymentMethod", "orderDetails")}</Label>
              <RadioGroup value={paymentMethod} onValueChange={(v: "CASH" | "CARD") => setPaymentMethod(v)} className="grid grid-cols-2 gap-4">
                <div className={cn(
                  "flex items-center space-x-2 border rounded-lg p-4 cursor-pointer transition-all",
                  paymentMethod === "CASH" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted"
                )} onClick={() => setPaymentMethod("CASH")}>
                  <RadioGroupItem value="CASH" id="p-cash" />
                  <Label htmlFor="p-cash" className="flex items-center gap-2 cursor-pointer">
                    <Banknote className="size-4" /> {t("cash", "orderDetails")}
                  </Label>
                </div>
                <div className={cn(
                  "flex items-center space-x-2 border rounded-lg p-4 cursor-pointer transition-all",
                  paymentMethod === "CARD" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted"
                )} onClick={() => setPaymentMethod("CARD")}>
                  <RadioGroupItem value="CARD" id="p-card" />
                  <Label htmlFor="p-card" className="flex items-center gap-2 cursor-pointer">
                    <CreditCard className="size-4" /> {t("card", "orderDetails")}
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="bg-secondary/30 p-4 rounded-lg border border-border">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted-foreground uppercase font-bold">{t("total", "orderDetails")}</span>
                <span className="text-lg font-bold text-foreground">{Number(order?.totalAmount).toLocaleString()} ₴</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentModalOpen(false)}>
              {t("cancel", "common")}
            </Button>
            <Button onClick={handlePayment} disabled={isPaymentSubmitting} className="gap-2">
              {isPaymentSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {paymentMethod === "CARD" && role === "CLIENT" ? t("continue", "common") : t("confirmPayment", "orderDetails")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}