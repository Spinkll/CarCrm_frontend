"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { useAuth } from "@/lib/auth-context"
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
import { UserPlus, Shield, Settings, Search, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

const roleConfig = {
  admin: { label: "Administrator", icon: Shield, className: "bg-primary/15 text-primary border-primary/30" },
  mechanic: { label: "Mechanic", icon: Settings, className: "bg-chart-2/15 text-chart-2 border-chart-2/30" },
}

export default function EmployeesPage() {
  const { user, addEmployee, removeEmployee, getEmployees } = useAuth()
  const router = useRouter()
  const [employees, setEmployees] = useState<ReturnType<typeof getEmployees>>([])
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "" as "mechanic" | "admin" | "",
  })
  const [error, setError] = useState("")

  const refreshEmployees = useCallback(() => {
    setEmployees(getEmployees())
  }, [getEmployees])

  useEffect(() => {
    if (user?.role !== "admin") {
      router.replace("/")
      return
    }
    refreshEmployees()
  }, [user, router, refreshEmployees])

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
  )

  const mechanicCount = employees.filter((e) => e.role === "mechanic").length
  const adminCount = employees.filter((e) => e.role === "admin").length

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!form.name || !form.email || !form.password || !form.role) {
      setError("Please fill in all fields")
      return
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    const result = addEmployee(form.name, form.email, form.password, form.role as "mechanic" | "admin")
    if (result.success) {
      setForm({ name: "", email: "", password: "", role: "" })
      setDialogOpen(false)
      refreshEmployees()
    } else {
      setError(result.error || "Failed to add employee")
    }
  }

  function handleRemove(userId: string) {
    const result = removeEmployee(userId)
    if (result.success) {
      refreshEmployees()
    }
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (user?.role !== "admin") return null

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Employees" description="Manage mechanics and administrators">
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
            <form onSubmit={handleAdd} className="grid gap-4">
              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="emp-name">Full Name</Label>
                <Input
                  id="emp-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe"
                  className="bg-secondary"
                  required
                />
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
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="emp-password">Password</Label>
                <Input
                  id="emp-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 6 characters"
                  className="bg-secondary"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm({ ...form, role: v as "mechanic" | "admin" })}
                >
                  <SelectTrigger className="w-full bg-secondary">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mechanic">Mechanic</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="gap-2">
                <UserPlus className="size-4" />
                Add Employee
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex-1 space-y-6 p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-border bg-card">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                <Shield className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{employees.length}</p>
                <p className="text-sm text-muted-foreground">Total Employees</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-10 items-center justify-center rounded-lg bg-chart-2/10">
                <Settings className="size-5 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{mechanicCount}</p>
                <p className="text-sm text-muted-foreground">Mechanics</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{adminCount}</p>
                <p className="text-sm text-muted-foreground">Administrators</p>
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
                    const config = roleConfig[emp.role as "admin" | "mechanic"]
                    const isSelf = emp.id === user?.id
                    return (
                      <TableRow key={emp.id} className="border-border">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
                              {getInitials(emp.name)}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {emp.name}
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
                                    Are you sure you want to remove <strong>{emp.name}</strong> from the system? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-border bg-secondary text-foreground hover:bg-accent">Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRemove(emp.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
