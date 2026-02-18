"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { useAuth } from "@/lib/auth-context"
import { useEmployees } from "@/lib/employees-context" // 👈 Використовуємо новий хук
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { UserPlus, Shield, Settings, Search, Trash2, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"

// Конфігурація для бейджів ролей
const roleConfig = {
  ADMIN: { label: "Administrator", icon: Shield, className: "bg-primary/15 text-primary border-primary/30" },
  MANAGER: { label: "Manager", icon: Briefcase, className: "bg-purple-100 text-purple-700 border-purple-200" },
  MECHANIC: { label: "Mechanic", icon: Settings, className: "bg-orange-100 text-orange-700 border-orange-200" },
}

export default function EmployeesPage() {
  const { user } = useAuth()
  // 👇 Беремо дані з нового контексту
  const { employees, createEmployee, deleteEmployee, isLoading } = useEmployees() 
  const router = useRouter()

  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    role: "" as "MECHANIC" | "ADMIN" | "MANAGER" | "",
  })
  const [error, setError] = useState("")

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      router.replace("/")
    }
  }, [user, router])

  // Фільтрація
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

    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.role) {
      setError("Please fill in all fields")
      return
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setIsSubmitting(true)
    
    // Відправляємо на бекенд
    const result = await createEmployee({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role: form.role
    })

    setIsSubmitting(false)

    if (result.success) {
      setForm({ firstName: "", lastName: "", email: "", password: "", phone: "", role: "" })
      setDialogOpen(false)
    } else {
      setError(result.error || "Failed to add employee")
    }
  }

  async function handleRemove(userId: number) {
    await deleteEmployee(userId)
  }

  function getInitials(first: string, last: string) {
    return `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase()
  }

  if (user?.role !== "ADMIN") return null

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Employees" description="Manage access and roles">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="size-4" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="border-border bg-card sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add New Employee</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="emp-first">First Name</Label>
                    <Input
                    id="emp-first"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    placeholder="John"
                    className="bg-secondary"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="emp-last">Last Name</Label>
                    <Input
                    id="emp-last"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    placeholder="Doe"
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
                <Label htmlFor="emp-phone">Phone</Label>
                <Input
                  id="emp-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+380..."
                  className="bg-secondary"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="emp-password">Password</Label>
                <Input
                  id="emp-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 8 characters"
                  className="bg-secondary"
                />
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm({ ...form, role: v as any })}
                >
                  <SelectTrigger className="w-full bg-secondary">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MECHANIC">Mechanic</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="ADMIN">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAdd} disabled={isSubmitting} className="gap-2">
                {isSubmitting ? "Saving..." : (
                    <>
                        <UserPlus className="size-4" />
                        Add Employee
                    </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex-1 space-y-6 p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-border bg-card">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                <Briefcase className="size-5 text-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{employees.length}</p>
                <p className="text-sm text-muted-foreground">Total Employees</p>
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
                 <p className="text-sm text-muted-foreground">Mechanics</p>
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
                 <p className="text-sm text-muted-foreground">Managers</p>
               </div>
             </CardContent>
           </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-secondary pl-9"
          />
        </div>

        {/* Table */}
        <Card className="border-border bg-card">
          <CardContent className="p-0">
            {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading employees...</div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Employee</TableHead>
                  <TableHead className="text-muted-foreground">Email</TableHead>
                  <TableHead className="text-muted-foreground">Role</TableHead>
                  <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No employees found
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
                                  <span className="ml-2 text-xs text-muted-foreground">(You)</span>
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
                        <TableCell className="text-right">
                          {isSelf ? (
                            <span className="text-xs text-muted-foreground">--</span>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive">
                                  <Trash2 className="size-4" />
                                  <span className="sr-only">Remove employee</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="border-border bg-card">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-foreground">Remove Employee</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove <strong>{emp.firstName} {emp.lastName}</strong> from the system?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-border bg-secondary text-foreground hover:bg-accent">Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRemove(emp.id)}
                                    className="bg-destructive text-foreground hover:bg-destructive/90"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
    </div>
  )
}