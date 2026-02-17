"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import {
  customers as initialCustomers,
  vehicles as initialVehicles,
  serviceOrders as initialOrders,
  appointments as initialAppointments,
  type Customer,
  type Vehicle,
  type ServiceOrder,
  type Appointment,
} from "./data"

type CrmContextType = {
  customers: Customer[]
  vehicles: Vehicle[]
  serviceOrders: ServiceOrder[]
  appointments: Appointment[]
  addCustomer: (customer: Customer) => void
  addVehicle: (vehicle: Vehicle) => void
  addServiceOrder: (order: ServiceOrder) => void
  addAppointment: (appointment: Appointment) => void
  updateOrderStatus: (id: string, status: ServiceOrder["status"]) => void
  updateAppointmentStatus: (id: string, status: Appointment["status"]) => void
}

const CrmContext = createContext<CrmContextType | undefined>(undefined)

export function CrmProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles)
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>(initialOrders)
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)

  const addCustomer = useCallback((customer: Customer) => {
    setCustomers(prev => [customer, ...prev])
  }, [])

  const addVehicle = useCallback((vehicle: Vehicle) => {
    setVehicles(prev => [vehicle, ...prev])
  }, [])

  const addServiceOrder = useCallback((order: ServiceOrder) => {
    setServiceOrders(prev => [order, ...prev])
  }, [])

  const addAppointment = useCallback((appointment: Appointment) => {
    setAppointments(prev => [appointment, ...prev])
  }, [])

  const updateOrderStatus = useCallback((id: string, status: ServiceOrder["status"]) => {
    setServiceOrders(prev =>
      prev.map(o =>
        o.id === id
          ? { ...o, status, completedAt: status === "completed" ? new Date().toISOString().split("T")[0] : o.completedAt }
          : o
      )
    )
  }, [])

  const updateAppointmentStatus = useCallback((id: string, status: Appointment["status"]) => {
    setAppointments(prev =>
      prev.map(a => (a.id === id ? { ...a, status } : a))
    )
  }, [])

  return (
    <CrmContext.Provider
      value={{
        customers,
        vehicles,
        serviceOrders,
        appointments,
        addCustomer,
        addVehicle,
        addServiceOrder,
        addAppointment,
        updateOrderStatus,
        updateAppointmentStatus,
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
