"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { initialUsers, type AppUser, type UserRole } from "./data"

type AuthUser = Omit<AppUser, "password">

type AuthContextType = {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => { success: boolean; error?: string }
  register: (name: string, email: string, password: string, role: UserRole) => { success: boolean; error?: string }
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = "autocare-auth"
const USERS_KEY = "autocare-users"

function getStoredUsers(): AppUser[] {
  if (typeof window === "undefined") return initialUsers
  try {
    const stored = localStorage.getItem(USERS_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return initialUsers
}

function storeUsers(users: AppUser[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setUser(parsed)
      }
    } catch {}
    setIsLoading(false)
  }, [])

  const login = useCallback((email: string, password: string) => {
    const users = getStoredUsers()
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )
    if (!found) return { success: false, error: "Invalid email or password" }

    const authUser: AuthUser = {
      id: found.id,
      name: found.name,
      email: found.email,
      role: found.role,
      customerId: found.customerId,
      mechanicName: found.mechanicName,
    }
    setUser(authUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
    return { success: true }
  }, [])

  const register = useCallback(
    (name: string, email: string, password: string, role: UserRole) => {
      const users = getStoredUsers()
      if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        return { success: false, error: "Email already exists" }
      }

      const newId = `U${String(users.length + 1).padStart(3, "0")}`
      let customerId: string | undefined

      // If registering as a client, create a linked customer ID
      if (role === "client") {
        customerId = `C${String(Date.now()).slice(-5)}`
      }

      const newUser: AppUser = {
        id: newId,
        name,
        email,
        password,
        role,
        customerId,
        mechanicName: role === "mechanic" ? name : undefined,
      }

      const updatedUsers = [...users, newUser]
      storeUsers(updatedUsers)

      const authUser: AuthUser = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        customerId: newUser.customerId,
        mechanicName: newUser.mechanicName,
      }
      setUser(authUser)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
      return { success: true }
    },
    []
  )

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
