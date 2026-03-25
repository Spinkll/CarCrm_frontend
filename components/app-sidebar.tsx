"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Banknote,
  BarChart3,
  Building2,
  CalendarDays,
  Car,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Package,
  Settings2,
  UserCog,
  Users,
  Wrench,
  X,
} from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { UserNav } from "@/components/user-nav"
import { type CompanySettings } from "@/lib/company-settings"
import { useCompanySettings } from "@/lib/company-settings-context"
import { useAuth, type UserRole } from "@/lib/auth-context"
import { useServiceRequests } from "@/lib/service-requests-context"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/hooks/use-translation"

type NavItem = {
  label: string
  href: string
  icon: typeof LayoutDashboard
  roles: UserRole[]
}

export function AppSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user } = useAuth()
  const { requests } = useServiceRequests()
  const { companySettings } = useCompanySettings()
  const { t } = useTranslation()

  const navItems: NavItem[] = [
    {
      label: t("dashboard"),
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["ADMIN", "MECHANIC", "CLIENT", "MANAGER"],
    },
    {
      label: t("requests"),
      href: "/requests",
      icon: MessageSquare,
      roles: ["ADMIN", "MANAGER"],
    },
    {
      label: t("customers"),
      href: "/customers",
      icon: Users,
      roles: ["ADMIN", "MECHANIC", "MANAGER"],
    },
    {
      label: t("vehicles"),
      href: "/vehicles",
      icon: Car,
      roles: ["ADMIN", "MECHANIC", "CLIENT", "MANAGER"],
    },
    {
      label: t("orders"),
      href: "/orders",
      icon: ClipboardList,
      roles: ["ADMIN", "MECHANIC", "CLIENT", "MANAGER"],
    },
    {
      label: t("calendar"),
      href: "/appointments",
      icon: CalendarDays,
      roles: ["ADMIN", "MECHANIC", "CLIENT", "MANAGER"],
    },
    {
      label: t("employees"),
      href: "/employees",
      icon: UserCog,
      roles: ["ADMIN", "MANAGER"],
    },
    {
      label: t("inventory"),
      href: "/inventory",
      icon: Package,
      roles: ["ADMIN", "MANAGER", "MECHANIC"],
    },
    {
      label: t("services"),
      href: "/services",
      icon: Wrench,
      roles: ["ADMIN", "MANAGER", "MECHANIC"],
    },
    {
      label: t("payroll"),
      href: "/payroll",
      icon: Banknote,
      roles: ["ADMIN", "MANAGER"],
    },
    {
      label: t("reports"),
      href: "/reports",
      icon: BarChart3,
      roles: ["ADMIN", "MANAGER"],
    },
    {
      label: t("earnings"),
      href: "/earnings",
      icon: Banknote,
      roles: ["MECHANIC"],
    },
    {
      label: t("company"),
      href: "/company",
      icon: Building2,
      roles: ["ADMIN", "MANAGER"],
    },
    {
      label: t("settings"),
      href: "/settings",
      icon: Settings2,
      roles: ["ADMIN", "MANAGER", "MECHANIC", "CLIENT"],
    },
  ]

  const serviceProfileLabels: Record<string, string> = {
    "full-service": t("crm_auto_service", "sidebar"),
    diagnostics: t("diagnostics", "sidebar"),
    bodywork: t("bodywork", "sidebar"),
    tires: t("tires", "sidebar"),
  }

  function getSidebarSubtitle(settings: CompanySettings) {
    const baseLabel = serviceProfileLabels[settings.serviceProfile] || t("crm_auto_service", "sidebar")

    if (settings.city) {
      return `${baseLabel} • ${settings.city}`
    }

    return baseLabel
  }

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false)
      }
    }

    if (mobileOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

  if (!user) return null

  const visibleItems = navItems.filter((item) => item.roles.includes(user.role))
  const pendingRequestsCount = requests?.filter((item) => item.status === "NEW" || item.status === "IN_REVIEW").length || 0
  const companyBrand = companySettings.shortName || companySettings.companyName || "WagGarage"
  const companySubtitle = getSidebarSubtitle(companySettings)

  const sidebarContent = (
    <>
      <div className="flex h-14 items-center gap-3 border-b border-sidebar-border px-4 md:h-16">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Wrench className="size-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-semibold text-sidebar-foreground">{companyBrand}</span>
            <span className="truncate text-xs text-muted-foreground">{companySubtitle}</span>
          </div>
        )}
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto flex size-8 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground md:hidden"
          aria-label={t("close")}
        >
          <X className="size-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
          const isRequestsTab = item.href === "/requests"
          const showBadge = isRequestsTab && pendingRequestsCount > 0

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <div className="relative">
                <item.icon className="size-5 shrink-0" />
                {collapsed && showBadge && (
                  <span className="absolute -right-1 -top-1 flex size-2.5 rounded-full bg-destructive" />
                )}
              </div>
              {!collapsed && (
                <div className="flex flex-1 items-center justify-between">
                  <span>{item.label}</span>
                  {showBadge && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
                      {pendingRequestsCount}
                    </span>
                  )}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      <UserNav collapsed={collapsed} />

      <div className="hidden border-t border-sidebar-border p-2 md:block">
        <div className="flex items-center gap-1">
          {pathname === "/dashboard" && (
            <ThemeToggle
              variant="icon"
              className="shrink-0 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            />
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            aria-label={collapsed ? t("expand") : t("collapse")}
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            {!collapsed && <span>{t("collapse")}</span>}
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-50 flex size-10 items-center justify-center rounded-xl border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-lg transition-colors hover:bg-sidebar-accent md:hidden"
        aria-label={t("expand")}
      >
        <Menu className="size-5" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full w-[280px] max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-in-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebarContent}
      </aside>

      <aside
        className={cn(
          "hidden h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 md:flex",
          collapsed ? "w-16" : "w-64",
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}