"use client"

import { useState, useMemo } from "react"
import { toast } from "@/hooks/use-toast"
import { useNotifications } from "@/lib/notifications-context"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/status-badge"
import { CalendarDays, Clock, User, Car, Loader2, Wrench, AlertCircle, History, CalendarClock } from "lucide-react"
import { useAppointments } from "@/lib/appointments-context"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/hooks/use-translation"


export default function AppointmentsPage() {
  const { appointments, isLoading, fetchAppointments, reschedule } = useAppointments()
  const { user } = useAuth()
  const { t, lang } = useTranslation()

  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [rescheduleTarget, setRescheduleTarget] = useState<{ id: number; scheduledAt: string; estimatedMin: number | null } | null>(null)
  const [rescheduleForm, setRescheduleForm] = useState({ date: "", time: "", estimatedMin: "" })
  const [tab, setTab] = useState<"active" | "history">("active")

  const role = user?.role?.toLowerCase() || "client"
  const canReschedule = role === "admin" || role === "manager"

  const activeStatuses = ["SCHEDULED", "CONFIRMED", "ARRIVED"]
  const historyStatuses = ["COMPLETED", "NO_SHOW", "CANCELLED"]

  const activeCounts = useMemo(() => ({
    active: appointments.filter(a => activeStatuses.includes(a.status)).length,
    history: appointments.filter(a => historyStatuses.includes(a.status)).length,
  }), [appointments])

  // Фільтруємо записи за обраною вкладкою
  const filteredAppointments = useMemo(() => {
    const statuses = tab === "active" ? activeStatuses : historyStatuses
    return appointments.filter(a => statuses.includes(a.status))
  }, [appointments, tab])

  // Групуємо записи за датами
  const grouped = filteredAppointments.reduce<Record<string, typeof appointments>>((acc, appt) => {
    const dateKey = appt.scheduledAt ? appt.scheduledAt.split("T")[0] : "unknown"
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(appt)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort(
    (a, b) => tab === "history"
      ? new Date(b).getTime() - new Date(a).getTime()
      : new Date(a).getTime() - new Date(b).getTime()
  )

  function formatDate(dateStr: string) {
    if (dateStr === "unknown") return t("unknownDate", "calendarPage")
    const date = new Date(dateStr + "T00:00:00")
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.getTime() === today.getTime()) return t("today", "calendarPage")
    if (date.getTime() === tomorrow.getTime()) return t("tomorrow", "calendarPage")
    
    return date.toLocaleDateString(lang === "uk" ? "uk-UA" : "en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
  }

  function formatTime(isoStr: string) {
    const d = new Date(isoStr)
    return d.toLocaleTimeString(lang === "uk" ? "uk-UA" : "en-US", { hour: "2-digit", minute: "2-digit" })
  }



  function openReschedule(appt: typeof appointments[0]) {
    const d = new Date(appt.scheduledAt)
    setRescheduleTarget({ id: appt.id, scheduledAt: appt.scheduledAt, estimatedMin: appt.estimatedMin })
    setRescheduleForm({
      date: d.toISOString().split("T")[0],
      time: d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit", hour12: false }),
      estimatedMin: appt.estimatedMin?.toString() || "",
    })
    setRescheduleOpen(true)
  }

  const { fetchNotifications } = useNotifications()

  async function handleReschedule() {
    if (!rescheduleTarget || !rescheduleForm.date || !rescheduleForm.time) return
    const scheduledAt = `${rescheduleForm.date}T${rescheduleForm.time}:00`
    const estimatedMin = rescheduleForm.estimatedMin ? Number(rescheduleForm.estimatedMin) : undefined
    const result = await reschedule(rescheduleTarget.id, scheduledAt, estimatedMin)
    if (result.success) {
      setRescheduleOpen(false)
      toast({ title: t("rescheduleSuccess", "calendarPage"), variant: "success" })
      fetchNotifications()
    } else {
      toast({ title: t("rescheduleError", "calendarPage"), description: result.error || t("error", "common"), variant: "destructive" })
    }
  }

  const descriptions: Record<string, string> = {
    admin: t("descriptionStaff", "calendarPage"),
    manager: t("descriptionStaff", "calendarPage"),
    mechanic: t("descriptionMechanic", "calendarPage"),
    client: t("descriptionClient", "calendarPage"),
  }

  const pluralizeAppointments = (count: number) => {
    if (lang !== "uk") {
      return count === 1 ? t("record_1", "calendarPage") : t("record_2", "calendarPage")
    }
    
    const lastDigit = count % 10
    const lastTwoDigits = count % 100

    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return t("record_5", "calendarPage")
    if (lastDigit === 1) return t("record_1", "calendarPage")
    if (lastDigit >= 2 && lastDigit <= 4) return t("record_2", "calendarPage")
    return t("record_5", "calendarPage")
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <PageHeader
        title={role === "client" ? t("myAppointments", "calendarPage") : t("serviceAppointments", "calendarPage")}
        description={descriptions[role] || ""}
      />

      <div className="min-h-0 flex-1 overflow-auto p-6">
        <div className="mb-6">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "active" | "history")} className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="active">
                <CalendarDays className="mr-1.5 size-3.5" />
                {t("active", "calendarPage")}
                <span className="ml-1.5 text-xs text-muted-foreground">({activeCounts.active})</span>
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="mr-1.5 size-3.5" />
                {t("history", "calendarPage")}
                <span className="ml-1.5 text-xs text-muted-foreground">({activeCounts.history})</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

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
                    {grouped[date].length} {pluralizeAppointments(grouped[date].length)}
                  </span>
                </h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {grouped[date]
                    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                    .map((appt) => {
                      const car = appt.order?.car
                      const owner = car?.user
                      const mechanic = appt.order?.mechanic

                      return (
                        <Card key={appt.id} className={`border-border bg-card hover:shadow-sm transition-shadow flex flex-col${tab === "history" ? " opacity-70" : ""}`}>
                          <CardContent className="p-4 flex flex-col h-full">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                                  <Clock className="size-5 text-primary" />
                                </div>
                                <div>
                                  <p className="text-lg font-bold text-foreground tracking-tight">
                                    {formatTime(appt.scheduledAt)}
                                  </p>
                                  {appt.estimatedMin && (
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                      ~{appt.estimatedMin} {t("min", "calendarPage")}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <StatusBadge status={appt.status} />
                                {canReschedule && tab === "active" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7"
                                    title={t("reschedule", "calendarPage")}
                                    onClick={() => openReschedule(appt)}
                                  >
                                    <CalendarClock className="size-3.5" />
                                    <span className="sr-only">{t("reschedule", "calendarPage")}</span>
                                  </Button>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 rounded-lg bg-secondary/30 p-3 flex-1 flex flex-col">

                              {/* --- БЛОК ІЗ ПРОБЛЕМОЮ --- */}
                              <div className="mb-3">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <AlertCircle className="size-3.5 text-muted-foreground" />
                                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                                    {t("problemDescription", "calendarPage")}
                                  </p>
                                </div>
                                <p className="text-sm font-medium text-foreground whitespace-pre-wrap line-clamp-3" title={appt.order?.description}>
                                  {(appt.order?.description || t("noDescription", "calendarPage")).replace(/^Бажана дата:\s*\S+\s*/i, "").trim() || t("noDescription", "calendarPage")}
                                </p>
                              </div>

                              {/* --- БЛОК ІЗ ДЕТАЛЯМИ --- */}
                              <div className="mt-auto pt-3 space-y-2 border-t border-border/50">
                                {role !== "client" && owner && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <User className="size-3.5 shrink-0" />
                                    <span className="truncate">
                                      {owner.firstName} {owner.lastName}
                                    </span>
                                  </div>
                                )}
                                {car && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Car className="size-3.5 shrink-0" />
                                    <span className="truncate font-medium text-foreground/80">
                                      {car.brand} {car.model} • {car.plate || t("noNumbers", "orders")}
                                    </span>
                                  </div>
                                )}
                                {mechanic && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Wrench className="size-3.5 shrink-0" />
                                    <span className="truncate">
                                      {t("mechanic", "calendarPage")}: {mechanic.firstName} {mechanic.lastName}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {appt.note && (
                                <p className="mt-3 border-t border-border pt-2 text-xs text-muted-foreground italic">
                                  &ldquo;{appt.note}&rdquo;
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
                  {tab === "history" ? (
                    <History className="size-12 text-muted-foreground opacity-20" />
                  ) : (
                    <CalendarDays className="size-12 text-muted-foreground opacity-20" />
                  )}
                  <p className="mt-4 text-sm font-medium text-muted-foreground">
                    {tab === "history"
                      ? t("noAppointmentsHistory", "calendarPage")
                      : role === "client" ? t("noPlannedAppointments", "calendarPage") : t("noActiveAppointments", "calendarPage")}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Діалог перенесення запису */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("rescheduleTitle", "calendarPage")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="r-date">{t("dateLabel", "calendarPage")}</Label>
                <Input
                  id="r-date"
                  type="date"
                  value={rescheduleForm.date}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="r-time">{t("timeLabel", "calendarPage")}</Label>
                <Input
                  id="r-time"
                  type="time"
                  value={rescheduleForm.time}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="r-est">{t("estTimeLabel", "calendarPage")}</Label>
              <Input
                id="r-est"
                type="number"
                min={0}
                value={rescheduleForm.estimatedMin}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, estimatedMin: e.target.value })}
                placeholder={t("placeholderEst", "calendarPage")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleOpen(false)}>
              {t("cancel", "common")}
            </Button>
            <Button onClick={handleReschedule}>
              {t("reschedule", "calendarPage")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}