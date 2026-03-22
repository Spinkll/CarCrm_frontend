"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Wrench, LogIn } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const result = await login(email, password)

    if (result.success) {
      router.replace("/dashboard")
    } else {
      setError(result.error || "Помилка входу")
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
        <p className="text-sm text-muted-foreground">Увійдіть, щоб керувати роботою вашого автосервісу</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-base text-foreground">Вхід</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">Електронна пошта</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="bg-secondary"
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Пароль</Label>
                <Link href="/forgot-password" className="text-xs text-primary underline-offset-4 hover:underline">
                  Забули пароль?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введіть ваш пароль"
                className="bg-secondary"
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="gap-2" disabled={isLoading}>
              <LogIn className="size-4" />
              {isLoading ? "Вхід..." : "Увійти"}
            </Button>
          </form>

          <div className="mt-6 flex flex-col gap-2">
            <div className="text-center text-sm font-medium text-muted-foreground">
              Швидкий вхід:
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEmail("admin@admin.com")
                  setPassword("12345678")
                }}
                disabled={isLoading}
              >
                Адмін
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEmail("client@client.com")
                  setPassword("123456789")
                }}
                disabled={isLoading}
              >
                Клієнт
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEmail("mechanic@mechanic.com")
                  setPassword("12345678")
                }}
                disabled={isLoading}
              >
                Механік
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {"Немає облікового запису? "}
            <Link href="/register" className="text-primary underline-offset-4 hover:underline">
              Реєстрація
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}