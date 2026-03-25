"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import { api } from "./api"
import { useAuth } from "./auth-context"

export interface InventoryItem {
    id: number
    name: string
    sku: string | null
    purchasePrice: number | null
    retailPrice: number
    salePrice: number
    stockQuantity: number
    minStockLevel: number | null
    createdAt: string
    updatedAt: string
}

type InventoryContextType = {
    inventory: InventoryItem[]
    isLoading: boolean
    fetchInventory: () => Promise<void>
    createItem: (data: Partial<InventoryItem>) => Promise<{ success: boolean; error?: string }>
    updateItem: (id: number, data: Partial<InventoryItem>) => Promise<{ success: boolean; error?: string }>
    deleteItem: (id: number) => Promise<{ success: boolean; error?: string }>
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined)

export function InventoryProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth()
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchInventory = useCallback(async () => {
        if (!user || user.role === "CLIENT") return
        setIsLoading(true)
        try {
            const res = await api.get("/inventory")
            setInventory(Array.isArray(res.data) ? res.data : [])
        } catch (error) {
            console.error("Failed to fetch inventory", error)
        } finally {
            setIsLoading(false)
        }
    }, [user])

    useEffect(() => {
        fetchInventory()
    }, [fetchInventory])

    const createItem = async (data: Partial<InventoryItem>) => {
        try {
            await api.post("/inventory", data)
            await fetchInventory()
            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.response?.data?.message || error.message }
        }
    }

    const updateItem = async (id: number, data: Partial<InventoryItem>) => {
        try {
            await api.patch(`/inventory/${id}`, data)
            await fetchInventory()
            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.response?.data?.message || error.message }
        }
    }

    const deleteItem = async (id: number) => {
        try {
            await api.delete(`/inventory/${id}`)
            await fetchInventory()
            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.response?.data?.message || error.message }
        }
    }

    return (
        <InventoryContext.Provider
            value={{
                inventory,
                isLoading,
                fetchInventory,
                createItem,
                updateItem,
                deleteItem,
            }}
        >
            {children}
        </InventoryContext.Provider>
    )
}

export function useInventory() {
    const context = useContext(InventoryContext)
    if (context === undefined) {
        throw new Error("useInventory must be used within an InventoryProvider")
    }
    return context
}
