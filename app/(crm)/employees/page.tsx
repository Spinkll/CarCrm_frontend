"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { useAuth } from "@/lib/auth-context"
import { useEmployees } from "@/lib/employees-context"
import type { Employee } from "@/lib/employees-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
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
import { UserPlus, Shield, Settings, Search, Trash2, Briefcase, Percent, Pencil, Banknote } from "lucide-react"
import { cn } from "@/lib/utils"

const roleConfig = {
  ADMIN: { label: "Адміністратор", icon: Shield, className: "bg-primary/15 text-primary border-primary/30" },
  MANAGER: { label: "Менеджер", icon: Briefcase, className: "bg-purple-100 text-purple-700 border-purple-200" },
  MECHANIC: { label: "Механік", icon: Settings, className: "bg-orange-100 text-orange-700 border-orange-200" },
}

export default function EmployeesPage() {
  const { user } = useAuth()
  const { employees, createEmployee, updateEmployee, deleteEmployee, isLoading } = useEmployees()
  const router = useRouter()

  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "" as "MECHANIC" | "MANAGER" | "",
    commissionRate: "",
    baseSalary: "",
  })
  const [error, setError] = useState("")

  // Стан для діалогу налаштувань працівника
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [editCommission, setEditCommission] = useState("")
  const [editBaseSalary, setEditBaseSalary] = useState("")
  const [editError, setEditError] = useState("")
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  useEffect(() => {
    if (user && user.role !== "ADMIN" && user.role !== "MANAGER") {
      router.replace("/")
    }
  }, [user, router])

  const filtered = employees.filter(
    (e) =>
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
  )

  const mechanicCount = employees.filter((e) => e.role === "MECHANIC").length
  const adminCount = employees.filter((e) => e.role === "ADMIN").length
  const managerCount = employees.filter((e) => e.role === "MANAGER").length

  async function handleAdd() {
    setError("")

    if (!form.firstName || !form.lastName || !form.email || !form.role) {
      setError("Будь ласка, заповніть усі поля")
      return
    }

    if (form.role === "MECHANIC" && (!form.commissionRate || Number(form.commissionRate) <= 0 || Number(form.commissionRate) > 100)) {
      setError("Вкажіть коректний % від робіт (1-100%)")
      return
    }

    if (!form.baseSalary || Number(form.baseSalary) < 0) {
      setError("Вкажіть коректну базову ставку")
      return
    }

    setIsSubmitting(true)

    const cleanPhone = form.phone ? form.phone.replace(/[\s\-\(\)]/g, "") : ""

    const result = await createEmployee({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: cleanPhone,
      role: form.role,
      baseSalary: Number(form.baseSalary),
      ...(form.role === "MECHANIC" && { commissionRate: Number(form.commissionRate) }),
    })

    setIsSubmitting(false)

    if (result.success) {
      setForm({ firstName: "", lastName: "", email: "", phone: "", role: "", commissionRate: "", baseSalary: "" })
      setDialogOpen(false)
    } else {
      setError(result.error || "Не вдалося додати працівника")
    }
  }

  async function handleRemove(userId: number) {
    await deleteEmployee(userId)
  }

  function openSettings(emp: Employee) {
    setEditingEmployee(emp)
    setEditCommission(emp.commissionRate ? String(emp.commissionRate) : "")
    setEditBaseSalary(emp.baseSalary ? String(emp.baseSalary) : "")
    setEditError("")
    setSettingsOpen(true)
  }

  async function handleSaveSettings() {
    if (!editingEmployee) return
    setEditError("")

    const updateData: any = {}

    // Базова ставка — для всіх
    const salary = Number(editBaseSalary)
    if (!editBaseSalary || salary < 0) {
      setEditError("Вкажіть коректну базову ставку")
      return
    }
    updateData.baseSalary = salary

    // Комісія — тільки для механіків
    if (editingEmployee.role === "MECHANIC") {
      const rate = Number(editCommission)
      if (!rate || rate <= 0 || rate > 100) {
        setEditError("Вкажіть коректний відсоток комісії (1-100%)")
        return
      }
      updateData.commissionRate = rate
    }

    setIsSavingSettings(true)
    const result = await updateEmployee(editingEmployee.id, updateData)
    setIsSavingSettings(false)

    if (result.success) {
      setSettingsOpen(false)
      setEditingEmployee(null)
    } else {
      setEditError(result.error || "Не вдалося зберегти зміни")
    }
  }

  function getInitials(first: string, last: string) {
    return `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase()
  }

  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) return null

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Персонал" description="Управління доступом та ролями" />

      <div className="flex-1 space-y-6 p-6">
        {/* Статистика */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-border bg-card">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                <Briefcase className="size-5 text-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{employees.length}</p>
                <p className="text-sm text-muted-foreground">Всього працівників</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-10 items-center justify-center rounded-lg bg-orange-100">
                <Settings className="size-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{mechanicCount}</p>
                <p className="text-sm text-muted-foreground">Механіки</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-10 items-center justify-center rounded-lg bg-purple-100">
                <Briefcase className="size-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{managerCount}</p>
                <p className="text-sm text-muted-foreground">Менеджери</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Пошук та додавання */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Пошук працівників..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-card pl-9"
            />
          </div>

          {user.role === "ADMIN" && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-sm">
                  <UserPlus className="size-4" />
                  Додати працівника
                </Button>
              </DialogTrigger>
              <DialogContent className="border-border bg-card sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Новий працівник</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {error && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="emp-first">Ім'я</Label>
                      <Input
                        id="emp-first"
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        placeholder="Іван"
                        className="bg-secondary"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="emp-last">Прізвище</Label>
                      <Input
                        id="emp-last"
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        placeholder="Іванов"
                        className="bg-secondary"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="emp-email">Email</Label>
                    <Input
                      id="emp-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="employee@autocare.com"
                      className="bg-secondary"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="emp-phone">Телефон</Label>
                    <PhoneInput
                      id="emp-phone"
                      value={form.phone}
                      onValueChange={(val) => setForm({ ...form, phone: val })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Роль</Label>
                    <Select
                      value={form.role}
                      onValueChange={(v) => setForm({ ...form, role: v as any, commissionRate: v === "MECHANIC" ? form.commissionRate : "" })}
                    >
                      <SelectTrigger className="w-full bg-secondary">
                        <SelectValue placeholder="Оберіть роль" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MECHANIC">Механік</SelectItem>
                        <SelectItem value="MANAGER">Менеджер</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {form.role && (
                    <div className="grid gap-2">
                      <Label htmlFor="emp-salary">Базова ставка (₴)</Label>
                      <div className="relative">
                        <Input
                          id="emp-salary"
                          type="number"
                          min="0"
                          value={form.baseSalary}
                          onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
                          placeholder="Наприклад, 15000"
                          className="bg-secondary pr-10"
                          required
                        />
                        <Banknote className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Фіксована місячна ставка працівника
                      </p>
                    </div>
                  )}

                  {form.role === "MECHANIC" && (
                    <div className="grid gap-2">
                      <Label htmlFor="emp-commission">% від виконаних робіт</Label>
                      <div className="relative">
                        <Input
                          id="emp-commission"
                          type="number"
                          min="1"
                          max="100"
                          value={form.commissionRate}
                          onChange={(e) => setForm({ ...form, commissionRate: e.target.value })}
                          placeholder="Наприклад, 30"
                          className="bg-secondary pr-10"
                          required
                        />
                        <Percent className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        % від вартості послуги, який отримує механік
                      </p>
                    </div>
                  )}

                  <Button onClick={handleAdd} disabled={isSubmitting} className="gap-2">
                    {isSubmitting ? "Збереження..." : (
                      <>
                        <UserPlus className="size-4" />
                        Додати працівника
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Таблиця */}
        <Card className="border-border bg-card">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Завантаження персоналу...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Працівник</TableHead>
                    <TableHead className="text-muted-foreground">Email</TableHead>
                    <TableHead className="text-muted-foreground">Роль</TableHead>
                    <TableHead className="text-center text-muted-foreground">Ставка</TableHead>
                    <TableHead className="text-center text-muted-foreground">% від робіт</TableHead>
                    <TableHead className="text-right text-muted-foreground">Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        Працівників не знайдено
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((emp) => {
                      const config = roleConfig[emp.role] || roleConfig.MECHANIC
                      const isSelf = emp.id === user?.id
                      return (
                        <TableRow key={emp.id} className="border-border">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex size-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
                                {getInitials(emp.firstName, emp.lastName)}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">
                                  {emp.firstName} {emp.lastName}
                                  {isSelf && (
                                    <span className="ml-2 text-xs text-muted-foreground">(Ви)</span>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground">ID: {emp.id}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{emp.email}</TableCell>
                          <TableCell>
                            {config && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
                                  config.className
                                )}
                              >
                                <config.icon className="size-3" />
                                {config.label}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {(emp.role === "MECHANIC" || emp.role === "MANAGER") && emp.baseSalary != null ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-green-50 border border-green-200 px-2 py-0.5 text-xs font-medium text-green-700">
                                <Banknote className="size-3" />
                                {Number(emp.baseSalary).toLocaleString()} ₴
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {emp.role === "MECHANIC" ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-medium text-blue-700">
                                <Percent className="size-3" />
                                {emp.commissionRate ?? "—"}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isSelf ? (
                              <span className="text-xs text-muted-foreground">--</span>
                            ) : user.role === "ADMIN" ? (
                              <div className="flex items-center justify-end gap-1">
                                {(emp.role === "MECHANIC" || emp.role === "MANAGER") && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-muted-foreground hover:text-foreground"
                                    onClick={() => openSettings(emp)}
                                  >
                                    <Pencil className="size-4" />
                                    <span className="sr-only">Налаштування працівника</span>
                                  </Button>
                                )}
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive">
                                      <Trash2 className="size-4" />
                                      <span className="sr-only">Видалити працівника</span>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="border-border bg-card">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-foreground">Видалити працівника</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Ви впевнені, що хочете видалити <strong>{emp.firstName} {emp.lastName}</strong> із системи? Цю дію неможливо скасувати.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="border-border bg-secondary text-foreground hover:bg-accent">Скасувати</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleRemove(emp.id)}
                                        className="bg-destructive text-foreground hover:bg-destructive/90"
                                      >
                                        Видалити
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">--</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Діалог налаштувань працівника */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="border-border bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Налаштування: {editingEmployee?.firstName} {editingEmployee?.lastName}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {editError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {editError}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="edit-salary">Базова ставка (₴)</Label>
              <div className="relative">
                <Input
                  id="edit-salary"
                  type="number"
                  min="0"
                  value={editBaseSalary}
                  onChange={(e) => setEditBaseSalary(e.target.value)}
                  placeholder="Наприклад, 15000"
                  className="bg-secondary pr-10"
                />
                <Banknote className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Фіксована місячна ставка працівника
              </p>
            </div>

            {editingEmployee?.role === "MECHANIC" && (
              <div className="grid gap-2">
                <Label htmlFor="edit-commission">% від виконаних робіт</Label>
                <div className="relative">
                  <Input
                    id="edit-commission"
                    type="number"
                    min="1"
                    max="100"
                    value={editCommission}
                    onChange={(e) => setEditCommission(e.target.value)}
                    placeholder="Наприклад, 30"
                    className="bg-secondary pr-10"
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Відсоток від вартості послуги, який отримує механік
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)} className="border-border">
              Скасувати
            </Button>
            <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="gap-2">
              {isSavingSettings ? "Збереження..." : "Зберегти"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}