"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { Label } from "@/components/ui/label"
import { Wrench, UserPlus, MailCheck, ArrowRight } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: ""
  })

  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.phone) {
      setError("Please fill in all fields")
      setIsLoading(false)
      return
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters")
      setIsLoading(false)
      return
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    const cleanPhone = form.phone.replace(/[\s\-\(\)]/g, "")

    const result = await register(
      form.firstName,
      form.lastName,
      form.email,
      form.password,
      cleanPhone
    )

    if (result.success) {
      setIsSuccess(true)
    } else {
      setError(result.error || "Registration failed")
    }
    setIsLoading(false)
  }

  if (isSuccess) {
    return (
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <MailCheck className="size-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Перевірте пошту</h1>
          <p className="text-muted-foreground whitespace-pre-line">
            Ми надіслали лист із підтвердженням на адресу
            <span className="font-semibold text-foreground d-block mt-1">{form.email}</span>
          </p>
        </div>

        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 text-center">
              <p className="text-sm text-muted-foreground">
                Будь ласка, перейдіть за посиланням у листі, щоб активувати свій обліковий запис і отримати повний доступ до системи.
              </p>
              <div className="rounded-lg bg-muted p-4 text-sm">
                <p>Не отримали лист? Перевірте папку "Спам" або зачекайте кілька хвилин.</p>
              </div>
              <Button asChild className="w-full mt-2 gap-2" variant="outline">
                <Link href="/login">
                  Повернутися до входу
                  <ArrowRight className="size-4" />
                </Link>
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
        <h1 className="text-2xl font-bold text-foreground">Створити обліковий запис</h1>
        <p className="text-sm text-muted-foreground">Зареєструйтесь, щоб розпочати роботу з WagGarage CRM</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-base text-foreground">Зареєструватися</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">Ім'я</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="Іван"
                  className="bg-secondary"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Прізвище</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="Шевченко"
                  className="bg-secondary"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reg-email">Електронна пошта</Label>
              <Input
                id="reg-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@email.com"
                className="bg-secondary"
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Номер телефону</Label>
              <PhoneInput
                id="phone"
                value={form.phone}
                onValueChange={(val) => setForm({ ...form, phone: val })}
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reg-password">Пароль</Label>
              <Input
                id="reg-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Принаймні 8 символів"
                className="bg-secondary"
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reg-confirm">Підтвердьте пароль</Label>
              <Input
                id="reg-confirm"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Введіть свій пароль ще раз"
                className="bg-secondary"
                required
                disabled={isLoading}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Реєструючись, ви створите обліковий запис клієнта. Облікові записи співробітників створюються адміністраторами.
            </p>

            <Button type="submit" className="gap-2" disabled={isLoading}>
              <UserPlus className="size-4" />
              {isLoading ? "Створення..." : "Створити обліковий запис"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Вже маєте обліковий запис?{" "}
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">
              Увійти
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
