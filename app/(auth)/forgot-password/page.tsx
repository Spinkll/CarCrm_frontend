"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Wrench, ArrowLeft, Mail, Loader2, CheckCircle2 } from "lucide-react"
import api from "@/lib/api"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSent, setIsSent] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            await api.post("/auth/forgot-password", { email })
            setIsSent(true)
        } catch (err: any) {
            const msg = err.response?.data?.message || "Не вдалося надіслати лист"
            setError(Array.isArray(msg) ? msg[0] : msg)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex w-full max-w-md flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary">
                    <Wrench className="size-6 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">WagGarage CRM</h1>
                <p className="text-sm text-muted-foreground">Відновлення доступу до облікового запису</p>
            </div>

            <Card className="border-border bg-card">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base text-foreground">Забули пароль?</CardTitle>
                </CardHeader>
                <CardContent>
                    {isSent ? (
                        <div className="flex flex-col items-center gap-4 py-4">
                            <div className="flex size-14 items-center justify-center rounded-full bg-success/10">
                                <CheckCircle2 className="size-7 text-success" />
                            </div>
                            <div className="text-center">
                                <p className="font-medium text-foreground">Лист надіслано!</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Перевірте вашу пошту <strong className="text-foreground">{email}</strong> та перейдіть за посиланням для скидання паролю.
                                </p>
                            </div>
                            <Button variant="outline" asChild className="mt-2 gap-2">
                                <Link href="/login">
                                    <ArrowLeft className="size-4" />
                                    Повернутися до входу
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <>
                            <p className="mb-4 text-sm text-muted-foreground">
                                Введіть адресу електронної пошти, пов'язану з вашим обліковим записом. Ми надішлемо вам посилання для скидання паролю.
                            </p>
                            <form onSubmit={handleSubmit} className="grid gap-4">
                                {error && (
                                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                        {error}
                                    </div>
                                )}
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Електронна пошта</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@email.com"
                                            className="bg-secondary pl-9"
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="gap-2" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            Надсилання...
                                        </>
                                    ) : (
                                        "Надіслати посилання"
                                    )}
                                </Button>
                            </form>

                            <div className="mt-4 text-center text-sm text-muted-foreground">
                                <Link href="/login" className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline">
                                    <ArrowLeft className="size-3" />
                                    Повернутися до входу
                                </Link>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
