"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import api from "./api"
import { useAuth } from "./auth-context"

export interface Order {
  id: number
  customerId: number
  vehicleId: number
  description: string
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
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
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined)

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  const fetchOrders = useCallback(async () => {
    if (!user) return
    try {
      setIsLoading(true)
      const { data } = await api.get("/orders")
      setOrders(data)
    } catch (error) {
      console.error("Failed to fetch orders:", error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const createOrder = async (orderData: any) => {
    try {
      const { data } = await api.post("/orders", orderData)
      setOrders((prev) => [data, ...prev])
      return { success: true }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to create order"
      return { success: false, error: Array.isArray(msg) ? msg[0] : msg }
    }
  }

  const updateStatus = async (id: number, status: string) => {
    try {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: status as any } : o))
      await api.patch(`/orders/${id}/status`, { status })
    } catch (error) {
      console.error("Failed to update status", error)
      fetchOrders() 
    }
  }

  return (
    <OrdersContext.Provider value={{ orders, isLoading, createOrder, updateStatus, refreshOrders: fetchOrders }}>
      {children}
    </OrdersContext.Provider>
  )
}

export function useOrders() {
  const context = useContext(OrdersContext)
  if (!context) throw new Error("useOrders must be used within OrdersProvider")
  return context
}