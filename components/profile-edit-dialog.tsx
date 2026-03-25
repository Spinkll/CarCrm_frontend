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
import { PhoneInput } from "@/components/ui/phone-input"
import { Label } from "@/components/ui/label"
import { User, Mail, Phone, Loader2, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/hooks/use-toast"

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

        const trimmedPhone = phone.trim()
        
        if (!trimmedPhone) {
            const errorMsg = "Телефон не може бути порожнім"
            setError(errorMsg)
            toast({
                title: "Помилка",
                description: errorMsg,
                variant: "destructive"
            })
            return
        }

        if (trimmedPhone === user?.phone) {
            onOpenChange(false)
            return
        }

        setIsLoading(true)

        // Clean phone number (remove spaces, dashes, parentheses)
        const cleanPhone = trimmedPhone.replace(/[\s\-\(\)]/g, "")

        const result = await updateProfile({
            phone: cleanPhone,
        })

        if (result.success) {
            setIsSuccess(true)
            toast({
                title: "Успішно оновлено",
                description: "Ваш номер телефону було змінено",
                variant: "success"
            })
            // Close after a brief delay to show success state
            setTimeout(() => {
                onOpenChange(false)
            }, 1000)
        } else {
            const errorMsg = result.error || "Не вдалося оновити профіль"
            setError(errorMsg)
            toast({
                title: "Помилка",
                description: errorMsg,
                variant: "destructive"
            })
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
                        <Button onClick={() => onOpenChange(false)} className="mt-2 text-primary border-primary hover:bg-primary/10" variant="outline">
                            Закрити
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="grid gap-4">
                        {error && (
                            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive font-medium">
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
                                <div className="flex items-center gap-2">
                                    <Phone className="size-4 text-muted-foreground" />
                                    {user?.phone ? (
                                        user.phone.replace(/\D/g, '').length === 12 && user.phone.replace(/\D/g, '').startsWith('380') 
                                            ? `+380 (${user.phone.replace(/\D/g, '').slice(3, 5)}) ${user.phone.replace(/\D/g, '').slice(5, 8)}-${user.phone.replace(/\D/g, '').slice(8, 10)}-${user.phone.replace(/\D/g, '').slice(10, 12)}`
                                            : user.phone
                                    ) : "Телефон не вказано"}
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Зміна імені та електронної пошти наразі недоступна. Зверніться до адміністратора для їх зміни.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="profile-phone" className="text-sm font-medium text-muted-foreground">Новий телефон</Label>
                            <PhoneInput
                                id="profile-phone"
                                value={phone}
                                onValueChange={(val) => setPhone(val)}
                                disabled={isLoading}
                                className="bg-secondary border-transparent focus:border-primary/50 transition-all font-mono"
                            />
                        </div>

                        <Button type="submit" className="gap-2 mt-2 w-full shadow-md transition-all active:scale-95" disabled={isLoading}>
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
