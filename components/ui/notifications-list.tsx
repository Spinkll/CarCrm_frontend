"use client"

import { Bell, CheckCheck, Info, AlertTriangle, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useNotifications } from "@/lib/notifications-context"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { uk } from "date-fns/locale"

export function NotificationsList() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" />
          )}
          <span className="sr-only">Сповіщення</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 pb-2">
          <h4 className="font-semibold">Сповіщення</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" onClick={markAllAsRead}>
              <CheckCheck className="mr-1 size-3" /> Всі прочитані
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-[400px] overflow-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Немає нових повідомлень</div>
          ) : (
            notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className={cn(
                  "flex flex-col items-start gap-1 p-4 cursor-pointer focus:bg-muted",
                  !n.isRead && "bg-primary/5"
                )}
                onClick={() => markAsRead(n.id)}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <span className={cn("font-medium text-sm", !n.isRead && "text-primary")}>{n.title}</span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: uk })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground whitespace-normal break-words mt-1 leading-relaxed w-full">
                  {n.message}
                </p>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}