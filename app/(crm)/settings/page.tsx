"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { useSettings, type AppTheme, type Language, type DateFormat } from "@/lib/settings-context"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Bell,
  BellOff,
  Volume2,
  Mail,
  Palette,
  Monitor,
  Moon,
  Sun,
  Globe,
  Calendar,
  Table2,
  RotateCcw,
  Check,
  ShoppingCart,
  RefreshCw,
  CalendarClock,
  Columns3,
  Minimize2,
  SeparatorHorizontal,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useToast } from "@/components/ui/use-toast"

/* ─────────────────── helpers ─────────────────── */

function SettingRow({
  icon: Icon,
  iconClassName,
  label,
  description,
  children,
  className,
}: {
  icon: typeof Bell
  iconClassName?: string
  label: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4 py-4", className)}>
      <div className="flex items-start gap-3 min-w-0">
        <div className={cn(
          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg",
          iconClassName || "bg-muted text-muted-foreground"
        )}>
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <Label className="text-sm font-medium text-foreground leading-snug">{label}</Label>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function SectionCard({
  icon: Icon,
  iconClassName,
  title,
  description,
  children,
}: {
  icon: typeof Bell
  iconClassName?: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex size-10 items-center justify-center rounded-xl",
            iconClassName || "bg-primary/10 text-primary"
          )}>
            <Icon className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {children}
      </CardContent>
    </Card>
  )
}

/* ─────────────────── theme cards ─────────────────── */

const themeOptions: { value: AppTheme; label: string; icon: typeof Sun; desc: string }[] = [
  { value: "light", label: "Світла", icon: Sun, desc: "Яскрава тема для робочого дня" },
  { value: "dark", label: "Темна", icon: Moon, desc: "М'яке підсвічування для очей" },
  { value: "system", label: "Системна", icon: Monitor, desc: "Автоматично за налаштуванням ОС" },
]

function ThemeCard({
  option,
  isActive,
  onClick,
}: {
  option: (typeof themeOptions)[0]
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200",
        isActive
          ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
          : "border-border bg-card hover:border-muted-foreground/30 hover:shadow-sm"
      )}
    >
      {/* Check badge */}
      {isActive && (
        <div className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
          <Check className="size-3" />
        </div>
      )}

      {/* Theme preview */}
      <div
        className={cn(
          "flex size-14 items-center justify-center rounded-xl transition-colors duration-200",
          isActive
            ? "bg-primary/15 text-primary"
            : "bg-muted text-muted-foreground group-hover:bg-muted/80"
        )}
      >
        <option.icon className="size-6" />
      </div>

      <div className="text-center">
        <span className={cn(
          "block text-sm font-semibold",
          isActive ? "text-primary" : "text-foreground"
        )}>
          {option.label}
        </span>
        <span className="mt-0.5 block text-[11px] text-muted-foreground leading-tight">
          {option.desc}
        </span>
      </div>
    </button>
  )
}

/* ─────────────────── main page ─────────────────── */

