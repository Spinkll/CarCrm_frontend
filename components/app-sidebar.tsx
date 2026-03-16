"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Car,
  ClipboardList,
  CalendarDays,
  Wrench,
  ChevronLeft,
  ChevronRight,
  UserCog,
  MessageSquare,
  Package,
  Banknote,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { useAuth, type UserRole } from "@/lib/auth-context"
import { useServiceRequests } from "@/lib/service-requests-context"
import { UserNav } from "@/components/user-nav"
import { ThemeToggle } from "@/components/theme-toggle"

type NavItem = {
  label: string
  href: string
  icon: typeof LayoutDashboard
  roles: UserRole[]
}

const navItems: NavItem[] = [
  {
    label: "Головна",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "MECHANIC", "CLIENT", "MANAGER"]
  },
  {
    label: "Вхідні заявки",
    href: "/requests",
    icon: MessageSquare,
    roles: ["ADMIN", "MANAGER"]
  },
  {
    label: "Клієнти",
    href: "/customers",
    icon: Users,
    roles: ["ADMIN", "MECHANIC", "MANAGER"]
  },
  {
    label: "Автомобілі",
    href: "/vehicles",
    icon: Car,
    roles: ["ADMIN", "MECHANIC", "CLIENT", "MANAGER"]
  },
  {
    label: "Замовлення",
    href: "/orders",
    icon: ClipboardList,
    roles: ["ADMIN", "MECHANIC", "CLIENT", "MANAGER"]
  },
  {
    label: "Календар",
    href: "/appointments",
    icon: CalendarDays,
    roles: ["ADMIN", "MECHANIC", "CLIENT", "MANAGER"]
  },
  {
    label: "Персонал",
    href: "/employees",
    icon: UserCog,
    roles: ["ADMIN", "MANAGER"]
  },
  {
    label: "Склад",
    href: "/inventory",
    icon: Package,
    roles: ["ADMIN", "MANAGER", "MECHANIC"]
  },
  {
    label: "Послуги",
    href: "/services",
    icon: Wrench,
    roles: ["ADMIN", "MANAGER", "MECHANIC"]
  },
  {
    label: "Зарплати",
    href: "/payroll",
    icon: Banknote,
    roles: ["ADMIN", "MANAGER"]
  },
  {
    label: "Мої доходи",
    href: "/earnings",
    icon: Banknote,
    roles: ["MECHANIC"]
  },

]

export function AppSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user } = useAuth()

  // Use service requests to get the count of newly incoming or in-review requests
  const { requests } = useServiceRequests()

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Handle escape key to close mobile sidebar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false)
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

  if (!user) return null;

  const visibleItems = navItems.filter(
    (item) => item.roles.includes(user.role)
  )

  const pendingRequestsCount = requests?.filter(r => r.status === "NEW" || r.status === "IN_REVIEW").length || 0;

  const sidebarContent = (
    <>
      <div className="flex h-14 md:h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Wrench className="size-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="flex flex-col flex-1">
            <span className="text-sm font-semibold text-sidebar-foreground">WagGarage</span>
            <span className="text-xs text-muted-foreground">CRM Автосервісу</span>
          </div>
        )}
        {/* Mobile only close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden ml-auto flex items-center justify-center size-8 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          aria-label="Закрити меню"
        >
          <X className="size-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href))

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
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
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

      {/* Desktop only collapse button + theme toggle — hidden on mobile */}
      <div className="hidden md:block border-t border-sidebar-border p-2">
        <div className="flex items-center gap-1">
          <ThemeToggle
            variant="icon"
            className="shrink-0 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          />
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            aria-label={collapsed ? "Розгорнути панель" : "Згорнути панель"}
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            {!collapsed && <span>Згорнути</span>}
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile hamburger trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 flex items-center justify-center size-10 rounded-xl bg-sidebar border border-sidebar-border text-sidebar-foreground shadow-lg hover:bg-sidebar-accent transition-colors"
        aria-label="Відкрити меню"
      >
        <Menu className="size-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-50 flex h-full w-[280px] max-w-[85vw] flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}