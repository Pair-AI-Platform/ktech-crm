"use client"

import { Moon, Sun, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState, useCallback, useMemo, useSyncExternalStore, useRef } from "react"

type Theme = "light" | "dark" | "system"

interface ThemeToggleProps {
  variant?: "icon" | "full"
  className?: string
}

const emptySubscribe = () => () => {}

function useLocalTheme() {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return "system"
    return (localStorage.getItem("ktech-theme") as Theme | null) ?? "system"
  })
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(() => {
    if (typeof window === 'undefined') return "light"
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  })

  // Compute resolved theme from theme + systemTheme
  const resolvedTheme = useMemo<"light" | "dark">(() => {
    if (theme === "system") {
      return systemTheme
    }
    return theme
  }, [theme, systemTheme])

  // Track previous resolved theme to avoid unnecessary DOM updates
  const prevResolvedRef = useRef(resolvedTheme)

  useEffect(() => {
    // Listen for theme changes from settings page
    const handleThemeChange = (e: CustomEvent<{ theme: Theme; resolved: "light" | "dark" }>) => {
      setThemeState(e.detail.theme)
      // Update system theme based on the resolved value from settings
      if (e.detail.theme === "system") {
        setSystemTheme(e.detail.resolved)
      }
    }
    window.addEventListener("theme-change", handleThemeChange as EventListener)
    return () => window.removeEventListener("theme-change", handleThemeChange as EventListener)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Only update DOM if resolved theme changed
    if (prevResolvedRef.current !== resolvedTheme) {
      prevResolvedRef.current = resolvedTheme
    }

    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(resolvedTheme)
    document.documentElement.style.colorScheme = resolvedTheme

    // Listen for system theme changes
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      const handler = (e: MediaQueryListEvent) => {
        const newSystemTheme = e.matches ? "dark" : "light"
        setSystemTheme(newSystemTheme)
        document.documentElement.classList.remove("light", "dark")
        document.documentElement.classList.add(newSystemTheme)
        document.documentElement.style.colorScheme = newSystemTheme
      }
      mediaQuery.addEventListener("change", handler)
      return () => mediaQuery.removeEventListener("change", handler)
    }
  }, [theme, mounted, resolvedTheme])

  const setTheme = useCallback((newTheme: Theme) => {
    localStorage.setItem("ktech-theme", newTheme)
    setThemeState(newTheme)
  }, [])

  return { theme, resolvedTheme, setTheme, mounted }
}

export function ThemeToggle({ variant = "icon", className }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, mounted } = useLocalTheme()

  const cycleTheme = () => {
    const themes: Theme[] = ["light", "dark", "system"]
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  if (!mounted) {
    return variant === "full" ? (
      <div className={cn("flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-sunken)]", className)}>
        <div className="h-9 w-full animate-pulse bg-[var(--bg-hover)] rounded-lg" />
      </div>
    ) : (
      <Button variant="ghost" size="icon" className={className} disabled>
        <Sun className="w-5 h-5 opacity-50" />
      </Button>
    )
  }

  if (variant === "full") {
    return (
      <div className={cn("flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-sunken)]", className)}>
        {[
          { value: "light" as const, icon: Sun, label: "Light" },
          { value: "dark" as const, icon: Moon, label: "Dark" },
          { value: "system" as const, icon: Monitor, label: "Auto" },
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => setTheme(item.value)}
            className={cn(
              "relative flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-1",
              theme === item.value
                ? "text-[var(--text-primary)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            )}
          >
            {theme === item.value && (
              <motion.div
                layoutId="theme-indicator"
                className="absolute inset-0 bg-[var(--bg-surface)] rounded-lg shadow-sm border border-[var(--border)]"
                transition={{ type: "spring", duration: 0.3, bounce: 0.15 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <item.icon className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">{item.label}</span>
            </span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className={cn("relative overflow-hidden", className)}
      aria-label={`Current theme: ${theme}. Click to change.`}
    >
      <AnimatePresence mode="wait">
        {resolvedTheme === "light" ? (
          <motion.div
            key="sun"
            initial={{ rotate: -90, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            exit={{ rotate: 90, scale: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="w-5 h-5" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            exit={{ rotate: -90, scale: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="w-5 h-5" />
          </motion.div>
        )}
      </AnimatePresence>
      {theme === "system" && (
        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent)]" />
      )}
    </Button>
  )
}
