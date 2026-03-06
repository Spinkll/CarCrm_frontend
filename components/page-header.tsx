"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { NotificationsList } from "./ui/notifications-list"


export function PageHeader({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border bg-card px-4 py-4 sm:px-6 sm:py-5 md:flex-row md:items-center md:justify-between">
      <div className="pl-10 md:pl-0">
        <h1 className="text-lg sm:text-xl font-semibold text-foreground">{title}</h1>
        {description && (
          <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Пошук..."
            className="h-9 w-40 bg-secondary pl-9 text-sm sm:w-48 lg:w-64"
          />
        </div>

        <NotificationsList />

        {children}
      </div>
    </div>
  )
}