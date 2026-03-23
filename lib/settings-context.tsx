"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"

export type AppTheme = "system" | "light" | "dark"
export type Language = "uk" | "en"
export type DateFormat = "DD.MM.YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD"

export interface AppSettings {
  // Повідомлення
  notificationsEnabled: boolean
  soundEnabled: boolean
  emailNotifications: boolean
  notificationNewOrders: boolean
  notificationStatusChanges: boolean
  notificationAppointments: boolean

  // Зовнішній вигляд
  theme: AppTheme
  sidebarCollapsed: boolean
  compactMode: boolean

  // Регіональні
  language: Language
  dateFormat: DateFormat

  // Таблиці
  tableRowsPerPage: number
  showTableBorders: boolean
}

const defaultSettings: AppSettings = {
  notificationsEnabled: true,
  soundEnabled: false,
  emailNotifications: true,
  notificationNewOrders: true,
  notificationStatusChanges: true,
  notificationAppointments: true,

  theme: "system",
  sidebarCollapsed: false,
  compactMode: false,

  language: "uk",
  dateFormat: "DD.MM.YYYY",

  tableRowsPerPage: 15,
  showTableBorders: false,
}

const SETTINGS_STORAGE_KEY = "app_settings"

interface SettingsContextType {
  settings: AppSettings
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
  updateSettings: (partial: Partial<AppSettings>) => void
  resetSettings: () => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

function loadSettings(): AppSettings {
  if (typeof window === "undefined") return defaultSettings
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) }
    }
  } catch (e) {
    console.error("Failed to load settings", e)
  }
  return defaultSettings
}

function saveSettings(settings: AppSettings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch (e) {
    console.error("Failed to save settings", e)
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setSettings(loadSettings())
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      saveSettings(settings)
    }
  }, [settings, mounted])

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }))
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings)
  }, [])

  const value = useMemo(() => ({
    settings,
    updateSetting,
    updateSettings,
    resetSettings,
  }), [settings, updateSetting, updateSettings, resetSettings])

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) throw new Error("useSettings must be used within SettingsProvider")
  return context
}
