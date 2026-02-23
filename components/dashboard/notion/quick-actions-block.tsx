"use client"

import { ReactNode } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface QuickAction {
  id: string
  label: string
  icon: ReactNode
  onClick: () => void
  variant?: "default" | "primary" | "accent"
  disabled?: boolean
}

interface QuickActionsBlockProps {
  actions: QuickAction[]
  columns?: 2 | 3 | 4
  size?: "sm" | "md" | "lg"
}

export function QuickActionsBlock({
  actions,
  columns = 2,
  size = "md",
}: QuickActionsBlockProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
  }

  const sizes = {
    sm: { padding: "p-3", icon: "w-5 h-5", text: "text-xs" },
    md: { padding: "p-4", icon: "w-6 h-6", text: "text-sm" },
    lg: { padding: "p-5", icon: "w-7 h-7", text: "text-sm" },
  }

  const variants = {
    default: "bg-[var(--bg-sunken)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]",
    primary: "bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white",
    accent: "bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 text-[var(--accent)]",
  }

  return (
    <div className={cn("grid gap-2", gridCols[columns])}>
      {actions.map((action, index) => (
        <motion.button
          key={action.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={action.onClick}
          disabled={action.disabled}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-xl",
            "border border-[var(--border-subtle)]",
            "transition-all duration-200",
            sizes[size].padding,
            variants[action.variant || "default"],
            action.disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <span className={sizes[size].icon}>{action.icon}</span>
          <span className={cn("font-medium", sizes[size].text)}>{action.label}</span>
        </motion.button>
      ))}
    </div>
  )
}

// Horizontal quick actions bar
interface QuickActionsBarProps {
  actions: QuickAction[]
  size?: "sm" | "md"
}

export function QuickActionsBar({ actions, size = "md" }: QuickActionsBarProps) {
  const sizes = {
    sm: { padding: "px-3 py-1.5", icon: "w-4 h-4", text: "text-xs", gap: "gap-1.5" },
    md: { padding: "px-4 py-2", icon: "w-5 h-5", text: "text-sm", gap: "gap-2" },
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <motion.button
          key={action.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={action.onClick}
          disabled={action.disabled}
          className={cn(
            "flex items-center rounded-lg",
            "border border-[var(--border-subtle)]",
            "bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)]",
            "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
            "transition-all duration-200",
            sizes[size].padding,
            sizes[size].gap,
            action.disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <span className={sizes[size].icon}>{action.icon}</span>
          <span className={cn("font-medium", sizes[size].text)}>{action.label}</span>
        </motion.button>
      ))}
    </div>
  )
}

// Floating action button
interface FABProps {
  icon: ReactNode
  label?: string
  onClick: () => void
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
}

export function FAB({ icon, label, onClick, position = "bottom-right" }: FABProps) {
  const positions = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
  }

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={cn(
        "fixed z-50 flex items-center gap-2",
        "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white",
        "rounded-full shadow-lg hover:shadow-xl",
        "transition-shadow duration-200",
        label ? "px-5 py-3" : "p-4",
        positions[position]
      )}
    >
      <span className="w-6 h-6">{icon}</span>
      {label && <span className="font-medium">{label}</span>}
    </motion.button>
  )
}
