"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import api from "./api"
import { useRouter } from "next/navigation"

export type UserRole = "CLIENT" | "ADMIN" | "MECHANIC" | "MANAGER"

export interface AuthUser {
  id: number
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: UserRole
  isVerified?: boolean
}

type AuthContextType = {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (firstName: string, lastName: string, email: string, password: string, phone: string) => Promise<{ success: boolean; error?: string }>
  addEmployee: (firstName: string, lastName: string, email: string, password: string, phone: string, role: UserRole) => Promise<{ success: boolean; error?: string }>
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  updateProfile: (data: { firstName?: string; lastName?: string; phone?: string }) => Promise<{ success: boolean; error?: string }>
  markEmailAsVerified: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("access_token")
      const storedUser = localStorage.getItem("user_data")

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser))
        } catch (e) {
          console.error("Failed to parse user data", e)
          logout()
        }
      }
      setIsLoading(false)
    }
    initAuth()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data } = await api.post("/auth/login", { email, password })

      localStorage.setItem("access_token", data.access_token)
      localStorage.setItem("refresh_token", data.refresh_token)

      if (data.user) {
        localStorage.setItem("user_data", JSON.stringify(data.user))
        setUser(data.user)
      }

      return { success: true }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Не вдалося ввійти"
      return { success: false, error: Array.isArray(msg) ? msg[0] : msg }
    }
  }, [])

  const register = useCallback(async (firstName: string, lastName: string, email: string, password: string, phone: string) => {
    try {
      const { data } = await api.post("/auth/register", {
        email,
        password,
        firstName,
        lastName,
        phone,
      })

      localStorage.setItem("access_token", data.access_token)
      localStorage.setItem("refresh_token", data.refresh_token)
      if (data.user) {
        localStorage.setItem("user_data", JSON.stringify(data.user))
        setUser(data.user)
      }

      return { success: true }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Реєстрація не вдалася"
      return { success: false, error: Array.isArray(msg) ? msg[0] : msg }
    }
  }, [])

  const addEmployee = useCallback(async (firstName: string, lastName: string, email: string, password: string, phone: string, role: UserRole) => {
    try {
      await api.post("/users/employees", {
        email,
        password,
        firstName,
        lastName,
        phone,
        role,
      })

      return { success: true }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to add employee"
      return { success: false, error: Array.isArray(msg) ? msg[0] : msg }
    }
  }, [])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      await api.patch("/users/change-password", { currentPassword, newPassword })
      return { success: true }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Не вдалося змінити пароль"
      return { success: false, error: Array.isArray(msg) ? msg[0] : msg }
    }
  }, [])

  const updateProfile = useCallback(async (profileData: { firstName?: string; lastName?: string; phone?: string }) => {
    try {
      const { data } = await api.patch("/user/profile", profileData)
      const updatedUser = data.user || { ...user, ...profileData }
      localStorage.setItem("user_data", JSON.stringify(updatedUser))
      setUser(updatedUser)
      return { success: true }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Не вдалося оновити профіль"
      return { success: false, error: Array.isArray(msg) ? msg[0] : msg }
    }
  }, [user])

  const logout = useCallback(() => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user_data")
    setUser(null)
    router.push("/login")
  }, [router])

  const markEmailAsVerified = useCallback(() => {
    if (user) {
      const updatedUser = { ...user, isVerified: true }
      localStorage.setItem("user_data", JSON.stringify(updatedUser))
      setUser(updatedUser)
    }
  }, [user])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        addEmployee,
        changePassword,
        updateProfile,
        markEmailAsVerified,
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