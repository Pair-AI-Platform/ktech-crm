"use client"

import { AlertCircle, RefreshCw, WifiOff, ServerCrash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  retryLabel?: string
  variant?: "default" | "compact" | "inline"
  className?: string
}

export function ErrorState({
  title = "Something went wrong",
  message = "An error occurred while loading the data. Please try again.",
  onRetry,
  retryLabel = "Try Again",
  variant = "default",
  className,
}: ErrorStateProps) {
  const isNetworkError = message?.toLowerCase().includes("network") || message?.toLowerCase().includes("fetch")
  const isServerError = message?.toLowerCase().includes("500") || message?.toLowerCase().includes("server")

  const Icon = isNetworkError ? WifiOff : isServerError ? ServerCrash : AlertCircle

  if (variant === "inline") {
    return (
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-lg bg-[var(--error-bg)] text-[var(--error)]",
        className
      )}>
        <Icon className="w-4 h-4 shrink-0" />
        <span className="text-sm flex-1">{message}</span>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="text-[var(--error)] hover:bg-[var(--error)]/10 shrink-0"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
    )
  }

  if (variant === "compact") {
    return (
      <div className={cn(
        "flex flex-col items-center text-center p-6",
        className
      )}>
        <div className="w-12 h-12 rounded-xl bg-[var(--error-bg)] flex items-center justify-center mb-3">
          <Icon className="w-6 h-6 text-[var(--error)]" />
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-4">{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="w-3 h-3 mr-2" />
            {retryLabel}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={cn(
      "flex flex-col items-center text-center p-8",
      className
    )}>
      <div className="w-16 h-16 rounded-2xl bg-[var(--error-bg)] flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-[var(--error)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--text-muted)] max-w-sm mb-6">
        {message}
      </p>
      {onRetry && (
        <Button onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-2" />
          {retryLabel}
        </Button>
      )}
    </div>
  )
}

// Empty state component (for when there's no data, not an error)
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  message?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  message,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center text-center p-8",
      className
    )}>
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-[var(--bg-sunken)] flex items-center justify-center mb-4 text-[var(--text-muted)]">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
        {title}
      </h3>
      {message && (
        <p className="text-sm text-[var(--text-muted)] max-w-sm mb-6">
          {message}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
