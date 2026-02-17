"use client"

import { useAuth } from "@/lib/auth-context"
import { LogOut, Shield, Settings, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const roleConfig = {
  admin: { label: "Admin", icon: Shield, className: "bg-primary/20 text-primary border-primary/30" },
  mechanic: { label: "Mechanic", icon: Settings, className: "bg-chart-2/20 text-chart-2 border-chart-2/30" },
  client: { label: "Client", icon: User, className: "bg-chart-3/20 text-chart-3 border-chart-3/30" },
}

export function UserNav({ collapsed }: { collapsed: boolean }) {
  const { user, logout } = useAuth()

  if (!user) return null

  const role = roleConfig[user.role]
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="border-t border-sidebar-border p-2">
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2",
          collapsed && "justify-center px-0"
        )}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {initials}
        </div>
        {!collapsed && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {user.name}
            </span>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className={cn("h-4 rounded px-1 text-[10px] font-medium leading-none", role.className)}>
                {role.label}
              </Badge>
            </div>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={logout}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        )}
      </div>
      {collapsed && (
        <button
          onClick={logout}
          className="mt-1 flex w-full items-center justify-center rounded-lg px-3 py-2 text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          aria-label="Sign out"
        >
          <LogOut className="size-4" />
        </button>
      )}
    </div>
  )
}
