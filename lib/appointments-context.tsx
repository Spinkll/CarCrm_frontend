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
  getAvailableSlots: (date: string) => Promise<string[]>
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
      const fetchedAppointments = res.data

      // Auto-cancel past appointments (SCHEDULED or CONFIRMED)
      const now = new Date()
      // Normalize to today midnight to only cancel if the day has fully passed
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

      const processedAppointments = await Promise.all(
        fetchedAppointments.map(async (app: Appointment) => {
          if (app.status === "SCHEDULED" || app.status === "CONFIRMED") {
            const appointmentDate = new Date(app.scheduledAt)
            const appointmentMidnight = new Date(
              appointmentDate.getFullYear(),
              appointmentDate.getMonth(),
              appointmentDate.getDate()
            ).getTime()

            // If the appointment date is strictly before today
            if (appointmentMidnight < todayMidnight) {
              try {
                // Update on the backend silently
                await api.patch(`/appointments/${app.id}/status`, { status: "CANCELLED" })
                // Return updated locally
                return { ...app, status: "CANCELLED" as const }
              } catch (err) {
                console.error(`Failed to auto-cancel appointment ${app.id}`, err)
              }
            }
          }
          return app
        })
      )

      setAppointments(processedAppointments)
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

  const getAvailableSlots = useCallback(async (date: string) => {
    try {
      const res = await api.get(`/appointments/available-slots?date=${date}`)
      return Array.isArray(res.data) ? res.data : []
    } catch (error) {
      console.error("Failed to fetch available slots", error)
      return []
    }
  }, [])

  const value = useMemo(() => ({
    appointments,
    isLoading,
    fetchAppointments,
    updateStatus,
    reschedule,
    getAvailableSlots,
  }), [appointments, isLoading, fetchAppointments, updateStatus, reschedule, getAvailableSlots])

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