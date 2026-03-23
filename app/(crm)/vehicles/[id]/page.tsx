"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { ArrowLeft, Car, Calendar, Search, Wrench, Package, Clock, ShieldCheck, ChevronRight, FileText, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useSettings } from "@/lib/settings-context"
import { formatAppDate } from "@/lib/utils"
import { useTranslation } from "@/hooks/use-translation"

export default function VehicleHistoryPage() {
    const params = useParams()
    const router = useRouter()
    const vehicleId = Number(params.id)
    const { settings } = useSettings()
    const { t } = useTranslation()
    const td = (key: string) => t(key, "vehicles")

    const [historyData, setHistoryData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Фільтри (API)
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [minAmount, setMinAmount] = useState("")
    const [maxAmount, setMaxAmount] = useState("")

    // Фільтри (Локальні / Клієнтські)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [typeFilter, setTypeFilter] = useState("ALL") // ALL, SERVICE, PART

    const statusOptions = [
        "PENDING", "CONFIRMED", "IN_PROGRESS", "WAITING_PARTS", "COMPLETED", "PAID", "CANCELLED"
    ]

    useEffect(() => {
        const fetchHistory = async () => {
            if (!vehicleId) return

            setIsLoading(true)
            try {
                const params = new URLSearchParams()
                if (startDate) params.append("startDate", startDate)
                if (endDate) params.append("endDate", endDate)
                if (minAmount) params.append("minAmount", minAmount)
                if (maxAmount) params.append("maxAmount", maxAmount)

                const { data } = await api.get(`/cars/${vehicleId}/history?${params.toString()}`)
                setHistoryData(data)
            } catch (error) {
                console.error("Failed to load vehicle history:", error)
            } finally {
                setIsLoading(false)
            }
        }

        const timeoutId = setTimeout(() => {
            fetchHistory()
        }, 300)

        return () => clearTimeout(timeoutId)
    }, [vehicleId, startDate, endDate, minAmount, maxAmount])

    // Застосування локальних фільтрів поверх наданого таймлайну
    const filteredTimeline = useMemo(() => {
        const rawTimeline = historyData?.timeline || []

        return rawTimeline.filter((order: any) => {
            // 1. Фільтр за статусом
            if (statusFilter !== "ALL" && order.status !== statusFilter) {
                return false
            }

            // 2. Фільтр за текстом (опис, назва послуги/запчастини)
            const q = searchQuery.toLowerCase()
            const searchMatch =
                !q ||
                (order.description && order.description.toLowerCase().includes(q)) ||
                (order.items && order.items.some((item: any) => item.name.toLowerCase().includes(q)))

            if (!searchMatch) return false

            // 3. Фільтр за типом робіт (лише ті замовлення, де є хоча б одна послуга чи запчастина потрібного типу)
            if (typeFilter !== "ALL") {
                if (!order.items || order.items.length === 0) return false

                const hasMatchingType = order.items.some((item: any) => {
                    const itemType = item.type || "SERVICE"
                    return itemType === typeFilter
                })

                if (!hasMatchingType) return false
            }

            return true
        })
    }, [historyData, searchQuery, statusFilter, typeFilter])

    const carInfo = historyData?.carInfo || null

    if (!carInfo && !isLoading) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <Car className="mb-4 size-12 opacity-20" />
                <p className="text-lg font-medium">{td("details.notFoundTitle")}</p>
                <p className="text-sm mt-1">{td("details.notFoundDesc")}</p>
                <Button variant="outline" className="mt-4" onClick={() => router.push('/vehicles')}>{td("details.back")}</Button>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            <PageHeader
                title={carInfo ? `${carInfo.fullName} (${carInfo.year})` : t("loading")}
                description={td("details.historyTitle")}
            >
                <Button variant="outline" onClick={() => router.push('/vehicles')} className="gap-2 h-9">
                    <ArrowLeft className="size-4" />
                    {td("details.allVehicles")}
                </Button>
            </PageHeader>

            <div className="flex-1 overflow-auto p-4 sm:p-6">
                <div className="mx-auto max-w-5xl space-y-6">

                    {/* Деталі авто та фільтри */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="md:col-span-1 border-border bg-card">
                            <CardHeader className="pb-3 border-b border-border">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Car className="size-5 text-primary" /> {td("details.info")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-3 text-sm">
                                <div>
                                    <span className="text-muted-foreground mr-2">{td("details.plateLabel")}</span>
                                    <Badge variant="outline" className="font-mono uppercase tracking-widest bg-secondary/30">{carInfo?.plate || "—"}</Badge>
                                </div>
                                <div>
                                    <span className="text-muted-foreground mr-2">{td("details.vinLabel")}</span>
                                    <span className="font-mono text-xs uppercase">{carInfo?.vin || "—"}</span>
                                </div>
                                {carInfo?.owner && (
                                    <div>
                                        <span className="text-muted-foreground mr-2">{td("details.ownerLabel")}</span>
                                        <span className="font-medium text-foreground">{carInfo.owner}</span>
                                    </div>
                                )}
                                <div>
                                    <span className="text-muted-foreground mr-2">{td("details.mileageLabel")}</span>
                                    <span className="font-medium text-foreground">{carInfo?.currentMileage?.toLocaleString() || 0} {t("km", "customers")}</span>
                                </div>
                                <div className="pt-2 border-t border-border mt-2 flex justify-between">
                                    <span className="text-muted-foreground">{td("details.totalVisits")}</span>
                                    <span className="font-medium text-foreground">{historyData?.totalOrders || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{td("details.totalSpent")}</span>
                                    <span className="font-medium text-primary">{Number(historyData?.totalSpent || 0).toLocaleString()} ₴</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-2 border-border bg-card">
                            <CardHeader className="pb-3 border-b border-border text-base">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Filter className="size-5 text-primary" /> {td("details.filtersTitle")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* API-фільтри */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">{td("details.dateFrom")}</label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="h-9"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">{td("details.dateTo")}</label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="h-9"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">{td("details.minAmount")}</label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={minAmount}
                                        onChange={(e) => setMinAmount(e.target.value)}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">{td("details.maxAmount")}</label>
                                    <Input
                                        type="number"
                                        placeholder="10000"
                                        value={maxAmount}
                                        onChange={(e) => setMaxAmount(e.target.value)}
                                        className="h-9"
                                    />
                                </div>

                                {/* Локальні фільтри */}
                                <div className="space-y-1.5 lg:col-span-2">
                                    <label className="text-xs font-medium text-muted-foreground">{td("details.quickSearchLabel")}</label>
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                                        <Input
                                            placeholder={td("details.quickSearchPlaceholder")}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9 h-9"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">{td("details.visitStatus")}</label>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder={td("details.allStatuses")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">{td("details.allStatuses")}</SelectItem>
                                            {statusOptions.map(status => (
                                                <SelectItem key={status} value={status}>{t("status_" + status, "search")}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">{td("details.workType")}</label>
                                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder={td("details.allTypes")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">{td("details.allTypes")}</SelectItem>
                                            <SelectItem value="SERVICE">{td("details.onlyServices")}</SelectItem>
                                            <SelectItem value="PART">{td("details.onlyParts")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Таймлайн */}
                    <div className="pt-4">
                        <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                            <Clock className="size-5 text-muted-foreground" /> {td("details.timelineTitle")}
                        </h3>

                        {isLoading ? (
                            <div className="flex justify-center p-12">
                                <Loader2 className="size-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredTimeline.length > 0 ? (
                            <div className="relative border-l-2 border-border/70 ml-3 md:ml-6 space-y-8 pb-8">
                                {filteredTimeline.map((order: any, index: number) => {
                                    const items = order.items || []

                                    const displayItems = typeFilter === "ALL"
                                        ? items
                                        : items.filter((i: any) => (i.type || "SERVICE") === typeFilter)

                                    return (
                                        <div key={order.orderId} className="relative pl-6 md:pl-8 group">
                                            <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-background border-2 border-primary group-hover:bg-primary transition-colors duration-300 shadow-sm" />

                                            <Card className="border-border bg-card hover:border-border/80 hover:shadow-md transition-all">
                                                <div className="flex flex-col md:flex-row md:items-start p-4 md:p-5 gap-4">

                                                    {/* Ліва частина */}
                                                    <div className="md:w-1/3 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-4">
                                                        <div className="flex items-center justify-between">
                                                            <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
                                                                {td("details.code")} #{order.orderId}
                                                            </Badge>
                                                            <StatusBadge status={order.status.toLowerCase()} />
                                                        </div>

                                                        <div className="space-y-1">
                                                            <div className="flex items-center text-sm text-foreground font-medium gap-2">
                                                                <Calendar className="size-4 text-primary" />
                                                                {formatAppDate(order.date, settings.dateFormat) || t("noData")}
                                                            </div>
                                                            {order.completedAt && (
                                                                <div className="flex items-center text-xs text-muted-foreground gap-2 pl-6">
                                                                    <span>{td("details.completedAt")} {formatAppDate(order.completedAt, settings.dateFormat)}</span>
                                                                </div>
                                                            )}
                                                            {order.mileageAtOrder && (
                                                                <div className="flex items-center text-xs text-muted-foreground gap-2 pl-6">
                                                                    <span>{t("mileage", "orders")}: {order.mileageAtOrder} {t("km", "customers")}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="mt-auto pt-2">
                                                            <p className="text-xs text-muted-foreground mb-1">{td("details.complaintsLabel")}</p>
                                                            <p className="text-sm italic text-foreground/80 line-clamp-3">
                                                                {order.description || "—"}
                                                            </p>
                                                        </div>

                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            className="mt-2 w-full justify-between text-xs"
                                                            onClick={() => router.push(`/orders-detail/${order.orderId}`)}
                                                        >
                                                            {td("details.viewOrderDetails")} <ChevronRight className="size-3" />
                                                        </Button>
                                                    </div>

                                                    {/* Права частина */}
                                                    <div className="md:w-2/3 flex flex-col">
                                                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
                                                            <FileText className="size-4 text-muted-foreground" />
                                                            {td("details.worksAndPartsTitle")}
                                                        </h4>

                                                        {displayItems.length > 0 ? (
                                                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                                                {displayItems.map((item: any) => {
                                                                    const isPart = item.type === "PART"
                                                                    return (
                                                                        <div key={item.id} className="flex items-start justify-between bg-secondary/30 rounded-md p-2.5 text-sm border border-border/50 hover:bg-secondary/50 transition-colors">
                                                                            <div className="flex items-start gap-2.5">
                                                                                <div className={`mt-0.5 rounded-sm p-1 ${isPart ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                                                    {isPart ? <Package className="size-3.5" /> : <Wrench className="size-3.5" />}
                                                                                </div>
                                                                                <div>
                                                                                    <p className="font-medium text-foreground leading-tight">{item.name}</p>
                                                                                    <p className="text-xs text-muted-foreground mt-0.5">{td("details.qty")} {item.quantity}</p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-right whitespace-nowrap pl-2 font-medium text-foreground text-sm">
                                                                                {(Number(item.price) * item.quantity).toLocaleString()} ₴
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center p-6 bg-secondary/20 rounded-lg text-muted-foreground border border-dashed border-border/60">
                                                                <p className="text-sm">{td("details.listEmpty")}</p>
                                                            </div>
                                                        )}

                                                        <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-sm">
                                                            <span className="text-muted-foreground font-medium">{td("details.totalVisitAmount")}</span>
                                                            <span className="text-base font-bold text-foreground">
                                                                {Number(order.totalAmount || 0).toLocaleString()} ₴
                                                            </span>
                                                        </div>
                                                    </div>

                                                </div>
                                            </Card>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-border rounded-xl bg-card">
                                <Calendar className="mb-4 size-10 text-muted-foreground/50" />
                                <h3 className="text-lg font-medium text-foreground mb-1">{td("details.noRecordsTitle")}</h3>
                                <p className="text-muted-foreground text-sm max-w-sm">
                                    {td("details.noRecordsDesc")}
                                </p>
                                {(startDate || endDate || minAmount || maxAmount || searchQuery || statusFilter !== "ALL" || typeFilter !== "ALL") && (
                                    <Button
                                        variant="link"
                                        className="mt-2 text-primary"
                                        onClick={() => {
                                            setStartDate("")
                                            setEndDate("")
                                            setMinAmount("")
                                            setMaxAmount("")
                                            setSearchQuery("")
                                            setStatusFilter("ALL")
                                            setTypeFilter("ALL")
                                        }}
                                    >
                                        {td("details.resetFilters")}
                                    </Button>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Кастомний стиль скролбару */}
            <style dangerouslySetInnerHTML={{
                __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground)/0.5); }
      `}} />
        </div>
    )
}
