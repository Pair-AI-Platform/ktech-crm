"use client"

import { Component, ReactNode } from "react"
import * as Sentry from "@sentry/nextjs"
import { AlertTriangle } from "lucide-react"

interface SectionBoundaryProps {
  name: string
  children: ReactNode
  fallback?: ReactNode
}

interface SectionBoundaryState {
  error: Error | null
}

/**
 * Class-based error boundary scoped to a single dashboard section.
 *
 * Why a class: React's only stable error-boundary API is `componentDidCatch` /
 * `getDerivedStateFromError`, which only exist on class components. Hook-based
 * boundaries do not exist yet.
 *
 * Why per-section: a hook-ordering bug in one section (e.g. React error #310)
 * would otherwise propagate to the route-level error boundary and blank the
 * entire dashboard. Containing it here keeps the rest of the page usable while
 * the broken section shows a small inline error with a copyable digest.
 */
export class SectionBoundary extends Component<SectionBoundaryProps, SectionBoundaryState> {
  state: SectionBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): SectionBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    Sentry.captureException(error, {
      tags: { boundary: "dashboard-section", section: this.props.name },
      contexts: {
        react: { componentStack: info.componentStack ?? "(none)" },
      },
      extra: {
        section: this.props.name,
        message: error.message,
        stack: error.stack,
      },
    })
    console.error(`[SectionBoundary:${this.props.name}]`, {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    })
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <div className="font-medium">Section unavailable: {this.props.name}</div>
            <div className="text-xs mt-1 opacity-80 break-words">
              {this.state.error.message || "Failed to render"}
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
