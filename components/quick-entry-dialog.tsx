"use client"

import { useState, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Zap, UserCheck } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useOrders } from "@/lib/orders-context"
import { useNotifications } from "@/lib/notifications-context"
import { useTranslation } from "@/hooks/use-translation"
import { useCrm } from "@/lib/crm-context"
import api from "@/lib/api"

interface QuickEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickEntryDialog({ open, onOpenChange }: QuickEntryDialogProps) {
  const { quickCreateOrder, fetchOrders } = useOrders()
  const { fetchNotifications } = useNotifications()
  const { refreshData: refreshCrm } = useCrm()
  const { t } = useTranslation()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clientFound, setClientFound] = useState(false)

  const [form, setForm] = useState({
    clientPhone: "",
    clientName: "",
    carBrand: "",
    carModel: "",
    description: "",
  })

  const resetForm = useCallback(() => {
    setForm({ clientPhone: "", clientName: "", carBrand: "", carModel: "", description: "" })
    setClientFound(false)
  }, [])

  // Пошук клієнта за телефоном при втраті фокусу
  const handlePhoneBlur = useCallback(async () => {
    // Очищаємо номер від зайвих символів для пошуку, але залишаємо +
    const phone = form.clientPhone.replace(/[^\d\+]/g, "")
    
    if (phone.length < 10) {
      setClientFound(false)
      return
    }

    try {
      const { data: customers } = await api.get("/users/customers")
      // Шукаємо або повний збіг, або закінчення номера (останні 10 цифр)
      const found = customers.find((c: any) => {
        const dbPhone = (c.phone || "").replace(/[^\d\+]/g, "")
        return dbPhone === phone || (phone.length >= 10 && dbPhone.endsWith(phone.slice(-10)))
      })

      if (found) {
        setForm(prev => ({
          ...prev,
          clientName: `${found.firstName} ${found.lastName}`.trim(),
        }))
        setClientFound(true)
      } else {
        setClientFound(false)
      }
    } catch {
      setClientFound(false)
    }
  }, [form.clientPhone])

  async function handleSubmit() {
    if (!form.clientPhone.trim() || !form.clientName.trim() || !form.carBrand.trim() || !form.description.trim()) {
      toast({ title: t("fillRequired", "orders"), variant: "destructive" })
      return
    }

    if (!form.clientPhone.startsWith('+')) {
      toast({ 
        title: "Некоректний номер", 
        description: "Номер телефону повинен починатися з +", 
        variant: "destructive" 
      })
      return
    }

    setIsSubmitting(true)

    const cleanPhone = form.clientPhone.replace(/[^\d\+]/g, "")

    const result = await quickCreateOrder({
      clientName: form.clientName.trim(),
      clientPhone: cleanPhone,
      carBrand: form.carBrand.trim(),
      carModel: form.carModel.trim() || undefined,
      description: form.description.trim(),
    })

    setIsSubmitting(false)

    if (result.success) {
      resetForm()
      onOpenChange(false)
      toast({
        title: t("quickSuccess", "orders"),
        description: t("quickSuccessDesc", "orders"),
        variant: "success",
      })
      await fetchOrders(true)
      refreshCrm()
      fetchNotifications()
    } else {
      toast({
        title: result.error || t("quickError", "orders"),
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v) }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="size-5 text-amber-500" />
            {t("quickEntryTitle", "orders")}
          </DialogTitle>
          <DialogDescription>
            {t("quickEntryDesc", "orders")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Телефон */}
          <div className="grid gap-2">
            <Label htmlFor="qe-phone">{t("clientPhone", "orders")}</Label>
            <PhoneInput
              id="qe-phone"
              value={form.clientPhone}
              onValueChange={(val) => { setForm({ ...form, clientPhone: val }); setClientFound(false) }}
              onBlur={handlePhoneBlur}
              autoFocus
            />
          </div>

          {/* Ім'я клієнта */}
          <div className="grid gap-2">
            <Label htmlFor="qe-name" className="flex items-center gap-2">
              {t("clientName", "orders")}
              {clientFound && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-normal">
                  <UserCheck className="size-3.5" />
                  {t("clientFound", "orders")}
                </span>
              )}
            </Label>
            <Input
              id="qe-name"
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              placeholder={t("clientNamePlaceholder", "orders")}
            />
          </div>

          {/* Марка + Модель */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="qe-brand">{t("carBrand", "orders")}</Label>
              <Input
                id="qe-brand"
                value={form.carBrand}
                onChange={(e) => setForm({ ...form, carBrand: e.target.value })}
                placeholder={t("carBrandPlaceholder", "orders")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="qe-model">{t("carModel", "orders")}</Label>
              <Input
                id="qe-model"
                value={form.carModel}
                onChange={(e) => setForm({ ...form, carModel: e.target.value })}
                placeholder={t("carModelPlaceholder", "orders")}
              />
            </div>
          </div>

          {/* Опис */}
          <div className="grid gap-2">
            <Label htmlFor="qe-desc">{t("quickDescription", "orders")}</Label>
            <Textarea
              id="qe-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={t("quickDescriptionPlaceholder", "orders")}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {t("cancel", "common")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
            {isSubmitting ? t("processing", "orders") : t("quickSubmit", "orders")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
