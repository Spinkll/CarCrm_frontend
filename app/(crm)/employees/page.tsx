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
import { UserPlus, Shield, Settings, Search, Trash2, Briefcase, Percent, Pencil, Banknote, Lock, Unlock, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/hooks/use-translation"

export default function EmployeesPage() {
  const { user } = useAuth()
  const { employees, createEmployee, updateEmployee, deleteEmployee, blockEmployee, unblockEmployee, isLoading } = useEmployees()
  const router = useRouter()
  const { t } = useTranslation()

  const roleConfig = {
    ADMIN: { label: t("admin", "employees"), icon: Shield, className: "bg-primary/15 text-primary border-primary/30" },
    MANAGER: { label: t("manager", "employees"), icon: Briefcase, className: "bg-purple-100 text-purple-700 border-purple-200" },
    MECHANIC: { label: t("mechanic", "employees"), icon: Settings, className: "bg-orange-100 text-orange-700 border-orange-200" },
  }

  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("ACTIVE") // ACTIVE, BLOCKED, ALL
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [employeeToBlock, setEmployeeToBlock] = useState<Employee | null>(null)
  const [blockReason, setBlockReason] = useState("")
  const [isBlocking, setIsBlocking] = useState(false)

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

  const filtered = employees.filter((e) => {
    // Фільтр по статусу
    if (filterStatus === "ACTIVE" && e.isBlocked) return false;
    if (filterStatus === "BLOCKED" && !e.isBlocked) return false;

    return (
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
    )
  })

  const mechanicCount = employees.filter((e) => e.role === "MECHANIC").length
  const adminCount = employees.filter((e) => e.role === "ADMIN").length
  const managerCount = employees.filter((e) => e.role === "MANAGER").length

  async function handleAdd() {
    setError("")

    if (!form.firstName || !form.lastName || !form.email || !form.role) {
      setError(t("fillAllFields", "employees"))
      return
    }

    if (form.role === "MECHANIC" && (!form.commissionRate || Number(form.commissionRate) <= 0 || Number(form.commissionRate) > 100)) {
      setError(t("invalidCommission", "employees"))
      return
    }

    if (!form.baseSalary || Number(form.baseSalary) < 0) {
      setError(t("invalidSalary", "employees"))
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
      ...((form.role === "MECHANIC" || form.role === "MANAGER") && { commissionRate: Number(form.commissionRate) }),
    })

    setIsSubmitting(false)

    if (result.success) {
      setForm({ firstName: "", lastName: "", email: "", phone: "", role: "", commissionRate: "", baseSalary: "" })
      setDialogOpen(false)
    } else {
      setError(result.error || t("addError", "employees"))
    }
  }

  async function handleRemove(userId: number) {
    await deleteEmployee(userId)
  }

  function openBlockDialog(emp: Employee) {
    setEmployeeToBlock(emp)
    setBlockReason("")
    setBlockDialogOpen(true)
  }

  async function handleBlock() {
    if (!employeeToBlock) return
    setIsBlocking(true)
    await blockEmployee(employeeToBlock.id, blockReason)
    setIsBlocking(false)
    setBlockDialogOpen(false)
    setEmployeeToBlock(null)
  }

  async function handleUnblock(userId: number) {
    await unblockEmployee(userId)
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
      setEditError(t("invalidSalary", "employees"))
      return
    }
    updateData.baseSalary = salary

    // Комісія — для механіків та менеджерів
    if (editingEmployee.role === "MECHANIC" || editingEmployee.role === "MANAGER") {
      const rate = Number(editCommission)
      if (!rate || rate <= 0 || rate > 100) {
        setEditError(t("invalidCommission", "employees"))
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
      setEditError(result.error || t("error", "common"))
    }
  }

  function getInitials(first: string, last: string) {
    return `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase()
  }

  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) return null

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title={t("title", "employees")} description={t("description", "employees")} />

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
                <p className="text-sm text-muted-foreground">{t("totalEmployees", "employees")}</p>
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
                <p className="text-sm text-muted-foreground">{t("mechanics", "employees")}</p>
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
                <p className="text-sm text-muted-foreground">{t("managers", "employees")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Пошук та додавання */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-4 sm:max-w-md sm:flex-row">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder", "employees")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-card pl-9 w-full"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px] bg-card">
                <SelectValue placeholder={t("status", "requests")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">{t("filterActive", "employees")}</SelectItem>
                <SelectItem value="ALL">{t("filterAll", "employees")}</SelectItem>
                <SelectItem value="BLOCKED">{t("filterBlocked", "employees")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {user.role === "ADMIN" && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-sm">
                  <UserPlus className="size-4" />
                  {t("addEmployee", "employees")}
                </Button>
              </DialogTrigger>
              <DialogContent className="border-border bg-card sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-foreground">{t("newEmployee", "employees")}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {error && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="emp-first">{t("firstName", "employees")}</Label>
                      <Input
                        id="emp-first"
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        placeholder="Ivan"
                        className="bg-secondary"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="emp-last">{t("lastName", "employees")}</Label>
                      <Input
                        id="emp-last"
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        placeholder="Ivanov"
                        className="bg-secondary"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="emp-email">{t("email", "employees")}</Label>
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
                    <Label htmlFor="emp-phone">{t("phone", "employees")}</Label>
                    <PhoneInput
                      id="emp-phone"
                      value={form.phone}
                      onValueChange={(val) => setForm({ ...form, phone: val })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>{t("role", "employees")}</Label>
                    <Select
                      value={form.role}
                      onValueChange={(v) => setForm({ ...form, role: v as any, commissionRate: v === "MECHANIC" ? form.commissionRate : "" })}
                    >
                      <SelectTrigger className="w-full bg-secondary">
                        <SelectValue placeholder={t("selectRole", "employees")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MECHANIC">{t("mechanic", "employees")}</SelectItem>
                        <SelectItem value="MANAGER">{t("manager", "employees")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {form.role && (
                    <div className="grid gap-2">
                      <Label htmlFor="emp-salary">{t("baseSalary", "employees")}</Label>
                      <div className="relative">
                        <Input
                          id="emp-salary"
                          type="number"
                          min="0"
                          value={form.baseSalary}
                          onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
                          placeholder={t("salaryPlaceholder", "employees")}
                          className="bg-secondary pr-10"
                          required
                        />
                        <Banknote className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t("salaryDesc", "employees")}
                      </p>
                    </div>
                  )}

                  {(form.role === "MECHANIC" || form.role === "MANAGER") && (
                    <div className="grid gap-2">
                      <Label htmlFor="emp-commission">{t("commissionRate", "employees")}</Label>
                      <div className="relative">
                        <Input
                          id="emp-commission"
                          type="number"
                          min="1"
                          max="100"
                          value={form.commissionRate}
                          onChange={(e) => setForm({ ...form, commissionRate: e.target.value })}
                          placeholder={t("commissionPlaceholder", "employees")}
                          className="bg-secondary pr-10"
                          required
                        />
                        <Percent className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t("commissionDesc", "employees").replace("{role}", form.role === "MECHANIC" ? t("mechanic", "employees").toLowerCase() : t("manager", "employees").toLowerCase())}
                      </p>
                    </div>
                  )}

                  <Button onClick={handleAdd} disabled={isSubmitting} className="gap-2">
                    {isSubmitting ? t("saving", "common") : (
                      <>
                        <UserPlus className="size-4" />
                        {t("addEmployee", "employees")}
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
              <div className="p-8 text-center text-muted-foreground">{t("loading", "employees")}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">{t("employee", "employees")}</TableHead>
                    <TableHead className="text-muted-foreground">{t("email", "employees")}</TableHead>
                    <TableHead className="text-muted-foreground">{t("role", "employees")}</TableHead>
                    <TableHead className="text-center text-muted-foreground">{t("salary", "employees")}</TableHead>
                    <TableHead className="text-center text-muted-foreground">{t("commission", "employees")}</TableHead>
                    <TableHead className="text-right text-muted-foreground">{t("actions", "employees")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        {t("notFound", "employees")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((emp) => {
                      const config = (roleConfig as any)[emp.role] || roleConfig.MECHANIC
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
                                    <span className="ml-2 text-xs text-muted-foreground">({t("selfBadge", "employees")})</span>
                                  )}
                                  {emp.isBlocked && (
                                    <Badge variant="destructive" className="ml-2 px-1.5 py-0 text-[10px]">{t("blockedBadge", "employees")}</Badge>
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
                            {emp.role === "MECHANIC" || emp.role === "MANAGER" ? (
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
                                    <span className="sr-only">{t("edit", "common")}</span>
                                  </Button>
                                )}
                                {emp.isBlocked ? (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-green-600">
                                        <Unlock className="size-4" />
                                        <span className="sr-only">{t("unblockTitle", "employees")}</span>
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="border-border bg-card">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="text-foreground">{t("unblockTitle", "employees")}</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          {t("unblockConfirm", "employees")} <strong>{emp.firstName} {emp.lastName}</strong>?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="border-border bg-secondary text-foreground hover:bg-accent">{t("cancel", "common")}</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleUnblock(emp.id)}
                                          className="bg-primary text-primary-foreground"
                                        >
                                          {t("unblockTitle", "employees")}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-muted-foreground hover:text-orange-600"
                                    onClick={() => openBlockDialog(emp)}
                                  >
                                    <Lock className="size-4" />
                                    <span className="sr-only">{t("blockTitle", "employees")}</span>
                                  </Button>
                                )}
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive">
                                      <Trash2 className="size-4" />
                                      <span className="sr-only">{t("deleteTitle", "employees")}</span>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="border-border bg-card">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-foreground">{t("deleteTitle", "employees")}</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {t("deleteConfirm", "employees").replace("{name}", `${emp.firstName} ${emp.lastName}`)}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="border-border bg-secondary text-foreground hover:bg-accent">{t("cancel", "common")}</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleRemove(emp.id)}
                                        className="bg-destructive text-foreground hover:bg-destructive/90"
                                      >
                                        {t("delete", "common")}
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
              {t("settingsTitle", "employees")} {editingEmployee?.firstName} {editingEmployee?.lastName}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {editError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {editError}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="edit-salary">{t("baseSalary", "employees")}</Label>
              <div className="relative">
                <Input
                  id="edit-salary"
                  type="number"
                  min="0"
                  value={editBaseSalary}
                  onChange={(e) => setEditBaseSalary(e.target.value)}
                  placeholder={t("salaryPlaceholder", "employees")}
                  className="bg-secondary pr-10"
                />
                <Banknote className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                {t("salaryDesc", "employees")}
              </p>
            </div>

            {(editingEmployee?.role === "MECHANIC" || editingEmployee?.role === "MANAGER") && (
              <div className="grid gap-2">
                <Label htmlFor="edit-commission">{t("commissionRate", "employees")}</Label>
                <div className="relative">
                  <Input
                    id="edit-commission"
                    type="number"
                    min="1"
                    max="100"
                    value={editCommission}
                    onChange={(e) => setEditCommission(e.target.value)}
                    placeholder={t("commissionPlaceholder", "employees")}
                    className="bg-secondary pr-10"
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("commissionDesc", "employees").replace("{role}", editingEmployee?.role === "MECHANIC" ? t("mechanic", "employees").toLowerCase() : t("manager", "employees").toLowerCase())}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)} className="border-border">
              {t("cancel", "common")}
            </Button>
            <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="gap-2">
              {isSavingSettings ? t("saving", "common") : t("save", "common")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Діалог блокування працівника */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="border-border bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t("blockTitle", "employees")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-muted-foreground">
              {t("blockConfirm", "employees")} <strong>{employeeToBlock?.firstName} {employeeToBlock?.lastName}</strong>?
            </p>
            <div className="grid gap-2">
              <Label htmlFor="block-reason">{t("blockReason", "employees")}</Label>
              <Input
                id="block-reason"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder={t("blockPlaceholder", "employees")}
                className="bg-secondary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)} className="border-border">
              {t("cancel", "common")}
            </Button>
            <Button onClick={handleBlock} disabled={isBlocking} className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
              {isBlocking ? t("blocking", "employees") : t("blockTitle", "employees")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}