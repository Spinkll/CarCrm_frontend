"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { AuthProvider, useAuth } from "@/lib/auth-context"

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && isAuthenticated && pathname !== "/verify-email") {
      router.replace("/dashboard")
    }
  }, [isAuthenticated, isLoading, router, pathname])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isAuthenticated && pathname !== "/verify-email") return null

  return <>{children}</>
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>
        <div className="fixed inset-0 flex justify-center overflow-y-auto bg-background px-4 py-8">
          <div className="m-auto">
            {children}
          </div>
        </div>
      </AuthGuard>
    </AuthProvider>
  )
}
