"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import {
  SendHorizontal,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from "lucide-react"

interface PSPTransferModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function PSPTransferModal({
  isOpen,
  onClose,
  onSuccess,
}: PSPTransferModalProps) {
  const [loading, setLoading] = useState(false)
  const [fetchingCount, setFetchingCount] = useState(true)
  const [eligibleCount, setEligibleCount] = useState(0)
  const [result, setResult] = useState<{
    success: boolean
    transferred: number
    message: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEligibleCount() {
      setFetchingCount(true)
      setError(null)
      try {
        const response = await fetch("/api/leads/psp-transfer")
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch count")
        }

        setEligibleCount(data.count)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch eligible leads count")
      } finally {
        setFetchingCount(false)
      }
    }

    if (isOpen && !result) {
      fetchEligibleCount()
    }
  }, [isOpen, result])

  const handleTransfer = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/leads/psp-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Transfer failed")
      }

      setResult({
        success: true,
        transferred: data.transferred,
        message: data.message,
      })
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer failed")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setResult(null)
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center mb-2">
            {result?.success ? (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            ) : (
              <SendHorizontal className="w-6 h-6 text-[var(--primary)]" />
            )}
          </div>
          <DialogTitle>
            {result?.success ? "Transfer Complete" : "PSP Transfer"}
          </DialogTitle>
          <DialogDescription>
            {result?.success
              ? result.message
              : "Transfer all PUC leads to the Submission stage (PSP - PUC Submission Pipeline)"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {result?.success ? (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">
                Successfully transferred <strong>{result.transferred}</strong> PUC leads to the Submission stage.
              </p>
            </div>
          ) : (
            <>
              {fetchingCount ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
                </div>
              ) : error ? (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              ) : eligibleCount === 0 ? (
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    No eligible PUC leads found to transfer. All PUC leads may already be in Submission, Enrolled, or Lost stages.
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          This will transfer {eligibleCount} PUC lead{eligibleCount !== 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                          All PUC-funded leads (not already in Submission, Enrolled, or Lost) will be moved to the Submission stage.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[var(--bg-sunken)]">
                    <p className="text-xs text-[var(--text-muted)]">What happens:</p>
                    <ul className="text-sm text-[var(--text-secondary)] mt-2 space-y-1">
                      <li>- Pipeline stage changes to &quot;Submission&quot;</li>
                      <li>- Activity logged for each lead</li>
                      <li>- Leads ready for PUC submission process</li>
                    </ul>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2">
          {result?.success ? (
            <Button onClick={handleClose}>
              Done
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={handleTransfer}
                disabled={loading || fetchingCount || eligibleCount === 0 || !!error}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Transferring...
                  </>
                ) : (
                  <>
                    <SendHorizontal className="w-4 h-4 mr-2" />
                    Transfer {eligibleCount} Lead{eligibleCount !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
