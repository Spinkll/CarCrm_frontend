import * as React from "react"
import { IMaskInput } from "react-imask"
import { cn } from "@/lib/utils"

export interface PhoneInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
    onValueChange?: (value: string) => void
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
    ({ className, onValueChange, ...props }, ref) => {
        return (
            // @ts-ignore - IMaskInput type definitions are overly complex and conflict with standard InputHTMLAttributes
            <IMaskInput
                {...props}
                mask="+{380} (00) 000-00-00"
                placeholder="+380 (XX) XXX-XX-XX"
                inputRef={ref as any}
                onAccept={(value: string) => {
                    if (onValueChange) {
                        onValueChange(value)
                    }
                }}
                className={cn(
                    "flex h-9 w-full rounded-md border border-input bg-secondary px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
            />
        )
    }
)
PhoneInput.displayName = "PhoneInput"

export { PhoneInput }
