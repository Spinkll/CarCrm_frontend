"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useAuth } from "./auth-context"

interface ServiceRequest {
  id: number
  clientId: number
  carId: number
  reason: string
  description?: string
  status: "NEW" | "IN_REVIEW" | "PROCESSED" | "REJECTED"
  orderId?: number
  createdAt: string
  client?: { id: number; firstName: string; lastName: string; phone: string }
  car?: { id: number; brand: string; model: string; plate: string; mileage: number }
}

interface ServiceRequestsContextType {
  requests: ServiceRequest[]
  isLoading: boolean
  fetchRequests: () => Promise<void>
  createRequest: (carId: number, reason: string) => Promise<{ success: boolean; error?: string }>
  approveRequest: (id: number, data: { scheduledAt: string; estimatedMin?: number; mechanicId?: number; description?: string }) => Promise<{ success: boolean; error?: string }>
  rejectRequest: (id: number) => Promise<{ success: boolean; error?: string }>
}

const ServiceRequestsContext = createContext<ServiceRequestsContextType | undefined>(undefined)

export function ServiceRequestsProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth()
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchRequests = useCallback(async () => {
    if (!token || !user) return
    setIsLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setRequests(await res.json())
      }
    } catch (error) {
      console.error("Помилка завантаження заявок", error)
    } finally {
      setIsLoading(false)
    }
  }, [token, user])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const createRequest = async (carId: number, reason: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ carId, reason }),
      })
      if (!res.ok) throw new Error("Помилка створення заявки")
      await fetchRequests()
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const approveRequest = async (id: number, data: any) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-requests/${id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Помилка схвалення заявки")
      await fetchRequests()
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const rejectRequest = async (id: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-requests/${id}/reject`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Помилка відхилення заявки")
      await fetchRequests()
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  return (
    <ServiceRequestsContext.Provider value={{ requests, isLoading, fetchRequests, createRequest, approveRequest, rejectRequest }}>
      {children}
    </ServiceRequestsContext.Provider>
  )
}

export const useServiceRequests = () => {
  const context = useContext(ServiceRequestsContext)
  if (!context) throw new Error("useServiceRequests must be used within ServiceRequestsProvider")
  return context
}