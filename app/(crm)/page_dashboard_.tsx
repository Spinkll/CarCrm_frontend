"use client"

import { PageHeader } from "@/components/page-header"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { ServiceBreakdown } from "@/components/dashboard/service-breakdown"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { UpcomingAppointments } from "@/components/dashboard/upcoming-appointments"
import { useAuth } from "@/lib/auth-context" 
import { MechanicDashboard } from "@/components/dashboard/mechanic-dashboard"
import { ClientDashboard } from "@/components/dashboard/client-dashboard"
import { useTranslation } from "@/hooks/use-translation"

export default function DashboardPage() {
  const { user } = useAuth() 
  const { t } = useTranslation()

  if (!user) return null

  if (user.role === "MECHANIC") {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <PageHeader 
          title={t("title", "dashboard")} 
          description={t("mechanicDesc", "dashboard")} 
        />
        <div className="flex-1 overflow-auto p-6">
          <MechanicDashboard />
        </div>
      </div>
    )
  }

  if (user.role === "CLIENT") {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <PageHeader 
          title={t("title", "dashboard")} 
          description={t("clientDesc", "dashboard")} 
        />
        <div className="flex-1 overflow-auto p-6">
          <ClientDashboard />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PageHeader 
        title={t("title", "dashboard")} 
        description={t("adminDesc", "dashboard")} 
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          <KpiCards />
          <div className="grid gap-6 lg:grid-cols-2">
            <RevenueChart />
            <ServiceBreakdown />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RecentOrders />
            </div>
            <UpcomingAppointments />
          </div>
        </div>
      </div>
    </div>
  )
}