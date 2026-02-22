"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Mail, Phone, Loader2, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface ProfileEditDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ProfileEditDialog({ open, onOpenChange }: ProfileEditDialogProps) {
    const { user, updateProfile } = useAuth()

    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [phone, setPhone] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    useEffect(() => {
        if (open && user) {
            setFirstName(user.firstName || "")
            setLastName(user.lastName || "")
            setPhone(user.phone || "")
            setError("")
            setIsSuccess(false)
        }
    }, [open, user])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError("")

        setIsLoading(true)

        const result = await updateProfile({
            phone: phone.trim() || undefined,
        })

        if (result.success) {
            setIsSuccess(true)
        } else {
            setError(result.error || "Не вдалося оновити профіль")
        }

        setIsLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Мій профіль</DialogTitle>
                </DialogHeader>

                {isSuccess ? (
                    <div className="flex flex-col items-center gap-4 py-6">
                        <div className="flex size-14 items-center justify-center rounded-full bg-green-500/10">
                            <CheckCircle2 className="size-7 text-green-500" />
                        </div>
                        <div className="text-center">
                            <p className="font-medium text-foreground">Профіль оновлено!</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Ваші дані успішно збережено.
                            </p>
                        </div>
                        <Button onClick={() => onOpenChange(false)} className="mt-2">
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

                        <div className="rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-muted-foreground">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <User className="size-4" />
                                    <span className="font-medium text-foreground">{user?.firstName} {user?.lastName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="size-4" />
                                    {user?.email}
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Зміна імені та електронної пошти наразі недоступна. Зверніться до адміністратора для їх зміни.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="profile-phone">Контактний телефон</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="profile-phone"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+380..."
                                    className="bg-secondary pl-9"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <Button type="submit" className="gap-2" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Збереження...
                                </>
                            ) : (
                                "Зберегти зміни"
                            )}
                        </Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
