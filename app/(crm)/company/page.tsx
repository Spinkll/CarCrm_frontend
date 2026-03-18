
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BadgeCheck,
  Building2,
  Clock3,
  Globe,
  Landmark,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  Save,
  ShieldCheck,
  TimerReset,
} from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/ui/phone-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import api from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useCompanySettings } from "@/lib/company-settings-context"
import {
  COMPANY_SETTINGS_ENDPOINT,
  type CompanySettings,
  defaultCompanySettings,
  normalizeCompanySettings,
  serializeCompanySettings,
} from "@/lib/company-settings"

const generalFields: Array<keyof CompanySettings> = [
  "companyName",
  "serviceProfile",
  "workSchedule",
  "workStart",
  "workEnd",
  "slotDuration",
]

const contactFields: Array<keyof CompanySettings> = [
  "addressLine",
  "city",
  "phone",
  "email",
  "contactPerson",
]

const requisitesFields: Array<keyof CompanySettings> = [
  "companyType",
  "edrpou",
  "iban",
  "bankName",
  "recipientName",
]

const scheduleLabels: Record<string, string> = {
  "mon-fri": "Пн-Пт",
  "mon-sat": "Пн-Сб",
  daily: "Щодня",
  custom: "Індивідуально",
}

export default function CompanyPage() {
  const { user } = useAuth()
  const { applyCompanySettings } = useCompanySettings()
  const router = useRouter()

  const [settings, setSettings] = useState<CompanySettings>(defaultCompanySettings)
  const [savedSettings, setSavedSettings] = useState<CompanySettings>(defaultCompanySettings)
  const [activeTab, setActiveTab] = useState("general")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState("")

  useEffect(() => {
    if (user && user.role !== "ADMIN" && user.role !== "MANAGER") {
      router.replace("/")
    }
  }, [router, user])

  const fetchCompanySettings = useCallback(async () => {
    if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) return

    try {
      setIsLoading(true)
      setLoadError("")

      const { data } = await api.get(COMPANY_SETTINGS_ENDPOINT)
      const normalizedSettings = normalizeCompanySettings(data)

      setSettings(normalizedSettings)
      setSavedSettings(normalizedSettings)
    } catch (error: any) {
      if (error.response?.status === 404) {
        setSettings(defaultCompanySettings)
        setSavedSettings(defaultCompanySettings)
      } else {
        console.error("Failed to fetch company settings", error)
        const msg = error.response?.data?.message || "Не вдалося завантажити налаштування компанії"
        setLoadError(Array.isArray(msg) ? msg[0] : msg)
      }
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchCompanySettings()
  }, [fetchCompanySettings])

  const isDirty = JSON.stringify(settings) !== JSON.stringify(savedSettings)

  const completion = useMemo(() => {
    const countCompleted = (fields: Array<keyof CompanySettings>) =>
      fields.filter((field) => String(settings[field]).trim().length > 0).length

    return {
      general: Math.round((countCompleted(generalFields) / generalFields.length) * 100),
      contacts: Math.round((countCompleted(contactFields) / contactFields.length) * 100),
      requisites: Math.round((countCompleted(requisitesFields) / requisitesFields.length) * 100),
    }
  }, [settings])

  const totalCompletion = Math.round((completion.general + completion.contacts + completion.requisites) / 3)

  const handleFieldChange = <K extends keyof CompanySettings>(field: K, value: CompanySettings[K]) => {
    setSettings((current) => ({ ...current, [field]: value }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      const { data } = await api.patch(COMPANY_SETTINGS_ENDPOINT, serializeCompanySettings(settings))
      const normalizedSettings = normalizeCompanySettings(data ?? settings)

      setSettings(normalizedSettings)
      setSavedSettings(normalizedSettings)
      applyCompanySettings(normalizedSettings)
      toast({ title: "Налаштування компанії збережено", variant: "success" })
    } catch (error: any) {
      console.error("Failed to save company settings", error)
      const msg = error.response?.data?.message || "Не вдалося зберегти налаштування компанії"
      toast({ title: Array.isArray(msg) ? msg[0] : msg, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setSettings(savedSettings)
    toast({ title: "Незбережені зміни скасовано" })
  }

  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) return null

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PageHeader
        title="Налаштування компанії"
        description="Профіль СТО, контакти та реквізити для клієнтів, документів і команди"
      >
        <Badge
          variant="outline"
          className={isDirty ? "border-warning/40 bg-warning/10 text-amber-600 dark:text-amber-400" : "border-success/30 bg-success/10 text-success"}
        >
          {isDirty ? "Є незбережені зміни" : "Усе збережено"}
        </Badge>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
              <Loader2 className="size-4 animate-spin" />
              Завантаження налаштувань компанії...
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {loadError && (
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Не вдалося завантажити профіль компанії</p>
                    <p className="text-sm text-muted-foreground">{loadError}</p>
                  </div>
                  <Button variant="outline" onClick={fetchCompanySettings}>
                    Спробувати ще раз
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
              <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary/12 via-card to-card">
                <CardContent className="relative p-6">
                  <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-primary/10 blur-3xl" />
                  <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                          <Building2 className="size-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Профіль СТО</p>
                          <h2 className="text-2xl font-semibold text-foreground">
                            {settings.shortName || settings.companyName || "Назва компанії"}
                          </h2>
                        </div>
                      </div>
                      <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                        Сторінка збирає ключові дані про компанію в одному місці: графік, точки контакту, реквізити та сервісні примітки.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="gap-1 rounded-full px-3 py-1">
                          <Clock3 className="size-3.5" />
                          {scheduleLabels[settings.workSchedule] || "Графік"} {settings.workStart}-{settings.workEnd}
                        </Badge>
                        <Badge variant="secondary" className="gap-1 rounded-full px-3 py-1">
                          <ShieldCheck className="size-3.5" />
                          {settings.urgentOrdersEnabled ? "Термінові заявки увімкнено" : "Без термінових заявок"}
                        </Badge>
                        <Badge variant="secondary" className="gap-1 rounded-full px-3 py-1">
                          <Landmark className="size-3.5" />
                          {settings.vatPayer ? "Платник ПДВ" : "Без ПДВ"}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid min-w-[220px] gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                      <StatusCard icon={BadgeCheck} label="Профіль" value={`${completion.general}%`} hint="Основні дані" />
                      <StatusCard icon={Phone} label="Контакти" value={`${completion.contacts}%`} hint="Канали зв'язку" />
                      <StatusCard icon={ReceiptText} label="Реквізити" value={`${completion.requisites}%`} hint="Документи й оплати" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-base">Стан профілю компанії</CardTitle>
                  <CardDescription>Швидка оцінка того, наскільки сторінка готова для щоденної роботи.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Заповнення профілю</span>
                      <span className="font-semibold text-foreground">{totalCompletion}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary">
                      <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${totalCompletion}%` }} />
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm">
                    <InfoRow icon={MapPin} label="Адреса" value={settings.addressLine || "Ще не вказано"} />
                    <InfoRow icon={Mail} label="Email" value={settings.email || "Ще не вказано"} />
                    <InfoRow icon={Landmark} label="IBAN" value={settings.iban || "Ще не вказано"} />
                    <InfoRow icon={Globe} label="Сайт" value={settings.website || "Не додано"} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
              <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-xl bg-muted/70 p-1">
                <TabsTrigger value="general" className="min-w-[140px] flex-none rounded-lg px-4 py-2">
                  Основне
                </TabsTrigger>
                <TabsTrigger value="contacts" className="min-w-[140px] flex-none rounded-lg px-4 py-2">
                  Контакти
                </TabsTrigger>
                <TabsTrigger value="requisites" className="min-w-[140px] flex-none rounded-lg px-4 py-2">
                  Реквізити
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general">
                <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
                  <Card>
                    <CardHeader>
                      <CardTitle>Основні параметри</CardTitle>
                      <CardDescription>Назва компанії, графік роботи та базова сервісна конфігурація.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-5">
                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="companyName">Назва компанії</Label>
                          <Input
                            id="companyName"
                            value={settings.companyName}
                            onChange={(event) => handleFieldChange("companyName", event.target.value)}
                            placeholder="Наприклад, Auto Point Service"
                            className="bg-secondary"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="shortName">Коротка назва</Label>
                          <Input
                            id="shortName"
                            value={settings.shortName}
                            onChange={(event) => handleFieldChange("shortName", event.target.value)}
                            placeholder="Для бейджів і коротких підписів"
                            className="bg-secondary"
                          />
                        </div>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label>Профіль СТО</Label>
                          <Select value={settings.serviceProfile} onValueChange={(value) => handleFieldChange("serviceProfile", value)}>
                            <SelectTrigger className="w-full bg-secondary">
                              <SelectValue placeholder="Оберіть профіль" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="full-service">Повний цикл обслуговування</SelectItem>
                              <SelectItem value="diagnostics">Діагностика та електрика</SelectItem>
                              <SelectItem value="bodywork">Кузовний ремонт</SelectItem>
                              <SelectItem value="tires">Шиномонтаж та сезонні роботи</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label>Тип графіка</Label>
                          <Select value={settings.workSchedule} onValueChange={(value) => handleFieldChange("workSchedule", value)}>
                            <SelectTrigger className="w-full bg-secondary">
                              <SelectValue placeholder="Оберіть графік" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mon-fri">Понеділок - П'ятниця</SelectItem>
                              <SelectItem value="mon-sat">Понеділок - Субота</SelectItem>
                              <SelectItem value="daily">Щодня</SelectItem>
                              <SelectItem value="custom">Індивідуальний графік</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid gap-5 md:grid-cols-3">
                        <div className="grid gap-2">
                          <Label htmlFor="workStart">Початок роботи</Label>
                          <Input
                            id="workStart"
                            type="time"
                            value={settings.workStart}
                            onChange={(event) => handleFieldChange("workStart", event.target.value)}
                            className="bg-secondary"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="workEnd">Завершення роботи</Label>
                          <Input
                            id="workEnd"
                            type="time"
                            value={settings.workEnd}
                            onChange={(event) => handleFieldChange("workEnd", event.target.value)}
                            className="bg-secondary"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Тривалість слоту</Label>
                          <Select value={settings.slotDuration} onValueChange={(value) => handleFieldChange("slotDuration", value)}>
                            <SelectTrigger className="w-full bg-secondary">
                              <SelectValue placeholder="Оберіть тривалість" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="30">30 хв</SelectItem>
                              <SelectItem value="45">45 хв</SelectItem>
                              <SelectItem value="60">60 хв</SelectItem>
                              <SelectItem value="90">90 хв</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="rounded-xl border border-border bg-secondary/40 p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">Обідня перерва</p>
                            <p className="text-sm text-muted-foreground">Можна вказати часовий інтервал, коли запис не приймається.</p>
                          </div>
                          <Switch checked={settings.lunchEnabled} onCheckedChange={(checked) => handleFieldChange("lunchEnabled", checked)} />
                        </div>

                        {settings.lunchEnabled && (
                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                              <Label htmlFor="lunchStart">Початок перерви</Label>
                              <Input
                                id="lunchStart"
                                type="time"
                                value={settings.lunchStart}
                                onChange={(event) => handleFieldChange("lunchStart", event.target.value)}
                                className="bg-card"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="lunchEnd">Кінець перерви</Label>
                              <Input
                                id="lunchEnd"
                                type="time"
                                value={settings.lunchEnd}
                                onChange={(event) => handleFieldChange("lunchEnd", event.target.value)}
                                className="bg-card"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="rounded-xl border border-border bg-secondary/40 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">Термінові заявки</p>
                            <p className="text-sm text-muted-foreground">Показувати команді, що сервіс може приймати швидкі візити поза основним потоком.</p>
                          </div>
                          <Switch checked={settings.urgentOrdersEnabled} onCheckedChange={(checked) => handleFieldChange("urgentOrdersEnabled", checked)} />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="publicDescription">Короткий опис компанії</Label>
                        <Textarea
                          id="publicDescription"
                          value={settings.publicDescription}
                          onChange={(event) => handleFieldChange("publicDescription", event.target.value)}
                          placeholder="Коротко опишіть спеціалізацію та сильні сторони СТО"
                          className="min-h-28 bg-secondary"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Підказки для вкладки</CardTitle>
                      <CardDescription>Що має бути заповнено в першу чергу.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      <TipCard title="Назва та короткий бренд" description="Повна назва добре працює в документах, а коротка зручна для таблиць, бейджів і карток." />
                      <TipCard title="Графік і слот запису" description="Ці поля напряму впливають на сприйняття доступності сервісу та майбутню інтеграцію з календарем." />
                      <TipCard title="Опис компанії" description="Короткий опис можна далі використати на публічній сторінці, у PDF та внутрішніх шаблонах." />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="contacts">
                <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
                  <Card>
                    <CardHeader>
                      <CardTitle>Контакти та локація</CardTitle>
                      <CardDescription>Дані, за якими клієнт знайде сервіс і швидко зв'яжеться з адміністратором.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-5">
                      <div className="grid gap-2">
                        <Label htmlFor="addressLine">Адреса</Label>
                        <Input
                          id="addressLine"
                          value={settings.addressLine}
                          onChange={(event) => handleFieldChange("addressLine", event.target.value)}
                          placeholder="Вулиця, будинок, офіс або бокс"
                          className="bg-secondary"
                        />
                      </div>

                      <div className="grid gap-5 md:grid-cols-3">
                        <div className="grid gap-2">
                          <Label htmlFor="city">Місто</Label>
                          <Input
                            id="city"
                            value={settings.city}
                            onChange={(event) => handleFieldChange("city", event.target.value)}
                            placeholder="Київ"
                            className="bg-secondary"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="region">Область</Label>
                          <Input
                            id="region"
                            value={settings.region}
                            onChange={(event) => handleFieldChange("region", event.target.value)}
                            placeholder="Київська"
                            className="bg-secondary"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="postalCode">Індекс</Label>
                          <Input
                            id="postalCode"
                            value={settings.postalCode}
                            onChange={(event) => handleFieldChange("postalCode", event.target.value)}
                            placeholder="01001"
                            className="bg-secondary"
                          />
                        </div>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="phone">Основний телефон</Label>
                          <PhoneInput id="phone" value={settings.phone} onValueChange={(value) => handleFieldChange("phone", value)} />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="additionalPhone">Додатковий телефон</Label>
                          <PhoneInput
                            id="additionalPhone"
                            value={settings.additionalPhone}
                            onValueChange={(value) => handleFieldChange("additionalPhone", value)}
                          />
                        </div>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={settings.email}
                            onChange={(event) => handleFieldChange("email", event.target.value)}
                            placeholder="service@company.ua"
                            className="bg-secondary"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="website">Сайт</Label>
                          <Input
                            id="website"
                            value={settings.website}
                            onChange={(event) => handleFieldChange("website", event.target.value)}
                            placeholder="https://example.ua"
                            className="bg-secondary"
                          />
                        </div>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="mapsLink">Google Maps / карта</Label>
                          <Input
                            id="mapsLink"
                            value={settings.mapsLink}
                            onChange={(event) => handleFieldChange("mapsLink", event.target.value)}
                            placeholder="Посилання на маршрут або мітку"
                            className="bg-secondary"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="contactPerson">Контактна особа</Label>
                          <Input
                            id="contactPerson"
                            value={settings.contactPerson}
                            onChange={(event) => handleFieldChange("contactPerson", event.target.value)}
                            placeholder="Ім'я адміністратора або менеджера"
                            className="bg-secondary"
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="clientNote">Примітка для клієнтів</Label>
                        <Textarea
                          id="clientNote"
                          value={settings.clientNote}
                          onChange={(event) => handleFieldChange("clientNote", event.target.value)}
                          placeholder="Що клієнту варто знати перед приїздом"
                          className="min-h-28 bg-secondary"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Поради по контактах</CardTitle>
                      <CardDescription>Маленькі деталі, які додають довіри.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      <TipCard title="Основний канал зв'язку" description="Телефон і email краще заповнити обов'язково, бо саме ці поля найчастіше потрапляють у заявки та документи." />
                      <TipCard title="Точка на мапі" description="Посилання на карту корисне для мобільних користувачів і може стати окремою кнопкою в майбутніх клієнтських сценаріях." />
                      <TipCard title="Примітка перед візитом" description="Тут зручно лишати інструкції: де паркуватися, як заїхати на територію або що взяти з собою." />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="requisites">
                <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
                  <Card>
                    <CardHeader>
                      <CardTitle>Реквізити та документи</CardTitle>
                      <CardDescription>Фінансові дані для рахунків, договорів та безпечної роботи з оплатами.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-5">
                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label>Форма компанії</Label>
                          <Select value={settings.companyType} onValueChange={(value) => handleFieldChange("companyType", value)}>
                            <SelectTrigger className="w-full bg-secondary">
                              <SelectValue placeholder="Оберіть форму компанії" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ФОП">ФОП</SelectItem>
                              <SelectItem value="ТОВ">ТОВ</SelectItem>
                              <SelectItem value="ПП">ПП</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">Платник ПДВ</p>
                            <p className="text-sm text-muted-foreground">Використовуйте перемикач, щоб зберігати податковий статус.</p>
                          </div>
                          <Switch checked={settings.vatPayer} onCheckedChange={(checked) => handleFieldChange("vatPayer", checked)} />
                        </div>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="edrpou">ЄДРПОУ</Label>
                          <Input
                            id="edrpou"
                            value={settings.edrpou}
                            onChange={(event) => handleFieldChange("edrpou", event.target.value)}
                            placeholder="Код компанії"
                            className="bg-secondary"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="ipn">ІПН</Label>
                          <Input
                            id="ipn"
                            value={settings.ipn}
                            onChange={(event) => handleFieldChange("ipn", event.target.value)}
                            placeholder="Податковий номер"
                            className="bg-secondary"
                          />
                        </div>
                      </div>

                      <div className="grid gap-5">
                        <div className="grid gap-2">
                          <Label htmlFor="iban">IBAN</Label>
                          <Input
                            id="iban"
                            value={settings.iban}
                            onChange={(event) => handleFieldChange("iban", event.target.value)}
                            placeholder="UA00 0000 0000 0000 0000 0000 000"
                            className="bg-secondary"
                          />
                        </div>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="bankName">Банк</Label>
                          <Input
                            id="bankName"
                            value={settings.bankName}
                            onChange={(event) => handleFieldChange("bankName", event.target.value)}
                            placeholder="Назва банку"
                            className="bg-secondary"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="recipientName">Отримувач</Label>
                          <Input
                            id="recipientName"
                            value={settings.recipientName}
                            onChange={(event) => handleFieldChange("recipientName", event.target.value)}
                            placeholder="Повна назва отримувача"
                            className="bg-secondary"
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="legalAddress">Юридична адреса</Label>
                        <Input
                          id="legalAddress"
                          value={settings.legalAddress}
                          onChange={(event) => handleFieldChange("legalAddress", event.target.value)}
                          placeholder="Для рахунків, актів та договорів"
                          className="bg-secondary"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="invoiceNote">Примітка до рахунків / оплат</Label>
                        <Textarea
                          id="invoiceNote"
                          value={settings.invoiceNote}
                          onChange={(event) => handleFieldChange("invoiceNote", event.target.value)}
                          placeholder="Наприклад, коли надсилати рахунок або які умови оплати вказувати"
                          className="min-h-28 bg-secondary"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Що ще варто додати</CardTitle>
                      <CardDescription>Щоб реквізити були готові не лише “для галочки”.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      <TipCard title="IBAN + отримувач" description="Ця пара полів найчастіше використовується в рахунках, тому її варто заповнювати разом." />
                      <TipCard title="ЄДРПОУ та ІПН" description="Якщо працюєте і з фізособами, і з корпоративними клієнтами, ці реквізити краще тримати під рукою в системі." />
                      <TipCard title="Примітка до оплат" description="Сюди можна винести короткі правила: передплата, строки дії рахунку або коментар для бухгалтера." />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            <Card>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Збереження налаштувань</p>
                  <p className="text-sm text-muted-foreground">
                    Зміни зберігаються в CRM і будуть доступні команді після оновлення профілю.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="outline" onClick={handleReset} disabled={!isDirty || isSaving}>
                    <TimerReset className="mr-2 size-4" />
                    Скасувати зміни
                  </Button>
                  <Button onClick={handleSave} disabled={!isDirty || isSaving || isLoading}>
                    {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                    {isSaving ? "Збереження..." : "Зберегти налаштування"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof BadgeCheck
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/80 p-4 backdrop-blur-sm">
      <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <p className="text-xl font-semibold text-foreground">{value}</p>
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-secondary/35 px-3 py-2.5">
      <div className="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-background text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

function TipCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-secondary/35 p-4">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  )
}
