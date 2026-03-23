import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type DateFormatType = "DD.MM.YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD"

/**
 * Format a date string or Date object according to the given format.
 * Falls back to "DD.MM.YYYY" if no format is provided.
 */
export function formatAppDate(
  dateInput: string | Date | undefined | null,
  dateFormat: DateFormatType = "DD.MM.YYYY",
  options?: { includeTime?: boolean }
): string {
  if (!dateInput) return "—"

  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput
  if (isNaN(date.getTime())) return "—"

  const dd = String(date.getDate()).padStart(2, "0")
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const yyyy = date.getFullYear()

  let formatted: string
  switch (dateFormat) {
    case "MM/DD/YYYY":
      formatted = `${mm}/${dd}/${yyyy}`
      break
    case "YYYY-MM-DD":
      formatted = `${yyyy}-${mm}-${dd}`
      break
    case "DD.MM.YYYY":
    default:
      formatted = `${dd}.${mm}.${yyyy}`
      break
  }

  if (options?.includeTime) {
    const hh = String(date.getHours()).padStart(2, "0")
    const min = String(date.getMinutes()).padStart(2, "0")
    formatted += ` ${hh}:${min}`
  }

  return formatted
}
