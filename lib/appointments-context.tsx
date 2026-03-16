"use client"

import React, { createContext, useContext, useCallback, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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
    mechanic?: { id: number; firstName: string; lastName: string }
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
  const queryClient = useQueryClient()

  // 1. Запит для отримання записів
  const {
    data: appointments = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const res = await api.get("/appointments")
      const fetchedAppointments = res.data

      // Auto-cancel past appointments (SCHEDULED or CONFIRMED)
      const now = new Date()
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

      return processedAppointments as Appointment[]
    },
    enabled: !!user,
  })

  // 2. Мутація для оновлення статусу
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await api.patch(`/appointments/${id}/status`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
    },
  })

  // 3. Мутація для перенесення запису
  const rescheduleMutation = useMutation({
    mutationFn: async ({ id, scheduledAt, estimatedMin }: { id: number; scheduledAt: string; estimatedMin?: number }) => {
      await api.patch(`/appointments/${id}/reschedule`, { scheduledAt, estimatedMin })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
    },
  })

  // Обгортки для сумісності з існуючим кодом
  const fetchAppointments = useCallback(async () => {
    await refetch()
  }, [refetch])

  const updateStatus = useCallback(async (id: number, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  }, [updateStatusMutation])

  const reschedule = useCallback(async (id: number, scheduledAt: string, estimatedMin?: number) => {
    try {
      await rescheduleMutation.mutateAsync({ id, scheduledAt, estimatedMin })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  }, [rescheduleMutation])

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