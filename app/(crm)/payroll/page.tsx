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
import { Button } from "@/components/ui/button"
import { Loader2, Banknote, Users, TrendingUp, Eye } from "lucide-react"
import api from "@/lib/api"
import { format } from "date-fns"
import { uk } from "date-fns/locale"

interface MechanicWork {
    id: number
    orderId: number
    car: string
    serviceName: string
    earned: number
    date: string
}

interface MechanicPayroll {
    mechanicId: number
    mechanicName: string
    worksCount: number
    totalEarnings: number
    works: MechanicWork[]
}

const monthNames = [
    "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
    "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"
]

export default function PayrollPage() {
    const { user } = useAuth()
    const now = new Date()

    const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1))
    const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()))
    const [data, setData] = useState<MechanicPayroll[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [detailMechanic, setDetailMechanic] = useState<MechanicPayroll | null>(null)
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
    const mechanicsWithEarnings = data.filter(m => m.totalEarnings > 0).length
    const avgSalary = mechanicsWithEarnings > 0 ? Math.round(totalFund / mechanicsWithEarnings) : 0

    const openDetail = (mechanic: MechanicPayroll) => {
        setDetailMechanic(mechanic)
        setDetailOpen(true)
    }

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            <PageHeader
                title="Зарплати механіків"
                description="Перегляд нарахувань та деталізація по кожному механіку"
            />

            <div className="flex-1 overflow-auto p-6 space-y-6">
                {/* Селектор періоду */}
                <div className="flex items-center gap-3">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[160px] bg-card">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {monthNames.map((name, i) => (
                                <SelectItem key={i + 1} value={String(i + 1)}>
                                    {name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
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
                                    <CardTitle className="text-sm font-medium">Механіків з нарахуваннями</CardTitle>
                                    <Users className="size-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{mechanicsWithEarnings}</div>
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
                                        на одного механіка
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Таблиця механіків */}
                        <Card className="border-border bg-card">
                            <CardHeader>
                                <CardTitle>Деталізація по механіках</CardTitle>
                                <CardDescription>
                                    Нарахування за {monthNames[Number(selectedMonth) - 1].toLowerCase()} {selectedYear} р.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border hover:bg-transparent">
                                            <TableHead className="pl-6 text-muted-foreground">Механік</TableHead>
                                            <TableHead className="text-center text-muted-foreground">Виконано робіт</TableHead>
                                            <TableHead className="text-right text-muted-foreground">Нараховано</TableHead>
                                            <TableHead className="pr-6 text-right text-muted-foreground">Дії</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                                                    Немає даних за обраний період
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            data.map((mechanic) => (
                                                <TableRow key={mechanic.mechanicId} className="border-border">
                                                    <TableCell className="pl-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex size-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
                                                                {mechanic.mechanicName.split(" ").map(n => n[0]).join("").toUpperCase()}
                                                            </div>
                                                            <span className="font-medium text-foreground">{mechanic.mechanicName}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center text-foreground">{mechanic.worksCount}</TableCell>
                                                    <TableCell className="text-right font-medium text-foreground">
                                                        {mechanic.totalEarnings.toLocaleString()} ₴
                                                    </TableCell>
                                                    <TableCell className="pr-6 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="gap-1.5 text-xs"
                                                            onClick={() => openDetail(mechanic)}
                                                            disabled={mechanic.worksCount === 0}
                                                        >
                                                            <Eye className="size-4" />
                                                            Деталі
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* Модальне вікно деталей механіка */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>
                            Деталізація: {detailMechanic?.mechanicName}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto">
                        {detailMechanic && detailMechanic.works.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border hover:bg-transparent">
                                        <TableHead className="pl-4 text-muted-foreground">№ Замовлення</TableHead>
                                        <TableHead className="text-muted-foreground">Автомобіль</TableHead>
                                        <TableHead className="text-muted-foreground">Назва роботи</TableHead>
                                        <TableHead className="text-right text-muted-foreground">Зароблено</TableHead>
                                        <TableHead className="pr-4 text-right text-muted-foreground">Дата</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {detailMechanic.works.map((work) => (
                                        <TableRow key={work.id} className="border-border">
                                            <TableCell className="pl-4 font-mono text-xs font-medium">
                                                #{work.orderId}
                                            </TableCell>
                                            <TableCell className="text-sm">{work.car}</TableCell>
                                            <TableCell className="max-w-[200px] truncate text-sm" title={work.serviceName}>
                                                {work.serviceName}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {work.earned.toLocaleString()} ₴
                                            </TableCell>
                                            <TableCell className="pr-4 text-right text-muted-foreground text-sm">
                                                {format(new Date(work.date), "dd.MM.yyyy HH:mm")}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="py-12 text-center text-muted-foreground">
                                Цей механік не виконав жодних робіт за обраний період
                            </div>
                        )}
                    </div>
                    {detailMechanic && detailMechanic.works.length > 0 && (
                        <div className="border-t border-border pt-4 flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                                Всього робіт: {detailMechanic.worksCount}
                            </span>
                            <span className="text-lg font-bold text-foreground">
                                Разом: {detailMechanic.totalEarnings.toLocaleString()} ₴
                            </span>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
