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
}

type EmployeesContextType = {
  employees: Employee[]
  isLoading: boolean
  createEmployee: (data: any) => Promise<{ success: boolean; error?: string }>
  deleteEmployee: (id: number) => Promise<{ success: boolean; error?: string }>
  refreshEmployees: () => void
}

const EmployeesContext = createContext<EmployeesContextType | undefined>(undefined)

export function EmployeesProvider({ children }: { children: React.ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  const fetchEmployees = useCallback(async () => {
    if (user?.role !== "ADMIN") return
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

  const deleteEmployee = async (id: number) => {
    try {
      await api.delete(`/users/${id}`)
      setEmployees((prev) => prev.filter((e) => e.id !== id))
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  return (
    <EmployeesContext.Provider
      value={{
        employees,
        isLoading,
        createEmployee,
        deleteEmployee,
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