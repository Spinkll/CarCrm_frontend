"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { CrmProvider } from "@/lib/crm-context"

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <CrmProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <AppSidebar />
        <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    </CrmProvider>
  )
}
