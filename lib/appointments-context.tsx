"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useAuth } from "./auth-context"

export interface Appointment {
  id: number
  orderId: number
  scheduledAt: string
  estimatedMin: number | null
  status: "SCHEDULED" | "CONFIRMED" | "ARRIVED" | "COMPLETED" | "NO_SHOW" | "CANCELLED"
  note: string | null
  order: {
    carId: number
    description: string
    car: { brand: string; model: string; plate: string; user?: { firstName: string; lastName: string } }
    mechanic?: { firstName: string; lastName: string }
  }
}

interface AppointmentsContextType {
  appointments: Appointment[]
  isLoading: boolean
  fetchAppointments: () => Promise<void>
  updateStatus: (id: number, status: string) => Promise<{ success: boolean; error?: string }>
  reschedule: (id: number, scheduledAt: string, estimatedMin?: number) => Promise<{ success: boolean; error?: string }>
}

const AppointmentsContext = createContext<AppointmentsContextType | undefined>(undefined)

export function AppointmentsProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchAppointments = useCallback(async () => {
    if (!token || !user) return
    setIsLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setAppointments(await res.json())
      }
    } catch (error) {
      console.error("Помилка завантаження записів", error)
    } finally {
      setIsLoading(false)
    }
  }, [token, user])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/appointments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Помилка зміни статусу")
      await fetchAppointments()
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const reschedule = async (id: number, scheduledAt: string, estimatedMin?: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/appointments/${id}/reschedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ scheduledAt, estimatedMin }),
      })
      if (!res.ok) throw new Error("Помилка перенесення запису")
      await fetchAppointments()
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  return (
    <AppointmentsContext.Provider value={{ appointments, isLoading, fetchAppointments, updateStatus, reschedule }}>
      {children}
    </AppointmentsContext.Provider>
  )
}

export const useAppointments = () => {
  const context = useContext(AppointmentsContext)
  if (!context) throw new Error("useAppointments must be used within AppointmentsProvider")
  return context
}