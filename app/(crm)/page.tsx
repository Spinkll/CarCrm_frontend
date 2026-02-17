"use client"

import { PageHeader } from "@/components/page-header"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { ServiceBreakdown } from "@/components/dashboard/service-breakdown"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { UpcomingAppointments } from "@/components/dashboard/upcoming-appointments"

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PageHeader title="Dashboard" description="Overview of your car service operations" />
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
