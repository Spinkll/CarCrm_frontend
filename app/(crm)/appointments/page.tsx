"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Plus, CalendarDays, Clock, User, Car, ChevronDown } from "lucide-react"
import { useCrm } from "@/lib/crm-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Appointment } from "@/lib/data"

export default function AppointmentsPage() {
  const {
    appointments,
    customers,
    vehicles,
    addAppointment,
    updateAppointmentStatus,
  } = useCrm()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    customerId: "",
    vehicleId: "",
    date: "",
    time: "",
    service: "",
    notes: "",
  })

  const customerVehicles = vehicles.filter(
    (v) => v.customerId === form.customerId
  )

  // Group appointments by date
  const grouped = appointments.reduce<Record<string, typeof appointments>>(
    (acc, appt) => {
      if (!acc[appt.date]) acc[appt.date] = []
      acc[appt.date].push(appt)
      return acc
    },
    {}
  )

  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  )

  function handleSubmit() {
    if (!form.customerId || !form.vehicleId || !form.date || !form.time) return
    addAppointment({
      id: `A${String(appointments.length + 1).padStart(3, "0")}`,
      customerId: form.customerId,
      vehicleId: form.vehicleId,
      date: form.date,
      time: form.time,
      service: form.service,
      status: "scheduled",
      notes: form.notes,
    })
    setForm({ customerId: "", vehicleId: "", date: "", time: "", service: "", notes: "" })
    setOpen(false)
  }

  function formatDate(dateStr: string) {
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

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PageHeader title="Appointments" description="Schedule and manage service appointments">
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="size-4" />
          New Appointment
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
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
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((appt) => {
                    const customer = customers.find(
                      (c) => c.id === appt.customerId
                    )
                    const vehicle = vehicles.find(
                      (v) => v.id === appt.vehicleId
                    )
                    return (
                      <Card key={appt.id} className="border-border bg-card">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                                <Clock className="size-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-lg font-semibold text-foreground">
                                  {appt.time}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {appt.id}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <StatusBadge status={appt.status} />
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="size-7">
                                    <ChevronDown className="size-3" />
                                    <span className="sr-only">Update status</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {(["scheduled", "confirmed", "completed", "cancelled"] as Appointment["status"][])
                                    .filter((s) => s !== appt.status)
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
                            </div>
                          </div>

                          <div className="mt-3 rounded-lg bg-secondary/50 p-3">
                            <p className="text-sm font-medium text-foreground">
                              {appt.service}
                            </p>
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <User className="size-3" />
                                {customer?.name}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Car className="size-3" />
                                {vehicle
                                  ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                                  : "N/A"}
                              </div>
                            </div>
                            {appt.notes && (
                              <p className="mt-2 text-xs text-muted-foreground italic">
                                {appt.notes}
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
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CalendarDays className="size-10 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No appointments scheduled
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Appointment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Customer</Label>
              <Select
                value={form.customerId}
                onValueChange={(v) => setForm({ ...form, customerId: v, vehicleId: "" })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Vehicle</Label>
              <Select
                value={form.vehicleId}
                onValueChange={(v) => setForm({ ...form, vehicleId: v })}
                disabled={!form.customerId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={form.customerId ? "Select vehicle" : "Select customer first"} />
                </SelectTrigger>
                <SelectContent>
                  {customerVehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.year} {v.make} {v.model}
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
                placeholder="Oil Change"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="a-notes">Notes</Label>
              <Textarea
                id="a-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any special notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
