"use client"

import { cn } from "@/lib/utils"

interface SectionShellProps {
  label: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function SectionShell({ label, action, children, className }: SectionShellProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]",
        "hover:border-[var(--border-hover)] transition-colors duration-150",
        className
      )}
    >
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{label}</h3>
        {action}
      </div>
      <div className="px-6 pb-5">{children}</div>
    </div>
  )
}
