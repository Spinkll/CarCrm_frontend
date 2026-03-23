"use client"

import { useState, useEffect, useMemo } from "react"
import { useSettings } from "@/lib/settings-context"
import { formatAppDate, cn } from "@/lib/utils"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Mail, Phone, Loader2, Lock, Unlock } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useCustomers } from "@/lib/customers-context"
import type { Customer } from "@/lib/customers-context"
import { useVehicles } from "@/lib/vehicles-context"
import { useOrders } from "@/lib/orders-context"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/use-translation"

export default function CustomersPage() {
  const { user } = useAuth()
  const { customers, createCustomer, blockCustomer, unblockCustomer, isLoading: customersLoading } = useCustomers()
  const { vehicles, isLoading: vehiclesLoading } = useVehicles()
  const { orders, isLoading: ordersLoading } = useOrders()
  const { t } = useTranslation()

  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const { settings } = useSettings()

  const [filterStatus, setFilterStatus] = useState("ACTIVE") // ACTIVE, BLOCKED, ALL

  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [customerToBlock, setCustomerToBlock] = useState<Customer | null>(null)
  const [blockReason, setBlockReason] = useState("")
  const [isBlocking, setIsBlocking] = useState(false)

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  })

  useEffect(() => {
    if (user?.role === "CLIENT") {
      router.replace("/")
    }
  }, [user, router])

  // Оптимізована фільтрація клієнтів
  const filtered = useMemo(() => {
    return customers.filter((c) => {
      // Фільтр по статусу (заблоковано/активно)
      if (filterStatus === "ACTIVE" && c.isBlocked) return false;
      if (filterStatus === "BLOCKED" && !c.isBlocked) return false;

      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase()
      const searchLower = search.toLowerCase()
      return (
        fullName.includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        (c.phone && c.phone.includes(search))
      )
    })
  }, [customers, search, filterStatus])

  // Пагінація
  const totalPages = Math.max(1, Math.ceil(filtered.length / settings.tableRowsPerPage))
  const paginatedCustomers = filtered.slice(
    (currentPage - 1) * settings.tableRowsPerPage,
    currentPage * settings.tableRowsPerPage
  )

  useEffect(() => { setCurrentPage(1) }, [search, filterStatus])

  async function handleSubmit() {
    if (!form.firstName || !form.lastName || !form.email) return
    setIsSubmitting(true)

    const cleanPhone = form.phone ? form.phone.replace(/[\s\-\(\)]/g, "") : ""

    const result = await createCustomer({
      ...form,
      phone: cleanPhone
    })

    setIsSubmitting(false)

    if (result.success) {
      setForm({ firstName: "", lastName: "", email: "", phone: "" })
      setOpen(false)
      toast({ title: t("addSuccess", "customers"), variant: "success" })
    } else {
      toast({ title: result.error || t("addError", "customers"), variant: "destructive" })
    }
  }

  function openBlockDialog(customer: Customer) {
    setCustomerToBlock(customer)
    setBlockReason("")
    setBlockDialogOpen(true)
  }

  async function handleBlock() {
    if (!customerToBlock) return
    setIsBlocking(true)
    const res = await blockCustomer(customerToBlock.id, blockReason)
    setIsBlocking(false)
    if (res.success) {
      setBlockDialogOpen(false)
      setCustomerToBlock(null)
      toast({ title: t("blockSuccess", "customers"), variant: "success" })
    } else {
      toast({ title: res.error || t("blockError", "customers"), variant: "destructive" })
    }
  }

  async function handleUnblock(userId: number) {
    const res = await unblockCustomer(userId)
    if (res.success) {
      toast({ title: t("unblockSuccess", "customers"), variant: "success" })
    } else {
      toast({ title: res.error || t("unblockError", "customers"), variant: "destructive" })
    }
  }

  if (!user || user.role === "CLIENT") return null

  const isDataLoading = customersLoading || vehiclesLoading || ordersLoading
  const canCreateCustomers = user.role === "ADMIN" || user.role === "MANAGER"

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PageHeader
        title={t("title", "customers")}
        description={user.role === "MECHANIC" ? t("descriptionMechanic", "customers") : t("descriptionStaff", "customers")}
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-4 sm:max-w-md sm:flex-row">
            <Input
              placeholder={t("searchPlaceholder", "customers")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px] bg-card">
                <SelectValue placeholder={t("status", "customers")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">{t("active", "customers")}</SelectItem>
                <SelectItem value="ALL">{t("all", "customers")}</SelectItem>
                <SelectItem value="BLOCKED">{t("blocked", "customers")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {canCreateCustomers && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-sm">
                  <Plus className="size-4" />
                  {t("addCustomer", "customers")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t("newCustomer", "customers")}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                       <Label htmlFor="first-name">{t("firstName", "customers")}</Label>
                      <Input
                        id="first-name"
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        placeholder="Іван"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="last-name">{t("lastName", "customers")}</Label>
                      <Input
                        id="last-name"
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        placeholder="Іванов"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">{t("email", "customers")}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="ivan@email.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">{t("phone", "customers")}</Label>
                    <PhoneInput
                      id="phone"
                      value={form.phone}
                      onValueChange={(val) => setForm({ ...form, phone: val })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                    {t("cancel")}
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                    {t("addCustomer", "customers")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card className={cn("border-border bg-card shadow-sm", settings.showTableBorders && "table-bordered")}>
          <CardContent className="p-0">
            {isDataLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                <Loader2 className="mb-2 size-8 animate-spin" />
                <p>{t("loading", "customers")}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="pl-6">{t("customer", "customers")}</TableHead>
                    <TableHead>{t("contacts", "customers")}</TableHead>
                    <TableHead>{t("vehicles", "customers")}</TableHead>
                    <TableHead>{t("orders", "customers")}</TableHead>
                    <TableHead>{t("totalSpent", "customers")}</TableHead>
                    <TableHead>{t("inSystemSince", "customers")}</TableHead>
                    {canCreateCustomers && <TableHead className="pr-6 text-right">{t("actions", "customers")}</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCustomers.map((customer) => {
                    // Рахуємо машини клієнта
                    const customerVehicles = vehicles.filter(v => v.userId === customer.id);
                    const vehicleIds = new Set(customerVehicles.map(v => v.id));

                    // Рахуємо замовлення
                    const customerOrders = orders.filter(o => {
                      if (o.carId && vehicleIds.has(o.carId)) return true;
                      if (o.vehicleId && vehicleIds.has(o.vehicleId)) return true;
                      return o.car?.userId === customer.id;
                    });

                    // Вважаємо витраченими тільки ті гроші, замовлення яких Completed або Paid
                    const totalSpent = customerOrders.reduce((acc, curr) => {
                      const status = curr.status?.toLowerCase();
                      if (status === 'completed' || status === 'paid') {
                        return acc + Number(curr.totalAmount || 0)
                      }
                      return acc;
                    }, 0);

                    return (
                      <TableRow key={customer.id} className="group border-border transition-colors hover:bg-muted/30">
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                              {customer.firstName?.[0]}{customer.lastName?.[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">
                                {customer.firstName} {customer.lastName}
                                {customer.isBlocked && (
                                  <Badge variant="destructive" className="ml-2 px-1.5 py-0 text-[10px]">{t("blockedBadge", "customers")}</Badge>
                                )}
                              </p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">ID: {customer.id}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-sm text-foreground">
                              <Mail className="size-3.5 text-muted-foreground" />
                              {customer.email}
                            </div>
                            {customer.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Phone className="size-3.5" />
                                {customer.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                            {customerVehicles.length}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{customerOrders.length}</span>
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">
                          {totalSpent.toLocaleString(undefined, { minimumFractionDigits: 0 })} ₴
                        </TableCell>
                        <TableCell className={canCreateCustomers ? "" : "pr-6"}>
                          <span className="text-xs text-muted-foreground">
                            {formatAppDate(customer.createdAt, settings.dateFormat)}
                          </span>
                        </TableCell>
                        {canCreateCustomers && (
                          <TableCell className="pr-6 text-right">
                            <div className="flex items-center justify-end">
                              {customer.isBlocked ? (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-green-600">
                                      <Unlock className="size-4" />
                                      <span className="sr-only">{t("unblockTitle", "customers")}</span>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="border-border bg-card">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-foreground">{t("unblockTitle", "customers")}</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {t("unblockConfirm", "customers")} <strong>{customer.firstName} {customer.lastName}</strong>?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="border-border bg-secondary text-foreground hover:bg-accent">{t("cancel")}</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleUnblock(customer.id)}
                                        className="bg-primary text-primary-foreground"
                                      >
                                        {t("unblockTitle", "customers")}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-muted-foreground hover:text-orange-600"
                                  onClick={() => openBlockDialog(customer)}
                                >
                                  <Lock className="size-4" />
                                  <span className="sr-only">{t("blockTitle", "customers")}</span>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}

            {!isDataLoading && filtered.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-muted-foreground">{t("notFound", "customers")}</p>
              </div>
            )}

            {/* Пагінація */}
            {!isDataLoading && filtered.length > settings.tableRowsPerPage && (
              <div className="flex items-center justify-between border-t border-border px-6 py-3">
                <span className="text-xs text-muted-foreground">
                  {(currentPage - 1) * settings.tableRowsPerPage + 1}–{Math.min(currentPage * settings.tableRowsPerPage, filtered.length)} {t("of", "customers")} {filtered.length}
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
      </div>

      {/* Діалог блокування клієнта */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="border-border bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t("blockTitle", "customers")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-muted-foreground">
              {t("blockConfirm", "customers")} <strong>{customerToBlock?.firstName} {customerToBlock?.lastName}</strong>?
              {t("blockWarning", "customers")}
            </p>
            <div className="grid gap-2">
              <Label htmlFor="block-reason-customer">{t("blockReason", "customers")}</Label>
              <Input
                id="block-reason-customer"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder={t("blockPlaceholder", "customers")}
                className="bg-secondary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)} className="border-border">
              {t("cancel")}
            </Button>
            <Button onClick={handleBlock} disabled={isBlocking} className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
              {isBlocking ? t("blocking", "customers") : t("blockTitle", "customers")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}