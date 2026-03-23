
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
import { useSettings } from "@/lib/settings-context"
import { translations } from "@/lib/translations"
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

export default function CompanyPage() {
  const { user } = useAuth()
  const { applyCompanySettings } = useCompanySettings()
  const { settings: appSettings } = useSettings()
  const router = useRouter()

  const t = translations[appSettings.language].companyPage

  const scheduleLabels: Record<string, string> = {
    "mon-fri": t.general.schedules.monFri,
    "mon-sat": t.general.schedules.monSat,
    daily: t.general.schedules.daily,
    custom: t.general.schedules.custom,
  }

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
        const msg = error.response?.data?.message || t.footer.fetchError
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
      toast({ title: t.footer.success, variant: "success" })
    } catch (error: any) {
      console.error("Failed to save company settings", error)
      const msg = error.response?.data?.message || t.footer.error
      toast({ title: Array.isArray(msg) ? msg[0] : msg, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setSettings(savedSettings)
    toast({ title: t.footer.reset })
  }

  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) return null

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PageHeader
        title={t.title}
        description={t.description}
      >
        <Badge
          variant="outline"
          className={isDirty ? "border-warning/40 bg-warning/10 text-amber-600 dark:text-amber-400" : "border-success/30 bg-success/10 text-success"}
        >
          {isDirty ? t.dirtyChanges : t.allSaved}
        </Badge>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
              <Loader2 className="size-4 animate-spin" />
              {t.loading}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {loadError && (
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.loadErrorTitle}</p>
                    <p className="text-sm text-muted-foreground">{loadError}</p>
                  </div>
                  <Button variant="outline" onClick={fetchCompanySettings}>
                    {t.retry}
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
                          <p className="text-sm font-medium text-muted-foreground">{t.profileSubtitle}</p>
                          <h2 className="text-2xl font-semibold text-foreground">
                            {settings.shortName || settings.companyName || t.footer.defaultName}
                          </h2>
                        </div>
                      </div>
                      <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                        {t.profileDescription}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="gap-1 rounded-full px-3 py-1">
                          <Clock3 className="size-3.5" />
                          {scheduleLabels[settings.workSchedule] || t.schedule} {settings.workStart}-{settings.workEnd}
                        </Badge>
                        <Badge variant="secondary" className="gap-1 rounded-full px-3 py-1">
                          <ShieldCheck className="size-3.5" />
                          {settings.urgentOrdersEnabled ? t.urgentEnabled : t.urgentDisabled}
                        </Badge>
                        <Badge variant="secondary" className="gap-1 rounded-full px-3 py-1">
                          <Landmark className="size-3.5" />
                          {settings.vatPayer ? t.vatPayer : t.noVat}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid min-w-[220px] gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                      <StatusCard icon={BadgeCheck} label={t.profileLabel} value={`${completion.general}%`} hint={t.generalData} />
                      <StatusCard icon={Phone} label={t.contactsLabel} value={`${completion.contacts}%`} hint={t.commChannels} />
                      <StatusCard icon={ReceiptText} label={t.requisitesLabel} value={`${completion.requisites}%`} hint={t.docsAndPayments} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-base">{t.profileStatus}</CardTitle>
                  <CardDescription>{t.statusDescription}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t.profileCompletion}</span>
                      <span className="font-semibold text-foreground">{totalCompletion}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary">
                      <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${totalCompletion}%` }} />
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm">
                    <InfoRow icon={MapPin} label={t.address} value={settings.addressLine || t.notSpecified} />
                    <InfoRow icon={Mail} label={t.email} value={settings.email || t.notSpecified} />
                    <InfoRow icon={Landmark} label={t.iban} value={settings.iban || t.notSpecified} />
                    <InfoRow icon={Globe} label={t.website} value={settings.website || t.notAdded} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
              <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-xl bg-muted/70 p-1">
                <TabsTrigger value="general" className="min-w-[140px] flex-none rounded-lg px-4 py-2">
                  {t.tabs.general}
                </TabsTrigger>
                <TabsTrigger value="contacts" className="min-w-[140px] flex-none rounded-lg px-4 py-2">
                  {t.tabs.contacts}
                </TabsTrigger>
                <TabsTrigger value="requisites" className="min-w-[140px] flex-none rounded-lg px-4 py-2">
                  {t.tabs.requisites}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general">
                <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t.general.title}</CardTitle>
                      <CardDescription>{t.general.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-5">
                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="companyName">{t.general.companyName}</Label>
                          <Input
                            id="companyName"
                            value={settings.companyName}
                            onChange={(event) => handleFieldChange("companyName", event.target.value)}
                            placeholder={t.general.companyNamePlaceholder}
                            className="bg-secondary"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="shortName">{t.general.shortName}</Label>
                          <Input
                            id="shortName"
                            value={settings.shortName}
                            onChange={(event) => handleFieldChange("shortName", event.target.value)}
                            placeholder={t.general.shortNamePlaceholder}
                            className="bg-secondary"
                          />
                        </div>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label>{t.general.serviceProfile}</Label>
                          <Select value={settings.serviceProfile} onValueChange={(value) => handleFieldChange("serviceProfile", value)}>
                            <SelectTrigger className="w-full bg-secondary">
                              <SelectValue placeholder={t.general.selectProfile} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="full-service">{t.general.profiles.full}</SelectItem>
                              <SelectItem value="diagnostics">{t.general.profiles.diagnostics}</SelectItem>
                              <SelectItem value="bodywork">{t.general.profiles.bodywork}</SelectItem>
                              <SelectItem value="tires">{t.general.profiles.tires}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label>{t.general.scheduleType}</Label>
                          <Select value={settings.workSchedule} onValueChange={(value) => handleFieldChange("workSchedule", value)}>
                            <SelectTrigger className="w-full bg-secondary">
                              <SelectValue placeholder={t.general.selectSchedule} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mon-fri">{t.general.schedules.monFri}</SelectItem>
                              <SelectItem value="mon-sat">{t.general.schedules.monSat}</SelectItem>
                              <SelectItem value="daily">{t.general.schedules.daily}</SelectItem>
                              <SelectItem value="custom">{t.general.schedules.custom}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid gap-5 md:grid-cols-3">
                        <div className="grid gap-2">
                          <Label htmlFor="workStart">{t.general.workStart}</Label>
                          <Input
                            id="workStart"
                            type="time"
                            value={settings.workStart}
                            onChange={(event) => handleFieldChange("workStart", event.target.value)}
                            className="bg-secondary"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="workEnd">{t.general.workEnd}</Label>
                          <Input
                            id="workEnd"
                            type="time"
                            value={settings.workEnd}
                            onChange={(event) => handleFieldChange("workEnd", event.target.value)}
                            className="bg-secondary"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>{t.general.slotDuration}</Label>
                          <Select value={settings.slotDuration} onValueChange={(value) => handleFieldChange("slotDuration", value)}>
                            <SelectTrigger className="w-full bg-secondary">
                              <SelectValue placeholder={t.general.selectDuration} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="30">{t.general.min30}</SelectItem>
                              <SelectItem value="45">{t.general.min45}</SelectItem>
                              <SelectItem value="60">{t.general.min60}</SelectItem>
                              <SelectItem value="90">{t.general.min90}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="rounded-xl border border-border bg-secondary/40 p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">{t.general.lunchBreak}</p>
                            <p className="text-sm text-muted-foreground">{t.general.lunchDescription}</p>
                          </div>
                          <Switch checked={settings.lunchEnabled} onCheckedChange={(checked) => handleFieldChange("lunchEnabled", checked)} />
                        </div>

                        {settings.lunchEnabled && (
                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                              <Label htmlFor="lunchStart">{t.general.lunchStart}</Label>
                              <Input
                                id="lunchStart"
                                type="time"
                                value={settings.lunchStart}
                                onChange={(event) => handleFieldChange("lunchStart", event.target.value)}
                                className="bg-card"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="lunchEnd">{t.general.lunchEnd}</Label>
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
                            <p className="text-sm font-medium text-foreground">{t.general.urgentOrders}</p>
                            <p className="text-sm text-muted-foreground">{t.general.urgentDescription}</p>
                          </div>
                          <Switch checked={settings.urgentOrdersEnabled} onCheckedChange={(checked) => handleFieldChange("urgentOrdersEnabled", checked)} />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="publicDescription">{t.general.publicDescription}</Label>
                        <Textarea
                           id="publicDescription"
                           value={settings.publicDescription}
                           onChange={(event) => handleFieldChange("publicDescription", event.target.value)}
                           placeholder={t.general.publicDescriptionPlaceholder}
                           className="min-h-28 bg-secondary"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{t.tips.title}</CardTitle>
                      <CardDescription>{t.tips.primaryTitle}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      <TipCard title={t.tips.tip1Title} description={t.tips.tip1Desc} />
                      <TipCard title={t.tips.tip2Title} description={t.tips.tip2Desc} />
                      <TipCard title={t.tips.tip3Title} description={t.tips.tip3Desc} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="contacts">
                <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t.contacts.title}</CardTitle>
                      <CardDescription>{t.contacts.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-5">
                      <div className="grid gap-2">
                        <Label htmlFor="addressLine">{t.contacts.address}</Label>
                        <Input
                          id="addressLine"
                          value={settings.addressLine}
                          onChange={(event) => handleFieldChange("addressLine", event.target.value)}
                          placeholder={t.contacts.addressPlaceholder}
                          className="bg-secondary"
                        />
                      </div>

                      <div className="grid gap-5 md:grid-cols-3">
                        <div className="grid gap-2">
                          <Label htmlFor="city">{t.contacts.city}</Label>
                          <Input
                            id="city"
                            value={settings.city}
                            onChange={(event) => handleFieldChange("city", event.target.value)}
                            placeholder={t.contacts.cityPlaceholder}
                            className="bg-secondary"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="region">{t.contacts.region}</Label>
                          <Input
                            id="region"
                            value={settings.region}
                            onChange={(event) => handleFieldChange("region", event.target.value)}
                            placeholder={t.contacts.regionPlaceholder}
                            className="bg-secondary"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="postalCode">{t.contacts.postalCode}</Label>
                          <Input
                            id="postalCode"
                            value={settings.postalCode}
                            onChange={(event) => handleFieldChange("postalCode", event.target.value)}
                            placeholder={t.contacts.postalCodePlaceholder}
                            className="bg-secondary"
                          />
                        </div>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="phone">{t.contacts.mainPhone}</Label>
                          <PhoneInput id="phone" value={settings.phone} onValueChange={(value) => handleFieldChange("phone", value)} />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="additionalPhone">{t.contacts.additionalPhone}</Label>
                          <PhoneInput
                            id="additionalPhone"
                            value={settings.additionalPhone}
                            onValueChange={(value) => handleFieldChange("additionalPhone", value)}
                          />
                        </div>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="email">{t.contacts.email}</Label>
                          <Input
                            id="email"
                            type="email"
                            value={settings.email}
                            onChange={(event) => handleFieldChange("email", event.target.value)}
                            placeholder={t.contacts.emailPlaceholder}
                            className="bg-secondary"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="website">{t.contacts.website}</Label>
                          <Input
                            id="website"
                            value={settings.website}
                            onChange={(event) => handleFieldChange("website", event.target.value)}
                            placeholder={t.contacts.websitePlaceholder}
                            className="bg-secondary"
                          />
                        </div>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="mapsLink">{t.contacts.mapsLink}</Label>
                          <Input
                            id="mapsLink"
                            value={settings.mapsLink}
                            onChange={(event) => handleFieldChange("mapsLink", event.target.value)}
                            placeholder={t.contacts.mapsPlaceholder}
                            className="bg-secondary"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="contactPerson">{t.contacts.contactPerson}</Label>
                          <Input
                            id="contactPerson"
                            value={settings.contactPerson}
                            onChange={(event) => handleFieldChange("contactPerson", event.target.value)}
                            placeholder={t.contacts.contactPersonPlaceholder}
                            className="bg-secondary"
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="clientNote">{t.contacts.clientNote}</Label>
                        <Textarea
                          id="clientNote"
                          value={settings.clientNote}
                          onChange={(event) => handleFieldChange("clientNote", event.target.value)}
                          placeholder={t.contacts.clientNotePlaceholder}
                          className="min-h-28 bg-secondary"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{t.contacts.tipsTitle}</CardTitle>
                      <CardDescription>{t.contacts.tipsDescription}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      <TipCard title={t.contacts.tip1Title} description={t.contacts.tip1Desc} />
                      <TipCard title={t.contacts.tip2Title} description={t.contacts.tip2Desc} />
                      <TipCard title={t.contacts.tip3Title} description={t.contacts.tip3Desc} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="requisites">
                <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t.requisites.title}</CardTitle>
                      <CardDescription>{t.requisites.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-5">
                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label>{t.requisites.companyType}</Label>
                          <Select value={settings.companyType} onValueChange={(value) => handleFieldChange("companyType", value)}>
                            <SelectTrigger className="w-full bg-secondary">
                              <SelectValue placeholder={t.requisites.selectType} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ФОП">{t.requisites.forms.fop}</SelectItem>
                              <SelectItem value="ТОВ">{t.requisites.forms.tov}</SelectItem>
                              <SelectItem value="ПП">{t.requisites.forms.pp}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">{t.requisites.vatPayer}</p>
                            <p className="text-sm text-muted-foreground">{t.requisites.vatDescription}</p>
                          </div>
                          <Switch checked={settings.vatPayer} onCheckedChange={(checked) => handleFieldChange("vatPayer", checked)} />
                        </div>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="edrpou">{t.requisites.edrpou}</Label>
                          <Input
                            id="edrpou"
                            value={settings.edrpou}
                            onChange={(event) => handleFieldChange("edrpou", event.target.value)}
                            placeholder={t.requisites.edrpouPlaceholder}
                            className="bg-secondary"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="ipn">{t.requisites.ipn}</Label>
                          <Input
                            id="ipn"
                            value={settings.ipn}
                            onChange={(event) => handleFieldChange("ipn", event.target.value)}
                            placeholder={t.requisites.ipnPlaceholder}
                            className="bg-secondary"
                          />
                        </div>
                      </div>

                      <div className="grid gap-5">
                        <div className="grid gap-2">
                          <Label htmlFor="iban">{t.requisites.iban}</Label>
                          <Input
                            id="iban"
                            value={settings.iban}
                            onChange={(event) => handleFieldChange("iban", event.target.value)}
                            placeholder={t.requisites.ibanPlaceholder}
                            className="bg-secondary"
                          />
                        </div>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="bankName">{t.requisites.bankName}</Label>
                          <Input
                            id="bankName"
                            value={settings.bankName}
                            onChange={(event) => handleFieldChange("bankName", event.target.value)}
                            placeholder={t.requisites.bankNamePlaceholder}
                            className="bg-secondary"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="recipientName">{t.requisites.recipientName}</Label>
                          <Input
                            id="recipientName"
                            value={settings.recipientName}
                            onChange={(event) => handleFieldChange("recipientName", event.target.value)}
                            placeholder={t.requisites.recipientNamePlaceholder}
                            className="bg-secondary"
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="legalAddress">{t.requisites.legalAddress}</Label>
                        <Input
                          id="legalAddress"
                          value={settings.legalAddress}
                          onChange={(event) => handleFieldChange("legalAddress", event.target.value)}
                          placeholder={t.requisites.legalAddressPlaceholder}
                          className="bg-secondary"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="invoiceNote">{t.requisites.invoiceNote}</Label>
                        <Textarea
                          id="invoiceNote"
                          value={settings.invoiceNote}
                          onChange={(event) => handleFieldChange("invoiceNote", event.target.value)}
                          placeholder={t.requisites.invoiceNotePlaceholder}
                          className="min-h-28 bg-secondary"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{t.requisites.moreTitle}</CardTitle>
                      <CardDescription>{t.requisites.moreDescription}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      <TipCard title={t.requisites.tip1Title} description={t.requisites.tip1Desc} />
                      <TipCard title={t.requisites.tip2Title} description={t.requisites.tip2Desc} />
                      <TipCard title={t.requisites.tip3Title} description={t.requisites.tip3Desc} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            <Card>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{t.footer.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {t.footer.description}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="outline" onClick={handleReset} disabled={!isDirty || isSaving}>
                    <TimerReset className="mr-2 size-4" />
                    {t.footer.cancel}
                  </Button>
                  <Button onClick={handleSave} disabled={!isDirty || isSaving || isLoading}>
                    {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                    {isSaving ? t.footer.saving : t.footer.save}
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
