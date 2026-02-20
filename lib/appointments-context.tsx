"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import { useAuth } from "./auth-context"
import api from "./api"

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
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchAppointments = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const res = await api.get("/appointments")
      setAppointments(res.data)
    } catch (error) {
      console.error("Помилка завантаження записів", error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const updateStatus = useCallback(async (id: number, status: string) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status })
      await fetchAppointments()
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  }, [fetchAppointments])

  const reschedule = useCallback(async (id: number, scheduledAt: string, estimatedMin?: number) => {
    try {
      await api.patch(`/appointments/${id}/reschedule`, { scheduledAt, estimatedMin })
      await fetchAppointments()
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  }, [fetchAppointments])

  const value = useMemo(() => ({
    appointments,
    isLoading,
    fetchAppointments,
    updateStatus,
    reschedule,
  }), [appointments, isLoading, fetchAppointments, updateStatus, reschedule])

  return (
    <AppointmentsContext.Provider value={value}>
      {children}
    </AppointmentsContext.Provider>
  )
}

export const useAppointments = () => {
  const context = useContext(AppointmentsContext)
  if (!context) throw new Error("useAppointments must be used within AppointmentsProvider")
  return context
}