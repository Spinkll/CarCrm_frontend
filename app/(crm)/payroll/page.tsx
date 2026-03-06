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
import { uk } from "date-fns/locale"
import { cn } from "@/lib/utils"

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

const monthNames = [
    "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
    "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"
]

const roleConfig: Record<string, { label: string; icon: any; className: string }> = {
    ADMIN: { label: "Адміністратор", icon: Briefcase, className: "bg-primary/15 text-primary border-primary/30" },
    MECHANIC: { label: "Механік", icon: Settings, className: "bg-orange-100 text-orange-700 border-orange-200" },
    MANAGER: { label: "Менеджер", icon: Briefcase, className: "bg-purple-100 text-purple-700 border-purple-200" },
}

export default function PayrollPage() {
    const { user } = useAuth()
    const now = new Date()

    const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1))
    const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()))
    const [data, setData] = useState<EmployeePayroll[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [detailEmployee, setDetailEmployee] = useState<EmployeePayroll | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)

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
                console.error("Помилка завантаження зарплат:", err)
                setError(err.response?.data?.message || "Не вдалося завантажити дані про зарплати")
            } finally {
                setIsLoading(false)
            }
        }

        if (user?.role === "ADMIN" || user?.role === "MANAGER") {
            fetchPayroll()
        }
    }, [user, selectedMonth, selectedYear])

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
                title="Зарплати працівників"
                description="Перегляд нарахувань та деталізація по кожному працівнику"
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
                                    <CardTitle className="text-sm font-medium">Загальний фонд зарплат</CardTitle>
                                    <Banknote className="size-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{totalFund.toLocaleString()} ₴</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {monthNames[Number(selectedMonth) - 1]} {selectedYear}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-border bg-card">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Працівників з нарахуваннями</CardTitle>
                                    <Users className="size-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{employeesWithPayroll}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        з {data.length} загалом
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-border bg-card">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Середня зарплата</CardTitle>
                                    <TrendingUp className="size-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{avgSalary.toLocaleString()} ₴</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        на одного працівника
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Таблиця працівників */}
                        <Card className="border-border bg-card">
                            <CardHeader>
                                <CardTitle>Деталізація по працівниках</CardTitle>
                                <CardDescription>
                                    Нарахування за {monthNames[Number(selectedMonth) - 1].toLowerCase()} {selectedYear} р.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border hover:bg-transparent">
                                            <TableHead className="pl-6 text-muted-foreground">Працівник</TableHead>
                                            <TableHead className="text-center text-muted-foreground">Роль</TableHead>
                                            <TableHead className="text-right text-muted-foreground">Ставка</TableHead>
                                            <TableHead className="text-right text-muted-foreground">% від робіт</TableHead>
                                            <TableHead className="text-right text-muted-foreground">Від робіт</TableHead>
                                            <TableHead className="text-right text-muted-foreground font-semibold">До виплати</TableHead>
                                            <TableHead className="pr-6 text-right text-muted-foreground">Дії</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                                                    Немає даних за обраний період
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
                                                                Деталі
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
                            Деталізація: {detailEmployee?.name}
                            {detailEmployee?.currentCommissionRate ? (
                                <span className="ml-2 text-sm font-normal text-muted-foreground">
                                    (% від робіт: {detailEmployee.currentCommissionRate}%)
                                </span>
                            ) : null}
                        </DialogTitle>
                    </DialogHeader>

                    {/* Підсумок */}
                    {detailEmployee && (
                        <div className="grid grid-cols-3 gap-3 px-1">
                            <div className="rounded-lg bg-secondary p-3 text-center">
                                <p className="text-xs text-muted-foreground mb-1">Ставка</p>
                                <p className="font-semibold text-foreground">
                                    {(Number(detailEmployee.baseSalary) || 0).toLocaleString()} ₴
                                </p>
                            </div>
                            <div className="rounded-lg bg-secondary p-3 text-center">
                                <p className="text-xs text-muted-foreground mb-1">Від робіт</p>
                                <p className="font-semibold text-foreground">
                                    {(Number(detailEmployee.commissionEarnings) || 0).toLocaleString()} ₴
                                </p>
                            </div>
                            <div className="rounded-lg bg-primary/10 p-3 text-center">
                                <p className="text-xs text-muted-foreground mb-1">До виплати</p>
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
                                        <TableHead className="pl-4 text-muted-foreground">№ Замовлення</TableHead>
                                        <TableHead className="text-muted-foreground">Автомобіль</TableHead>
                                        <TableHead className="text-muted-foreground">Опис</TableHead>
                                        <TableHead className="text-right text-muted-foreground">Зароблено</TableHead>
                                        <TableHead className="pr-4 text-right text-muted-foreground">Дата</TableHead>
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
                                Цей працівник не має виконаних робіт за обраний період
                            </div>
                        )}
                    </div>
                    {detailEmployee && detailEmployee.details.length > 0 && (
                        <div className="border-t border-border pt-4 flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                                Всього задач: {detailEmployee.tasksCount}
                            </span>
                            <span className="text-lg font-bold text-foreground">
                                Від робіт: {(Number(detailEmployee.commissionEarnings) || 0).toLocaleString()} ₴
                            </span>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