export default function SettingsPage() {
  const { user } = useAuth()
  const { settings, updateSetting, resetSettings } = useSettings()
  const { setTheme } = useTheme()
  const { toast } = useToast()
  const [resetting, setResetting] = useState(false)

  if (!user) return null

  const handleThemeChange = (value: AppTheme) => {
    updateSetting("theme", value)
    setTheme(value)
  }

  const handleReset = () => {
    setResetting(true)
    resetSettings()
    setTheme("system")
    setTimeout(() => {
      setResetting(false)
      toast({
        title: "Налаштування скинуто",
        description: "Всі параметри повернено до значень за замовчуванням.",
      })
    }, 400)
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PageHeader
        title="Налаштування"
        description="Керуйте параметрами системи під свої потреби"
      >
        <button
          onClick={handleReset}
          disabled={resetting}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-muted-foreground transition-all hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive",
            resetting && "pointer-events-none opacity-50"
          )}
        >
          <RotateCcw className={cn("size-4", resetting && "animate-spin")} />
          Скинути
        </button>
      </PageHeader>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="mx-auto max-w-4xl space-y-6">

          {/* ═══════ ПОВІДОМЛЕННЯ ═══════ */}
          <SectionCard
            icon={Bell}
            iconClassName="bg-blue-500/10 text-blue-500"
            title="Повідомлення"
            description="Налаштуйте, як і коли ви отримуєте сповіщення"
          >
            <SettingRow
              icon={settings.notificationsEnabled ? Bell : BellOff}
              iconClassName={settings.notificationsEnabled
                ? "bg-blue-500/10 text-blue-500"
                : "bg-muted text-muted-foreground"}
              label="Push-сповіщення"
              description="Отримувати сповіщення в браузері про нові події"
            >
              <Switch
                id="notifications-enabled"
                checked={settings.notificationsEnabled}
                onCheckedChange={(v) => updateSetting("notificationsEnabled", v)}
              />
            </SettingRow>

            <Separator />

            <SettingRow
              icon={Volume2}
              iconClassName="bg-violet-500/10 text-violet-500"
              label="Звукові сповіщення"
              description="Відтворювати звук при новому повідомленні"
            >
              <Switch
                id="sound-enabled"
                checked={settings.soundEnabled}
                onCheckedChange={(v) => updateSetting("soundEnabled", v)}
                disabled={!settings.notificationsEnabled}
              />
            </SettingRow>

            <Separator />

            <SettingRow
              icon={Mail}
              iconClassName="bg-emerald-500/10 text-emerald-500"
              label="Email-сповіщення"
              description="Отримувати дублікати сповіщень на email"
            >
              <Switch
                id="email-notifications"
                checked={settings.emailNotifications}
                onCheckedChange={(v) => updateSetting("emailNotifications", v)}
              />
            </SettingRow>

            {/* Типи сповіщень */}
            {settings.notificationsEnabled && (
              <>
                <Separator />
                <div className="py-2">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Типи сповіщень
                  </p>

                  <SettingRow
                    icon={ShoppingCart}
                    iconClassName="bg-orange-500/10 text-orange-500"
                    label="Нові замовлення"
                    description="Сповіщення про створення нових замовлень"
                    className="py-3"
                  >
                    <Switch
                      id="notification-new-orders"
                      checked={settings.notificationNewOrders}
                      onCheckedChange={(v) => updateSetting("notificationNewOrders", v)}
                    />
                  </SettingRow>

                  <SettingRow
                    icon={RefreshCw}
                    iconClassName="bg-cyan-500/10 text-cyan-500"
                    label="Зміни статусів"
                    description="Сповіщення про зміну статусу замовлень"
                    className="py-3"
                  >
                    <Switch
                      id="notification-status-changes"
                      checked={settings.notificationStatusChanges}
                      onCheckedChange={(v) => updateSetting("notificationStatusChanges", v)}
                    />
                  </SettingRow>

                  <SettingRow
                    icon={CalendarClock}
                    iconClassName="bg-pink-500/10 text-pink-500"
                    label="Записи на прийом"
                    description="Нагадування про заплановані візити"
                    className="py-3"
                  >
                    <Switch
                      id="notification-appointments"
                      checked={settings.notificationAppointments}
                      onCheckedChange={(v) => updateSetting("notificationAppointments", v)}
                    />
                  </SettingRow>
                </div>
              </>
            )}
          </SectionCard>

          {/* ═══════ ЗОВНІШНІЙ ВИГЛЯД ═══════ */}
          <SectionCard
            icon={Palette}
            iconClassName="bg-purple-500/10 text-purple-500"
            title="Зовнішній вигляд"
            description="Оберіть тему та налаштуйте відображення інтерфейсу"
          >
            {/* Theme picker */}
            <div className="py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Тема оформлення
              </p>
              <div className="grid grid-cols-3 gap-3">
                {themeOptions.map((opt) => (
                  <ThemeCard
                    key={opt.value}
                    option={opt}
                    isActive={settings.theme === opt.value}
                    onClick={() => handleThemeChange(opt.value)}
                  />
                ))}
              </div>
            </div>

            <Separator />

            <SettingRow
              icon={Minimize2}
              iconClassName="bg-teal-500/10 text-teal-500"
              label="Компактний режим"
              description="Зменшити відступи та розміри елементів для більшого контенту"
            >
              <Switch
                id="compact-mode"
                checked={settings.compactMode}
                onCheckedChange={(v) => updateSetting("compactMode", v)}
              />
            </SettingRow>
          </SectionCard>

          {/* ═══════ РЕГІОНАЛЬНІ НАЛАШТУВАННЯ ═══════ */}
          <SectionCard
            icon={Globe}
            iconClassName="bg-amber-500/10 text-amber-500"
            title="Регіональні"
            description="Мова інтерфейсу та формат дати"
          >
            <SettingRow
              icon={Globe}
              iconClassName="bg-amber-500/10 text-amber-500"
              label="Мова інтерфейсу"
              description="Основна мова системи"
            >
              <Select
                value={settings.language}
                onValueChange={(v) => updateSetting("language", v as Language)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uk">🇺🇦 Українська</SelectItem>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>

            <Separator />

            <SettingRow
              icon={Calendar}
              iconClassName="bg-rose-500/10 text-rose-500"
              label="Формат дати"
              description="Як відображати дати в системі"
            >
              <Select
                value={settings.dateFormat}
                onValueChange={(v) => updateSetting("dateFormat", v as DateFormat)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD.MM.YYYY">22.03.2026</SelectItem>
                  <SelectItem value="MM/DD/YYYY">03/22/2026</SelectItem>
                  <SelectItem value="YYYY-MM-DD">2026-03-22</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
          </SectionCard>

          {/* ═══════ ТАБЛИЦІ ═══════ */}
          <SectionCard
            icon={Table2}
            iconClassName="bg-indigo-500/10 text-indigo-500"
            title="Таблиці та дані"
            description="Налаштування рядків, меж та порядку таблиць"
          >
            <SettingRow
              icon={Columns3}
              iconClassName="bg-indigo-500/10 text-indigo-500"
              label="Рядків на сторінку"
              description="Кількість рядків, що відображаються в таблицях"
            >
              <Select
                value={settings.tableRowsPerPage.toString()}
                onValueChange={(v) => updateSetting("tableRowsPerPage", parseInt(v))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>

            <Separator />

            <SettingRow
              icon={SeparatorHorizontal}
              iconClassName="bg-sky-500/10 text-sky-500"
              label="Межі таблиць"
              description="Показувати розділові лінії між рядками"
            >
              <Switch
                id="show-table-borders"
                checked={settings.showTableBorders}
                onCheckedChange={(v) => updateSetting("showTableBorders", v)}
              />
            </SettingRow>
          </SectionCard>

          {/* ═══════ INFO FOOTER ═══════ */}
          <div className="flex items-center justify-center gap-2 pb-6 pt-2 text-xs text-muted-foreground/60">
            <Settings className="size-3.5" />
            <span>Налаштування зберігаються автоматично у вашому браузері</span>
          </div>

        </div>
      </div>
    </div>
  )
}
