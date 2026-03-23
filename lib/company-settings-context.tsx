"use client"

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"

import api from "./api"
import { useAuth } from "./auth-context"
import {
  COMPANY_SETTINGS_ENDPOINT,
  type CompanySettings,
  defaultCompanySettings,
  normalizeCompanySettings,
} from "./company-settings"

type CompanySettingsContextType = {
  companySettings: CompanySettings
  isLoading: boolean
  refreshCompanySettings: () => Promise<void>
  applyCompanySettings: (settings: CompanySettings) => void
}

const CompanySettingsContext = createContext<CompanySettingsContextType | undefined>(undefined)

export function CompanySettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [companySettings, setCompanySettings] = useState<CompanySettings>(defaultCompanySettings)
  const [isLoading, setIsLoading] = useState(true)

  const fetchCompanySettings = useCallback(async () => {
    if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
      setCompanySettings(defaultCompanySettings)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const { data } = await api.get(COMPANY_SETTINGS_ENDPOINT)
      setCompanySettings(normalizeCompanySettings(data))
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 403) {
        setCompanySettings(defaultCompanySettings)
      } else {
        console.error("Failed to fetch company settings", error)
      }
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchCompanySettings()
  }, [fetchCompanySettings])

  const applyCompanySettings = useCallback((settings: CompanySettings) => {
    setCompanySettings(settings)
  }, [])

  return (
    <CompanySettingsContext.Provider
      value={{
        companySettings,
        isLoading,
        refreshCompanySettings: fetchCompanySettings,
        applyCompanySettings,
      }}
    >
      {children}
    </CompanySettingsContext.Provider>
  )
}

export function useCompanySettings() {
  const context = useContext(CompanySettingsContext)
  if (!context) throw new Error("useCompanySettings must be used within CompanySettingsProvider")
  return context
}