"use client"

import { useState, useEffect, startTransition } from "react"
import { motion } from "framer-motion"
import { Table2, Kanban, List } from "lucide-react"
import { cn } from "@/lib/utils"

type ViewType = "table" | "kanban" | "list"

interface ViewSwitcherProps {
  activeView: ViewType
  onChange: (view: ViewType) => void
  className?: string
  availableViews?: ViewType[]
}

const viewConfig: Record<ViewType, { icon: React.ElementType; label: string }> = {
  table: { icon: Table2, label: "Table" },
  kanban: { icon: Kanban, label: "Board" },
  list: { icon: List, label: "List" },
}

const STORAGE_KEY = "ktech-leads-view"

export function ViewSwitcher({
  activeView,
  onChange,
  className,
  availableViews = ["table", "kanban"],
}: ViewSwitcherProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center p-1 bg-[var(--bg-surface)] rounded-lg border border-[var(--border)]",
        className
      )}
    >
      {availableViews.map((view) => {
        const config = viewConfig[view]
        const Icon = config.icon
        const isActive = activeView === view

        return (
          <button
            key={view}
            onClick={() => onChange(view)}
            className={cn(
              "relative flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
              isActive
                ? "text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="viewSwitcherActive"
                className="absolute inset-0 bg-[var(--primary)] rounded-md"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className={cn("relative z-10 flex items-center gap-2", isActive && "text-white")}>
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{config.label}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

// Hook to persist view preference
export function useViewPreference(defaultView: ViewType = "table") {
  const [view, setView] = useState<ViewType>(defaultView)
  const [isLoading, setIsLoading] = useState(true)

  // Load from localStorage on mount
  useEffect(() => {
    startTransition(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved && (saved === "table" || saved === "kanban" || saved === "list")) {
          setView(saved as ViewType)
        }
      } catch {
        // Ignore localStorage errors
      }
      setIsLoading(false)
    })
  }, [])

  // Save to localStorage when view changes
  const setViewWithPersist = (newView: ViewType) => {
    setView(newView)
    try {
      localStorage.setItem(STORAGE_KEY, newView)
    } catch {
      // Ignore localStorage errors
    }
  }

  return { view, setView: setViewWithPersist, isLoading }
}

export type { ViewType }
