"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import api from "./api"
import { useAuth } from "./auth-context"

export interface Customer {
  id: number
  email: string
  firstName: string
  lastName: string
  phone: string
  address?: string
  role: "CLIENT"
  createdAt: string
  cars?: any[]
  orders?: any[]
  isBlocked?: boolean
  blockReason?: string
}

type CustomersContextType = {
  customers: Customer[]
  isLoading: boolean
  createCustomer: (data: any) => Promise<{ success: boolean; error?: string }>
  blockCustomer: (id: number, reason?: string) => Promise<{ success: boolean; error?: string }>
  unblockCustomer: (id: number) => Promise<{ success: boolean; error?: string }>
  refreshCustomers: () => void
}

const CustomersContext = createContext<CustomersContextType | undefined>(undefined)

export function CustomersProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  const fetchCustomers = useCallback(async () => {
    if (!user) return
    if (user.role === "CLIENT") return

    try {
      setIsLoading(true)
      const { data } = await api.get("/users/customers")
      setCustomers(data)
    } catch (error) {
      console.error("Failed to fetch customers:", error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const createCustomer = async (payload: any) => {
    try {
      const { data } = await api.post("/users/customer", payload);
      setCustomers((prev) => [data, ...prev]);
      return { success: true };
    } catch (error: any) {
      const msg = error.response?.data?.message || "Error creating customer";
      return { success: false, error: Array.isArray(msg) ? msg[0] : msg };
    }
  }

  const blockCustomer = async (id: number, reason?: string) => {
    try {
      await api.patch(`/users/${id}/block`, { reason })
      setCustomers((prev) => prev.map((c) => c.id === id ? { ...c, isBlocked: true, blockReason: reason } : c))
      return { success: true }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to block customer"
      return { success: false, error: Array.isArray(msg) ? msg[0] : msg }
    }
  }

  const unblockCustomer = async (id: number) => {
    try {
      await api.patch(`/users/${id}/unblock`)
      setCustomers((prev) => prev.map((c) => c.id === id ? { ...c, isBlocked: false, blockReason: undefined } : c))
      return { success: true }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to unblock customer"
      return { success: false, error: Array.isArray(msg) ? msg[0] : msg }
    }
  }
  return (
    <CustomersContext.Provider
      value={{
        customers,
        isLoading,
        createCustomer,
        blockCustomer,
        unblockCustomer,
        refreshCustomers: fetchCustomers,
      }}
    >
      {children}
    </CustomersContext.Provider>
  )
}

export function useCustomers() {
  const context = useContext(CustomersContext)
  if (!context) throw new Error("useCustomers must be used within CustomersProvider")
  return context
}