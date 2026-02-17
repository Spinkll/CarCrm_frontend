"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Wrench, LogIn, Shield, Settings, User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

const demoAccounts = [
  { label: "Administrator", email: "admin@autocare.com", password: "admin123", icon: Shield, description: "Full access to all features" },
  { label: "Mechanic", email: "mike@autocare.com", password: "mech123", icon: Settings, description: "Assigned orders & appointments" },
  { label: "Client", email: "alex.johnson@email.com", password: "client123", icon: User, description: "Own vehicles, orders & appointments" },
]

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const result = login(email, password)
    if (result.success) {
      router.replace("/")
    } else {
      setError(result.error || "Login failed")
    }
  }

  function handleDemoLogin(demoEmail: string, demoPassword: string) {
    setError("")
    const result = login(demoEmail, demoPassword)
    if (result.success) {
      router.replace("/")
    } else {
      setError(result.error || "Login failed")
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <div className="flex flex-col items-center gap-2">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary">
          <Wrench className="size-6 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">AutoCare CRM</h1>
        <p className="text-sm text-muted-foreground">Sign in to manage your car service operations</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-base text-foreground">Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="bg-secondary"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="bg-secondary"
                required
              />
            </div>
            <Button type="submit" className="gap-2">
              <LogIn className="size-4" />
              Sign In
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            {"Don't have an account? "}
            <Link href="/register" className="text-primary underline-offset-4 hover:underline">
              Register
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Quick Demo Login
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {demoAccounts.map((demo) => (
            <button
              key={demo.email}
              onClick={() => handleDemoLogin(demo.email, demo.password)}
              className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-left transition-colors hover:bg-secondary"
            >
              <div className="flex size-8 items-center justify-center rounded-md bg-primary/10">
                <demo.icon className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{demo.label}</p>
                <p className="text-xs text-muted-foreground">{demo.description}</p>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
