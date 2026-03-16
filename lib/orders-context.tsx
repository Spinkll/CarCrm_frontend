"use client"

import React, { createContext, useContext, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "./api"
import { useAuth } from "./auth-context"

import { useAppointments } from "./appointments-context"

export interface Order {
  id: number
  customerId: number
  vehicleId: number
  description: string
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "WAITING_PARTS" | "COMPLETED" | "PAID" | "CANCELLED"
  totalAmount: number
  createdAt: string
  services: string[]
  carId: number
  car?: {
    brand: string;
    model: string;
    year: number;
    plate: string;
    userId: number
  }
}

type OrdersContextType = {
  orders: Order[]
  isLoading: boolean
  createOrder: (data: any) => Promise<{ success: boolean; error?: string }>
  updateStatus: (id: number, status: string) => Promise<void>
  refreshOrders: () => void
  fetchOrders: (force?: boolean) => Promise<void>
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined)

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { appointments, updateStatus: updateAppointmentStatus } = useAppointments()

  // 1. Запит для отримання замовлень
  const { 
    data: orders = [], 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data } = await api.get("/orders")
      return data as Order[]
    },
    enabled: !!user,
  })

  // 2. Мутація для створення замовлення
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const { data } = await api.post("/orders", orderData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
    },
  })

  // 3. Мутація для оновлення статусу
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const { data } = await api.patch(`/orders/${id}/status`, { status })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
    },
  })

  // Обгортки для сумісності з існуючим кодом
  const createOrder = async (orderData: any) => {
    try {
      await createOrderMutation.mutateAsync(orderData)
      return { success: true }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to create order"
      return { success: false, error: Array.isArray(msg) ? msg[0] : msg }
    }
  }

  const updateStatus = async (id: number, status: string) => {
    try {
      // 1. Оновлюємо статус самого замовлення
      await updateStatusMutation.mutateAsync({ id, status })

      // 2. Синхронізуємо статус запису в календарі
      const orderToApptStatus: Record<string, string> = {
        CONFIRMED: "CONFIRMED",
        IN_PROGRESS: "ARRIVED",
        WAITING_PARTS: "ARRIVED",
        COMPLETED: "COMPLETED",
        PAID: "COMPLETED",
        CANCELLED: "CANCELLED",
      }

      const nextApptStatus = orderToApptStatus[status]
      if (nextApptStatus) {
        const relatedAppt = appointments.find(a => a.orderId === id)
        if (relatedAppt && relatedAppt.status !== nextApptStatus) {
          await updateAppointmentStatus(relatedAppt.id, nextApptStatus)
        }
      }
    } catch (error) {
      console.error("Failed to update status", error)
    }
  }

  // Заглушка
  const fetchOrders = useCallback(async (force = false) => {
    if (force) {
      await refetch()
    }
  }, [refetch])

  return (
    <OrdersContext.Provider value={{ orders, isLoading, createOrder, updateStatus, refreshOrders: () => fetchOrders(true), fetchOrders }}>
      {children}
    </OrdersContext.Provider>
  )
}

export function useOrders() {
  const context = useContext(OrdersContext)
  if (!context) throw new Error("useOrders must be used within OrdersProvider")
  return context
}