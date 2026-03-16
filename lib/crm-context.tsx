"use client"

import React, { createContext, useContext, useCallback, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "./auth-context"
import { api } from "./api"

export interface Customer {
  id: number
  firstName: string
  lastName: string
  email: string
  phone?: string
  createdAt: string
}

export interface Vehicle {
  id: number
  brand: string
  model: string
  year: number
  vin: string
  plate: string
  mileage: number
  color: string
  userId: number
  createdAt?: string
}

export interface ServiceOrder {
  id: number
  status: string
  description: string
  totalAmount: number
  carId: number
  createdAt: string
  car?: Vehicle
  items?: Array<{ id: number; name: string; quantity: number; price: number; type?: "SERVICE" | "PART" }>
}

export interface Appointment {
  id: number
  orderId: number
  scheduledAt: string
  estimatedMin: number | null
  status: string
  note: string | null
  order: {
    carId: number
    description: string
    car: { brand: string; model: string; plate: string; userId?: number; user?: { firstName: string; lastName: string } }
    mechanic?: { firstName: string; lastName: string }
  }
}

type CrmContextType = {
  customers: Customer[]
  appointments: Appointment[]
  filteredAppointments: Appointment[]
  isLoading: boolean
  refreshData: () => Promise<void>
  // 👇 ДОДАНО НОВІ ТИПИ
  addAppointment: (data: any) => Promise<{ success: boolean; error?: string }>
  updateAppointmentStatus: (id: number, status: string) => Promise<void>
}

const CrmContext = createContext<CrmContextType | undefined>(undefined)

export function CrmProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const userRole = user?.role?.toUpperCase()
  const currentUserId = user?.id
  const isClient = user?.role === "CLIENT"

  // 1. Запит для клієнтів (Customers)
  const { data: customers = [], isLoading: isCustomersLoading, refetch: refetchCustomers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      if (isClient) return []
      const { data } = await api.get("/users/customers")
      return data as Customer[]
    },
    enabled: !!user,
  })

  // 2. Запит для записів (Appointments)
  const { data: appointments = [], isLoading: isAppointmentsLoading, refetch: refetchAppointments } = useQuery({
    queryKey: ["all_appointments"], // Відрізняємо від appointments-context.tsx якщо потрібно, або юзаємо той самий кеш
    queryFn: async () => {
      const { data } = await api.get("/appointments")
      return data as Appointment[]
    },
    enabled: !!user,
  })

  const isLoading = isCustomersLoading || isAppointmentsLoading

  // Мутація для додавання
  const addAppointmentMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post("/appointments", payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_appointments"] })
      // Якщо ми хочемо інвалідувати і в appointments-context:
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
    },
  })

  // Мутація для оновлення
  const updateAppointmentStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await api.patch(`/appointments/${id}/status`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_appointments"] })
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
    },
  })

  const refreshData = useCallback(async () => {
    await Promise.all([
      refetchCustomers(),
      refetchAppointments()
    ])
  }, [refetchCustomers, refetchAppointments])

  const filteredAppointments = useMemo(() => {
    if (userRole === "ADMIN" || userRole === "MANAGER") return appointments
    return appointments.filter(a => {
      const carUserId = a.order?.car?.userId
      return Number(carUserId) === Number(currentUserId)
    })
  }, [appointments, userRole, currentUserId])

  // --- Екшни (Actions) ---
  const addAppointment = async (payload: any) => {
    try {
      await addAppointmentMutation.mutateAsync(payload)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.response?.data?.message || "Error scheduling appointment" }
    }
  }

  const updateAppointmentStatus = async (id: number, status: string) => {
    try {
      await updateAppointmentStatusMutation.mutateAsync({ id, status })
    } catch (err) {
      console.error("Appointment status update failed", err)
    }
  }

  return (
    <CrmContext.Provider
      value={{
        customers,
        appointments,
        filteredAppointments,
        isLoading,
        refreshData,
        addAppointment,
        updateAppointmentStatus,
      }}
    >
      {children}
    </CrmContext.Provider>
  )
}

export const useCrm = () => {
  const context = useContext(CrmContext)
  if (!context) throw new Error("useCrm must be used within CrmProvider")
  return context
}