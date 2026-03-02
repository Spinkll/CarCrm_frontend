"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import api from "./api"
import { useAuth } from "./auth-context"

export interface Employee {
  id: number
  email: string
  firstName: string
  lastName: string
  role: "ADMIN" | "MANAGER" | "MECHANIC"
  phone: string
  commissionRate?: number
  baseSalary?: number
  isBlocked?: boolean
  blockReason?: string
}

type EmployeesContextType = {
  employees: Employee[]
  isLoading: boolean
  createEmployee: (data: any) => Promise<{ success: boolean; error?: string }>
  updateEmployee: (id: number, data: Partial<Employee>) => Promise<{ success: boolean; error?: string }>
  deleteEmployee: (id: number) => Promise<{ success: boolean; error?: string }>
  blockEmployee: (id: number, reason?: string) => Promise<{ success: boolean; error?: string }>
  unblockEmployee: (id: number) => Promise<{ success: boolean; error?: string }>
  refreshEmployees: () => void
}

const EmployeesContext = createContext<EmployeesContextType | undefined>(undefined)

export function EmployeesProvider({ children }: { children: React.ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  const fetchEmployees = useCallback(async () => {
    if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) return
    try {
      setIsLoading(true)
      const { data } = await api.get("/users/employees")
      setEmployees(data)
    } catch (error) {
      console.error("Failed to fetch employees:", error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const createEmployee = async (payload: any) => {
    try {
      const { data } = await api.post("/users/employee", payload)
      setEmployees((prev) => [...prev, data])
      return { success: true }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to create employee"
      return { success: false, error: Array.isArray(msg) ? msg[0] : msg }
    }
  }

  const updateEmployee = async (id: number, payload: Partial<Employee>) => {
    try {
      const { data } = await api.patch(`/users/${id}`, payload)
      setEmployees((prev) => prev.map((e) => e.id === id ? { ...e, ...data } : e))
      return { success: true }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to update employee"
      return { success: false, error: Array.isArray(msg) ? msg[0] : msg }
    }
  }

  const deleteEmployee = async (id: number) => {
    try {
      await api.delete(`/users/${id}`)
      setEmployees((prev) => prev.filter((e) => e.id !== id))
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const blockEmployee = async (id: number, reason?: string) => {
    try {
      await api.patch(`/users/${id}/block`, { reason })
      setEmployees((prev) => prev.map((e) => e.id === id ? { ...e, isBlocked: true, blockReason: reason } : e))
      return { success: true }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to block employee"
      return { success: false, error: Array.isArray(msg) ? msg[0] : msg }
    }
  }

  const unblockEmployee = async (id: number) => {
    try {
      await api.patch(`/users/${id}/unblock`)
      setEmployees((prev) => prev.map((e) => e.id === id ? { ...e, isBlocked: false, blockReason: undefined } : e))
      return { success: true }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to unblock employee"
      return { success: false, error: Array.isArray(msg) ? msg[0] : msg }
    }
  }

  return (
    <EmployeesContext.Provider
      value={{
        employees,
        isLoading,
        createEmployee,
        updateEmployee,
        deleteEmployee,
        blockEmployee,
        unblockEmployee,
        refreshEmployees: fetchEmployees,
      }}
    >
      {children}
    </EmployeesContext.Provider>
  )
}

export function useEmployees() {
  const context = useContext(EmployeesContext)
  if (!context) throw new Error("useEmployees must be used within EmployeesProvider")
  return context
}