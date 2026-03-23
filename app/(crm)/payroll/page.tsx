"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Banknote, Users, TrendingUp, Eye, Percent, Settings, Briefcase } from "lucide-react"
import api from "@/lib/api"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/hooks/use-translation"

interface WorkDetail {
    orderId: number
    car: string
    description: string
    earned: number
    date: string
}

interface EmployeePayroll {
    employeeId: number
    name: string
    role: string
    currentCommissionRate: number
    baseSalary: number
    commissionEarnings: number
    totalEarnings: number
    tasksCount: number
    details: WorkDetail[]
}

export default function PayrollPage() {
    const { user } = useAuth()
    const { t, lang } = useTranslation()
    const now = new Date()

    const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1))
    const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()))
    const [data, setData] = useState<EmployeePayroll[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [detailEmployee, setDetailEmployee] = useState<EmployeePayroll | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)

    const monthNames = (t("months", "payroll") as unknown as string[]) || []

    const roleConfig: Record<string, { label: string; icon: any; className: string }> = {
        ADMIN: { label: t("admin", "employees"), icon: Briefcase, className: "bg-primary/15 text-primary border-primary/30" },
        MECHANIC: { label: t("mechanic", "employees"), icon: Settings, className: "bg-orange-100 text-orange-700 border-orange-200" },
        MANAGER: { label: t("manager", "employees"), icon: Briefcase, className: "bg-purple-100 text-purple-700 border-purple-200" },
    }

    const years = useMemo(() => {
        const result: string[] = []
        for (let y = now.getFullYear(); y >= now.getFullYear() - 3; y--) {
            result.push(String(y))
        }
        return result
    }, [])

    useEffect(() => {
        async function fetchPayroll() {
            setIsLoading(true)
            setError(null)
            try {
                const response = await api.get("/payroll/summary", {
                    params: { month: Number(selectedMonth), year: Number(selectedYear) }
                })
                const summary = response.data?.summary
                setData(Array.isArray(summary) ? summary : [])
            } catch (err: any) {
                console.error("Failed to fetch payroll:", err)
                setError(err.response?.data?.message || t("fetchError", "payroll"))
            } finally {
                setIsLoading(false)
            }
        }

        if (user?.role === "ADMIN" || user?.role === "MANAGER") {
            fetchPayroll()
        }
    }, [user, selectedMonth, selectedYear, t])

    if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) return null

    const totalFund = data.reduce((sum, m) => sum + m.totalEarnings, 0)
    const employeesWithPayroll = data.filter(m => m.totalEarnings > 0).length
    const avgSalary = employeesWithPayroll > 0 ? Math.round(totalFund / employeesWithPayroll) : 0

    const openDetail = (employee: EmployeePayroll) => {
        setDetailEmployee(employee)
        setDetailOpen(true)
    }

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            <PageHeader
                title={t("title", "payroll")}
                description={t("description", "payroll")}
            />

            <div className="flex-1 overflow-auto p-6 space-y-6">
                {/* Селектор періоду */}
                <div className="flex items-center gap-3">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[160px] bg-card">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {monthNames.map((name, i) => {
                                const isFutureMonth = Number(selectedYear) === now.getFullYear() && (i + 1) > (now.getMonth() + 1);
                                return (
                                    <SelectItem key={i + 1} value={String(i + 1)} disabled={isFutureMonth}>
                                        {name}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                    <Select value={selectedYear} onValueChange={(year) => {
                        setSelectedYear(year);
                        if (Number(year) === now.getFullYear() && Number(selectedMonth) > now.getMonth() + 1) {
                            setSelectedMonth(String(now.getMonth() + 1));
                        }
                    }}>
                        <SelectTrigger className="w-[100px] bg-card">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map((y) => (
                                <SelectItem key={y} value={y}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="size-8 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <Card className="border-red-200 bg-red-50/50">
                        <CardContent className="p-6 text-center text-red-600">
                            {error}
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Картки-підсумки */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card className="border-border bg-card">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{t("totalFund", "payroll")}</CardTitle>
                                    <Banknote className="size-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{totalFund.toLocaleString()} ₴</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {t("fundPeriod", "payroll")
                                            .replace("{month}", monthNames[Number(selectedMonth) - 1])
                                            .replace("{year}", selectedYear)}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-border bg-card">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{t("employeesCount", "payroll")}</CardTitle>
                                    <Users className="size-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{employeesWithPayroll}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {t("employeesSub", "payroll").replace("{total}", data.length.toString())}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-border bg-card">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{t("avgSalary", "payroll")}</CardTitle>
                                    <TrendingUp className="size-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{avgSalary.toLocaleString()} ₴</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {t("avgSub", "payroll")}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Таблиця працівників */}
                        <Card className="border-border bg-card">
                            <CardHeader>
                                <CardTitle>{t("breakdownTitle", "payroll")}</CardTitle>
                                <CardDescription>
                                    {t("breakdownDesc", "payroll")
                                        .replace("{month}", monthNames[Number(selectedMonth) - 1].toLowerCase())
                                        .replace("{year}", selectedYear)}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border hover:bg-transparent">
                                            <TableHead className="pl-6 text-muted-foreground">{t("tableHeader_employee", "payroll")}</TableHead>
                                            <TableHead className="text-center text-muted-foreground">{t("tableHeader_role", "payroll")}</TableHead>
                                            <TableHead className="text-right text-muted-foreground">{t("tableHeader_base", "payroll")}</TableHead>
                                            <TableHead className="text-right text-muted-foreground">{t("tableHeader_commission", "payroll")}</TableHead>
                                            <TableHead className="text-right text-muted-foreground">{t("tableHeader_fromWork", "payroll")}</TableHead>
                                            <TableHead className="text-right text-muted-foreground font-semibold">{t("tableHeader_total", "payroll")}</TableHead>
                                            <TableHead className="pr-6 text-right text-muted-foreground">{t("tableHeader_actions", "payroll")}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                                                    {t("emptyData", "payroll")}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            data.map((emp) => {
                                                const baseSalary = Number(emp.baseSalary) || 0
                                                const commissionEarnings = Number(emp.commissionEarnings) || 0
                                                const totalToPay = Number(emp.totalEarnings) || 0
                                                const config = roleConfig[emp.role] || roleConfig.MECHANIC

                                                return (
                                                    <TableRow key={emp.employeeId} className="border-border">
                                                        <TableCell className="pl-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex size-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
                                                                    {(emp.name || "").split(" ").map(n => n?.[0] || "").join("").toUpperCase()}
                                                                </div>
                                                                <span className="font-medium text-foreground">{emp.name}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge
                                                                variant="outline"
                                                                className={cn(
                                                                    "gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
                                                                    config.className
                                                                )}
                                                            >
                                                                <config.icon className="size-3" />
                                                                {config.label}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right text-foreground">
                                                            {baseSalary > 0 ? (
                                                                <span>{baseSalary.toLocaleString()} ₴</span>
                                                            ) : (
                                                                <span className="text-muted-foreground">—</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {emp.currentCommissionRate ? (
                                                                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-medium text-blue-700">
                                                                    <Percent className="size-3" />
                                                                    {emp.currentCommissionRate}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground">—</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right text-foreground">
                                                            {commissionEarnings > 0 ? (
                                                                <span>{commissionEarnings.toLocaleString()} ₴</span>
                                                            ) : (
                                                                <span className="text-muted-foreground">—</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <span className="font-bold text-foreground text-base">
                                                                {totalToPay.toLocaleString()} ₴
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="pr-6 text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="gap-1.5 text-xs"
                                                                onClick={() => openDetail(emp)}
                                                                disabled={emp.tasksCount === 0}
                                                            >
                                                                <Eye className="size-4" />
                                                                {t("detailsBtn", "payroll")}
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* Модальне вікно деталей */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>
                            {t("dialogTitle", "payroll").replace("{name}", detailEmployee?.name || "")}
                            {detailEmployee?.currentCommissionRate ? (
                                <span className="ml-2 text-sm font-normal text-muted-foreground">
                                    {t("dialogCommission", "payroll").replace("{rate}", detailEmployee.currentCommissionRate.toString())}
                                </span>
                            ) : null}
                        </DialogTitle>
                    </DialogHeader>

                    {/* Підсумок */}
                    {detailEmployee && (
                        <div className="grid grid-cols-3 gap-3 px-1">
                            <div className="rounded-lg bg-secondary p-3 text-center">
                                <p className="text-xs text-muted-foreground mb-1">{t("labelBase", "payroll")}</p>
                                <p className="font-semibold text-foreground">
                                    {(Number(detailEmployee.baseSalary) || 0).toLocaleString()} ₴
                                </p>
                            </div>
                            <div className="rounded-lg bg-secondary p-3 text-center">
                                <p className="text-xs text-muted-foreground mb-1">{t("labelFromWork", "payroll")}</p>
                                <p className="font-semibold text-foreground">
                                    {(Number(detailEmployee.commissionEarnings) || 0).toLocaleString()} ₴
                                </p>
                            </div>
                            <div className="rounded-lg bg-primary/10 p-3 text-center">
                                <p className="text-xs text-muted-foreground mb-1">{t("labelTotal", "payroll")}</p>
                                <p className="font-bold text-primary text-lg">
                                    {(Number(detailEmployee.totalEarnings) || 0).toLocaleString()} ₴
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-auto">
                        {detailEmployee && detailEmployee.details.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border hover:bg-transparent">
                                        <TableHead className="pl-4 text-muted-foreground">{t("modalTableHeader_order", "payroll")}</TableHead>
                                        <TableHead className="text-muted-foreground">{t("modalTableHeader_car", "payroll")}</TableHead>
                                        <TableHead className="text-muted-foreground">{t("modalTableHeader_desc", "payroll")}</TableHead>
                                        <TableHead className="text-right text-muted-foreground">{t("modalTableHeader_earned", "payroll")}</TableHead>
                                        <TableHead className="pr-4 text-right text-muted-foreground">{t("modalTableHeader_date", "payroll")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {detailEmployee.details.map((detail, idx) => (
                                        <TableRow key={`${detail.orderId}-${idx}`} className="border-border">
                                            <TableCell className="pl-4 font-mono text-xs font-medium">
                                                #{detail.orderId}
                                            </TableCell>
                                            <TableCell className="text-sm">{detail.car}</TableCell>
                                            <TableCell className="max-w-[200px] truncate text-sm" title={detail.description}>
                                                {detail.description}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {detail.earned.toLocaleString()} ₴
                                            </TableCell>
                                            <TableCell className="pr-4 text-right text-muted-foreground text-sm">
                                                {format(new Date(detail.date), "dd.MM.yyyy HH:mm")}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="py-12 text-center text-muted-foreground">
                                {t("emptyDetails", "payroll")}
                            </div>
                        )}
                    </div>
                    {detailEmployee && detailEmployee.details.length > 0 && (
                        <div className="border-t border-border pt-4 flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                                {t("footerTasks", "payroll").replace("{count}", detailEmployee.tasksCount.toString())}
                            </span>
                            <span className="text-lg font-bold text-foreground">
                                {t("footerComm", "payroll").replace("{amount}", (Number(detailEmployee.commissionEarnings) || 0).toLocaleString())}
                            </span>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
