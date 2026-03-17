"use client"

import { NotificationsList } from "./ui/notifications-list"
import { GlobalSearch } from "./global-search"


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
    <div className="flex flex-col gap-3 border-b border-border bg-card px-3 py-3 sm:px-6 sm:py-5 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 pr-2 pl-10 md:pl-0">
        <h1 className="break-words text-base font-semibold text-foreground sm:text-xl">{title}</h1>
        {description && (
          <p className="mt-0.5 break-words text-xs text-muted-foreground sm:mt-1 sm:text-sm">{description}</p>
        )}
      </div>
      <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:gap-3 md:w-auto md:justify-end">
        <GlobalSearch />

        <NotificationsList />

        {children}
      </div>
    </div>
  )
}
