"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface SwitchProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
  id?: string
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked = false, onCheckedChange, disabled = false, className, id }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        id={id}
        onClick={(e) => {
          e.stopPropagation()
          onCheckedChange?.(!checked)
        }}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked
            ? "bg-[var(--primary)]"
            : "bg-[var(--bg-sunken)]",
          className
        )}
      >
        <motion.span
          initial={false}
          animate={{
            x: checked ? 20 : 2
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn(
            "pointer-events-none block h-4 w-4 rounded-full shadow-lg ring-0",
            checked ? "bg-[#FAF9F7]" : "bg-[var(--text-muted)]"
          )}
        />
      </button>
    )
  }
)

Switch.displayName = "Switch"

export { Switch }
