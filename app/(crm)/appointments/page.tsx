"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { StatusBadge } from "@/components/status-badge"
import { Plus, CalendarDays, Clock, User, Car, ChevronDown, Loader2 } from "lucide-react"
import { useCrm } from "@/lib/crm-context"
import { useAuth } from "@/lib/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function AppointmentsPage() {
  const {
    filteredAppointments,
    customers,
    vehicles,
    filteredVehicles,
    addAppointment, // Має бути асинхронною функцією в контексті
    updateAppointmentStatus,
    isLoading,
  } = useCrm()
  const { user } = useAuth()
  
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    userId: "", 
    carId: "",  
    date: "",
    time: "",
    service: "",
    notes: "",
  })

  // Визначаємо ролі та права
  const role = user?.role?.toLowerCase() || "client"
  const canCreateAppointments = role === "admin" || role === "manager" || role === "client"
  const canUpdateStatus = role === "admin" || role === "manager" || role === "mechanic"

  // Фільтруємо машини для дропдауну форми
  const customerVehicles = role === "client"
    ? filteredVehicles
    : vehicles.filter((v) => Number(v.userId) === Number(form.userId))

  // Групуємо записи за датами
  const grouped = filteredAppointments.reduce<Record<string, typeof filteredAppointments>>(
    (acc, appt) => {
      const dateKey = appt.date || "Unknown Date"
      if (!acc[dateKey]) acc[dateKey] = []
      acc[dateKey].push(appt)
      return acc
    },
    {}
  )

  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  )

  async function handleSubmit() {
    const currentUserId = role === "client" ? user?.id : Number(form.userId)
    if (!currentUserId || !form.carId || !form.date || !form.time) return

    setIsSubmitting(true)
    
    // Формуємо payload для бекенду (без фейкових ID, БД згенерує сама)
    const payload = {
      carId: Number(form.carId),
      date: form.date,
      time: form.time,
      service: form.service,
      notes: form.notes,
      status: "scheduled",
    }

    try {
      await addAppointment(payload)
      setForm({ userId: "", carId: "", date: "", time: "", service: "", notes: "" })
      setOpen(false)
    } catch (error) {
      console.error("Failed to add appointment", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  function formatDate(dateStr: string) {
    if (dateStr === "Unknown Date") return dateStr
    const date = new Date(dateStr + "T00:00:00")
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.getTime() === today.getTime()) return "Today"
    if (date.getTime() === tomorrow.getTime()) return "Tomorrow"
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    })
  }

  const descriptions: Record<string, string> = {
    admin: "Schedule and manage service appointments",
    manager: "Schedule and manage service appointments",
    mechanic: "Your assigned appointments",
    client: "View and request service appointments",
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PageHeader title={role === "client" ? "My Appointments" : "Appointments"} description={descriptions[role] || ""}>
        {canCreateAppointments && (
          <Button onClick={() => setOpen(true)} className="gap-2 shadow-sm">
            <Plus className="size-4" />
            {role === "client" ? "Request Appointment" : "New Appointment"}
          </Button>
        )}
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date}>
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                  {formatDate(date)}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {grouped[date].length} appointment{grouped[date].length !== 1 ? "s" : ""}
                  </span>
                </h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {grouped[date]
                    .sort((a, b) => (a.time || "00:00").localeCompare(b.time || "00:00"))
                    .map((appt) => {
                      const vehicle = vehicles.find((v) => v.id === appt.carId)
                      const customer = customers.find((c) => c.id === vehicle?.userId)
                      
                      return (
                        <Card key={appt.id} className="border-border bg-card hover:shadow-sm transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                                  <Clock className="size-5 text-primary" />
                                </div>
                                <div>
                                  <p className="text-lg font-bold text-foreground tracking-tight">
                                    {appt.time}
                                  </p>
                                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                    ID: {appt.id}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <StatusBadge status={appt.status} />
                                {canUpdateStatus && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="size-7">
                                        <ChevronDown className="size-3" />
                                        <span className="sr-only">Update status</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {["scheduled", "confirmed", "completed", "cancelled"]
                                        .filter((s) => s.toLowerCase() !== appt.status?.toLowerCase())
                                        .map((status) => (
                                          <DropdownMenuItem
                                            key={status}
                                            onClick={() => updateAppointmentStatus(appt.id, status)}
                                            className="capitalize"
                                          >
                                            {status}
                                          </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 rounded-lg bg-secondary/30 p-3">
                              <p className="text-sm font-semibold text-foreground">
                                {appt.service}
                              </p>
                              <div className="mt-2 space-y-1.5">
                                {role !== "client" && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <User className="size-3.5 shrink-0" />
                                    <span className="truncate">
                                      {customer ? `${customer.firstName} ${customer.lastName}` : "Unknown Client"}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Car className="size-3.5 shrink-0" />
                                  <span className="truncate">
                                    {vehicle
                                      ? `${vehicle.year} ${vehicle.brand} ${vehicle.model}`
                                      : "Unknown Vehicle"}
                                  </span>
                                </div>
                              </div>
                              {appt.notes && (
                                <p className="mt-3 border-t border-border pt-2 text-xs text-muted-foreground italic">
                                  "{appt.notes}"
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                </div>
              </div>
            ))}
            {sortedDates.length === 0 && (
              <Card className="border-border bg-card">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <CalendarDays className="size-12 text-muted-foreground opacity-20" />
                  <p className="mt-4 text-sm font-medium text-muted-foreground">
                    No appointments {role === "client" ? "scheduled for you" : "scheduled"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {canCreateAppointments && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{role === "client" ? "Request Appointment" : "Schedule Appointment"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {(role === "admin" || role === "manager") && (
                <div className="grid gap-2">
                  <Label>Customer</Label>
                  <Select
                    value={form.userId}
                    onValueChange={(v) => setForm({ ...form, userId: v, carId: "" })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.firstName} {c.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid gap-2">
                <Label>Vehicle</Label>
                <Select
                  value={form.carId}
                  onValueChange={(v) => setForm({ ...form, carId: v })}
                  disabled={(role === "admin" || role === "manager") && !form.userId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={(role === "admin" || role === "manager") && !form.userId ? "Select customer first" : "Select vehicle"} />
                  </SelectTrigger>
                  <SelectContent>
                    {customerVehicles.map((v) => (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {v.year} {v.brand} {v.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="a-date">Date</Label>
                  <Input
                    id="a-date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="a-time">Time</Label>
                  <Input
                    id="a-time"
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="a-service">Service</Label>
                <Input
                  id="a-service"
                  value={form.service}
                  onChange={(e) => setForm({ ...form, service: e.target.value })}
                  placeholder="e.g. Oil Change, Diagnostics"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="a-notes">Notes (Optional)</Label>
                <Textarea
                  id="a-notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any specific issues or requests?"
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                {role === "client" ? "Request" : "Schedule"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}