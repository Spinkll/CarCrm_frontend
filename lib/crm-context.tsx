"use client"

import React, { createContext, useContext, useState, useCallback, useMemo } from "react"
import {
  customers as initialCustomers,
  vehicles as initialVehicles,
  serviceOrders as initialOrders,
  appointments as initialAppointments,
  type Customer,
  type Vehicle,
  type ServiceOrder,
  type Appointment,
  type UserRole,
} from "./data"
import { useAuth } from "./auth-context"

type CrmContextType = {
  // raw data
  customers: Customer[]
  vehicles: Vehicle[]
  serviceOrders: ServiceOrder[]
  appointments: Appointment[]
  // filtered by role
  filteredCustomers: Customer[]
  filteredVehicles: Vehicle[]
  filteredOrders: ServiceOrder[]
  filteredAppointments: Appointment[]
  // role info
  role: UserRole
  // actions
  addCustomer: (customer: Customer) => void
  addVehicle: (vehicle: Vehicle) => void
  addServiceOrder: (order: ServiceOrder) => void
  addAppointment: (appointment: Appointment) => void
  updateOrderStatus: (id: string, status: ServiceOrder["status"]) => void
  updateAppointmentStatus: (id: string, status: Appointment["status"]) => void
  // permissions
  canCreateOrders: boolean
  canEditOrderStatus: boolean
  canCreateCustomers: boolean
  canCreateVehicles: boolean
  canCreateAppointments: boolean
}

const CrmContext = createContext<CrmContextType | undefined>(undefined)

export function CrmProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const role = user?.role || "client"

  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles)
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>(initialOrders)
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)

  // Role-based filtered data
  const filteredCustomers = useMemo(() => {
    if (role === "admin") return customers
    if (role === "mechanic") return customers // mechanics can view all customers (read-only)
    // client: return only the customer record linked to this user
    if (user?.customerId) {
      return customers.filter((c) => c.id === user.customerId)
    }
    return []
  }, [role, customers, user?.customerId])

  const filteredOrders = useMemo(() => {
    if (role === "admin") return serviceOrders
    if (role === "mechanic") {
      return serviceOrders.filter((o) => o.assignedMechanic === user?.mechanicName)
    }
    // client: only their own orders
    if (user?.customerId) {
      return serviceOrders.filter((o) => o.customerId === user.customerId)
    }
    return []
  }, [role, serviceOrders, user?.mechanicName, user?.customerId])

  const filteredVehicles = useMemo(() => {
    if (role === "admin") return vehicles
    if (role === "mechanic") {
      // vehicles from assigned orders
      const vehicleIds = new Set(filteredOrders.map((o) => o.vehicleId))
      return vehicles.filter((v) => vehicleIds.has(v.id))
    }
    // client: only own vehicles
    if (user?.customerId) {
      return vehicles.filter((v) => v.customerId === user.customerId)
    }
    return []
  }, [role, vehicles, filteredOrders, user?.customerId])

  const filteredAppointments = useMemo(() => {
    if (role === "admin") return appointments
    if (role === "mechanic") {
      // Mechanic sees appointments for vehicles from their assigned orders
      const customerIds = new Set(filteredOrders.map((o) => o.customerId))
      return appointments.filter((a) => customerIds.has(a.customerId))
    }
    // client
    if (user?.customerId) {
      return appointments.filter((a) => a.customerId === user.customerId)
    }
    return []
  }, [role, appointments, filteredOrders, user?.customerId])

  // Permissions
  const canCreateOrders = role === "admin" || role === "client"
  const canEditOrderStatus = role === "admin" || role === "mechanic"
  const canCreateCustomers = role === "admin"
  const canCreateVehicles = role === "admin" || role === "client"
  const canCreateAppointments = role === "admin" || role === "client"

  const addCustomer = useCallback((customer: Customer) => {
    setCustomers((prev) => [customer, ...prev])
  }, [])

  const addVehicle = useCallback((vehicle: Vehicle) => {
    setVehicles((prev) => [vehicle, ...prev])
  }, [])

  const addServiceOrder = useCallback((order: ServiceOrder) => {
    setServiceOrders((prev) => [order, ...prev])
  }, [])

  const addAppointment = useCallback((appointment: Appointment) => {
    setAppointments((prev) => [appointment, ...prev])
  }, [])

  const updateOrderStatus = useCallback((id: string, status: ServiceOrder["status"]) => {
    setServiceOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status,
              completedAt:
                status === "completed"
                  ? new Date().toISOString().split("T")[0]
                  : o.completedAt,
            }
          : o
      )
    )
  }, [])

  const updateAppointmentStatus = useCallback((id: string, status: Appointment["status"]) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
  }, [])

  return (
    <CrmContext.Provider
      value={{
        customers,
        vehicles,
        serviceOrders,
        appointments,
        filteredCustomers,
        filteredVehicles,
        filteredOrders,
        filteredAppointments,
        role,
        addCustomer,
        addVehicle,
        addServiceOrder,
        addAppointment,
        updateOrderStatus,
        updateAppointmentStatus,
        canCreateOrders,
        canEditOrderStatus,
        canCreateCustomers,
        canCreateVehicles,
        canCreateAppointments,
      }}
    >
      {children}
    </CrmContext.Provider>
  )
}

export function useCrm() {
  const context = useContext(CrmContext)
  if (!context) throw new Error("useCrm must be used within CrmProvider")
  return context
}
