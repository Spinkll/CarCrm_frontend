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
    <div className="flex flex-col gap-4 border-b border-border bg-card px-6 py-5 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Пошук..."
            className="h-9 w-48 bg-secondary pl-9 text-sm lg:w-64"
          />
        </div>
        
        <NotificationsList />

        {children}
      </div>
    </div>
  )
}