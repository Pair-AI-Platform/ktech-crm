"use client"

import React from "react"
import { AlertCircle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="flex flex-col items-center text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-[var(--error-bg)] flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-[var(--error)]" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              {this.state.error?.message || "An unexpected error occurred. Please try again."}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={this.handleRetry}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button asChild>
                <Link href="/dashboard">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Functional error fallback component
export function ErrorFallback({
  error,
  resetError,
}: {
  error?: Error | null
  resetError?: () => void
}) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-[var(--error-bg)] flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-[var(--error)]" />
        </div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          {error?.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="flex gap-3">
          {resetError && (
            <Button variant="outline" onClick={resetError}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          <Button asChild>
            <Link href="/dashboard">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

// Loading skeleton for pages
export function PageSkeleton() {
  return (
    <div className="min-h-screen p-6 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-[var(--bg-hover)] rounded-lg mb-2" />
          <div className="h-4 w-32 bg-[var(--bg-hover)] rounded" />
        </div>
        <div className="h-10 w-32 bg-[var(--bg-hover)] rounded-full" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]">
            <div className="h-4 w-24 bg-[var(--bg-hover)] rounded mb-3" />
            <div className="h-8 w-16 bg-[var(--bg-hover)] rounded" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-10 w-10 bg-[var(--bg-hover)] rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-[var(--bg-hover)] rounded" />
                <div className="h-3 w-32 bg-[var(--bg-hover)] rounded" />
              </div>
              <div className="h-6 w-20 bg-[var(--bg-hover)] rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Card skeleton
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={`p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] animate-pulse ${className}`}>
      <div className="h-4 w-24 bg-[var(--bg-hover)] rounded mb-3" />
      <div className="h-8 w-16 bg-[var(--bg-hover)] rounded" />
    </div>
  )
}

// Table skeleton
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] overflow-hidden animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-[var(--border)] bg-[var(--bg-sunken)]">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-4 flex-1 bg-[var(--bg-hover)] rounded" />
        ))}
      </div>
      {/* Rows */}
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border-b border-[var(--border)] last:border-0">
          <div className="h-8 w-8 bg-[var(--bg-hover)] rounded-full" />
          {[...Array(4)].map((_, j) => (
            <div key={j} className="h-4 flex-1 bg-[var(--bg-hover)] rounded" />
          ))}
        </div>
      ))}
    </div>
  )
}
