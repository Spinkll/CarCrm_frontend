"use client"

import { useCallback } from "react"
import { useSettings } from "@/lib/settings-context"
import { translations } from "@/lib/translations"

type TranslationNamespace = keyof (typeof translations)["uk"]

export function useTranslation() {
  const { settings } = useSettings()
  const lang = settings.language || "uk"

  const t = useCallback(
    (key: string, namespace: TranslationNamespace = "common") => {
      // @ts-ignore
      const ns = translations[lang]?.[namespace]
      if (!ns) return key

      // Support nested keys like "details.info"
      const keys = key.split(".")
      let result: any = ns
      for (const k of keys) {
        result = result?.[k]
      }

      if (!result) {
        // Fallback to UK
        // @ts-ignore
        const fallbackNs = translations["uk"]?.[namespace]
        if (fallbackNs) {
          let fallbackResult: any = fallbackNs
          for (const k of keys) {
            fallbackResult = fallbackResult?.[k]
          }
          if (fallbackResult) return fallbackResult
        }
        return key
      }
      return result
    },
    [lang],
  )

  return { t, lang }
}
