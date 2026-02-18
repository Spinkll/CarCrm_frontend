"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import api from "./api"
import { useAuth } from "./auth-context"

export interface Car {
  id: number
  brand: string
  model: string
  year: number
  vin: string
  plate: string
  color: string
  mileage: number
  userId: number
}

type VehiclesContextType = {
  vehicles: Car[]
  isLoading: boolean
  addVehicle: (data: Omit<Car, "id" | "userId">) => Promise<{ success: boolean; error?: string }>
  refreshVehicles: () => void
}

const VehiclesContext = createContext<VehiclesContextType | undefined>(undefined)

export function VehiclesProvider({ children }: { children: React.ReactNode }) {
  const [vehicles, setVehicles] = useState<Car[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth() 

  const fetchVehicles = useCallback(async () => {
    if (!user) return
    try {
      setIsLoading(true)
      const { data } = await api.get("/cars") 
      setVehicles(data)
    } catch (error) {
      console.error("Failed to fetch vehicles:", error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchVehicles()
  }, [fetchVehicles])

  const addVehicle = async (carData: Omit<Car, "id" | "userId">) => {
    try {
      const { data } = await api.post("/cars", carData)
      
      setVehicles((prev) => [...prev, data])
      
      return { success: true }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to add vehicle"
      return { success: false, error: Array.isArray(msg) ? msg[0] : msg }
    }
  }

  return (
    <VehiclesContext.Provider
      value={{
        vehicles,
        isLoading,
        addVehicle,
        refreshVehicles: fetchVehicles,
      }}
    >
      {children}
    </VehiclesContext.Provider>
  )
}

export function useVehicles() {
  const context = useContext(VehiclesContext)
  if (!context) throw new Error("useVehicles must be used within VehiclesProvider")
  return context
}