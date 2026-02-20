"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import { useAuth } from "./auth-context"
import api from "./api"

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
  const { user } = useAuth()
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchRequests = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const res = await api.get("/service-requests")
      setRequests(res.data)
    } catch (error) {
      console.error("Помилка завантаження заявок", error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const createRequest = useCallback(async (carId: number, reason: string) => {
    try {
      await api.post("/service-requests", { carId, reason })
      await fetchRequests()
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  }, [fetchRequests])

  const approveRequest = useCallback(async (id: number, data: { scheduledAt: string; estimatedMin?: number; mechanicId?: number; description?: string }) => {
    try {
      await api.patch(`/service-requests/${id}/approve`, data)
      await fetchRequests()
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  }, [fetchRequests])

  const rejectRequest = useCallback(async (id: number) => {
    try {
      await api.patch(`/service-requests/${id}/reject`)
      await fetchRequests()
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  }, [fetchRequests])

  const value = useMemo(() => ({
    requests,
    isLoading,
    fetchRequests,
    createRequest,
    approveRequest,
    rejectRequest,
  }), [requests, isLoading, fetchRequests, createRequest, approveRequest, rejectRequest])

  return (
    <ServiceRequestsContext.Provider value={value}>
      {children}
    </ServiceRequestsContext.Provider>
  )
}

export const useServiceRequests = () => {
  const context = useContext(ServiceRequestsContext)
  if (!context) throw new Error("useServiceRequests must be used within ServiceRequestsProvider")
  return context
}