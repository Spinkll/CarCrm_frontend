"use client"

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react"
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
  plate: string
  mileage: number
  color: string
  userId: number 
}

export interface ServiceOrder {
  id: number
  status: string
  description: string
  totalAmount: number
  carId: number
  createdAt: string
  car?: Vehicle
}

export interface Appointment {
  id: number
  service: string
  date: string
  time: string
  status: string
  carId: number
}

type CrmContextType = {
  customers: Customer[]
  vehicles: Vehicle[]
  orders: ServiceOrder[]
  appointments: Appointment[]
  filteredVehicles: Vehicle[]
  filteredOrders: ServiceOrder[]
  filteredAppointments: Appointment[]
  isLoading: boolean
  refreshData: () => Promise<void>
  addVehicle: (data: any) => Promise<{ success: boolean; error?: string }>
  updateOrderStatus: (id: number, status: string) => Promise<void>
}

const CrmContext = createContext<CrmContextType | undefined>(undefined)

export function CrmProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const userRole = user?.role?.toUpperCase() 
  const currentUserId = user?.id 

  const refreshData = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const [custRes, vehRes, ordRes, appRes] = await Promise.all([
        api.get('/users/customers').catch(() => ({ data: [] })), 
        api.get('/cars').catch(() => ({ data: [] })),
        api.get('/orders').catch(() => ({ data: [] })),
        api.get('/appointments').catch(() => ({ data: [] })),
      ])

      setCustomers(custRes.data)
      setVehicles(vehRes.data)
      setOrders(ordRes.data)
      setAppointments(appRes.data)
    } catch (err) {
      console.error("CRM Data fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  
  const filteredOrders = useMemo(() => {
    if (userRole === "ADMIN" || userRole === "MANAGER") return orders
    if (userRole === "MECHANIC") {
      return orders.filter(o => o.status !== "completed") 
    }
    return orders.filter(o => o.car?.userId === currentUserId || (vehicles.find(v => v.id === o.carId)?.userId === currentUserId))
  }, [orders, userRole, currentUserId, vehicles])

  const filteredVehicles = useMemo(() => {
    if (userRole === "ADMIN" || userRole === "MANAGER") return vehicles
    if (userRole === "MECHANIC") {
      const activeVehicleIds = new Set(filteredOrders.map(o => o.carId))
      return vehicles.filter(v => activeVehicleIds.has(v.id))
    }
    return vehicles.filter(v => Number(v.userId) === Number(currentUserId))
  }, [vehicles, userRole, currentUserId, filteredOrders])

  const filteredAppointments = useMemo(() => {
    if (userRole === "ADMIN" || userRole === "MANAGER") return appointments
    return appointments.filter(a => {
        const vehicle = vehicles.find(v => v.id === a.carId)
        return Number(vehicle?.userId) === Number(currentUserId)
    })
  }, [appointments, userRole, currentUserId, vehicles])

  // --- Екшни (Actions) ---

  const addVehicle = async (payload: any) => {
    try {
      const { data } = await api.post('/cars', payload)
      setVehicles(prev => [...prev, data])
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.response?.data?.message || "Error adding vehicle" }
    }
  }

  const updateOrderStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/orders/${id}/status`, { status })
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    } catch (err) {
      console.error("Status update failed", err)
    }
  }

  return (
    <CrmContext.Provider
      value={{
        customers,
        vehicles,
        orders,
        appointments,
        filteredVehicles,
        filteredOrders,
        filteredAppointments,
        isLoading,
        refreshData,
        addVehicle,
        updateOrderStatus,
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