import * as React from "react"
import { cn } from "@/lib/utils"

export interface VinInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: string
  onValueChange?: (value: string) => void
}

const VIN_GROUP_SIZE = 4
const VIN_MAX_LENGTH = 17
const VIN_DISALLOWED = /[IOQ]/g
const VIN_ALLOWED = /[^A-HJ-NPR-Z0-9]/g

function sanitizeVin(value: string) {
  return value
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(VIN_DISALLOWED, "")
    .replace(VIN_ALLOWED, "")
    .slice(0, VIN_MAX_LENGTH)
}

function formatVin(value: string) {
  const groups = value.match(new RegExp(`.{1,${VIN_GROUP_SIZE}}`, "g"))
  return groups?.join(" ") ?? ""
}

const VinInput = React.forwardRef<HTMLInputElement, VinInputProps>(
  ({ className, onValueChange, value = "", onPaste, ...props }, ref) => {
    const sanitizedValue = sanitizeVin(value)
    const displayValue = formatVin(sanitizedValue)

    return (
      <input
        {...props}
        ref={ref}
        value={displayValue}
        inputMode="text"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        placeholder="WVW ZZZ 1KZ 6W6 12345"
        onChange={(event) => {
          onValueChange?.(sanitizeVin(event.target.value))
        }}
        onPaste={(event) => {
          const pastedText = event.clipboardData.getData("text")
          const nextValue = sanitizeVin(pastedText)
          event.preventDefault()
          onValueChange?.(nextValue)
          onPaste?.(event)
        }}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm font-mono uppercase tracking-[0.18em] shadow-sm transition-colors placeholder:tracking-normal placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      />
    )
  }
)

VinInput.displayName = "VinInput"

export { VinInput, sanitizeVin }
