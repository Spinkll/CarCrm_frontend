"use client"

import { useState } from "react"
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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Clock, Loader2, MessageSquare } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useServiceRequests } from "@/lib/service-requests-context"
import { useOrders } from "@/lib/orders-context"
import { useAppointments } from "@/lib/appointments-context"
import { useNotifications } from "@/lib/notifications-context"
import { toast } from "@/hooks/use-toast"

const statusConfig: Record<string, { label: string; color: string }> = {
  NEW: { label: "Нова", color: "bg-blue-100 text-blue-700 border-blue-200" },
  IN_REVIEW: { label: "В обробці", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  PROCESSED: { label: "Схвалено", color: "bg-green-100 text-green-700 border-green-200" },
  REJECTED: { label: "Відхилено", color: "bg-red-100 text-red-700 border-red-200" },
}

export default function ServiceRequestsPage() {
  const { user } = useAuth()
  const { requests, isLoading, approveRequest, rejectRequest } = useServiceRequests()
  const { refreshOrders } = useOrders()
  const { fetchAppointments } = useAppointments()
  const { fetchNotifications } = useNotifications()

  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Форма для схвалення (призначення дати і часу)
  const [approveForm, setApproveForm] = useState({
    date: "",
    time: "10:00",
    estimatedMin: 60,
  })

  // Фільтруємо: показуємо тільки нові та ті, що в обробці
  const activeRequests = requests.filter(r => r.status === "NEW" || r.status === "IN_REVIEW")

  if (!user || user.role === "CLIENT") return null

  const openApproveModal = (req: any) => {
    setSelectedRequestId(req.id)

    // Предзаповнюємо форму, якщо клієнт обрав час
    if (req.scheduledAt) {
      // req.scheduledAt comes as ISO string e.g., "2026-02-23T14:00:00.000Z"
      // We want to extract exactly the YYYY-MM-DD and HH:MM parts
      const dateStr = req.scheduledAt.substring(0, 10) // "2026-02-23"
      const timeStr = req.scheduledAt.substring(11, 16) // "14:00"

      setApproveForm({
        date: dateStr,
        time: timeStr,
        estimatedMin: 60,
      })
    } else {
      setApproveForm({
        date: "",
        time: "10:00",
        estimatedMin: 60,
      })
    }

    setApproveOpen(true)
  }

  const handleApprove = async () => {
    if (!selectedRequestId || !approveForm.date || !approveForm.time) {
      toast({ title: "Будь ласка, оберіть дату та час", variant: "destructive" })
      return
    }

    setIsSubmitting(true)

    // Збираємо дату і час у формат ISO 8601
    const scheduledAt = new Date(`${approveForm.date}T${approveForm.time}:00`).toISOString()

    const result = await approveRequest(selectedRequestId, {
      scheduledAt,
      estimatedMin: Number(approveForm.estimatedMin),
    })

    setIsSubmitting(false)

    if (result.success) {
      setApproveOpen(false)
      setSelectedRequestId(null)
      setApproveForm({ date: "", time: "10:00", estimatedMin: 60 })
      toast({ title: "Заявку схвалено", description: "Створено замовлення та запис в календарі.", variant: "success" })
      await Promise.all([refreshOrders(), fetchAppointments(), fetchNotifications()])
    } else {
      toast({ title: result.error || "Не вдалося схвалити заявку", variant: "destructive" })
    }
  }

  const openRejectModal = (id: number) => {
    setSelectedRequestId(id)
    setRejectOpen(true)
  }

  const handleReject = async () => {
    if (!selectedRequestId) return

    setIsSubmitting(true)
    await rejectRequest(selectedRequestId)
    setIsSubmitting(false)

    setRejectOpen(false)
    setSelectedRequestId(null)
    toast({ title: "Заявку відхилено", variant: "default" })
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PageHeader
        title="Вхідні заявки"
        description="Обробка нових звернень від клієнтів"
      />

      <div className="flex-1 overflow-auto p-6">
        <Card className="border-border bg-card">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="pl-6 text-muted-foreground">Клієнт</TableHead>
                    <TableHead className="text-muted-foreground">Автомобіль</TableHead>
                    <TableHead className="text-muted-foreground">Причина звернення</TableHead>
                    <TableHead className="text-muted-foreground">Статус</TableHead>
                    <TableHead className="text-muted-foreground">Дата заявки</TableHead>
                    <TableHead className="text-muted-foreground">Бажаний час</TableHead>
                    <TableHead className="pr-6 text-right text-muted-foreground">Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center">
                          <MessageSquare className="mb-2 size-8 opacity-20" />
                          <p>Нових заявок немає</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeRequests.map((req) => {
                      const config = statusConfig[req.status]
                      return (
                        <TableRow key={req.id} className="border-border">
                          <TableCell className="pl-6">
                            <p className="font-medium text-foreground">
                              {req.client?.firstName} {req.client?.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">{req.client?.phone}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-foreground">
                              {req.car?.brand} {req.car?.model}
                            </p>
                            <p className="text-xs text-muted-foreground">{req.car?.plate}</p>
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-sm text-foreground" title={req.reason}>
                            {req.reason}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={config?.color}>
                              {config?.label || req.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(req.createdAt).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {req.scheduledAt ? (
                              <Badge variant="outline" className="font-medium text-primary bg-primary/10 border-primary/20 py-1">
                                {new Date(req.scheduledAt).toLocaleString('uk-UA', {
                                  timeZone: 'UTC', // Обов'язково вказуємо UTC, бо ми зберігали час без зсувів 
                                  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                                })}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-[10px] uppercase tracking-wider opacity-60">Не вказано</span>
                            )}
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                                onClick={() => openApproveModal(req)}
                              >
                                <CheckCircle2 className="mr-1 size-4" />
                                Одобрити
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-muted-foreground hover:bg-red-50 hover:text-red-600"
                                onClick={() => openRejectModal(req.id)}
                              >
                                <XCircle className="size-4" />
                              </Button>
                            </div>
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

      {/* Модалка підтвердження заявки */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Призначити час візиту</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Дата</Label>
                <Input
                  id="date"
                  type="date"
                  value={approveForm.date}
                  onChange={(e) => setApproveForm({ ...approveForm, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]} // Не можна вибрати минулу дату
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="time">Час</Label>
                <Input
                  id="time"
                  type="time"
                  value={approveForm.time}
                  onChange={(e) => setApproveForm({ ...approveForm, time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="duration">Орієнтовна тривалість (хвилин)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="duration"
                  type="number"
                  className="pl-9"
                  value={approveForm.estimatedMin}
                  onChange={(e) => setApproveForm({ ...approveForm, estimatedMin: Number(e.target.value) })}
                  step="15"
                  min="15"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)} disabled={isSubmitting}>
              Скасувати
            </Button>
            <Button onClick={handleApprove} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Підтвердити та записати
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Модалка відхилення заявки */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Відхилити заявку?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Ви впевнені, що хочете відхилити цю заявку? Цю дію не можна скасувати.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={isSubmitting}>
              Скасувати
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Відхилити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}