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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2, Banknote, Calendar } from "lucide-react"
import api from "@/lib/api"
import { format } from "date-fns"
import { uk } from "date-fns/locale"

interface WorkItem {
    id: number
    orderId: number
    car: string
    serviceName: string
    earned: number
    date: string
}

interface EarningsData {
    period: {
        start: string
        end: string
    }
    commissionEarnings: number
    baseSalary: number
    totalEarnings: number
    works: WorkItem[]
}

const monthNames = [
    "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
    "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"
]

export default function EarningsPage() {
    const { user } = useAuth()
    const now = new Date()

    const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1))
    const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()))
    const [data, setData] = useState<EarningsData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const years = useMemo(() => {
        const result: string[] = []
        for (let y = now.getFullYear(); y >= now.getFullYear() - 3; y--) {
            result.push(String(y))
        }
        return result
    }, [])

    useEffect(() => {
        async function fetchEarnings() {
            setIsLoading(true)
            setError(null)
            try {
                const response = await api.get("/payroll/my-earnings", {
                    params: { month: Number(selectedMonth), year: Number(selectedYear) }
                })
                setData(response.data)
            } catch (err: any) {
                console.error("Помилка завантаження доходів:", err)
                setError(err.response?.data?.message || "Не вдалося завантажити дані про доходи")
            } finally {
                setIsLoading(false)
            }
        }

        if (user?.role === "MECHANIC") {
            fetchEarnings()
        } else {
            setIsLoading(false)
        }
    }, [user, selectedMonth, selectedYear])

    if (!user || user.role !== "MECHANIC") return null

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            <PageHeader
                title="Мої доходи"
                description="Перегляд ваших доходів та виконаних робіт"
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
                ) : data ? (
                    <>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <Card className="border-border bg-card shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-semibold text-muted-foreground">Ставка</CardTitle>
                                    <Calendar className="size-4 text-primary/60" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">
                                        {data.baseSalary.toLocaleString()} ₴
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-medium">Фіксована частина</p>
                                </CardContent>
                            </Card>

                            <Card className="border-border bg-card shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-semibold text-muted-foreground">Відсоток з робіт</CardTitle>
                                    <Banknote className="size-4 text-primary/60" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">
                                        {data.commissionEarnings.toLocaleString()} ₴
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-medium">За {data.works.length} виконаних робіт</p>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20 bg-primary/5 shadow-md relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-1">
                                     <div className="bg-primary/10 text-primary text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">Разом</div>
                                </div>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-bold text-primary">До виплати</CardTitle>
                                    <Banknote className="size-4 text-primary" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-black text-primary">
                                        {data.totalEarnings.toLocaleString()} ₴
                                    </div>
                                    <p className="text-[10px] text-primary/70 mt-1 font-medium italic">
                                        За {monthNames[Number(selectedMonth) - 1]} {selectedYear}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="border-border bg-card">
                            <CardHeader>
                                <CardTitle>Деталізація виконаних робіт</CardTitle>
                                <CardDescription>
                                    Список усіх робіт за {monthNames[Number(selectedMonth) - 1].toLowerCase()} {selectedYear} р.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border hover:bg-transparent">
                                            <TableHead className="pl-6 text-muted-foreground">№ Замовлення</TableHead>
                                            <TableHead className="text-muted-foreground">Автомобіль</TableHead>
                                            <TableHead className="text-muted-foreground">Назва роботи</TableHead>

                                            <TableHead className="text-right text-muted-foreground">Зароблено</TableHead>
                                            <TableHead className="pr-6 text-right text-muted-foreground">Дата</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.works.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                                                    Ви ще не виконали жодних робіт за цей період
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            data.works.map((work) => (
                                                <TableRow key={work.id} className="border-border">
                                                    <TableCell className="pl-6 font-mono text-xs font-medium">
                                                        #{work.orderId}
                                                    </TableCell>
                                                    <TableCell>{work.car}</TableCell>
                                                    <TableCell className="max-w-[250px] truncate" title={work.serviceName}>
                                                        {work.serviceName}
                                                    </TableCell>

                                                    <TableCell className="text-right font-medium">
                                                        {work.earned.toLocaleString()} ₴
                                                    </TableCell>
                                                    <TableCell className="pr-6 text-right text-muted-foreground text-sm">
                                                        {format(new Date(work.date), "dd.MM.yyyy HH:mm")}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </>
                ) : null}
            </div>
        </div>
    )
}
