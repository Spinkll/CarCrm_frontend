"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface ChangePasswordDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
    const { changePassword } = useAuth()

    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const [showCurrent, setShowCurrent] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    function resetForm() {
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setError("")
        setIsLoading(false)
        setIsSuccess(false)
        setShowCurrent(false)
        setShowNew(false)
        setShowConfirm(false)
    }

    function handleOpenChange(value: boolean) {
        if (!value) resetForm()
        onOpenChange(value)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError("")

        if (!currentPassword) {
            setError("Введіть поточний пароль")
            return
        }

        if (newPassword.length < 8) {
            setError("Новий пароль повинен містити мінімум 8 символів")
            return
        }

        if (newPassword !== confirmPassword) {
            setError("Паролі не збігаються")
            return
        }

        setIsLoading(true)

        const result = await changePassword(currentPassword, newPassword)

        if (result.success) {
            setIsSuccess(true)
        } else {
            setError(result.error || "Не вдалося змінити пароль")
        }

        setIsLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Змінити пароль</DialogTitle>
                </DialogHeader>

                {isSuccess ? (
                    <div className="flex flex-col items-center gap-4 py-6">
                        <div className="flex size-14 items-center justify-center rounded-full bg-green-500/10">
                            <CheckCircle2 className="size-7 text-green-500" />
                        </div>
                        <div className="text-center">
                            <p className="font-medium text-foreground">Пароль змінено!</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Ваш пароль успішно оновлено.
                            </p>
                        </div>
                        <Button onClick={() => handleOpenChange(false)} className="mt-2">
                            Закрити
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
                            <Label htmlFor="current-password">Поточний пароль</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="current-password"
                                    type={showCurrent ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Введіть поточний пароль"
                                    className="bg-secondary pl-9 pr-10"
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrent(!showCurrent)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="new-password">Новий пароль</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="new-password"
                                    type={showNew ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Мінімум 8 символів"
                                    className="bg-secondary pl-9 pr-10"
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="confirm-password">Підтвердження нового паролю</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="confirm-password"
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
                                "Змінити пароль"
                            )}
                        </Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
