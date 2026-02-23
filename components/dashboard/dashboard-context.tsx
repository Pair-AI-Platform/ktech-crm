"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { useUser } from "@/lib/hooks/use-user"
import { DateRange, getDefaultDateRange } from "./primitives/date-range-picker"

interface DashboardContextValue {
  dateRange: DateRange
  setDateRange: (range: DateRange) => void
  isAdmin: boolean
  profileId: string | null
  profileName: string
  loading: boolean
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { profile, loading, isAdmin } = useUser()
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange)

  return (
    <DashboardContext.Provider
      value={{
        dateRange,
        setDateRange,
        isAdmin: isAdmin ?? false,
        profileId: profile?.id ?? null,
        profileName: profile?.full_name?.split(" ")[0] || "",
        loading,
      }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboardContext() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error("useDashboardContext must be used within DashboardProvider")
  return ctx
}
