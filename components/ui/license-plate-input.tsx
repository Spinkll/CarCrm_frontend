import * as React from "react"
import { IMaskInput } from "react-imask"
import { cn } from "@/lib/utils"

export interface LicensePlateInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
    onValueChange?: (value: string) => void
}

const LicensePlateInput = React.forwardRef<HTMLInputElement, LicensePlateInputProps>(
    ({ className, onValueChange, ...props }, ref) => {
        return (
            // @ts-ignore
            <IMaskInput
                {...props}
                mask="aa 0000 aa"
                prepare={(appended, masked) => {
                    // Only allow Cyrillic/Latin letters used in Ukrainian plates, and auto-uppercase them
                    const upper = appended.toUpperCase()
                    const allowedLetters = /^[ABCEHIKMOPTXАВЕКМНОРСТУХІ]$/
                    if (/[A-ZА-ЯІЇЄ]/.test(upper)) {
                        return allowedLetters.test(upper) ? upper : ""
                    }
                    return upper
                }}
                placeholder="AA 1234 BB"
                inputRef={ref as any}
                onAccept={(value: string) => {
                    if (onValueChange) {
                        onValueChange(value)
                    }
                }}
                className={cn(
                    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
            />
        )
    }
)
LicensePlateInput.displayName = "LicensePlateInput"

export { LicensePlateInput }
