"use client"

import type { ReactNode } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { QueryProvider } from "@/lib/query-client"

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider defaultTheme="system" storageKey="ktech-theme">
        {children}
      </ThemeProvider>
    </QueryProvider>
  )
}
