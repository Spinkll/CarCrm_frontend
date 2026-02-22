import * as React from "react"
import { IMaskInput } from "react-imask"
import { cn } from "@/lib/utils"

export interface VinInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
    onValueChange?: (value: string) => void
}

const VinInput = React.forwardRef<HTMLInputElement, VinInputProps>(
    ({ className, onValueChange, ...props }, ref) => {
        return (
            // @ts-ignore
            <IMaskInput
                {...props}
                mask={/^[A-Z0-9]{0,17}$/} // Regex to allow 0-17 alphanumeric uppercase characters
                prepare={(appended, masked) => appended.toUpperCase()} // Auto-uppercase
                placeholder="WVWZZZ..."
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
VinInput.displayName = "VinInput"

export { VinInput }
