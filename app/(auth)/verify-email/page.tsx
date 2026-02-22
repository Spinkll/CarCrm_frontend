"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, XCircle, LogIn, MailCheck } from "lucide-react"
import api from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

export default function VerifyEmailPage() {
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
    const [errorMessage, setErrorMessage] = useState("")

    const { markEmailAsVerified, isAuthenticated } = useAuth()

    // Використовуємо ref, щоб уникнути подвійного виклику в React Strict Mode
    const isVerifying = useRef(false)

    useEffect(() => {
        if (!token) {
            setStatus("error")
            setErrorMessage("Токен верифікації відсутній у посиланні.")
            return
        }

        if (isVerifying.current) return
        isVerifying.current = true

        const verifyEmail = async () => {
            try {
                await api.post("/auth/verify-email", { token })
                setStatus("success")
                markEmailAsVerified()
            } catch (error: any) {
                setStatus("error")
                setErrorMessage(
                    error.response?.data?.message ||
                    "Не вдалося підтвердити електронну пошту. Можливо, посилання застаріло."
                )
            }
        }

        verifyEmail()
    }, [token])

    return (
        <div className="flex w-full max-w-md flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary">
                    <MailCheck className="size-6 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">WagGarage CRM</h1>
            </div>

            <Card className="border-border bg-card">
                <CardHeader className="pb-4 text-center">
                    <CardTitle className="text-xl text-foreground">
                        Підтвердження пошти
                    </CardTitle>
                    <CardDescription>
                        {status === "loading" && "Зачекайте, ми перевіряємо посилання..."}
                        {status === "success" && "Успішно підтверджено!"}
                        {status === "error" && "Помилка верифікації"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-6 text-center">

                    {status === "loading" && (
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="size-12 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">
                                Обробка вашого запиту...
                            </p>
                        </div>
                    )}

                    {status === "success" && (
                        <div className="flex flex-col items-center gap-6">
                            <CheckCircle2 className="size-16 text-green-500" />
                            <p className="text-sm text-muted-foreground">
                                Вашу електронну пошту успішно підтверджено. Тепер ви можете користуватися всіма функціями системи, включаючи додавання автомобілів та створення заявок на сервіс.
                            </p>
                            <Button asChild className="w-full gap-2">
                                {isAuthenticated ? (
                                    <Link href="/">
                                        Перейти на головну
                                    </Link>
                                ) : (
                                    <Link href="/login">
                                        <LogIn className="size-4" />
                                        Перейти до входу
                                    </Link>
                                )}
                            </Button>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="flex flex-col items-center gap-6">
                            <XCircle className="size-16 text-destructive" />
                            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                                {errorMessage}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Ви можете спробувати авторизуватися або запросити нове посилання для підтвердження пізніше.
                            </p>
                            <Button asChild variant="outline" className="w-full">
                                <Link href="/login">Повернутися на головну</Link>
                            </Button>
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    )
}
