"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { LogOut, Shield, Settings, User, Briefcase, MoreVertical, KeyRound, UserCog, CheckCircle, XCircle, MailCheck, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ChangePasswordDialog } from "@/components/change-password-dialog"
import { ProfileEditDialog } from "@/components/profile-edit-dialog"
import { cn } from "@/lib/utils"

const roleConfig = {
  ADMIN: {
    label: "Адмін",
    icon: Shield,
    className: "bg-primary/20 text-primary border-primary/30"
  },
  MANAGER: {
    label: "Менеджер",
    icon: Briefcase,
    className: "bg-orange-500/20 text-orange-600 border-orange-500/30"
  },
  MECHANIC: {
    label: "Механік",
    icon: Settings,
    className: "bg-blue-500/20 text-blue-600 border-blue-500/30"
  },
  CLIENT: {
    label: "Клієнт",
    icon: User,
    className: "bg-green-500/20 text-green-600 border-green-500/30"
  },
}

export function UserNav({ collapsed }: { collapsed: boolean }) {
  const { user, logout, resendVerification } = useAuth()
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [profileEditOpen, setProfileEditOpen] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  if (!user) return null

  const handleResendVerification = async () => {
    setIsVerifying(true)
    const result = await resendVerification()
    setIsVerifying(false)

    if (result.success) {
      toast({ title: "Лист відправлено!", description: "Перевірте вашу пошту для верифікації.", variant: "success" })
    } else {
      toast({ title: "Помилка відправки", description: result.error || "Спробуйте пізніше", variant: "destructive" })
    }
  }

  const role = roleConfig[user.role as keyof typeof roleConfig] || roleConfig.CLIENT

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()

  const fullName = `${user.firstName} ${user.lastName}`

  return (
    <>
      <div className="border-t border-sidebar-border p-2">
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 relative",
            collapsed && "justify-center px-0"
          )}
        >
          <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials}
            {!collapsed && user.role === "CLIENT" && (
              <div className="absolute -bottom-1 -right-1 rounded-full bg-background" title={user.isVerified ? "Пошта підтверджена" : "Пошта не підтверджена"}>
                {user.isVerified ? (
                  <CheckCircle className="size-3.5 text-green-500" />
                ) : (
                  <XCircle className="size-3.5 text-destructive" />
                )}
              </div>
            )}
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
            <div className="flex shrink-0 items-center gap-0.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex size-7 items-center justify-center rounded-md text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    aria-label="Меню дій"
                  >
                    <MoreVertical className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="end" className="w-48">
                  {user.role === "CLIENT" && (
                    user.isVerified ? (
                      <DropdownMenuItem disabled className="text-green-600">
                        <CheckCircle className="mr-2 size-4" />
                        Пошта підтверджена
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={handleResendVerification} disabled={isVerifying} className="text-orange-600">
                        {isVerifying ? <Loader2 className="mr-2 size-4 animate-spin" /> : <MailCheck className="mr-2 size-4" />}
                        Підтвердити пошту
                      </DropdownMenuItem>
                    )
                  )}
                  <DropdownMenuItem onClick={() => setProfileEditOpen(true)} className="cursor-pointer gap-2 py-2.5">
                    <UserCog className="size-4 text-muted-foreground" />
                    Мій профіль
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setChangePasswordOpen(true)} className="cursor-pointer gap-2 py-2.5">
                    <KeyRound className="size-4 text-muted-foreground" />
                    Змінити пароль
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer gap-2 py-2.5 text-destructive focus:bg-destructive/10 focus:text-destructive">
                    <LogOut className="size-4" />
                    Вийти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        {collapsed && (
          <div className="mt-1 flex flex-col items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  aria-label="Меню дій"
                >
                  <MoreVertical className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-48">
                {user.role === "CLIENT" && (
                  user.isVerified ? (
                    <DropdownMenuItem disabled className="text-green-600">
                      <CheckCircle className="mr-2 size-4" />
                      Пошта підтверджена
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={handleResendVerification} disabled={isVerifying} className="text-orange-600">
                      {isVerifying ? <Loader2 className="mr-2 size-4 animate-spin" /> : <MailCheck className="mr-2 size-4" />}
                      Підтвердити пошту
                    </DropdownMenuItem>
                  )
                )}
                <DropdownMenuItem onClick={() => setProfileEditOpen(true)}>
                  <UserCog className="mr-2 size-4" />
                  Мій профіль
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setChangePasswordOpen(true)}>
                  <KeyRound className="mr-2 size-4" />
                  Змінити пароль
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              onClick={logout}
              className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        )}
      </div>

      <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
      <ProfileEditDialog open={profileEditOpen} onOpenChange={setProfileEditOpen} />
    </>
  )
}
