"use client"

import { useEffect } from "react"
import { useSettings } from "@/lib/settings-context"
import { useTheme } from "next-themes"

/**
 * This component doesn't render anything visible.
 * It applies global settings (compact mode, theme sync) to the DOM.
 */
export function SettingsApplier() {
  const { settings } = useSettings()
  const { setTheme } = useTheme()

  // Sync theme on mount
  useEffect(() => {
    setTheme(settings.theme)
  }, [settings.theme, setTheme])

  // Apply compact mode class to document
  useEffect(() => {
    if (settings.compactMode) {
      document.documentElement.classList.add("compact")
    } else {
      document.documentElement.classList.remove("compact")
    }
  }, [settings.compactMode])

  return null
}
