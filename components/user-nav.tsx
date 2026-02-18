"use client"

import { useAuth } from "@/lib/auth-context"
import { LogOut, Shield, Settings, User, Briefcase } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const roleConfig = {
  ADMIN: { 
    label: "Admin", 
    icon: Shield, 
    className: "bg-primary/20 text-primary border-primary/30" 
  },
  MANAGER: { 
    label: "Manager", 
    icon: Briefcase, 
    className: "bg-orange-500/20 text-orange-600 border-orange-500/30" 
  },
  MECHANIC: { 
    label: "Mechanic", 
    icon: Settings, 
    className: "bg-blue-500/20 text-blue-600 border-blue-500/30" 
  },
  CLIENT: { 
    label: "Client", 
    icon: User, 
    className: "bg-green-500/20 text-green-600 border-green-500/30" 
  },
}

export function UserNav({ collapsed }: { collapsed: boolean }) {
  const { user, logout } = useAuth()

  if (!user) return null

  const role = roleConfig[user.role as keyof typeof roleConfig] || roleConfig.CLIENT

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()

  const fullName = `${user.firstName} ${user.lastName}`

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
              {fullName} 
            </span>
            <div className="flex items-center gap-1.5">
              <role.icon className="size-3 opacity-70" /> 
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