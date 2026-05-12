"use client"

import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"
import { AlertCircle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Forward to Sentry (no-op if NEXT_PUBLIC_SENTRY_DSN is unset)
    Sentry.captureException(error, {
      tags: { boundary: "dashboard" },
      extra: { digest: error.digest, message: error.message, stack: error.stack },
    })
    console.error("[Dashboard error boundary]", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    })
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-base)]">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-[var(--error-bg)] flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-[var(--error)]" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          Something went wrong
        </h1>
        <p className="text-[var(--text-muted)] mb-6">
          {error.message || "An unexpected error occurred. Please try again or contact support if the problem persists."}
        </p>
        {error.digest && (
          <p className="text-xs text-[var(--text-muted)] mb-6 font-mono bg-[var(--bg-sunken)] px-3 py-1 rounded">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex gap-3">
          <Button variant="outline" onClick={reset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Link href="/dashboard">
            <Button>
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
