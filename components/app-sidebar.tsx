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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useAuth, type UserRole } from "@/lib/auth-context" 
import { UserNav } from "@/components/user-nav"

type NavItem = {
  label: string
  href: string
  icon: typeof LayoutDashboard
  roles: UserRole[] 
}

const navItems: NavItem[] = [
  { 
    label: "Dashboard", 
    href: "/", 
    icon: LayoutDashboard, 
    roles: ["ADMIN", "MECHANIC", "CLIENT", "MANAGER"] 
  },
  { 
    label: "Customers", 
    href: "/customers", 
    icon: Users, 
    roles: ["ADMIN", "MECHANIC", "MANAGER"] 
  },
  { 
    label: "Vehicles", 
    href: "/vehicles", 
    icon: Car, 
    roles: ["ADMIN", "MECHANIC", "CLIENT", "MANAGER"] 
  },
  { 
    label: "Service Orders", 
    href: "/orders", 
    icon: ClipboardList, 
    roles: ["ADMIN", "MECHANIC", "CLIENT", "MANAGER"] 
  },
  { 
    label: "Appointments", 
    href: "/appointments", 
    icon: CalendarDays, 
    roles: ["ADMIN", "MECHANIC", "CLIENT", "MANAGER"] 
  },
  { 
    label: "Employees", 
    href: "/employees", 
    icon: UserCog, 
    roles: ["ADMIN", "MANAGER"] 
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useAuth()

  if (!user) return null;

  const visibleItems = navItems.filter(
    (item) => item.roles.includes(user.role)
  )

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Wrench className="size-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">AutoCare</span>
            <span className="text-xs text-muted-foreground">Service CRM</span>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href))
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
              <item.icon className="size-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <UserNav collapsed={collapsed} />

      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}