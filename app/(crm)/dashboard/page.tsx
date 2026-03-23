"use client"

import { PageHeader } from "@/components/page-header"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { ServiceBreakdown } from "@/components/dashboard/service-breakdown"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { UpcomingAppointments } from "@/components/dashboard/upcoming-appointments"
import { MechanicProductivityChart } from "@/components/dashboard/mechanic-productivity-chart"
import { ServiceRequestsChart } from "@/components/dashboard/service-requests-chart"
import { InventoryStatus } from "@/components/dashboard/inventory-status"
import { useAuth } from "@/lib/auth-context"
import { useSettings } from "@/lib/settings-context"
import { translations } from "@/lib/translations"
import { MechanicDashboard } from "@/components/dashboard/mechanic-dashboard"
import { ClientDashboard } from "@/components/dashboard/client-dashboard"

export default function DashboardPage() {
    const { user } = useAuth()
    const { settings } = useSettings()

    const t = translations[settings.language].dashboard

    if (!user) return null

    if (user.role === "MECHANIC") {
        return (
            <div className="flex flex-1 flex-col overflow-hidden">
                <PageHeader
                    title={t.title}
                    description={t.mechanicDescription}
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
                    title={t.title}
                    description={t.clientDescription}
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
                title={t.title}
                description={t.adminDescription}
            />
            <div className="flex-1 overflow-auto p-6">
                <div className="space-y-6">
                    <KpiCards />
                    <div className="grid gap-6 lg:grid-cols-2">
                        <RevenueChart />
                        <MechanicProductivityChart />
                    </div>
                    <div className="grid gap-6 lg:grid-cols-3">
                        <ServiceBreakdown />
                        <ServiceRequestsChart />
                        <InventoryStatus />
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
