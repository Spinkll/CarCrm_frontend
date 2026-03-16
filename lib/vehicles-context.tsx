"use client"

import React, { createContext, useContext, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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
  const { user } = useAuth() 
  const queryClient = useQueryClient()

  // 1. Запит для отримання автомобілів
  const {
    data: vehicles = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data } = await api.get("/cars") 
      return data as Car[]
    },
    enabled: !!user,
  })

  // 2. Мутація для додавання автомобіля
  const addVehicleMutation = useMutation({
    mutationFn: async (carData: Omit<Car, "id" | "userId">) => {
      const { data } = await api.post("/cars", carData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
    },
  })

  // Обгортки для сумісності з існуючим кодом
  const addVehicle = async (carData: Omit<Car, "id" | "userId">) => {
    try {
      await addVehicleMutation.mutateAsync(carData)
      return { success: true }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to add vehicle"
      return { success: false, error: Array.isArray(msg) ? msg[0] : msg }
    }
  }

  const refreshVehicles = useCallback(async () => {
    await refetch()
  }, [refetch])

  return (
    <VehiclesContext.Provider
      value={{
        vehicles,
        isLoading,
        addVehicle,
        refreshVehicles,
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