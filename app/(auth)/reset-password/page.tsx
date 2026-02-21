"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Wrench, Lock, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react"
import api from "@/lib/api"

function ResetPasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isReset, setIsReset] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError("")

        if (password.length < 8) {
            setError("Пароль повинен містити мінімум 8 символів")
            return
        }

        if (password !== confirmPassword) {
            setError("Паролі не збігаються")
            return
        }

        setIsLoading(true)

        try {
            await api.post("/auth/reset-password", { token, password })
            setIsReset(true)
        } catch (err: any) {
            const msg = err.response?.data?.message || "Не вдалося скинути пароль"
            setError(Array.isArray(msg) ? msg[0] : msg)
        } finally {
            setIsLoading(false)
        }
    }

    if (!token) {
        return (
            <div className="flex w-full max-w-md flex-col gap-6">
                <div className="flex flex-col items-center gap-2">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary">
                        <Wrench className="size-6 text-primary-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">WagGarage CRM</h1>
                </div>

                <Card className="border-border bg-card">
                    <CardContent className="p-6">
                        <div className="flex flex-col items-center gap-4 py-4">
                            <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
                                <Lock className="size-7 text-destructive" />
                            </div>
                            <div className="text-center">
                                <p className="font-medium text-foreground">Невірне посилання</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Посилання для скидання паролю недійсне або застаріле. Спробуйте надіслати запит повторно.
                                </p>
                            </div>
                            <Button asChild className="mt-2 gap-2">
                                <Link href="/forgot-password">Надіслати повторно</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex w-full max-w-md flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary">
                    <Wrench className="size-6 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">WagGarage CRM</h1>
                <p className="text-sm text-muted-foreground">Встановлення нового паролю</p>
            </div>

            <Card className="border-border bg-card">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base text-foreground">Новий пароль</CardTitle>
                </CardHeader>
                <CardContent>
                    {isReset ? (
                        <div className="flex flex-col items-center gap-4 py-4">
                            <div className="flex size-14 items-center justify-center rounded-full bg-success/10">
                                <CheckCircle2 className="size-7 text-success" />
                            </div>
                            <div className="text-center">
                                <p className="font-medium text-foreground">Пароль змінено!</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Ваш пароль успішно скинуто. Тепер ви можете увійти з новим паролем.
                                </p>
                            </div>
                            <Button asChild className="mt-2 gap-2">
                                <Link href="/login">Увійти в систему</Link>
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="grid gap-4">
                            {error && (
                                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                    {error}
                                </div>
                            )}
                            <div className="grid gap-2">
                                <Label htmlFor="password">Новий пароль</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Мінімум 6 символів"
                                        className="bg-secondary pl-9 pr-10"
                                        required
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="confirm">Підтвердження паролю</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="confirm"
                                        type={showConfirm ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Повторіть новий пароль"
                                        className="bg-secondary pl-9 pr-10"
                                        required
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                            </div>
                            <Button type="submit" className="gap-2" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Збереження...
                                    </>
                                ) : (
                                    "Зберегти новий пароль"
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    )
}
