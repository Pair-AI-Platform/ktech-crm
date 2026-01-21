"use client"

import * as React from "react"
import { createContext, useContext, useEffect, useState, useMemo, useSyncExternalStore, useRef } from "react"

type Theme = "light" | "dark" | "system"

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

interface ThemeContextType {
  theme: Theme
  resolvedTheme: "light" | "dark"
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const emptySubscribe = () => () => {}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ktech-theme",
}: ThemeProviderProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme
    return (localStorage.getItem(storageKey) as Theme | null) ?? defaultTheme
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
    if (!mounted) return

    const root = window.document.documentElement

    // Only update DOM if resolved theme changed
    if (prevResolvedRef.current !== resolvedTheme) {
      prevResolvedRef.current = resolvedTheme
    }

    root.classList.remove("light", "dark")
    root.classList.add(resolvedTheme)
    root.style.colorScheme = resolvedTheme

    // Listen for system theme changes
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      const handler = (e: MediaQueryListEvent) => {
        const newSystemTheme = e.matches ? "dark" : "light"
        setSystemTheme(newSystemTheme)
        root.classList.remove("light", "dark")
        root.classList.add(newSystemTheme)
        root.style.colorScheme = newSystemTheme
      }
      mediaQuery.addEventListener("change", handler)
      return () => mediaQuery.removeEventListener("change", handler)
    }
  }, [theme, mounted, resolvedTheme])

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme)
    setThemeState(newTheme)
  }

  // Prevent flash by not rendering until mounted
  if (!mounted) {
    return (
      <div style={{ visibility: "hidden" }}>
        {children}
      </div>
    )
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
