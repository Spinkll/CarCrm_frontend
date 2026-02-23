"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { CrmProvider } from "@/lib/crm-context"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { VehiclesProvider } from "@/lib/vehicles-context"
import { OrdersProvider } from "@/lib/orders-context"
import { EmployeesProvider } from "@/lib/employees-context"
import { CustomersProvider } from "@/lib/customers-context"
import { NotificationsProvider } from "@/lib/notifications-context"
import { AppointmentsProvider } from "@/lib/appointments-context"
import { ServiceRequestsProvider } from "@/lib/service-requests-context"
import { InventoryProvider } from "@/lib/inventory-context"

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <CrmProvider>
      <ServiceRequestsProvider>
        <AppointmentsProvider>
          <NotificationsProvider>
            <CustomersProvider>
              <VehiclesProvider>
                <EmployeesProvider>
                  <OrdersProvider>
                    <InventoryProvider>
                      <div className="flex h-screen overflow-hidden bg-background">
                        <AppSidebar />
                        <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
                      </div>
                    </InventoryProvider>
                  </OrdersProvider>
                </EmployeesProvider>
              </VehiclesProvider>
            </CustomersProvider>
          </NotificationsProvider>
        </AppointmentsProvider>
      </ServiceRequestsProvider>
    </CrmProvider>
  )
}

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </AuthProvider>
  )
}