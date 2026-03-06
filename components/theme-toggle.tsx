"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
    /** compact — маленька кнопка-іконка (для sidebar або header) */
    variant?: "icon" | "switch"
    className?: string
}

export function ThemeToggle({ variant = "icon", className }: ThemeToggleProps) {
    const { theme, setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // Потрібно, щоб уникнути hydration mismatch
    useEffect(() => setMounted(true), [])

    if (!mounted) {
        // Рендеримо «заглушку» правильного розміру, щоб уникнути CLS
        if (variant === "switch") {
            return <div className={cn("h-7 w-14 rounded-full bg-muted/50 animate-pulse", className)} />
        }
        return <div className={cn("size-8 rounded-md bg-muted/50 animate-pulse", className)} />
    }

    const isDark = resolvedTheme === "dark"
    const toggleTheme = () => setTheme(isDark ? "light" : "dark")

    // --- SWITCH VARIANT ---
    if (variant === "switch") {
        return (
            <button
                onClick={toggleTheme}
                aria-label={isDark ? "Перемкнути на світлу тему" : "Перемкнути на темну тему"}
                className={cn(
                    "relative inline-flex h-7 w-14 cursor-pointer items-center rounded-full border transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isDark
                        ? "border-primary/30 bg-primary/20"
                        : "border-amber-400/40 bg-amber-100 dark:bg-amber-900/30",
                    className
                )}
            >
                {/* Track icons */}
                <span className="absolute left-1.5 flex size-4 items-center justify-center text-amber-500 transition-opacity duration-200" style={{ opacity: isDark ? 0 : 1 }}>
                    <Sun className="size-3.5" />
                </span>
                <span className="absolute right-1.5 flex size-4 items-center justify-center text-primary transition-opacity duration-200" style={{ opacity: isDark ? 1 : 0 }}>
                    <Moon className="size-3.5" />
                </span>
                {/* Thumb */}
                <span
                    className={cn(
                        "absolute flex size-5 items-center justify-center rounded-full shadow-sm transition-all duration-300",
                        isDark
                            ? "translate-x-[34px] bg-primary text-primary-foreground"
                            : "translate-x-[2px] bg-amber-400 text-white"
                    )}
                >
                    {isDark ? <Moon className="size-3" /> : <Sun className="size-3" />}
                </span>
            </button>
        )
    }

    // --- ICON VARIANT (default) ---
    return (
        <button
            onClick={toggleTheme}
            aria-label={isDark ? "Перемкнути на світлу тему" : "Перемкнути на темну тему"}
            className={cn(
                "relative flex size-8 items-center justify-center rounded-md transition-colors",
                "text-muted-foreground hover:text-foreground hover:bg-accent",
                className
            )}
        >
            {/* Sun icon — видно в light mode */}
            <Sun
                className="absolute size-4 transition-all duration-300"
                style={{
                    opacity: isDark ? 0 : 1,
                    transform: isDark ? "rotate(-90deg) scale(0)" : "rotate(0deg) scale(1)",
                }}
            />
            {/* Moon icon — видно в dark mode */}
            <Moon
                className="absolute size-4 transition-all duration-300"
                style={{
                    opacity: isDark ? 1 : 0,
                    transform: isDark ? "rotate(0deg) scale(1)" : "rotate(90deg) scale(0)",
                }}
            />
        </button>
    )
}
