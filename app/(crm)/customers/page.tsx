"use client"

import { useState, useEffect, useMemo } from "react"
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
import { Plus, Mail, Phone, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useCustomers } from "@/lib/customers-context"
import { useVehicles } from "@/lib/vehicles-context"
import { useOrders } from "@/lib/orders-context"
import { toast } from "@/hooks/use-toast"

export default function CustomersPage() {
  const { user } = useAuth()
  const { customers, createCustomer, isLoading: customersLoading } = useCustomers()
  const { vehicles, isLoading: vehiclesLoading } = useVehicles()
  const { orders, isLoading: ordersLoading } = useOrders()

  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase()
      const searchLower = search.toLowerCase()
      return (
        fullName.includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        (c.phone && c.phone.includes(search))
      )
    })
  }, [customers, search])

  async function handleSubmit() {
    if (!form.firstName || !form.lastName || !form.email) return
    setIsSubmitting(true)

    const result = await createCustomer({
      ...form
    })

    setIsSubmitting(false)

    if (result.success) {
      setForm({ firstName: "", lastName: "", email: "", phone: "" })
      setOpen(false)
      toast({ title: "Клієнта додано", variant: "success" })
    } else {
      toast({ title: result.error || "Не вдалося додати клієнта", variant: "destructive" })
    }
  }

  if (!user || user.role === "CLIENT") return null

  const isDataLoading = customersLoading || vehiclesLoading || ordersLoading
  const canCreateCustomers = user.role === "ADMIN" || user.role === "MANAGER"

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PageHeader
        title="Клієнти"
        description={user.role === "MECHANIC" ? "Перегляд інформації про клієнтів" : "Управління базою клієнтів"}
      >
        {canCreateCustomers && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-sm">
                <Plus className="size-4" />
                Додати клієнта
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Новий клієнт</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="first-name">Ім'я</Label>
                    <Input
                      id="first-name"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      placeholder="Іван"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="last-name">Прізвище</Label>
                    <Input
                      id="last-name"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      placeholder="Іванов"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="ivan@email.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <PhoneInput
                    id="phone"
                    value={form.phone}
                    onValueChange={(val) => setForm({ ...form, phone: val })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                  Скасувати
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Додати клієнта
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-0">
            <div className="border-b border-border p-4">
              <Input
                placeholder="Пошук клієнтів..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-md bg-secondary/50"
              />
            </div>

            {isDataLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                <Loader2 className="mb-2 size-8 animate-spin" />
                <p>Завантаження даних клієнтів...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="pl-6">Клієнт</TableHead>
                    <TableHead>Контакти</TableHead>
                    <TableHead>Автомобілі</TableHead>
                    <TableHead>Замовлення</TableHead>
                    <TableHead>Всього витрачено</TableHead>
                    <TableHead className="pr-6">В системі з</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((customer) => {
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
                              <p className="font-semibold text-foreground">{customer.firstName} {customer.lastName}</p>
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
                        <TableCell className="pr-6 text-xs text-muted-foreground">
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}

            {!isDataLoading && filtered.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-muted-foreground">Клієнтів не знайдено.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}