"use client"

import { cn } from "@/lib/utils"

interface SkeletonCardProps {
  lines?: number
  className?: string
}

export function SkeletonCard({ lines = 3, className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-4",
        className
      )}
    >
      <div className="h-4 w-32 rounded bg-[var(--bg-hover)] animate-pulse" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded bg-[var(--bg-hover)] animate-pulse"
          style={{ width: `${80 - i * 15}%` }}
        />
      ))}
    </div>
  )
}

export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 p-3 animate-pulse", className)}>
      <div className="w-9 h-9 rounded-full bg-[var(--bg-hover)]" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-32 rounded bg-[var(--bg-hover)]" />
        <div className="h-2 w-20 rounded bg-[var(--bg-hover)]" />
      </div>
    </div>
  )
}
