"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { ProgressBar } from "@/components/ui/progress"
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Users,
} from "lucide-react"
import type { Lead } from "@/types"
import type { MOEFetchResponse, MOEFetchResult } from "@/lib/moe/types"

interface MOEGPAFetchDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedLeads: Lead[]
  onSuccess: () => void
}

type FetchStep = "confirm" | "fetching" | "complete"

export function MOEGPAFetchDialog({
  isOpen,
  onClose,
  selectedLeads,
  onSuccess,
}: MOEGPAFetchDialogProps) {
  const [step, setStep] = useState<FetchStep>("confirm")
  const [fetching, setFetching] = useState(false)
  const [results, setResults] = useState<MOEFetchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  // Filter eligible leads (must have civil_id and seat_number)
  const eligibleLeads = selectedLeads.filter(
    (lead) => lead.civil_id && lead.seat_number
  )
  const ineligibleLeads = selectedLeads.filter(
    (lead) => !lead.civil_id || !lead.seat_number
  )

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setStep("confirm")
      setResults([])
      setError(null)
      setProgress({ current: 0, total: 0 })
    }
  }, [isOpen])

  const handleFetch = async () => {
    if (eligibleLeads.length === 0) return

    setFetching(true)
    setStep("fetching")
    setError(null)
    setProgress({ current: 0, total: eligibleLeads.length })

    try {
      const response = await fetch("/api/moe/fetch-gpa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadIds: eligibleLeads.map((l) => l.id),
        }),
      })

      const data = (await response.json()) as MOEFetchResponse | { error: string }

      if (!response.ok) {
        throw new Error((data as { error: string }).error || "Fetch failed")
      }

      const fetchResponse = data as MOEFetchResponse
      setResults(fetchResponse.results)
      setStep("complete")

      if (fetchResponse.summary.successful > 0) {
        onSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fetch failed")
      setStep("confirm")
    } finally {
      setFetching(false)
    }
  }

  const handleClose = () => {
    setStep("confirm")
    setResults([])
    setError(null)
    onClose()
  }

  const successfulResults = results.filter((r) => r.success)
  const failedResults = results.filter((r) => !r.success)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent size="lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle>Fetch GPA from MOE</DialogTitle>
              <DialogDescription>
                Retrieve actual GPAs from Kuwait Ministry of Education portal
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          {/* Confirm Step */}
          {step === "confirm" && (
            <div className="space-y-4">
              {/* Eligible leads summary */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-700">
                    {eligibleLeads.length} eligible lead{eligibleLeads.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="text-sm text-blue-600">
                  These leads have both Civil ID and Seat Number required for MOE portal authentication.
                </p>
              </div>

              {/* Eligible leads preview */}
              {eligibleLeads.length > 0 && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[var(--bg-sunken)] sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-[var(--text-secondary)]">
                            Name
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-[var(--text-secondary)]">
                            Civil ID
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-[var(--text-secondary)]">
                            Seat Number
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {eligibleLeads.slice(0, 10).map((lead) => (
                          <tr key={lead.id}>
                            <td className="px-3 py-2">
                              {lead.first_name_ar} {lead.last_name_ar}
                            </td>
                            <td className="px-3 py-2 font-mono text-xs">
                              {lead.civil_id}
                            </td>
                            <td className="px-3 py-2 font-mono text-xs">
                              {lead.seat_number}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {eligibleLeads.length > 10 && (
                    <div className="px-3 py-2 bg-[var(--bg-sunken)] text-sm text-[var(--text-secondary)]">
                      + {eligibleLeads.length - 10} more leads
                    </div>
                  )}
                </div>
              )}

              {/* Ineligible leads warning */}
              {ineligibleLeads.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-amber-700">
                      {ineligibleLeads.length} lead{ineligibleLeads.length !== 1 ? "s" : ""} missing
                      Civil ID or Seat Number
                    </span>
                  </div>
                  <ul className="mt-2 text-xs text-amber-600 list-disc list-inside">
                    {ineligibleLeads.slice(0, 3).map((lead) => (
                      <li key={lead.id}>
                        {lead.first_name_ar} {lead.last_name_ar}
                        {!lead.civil_id && " (no Civil ID)"}
                        {!lead.seat_number && " (no Seat Number)"}
                      </li>
                    ))}
                    {ineligibleLeads.length > 3 && (
                      <li>...and {ineligibleLeads.length - 3} more</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Info box */}
              <div className="p-3 bg-[var(--bg-sunken)] border border-[var(--border)] rounded-lg">
                <p className="text-sm text-[var(--text-secondary)]">
                  <strong>Note:</strong> This will log in to the MOE portal as each student
                  using their Civil ID and Seat Number, then extract their GPA.
                  Processing is rate-limited to prevent blocking.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Fetching Step */}
          {step === "fetching" && (
            <div className="py-8 text-center">
              <Loader2 className="w-12 h-12 mx-auto text-blue-500 animate-spin mb-4" />
              <h3 className="font-medium text-[var(--text-primary)] mb-2">
                Fetching GPAs from MOE Portal...
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Processing {eligibleLeads.length} lead{eligibleLeads.length !== 1 ? "s" : ""}.
                This may take a few minutes.
              </p>
              <div className="max-w-xs mx-auto">
                <ProgressBar
                  value={progress.current}
                  max={progress.total || eligibleLeads.length}
                />
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  {progress.current} of {progress.total || eligibleLeads.length} processed
                </p>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {step === "complete" && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-4" />
                <h3 className="font-medium text-[var(--text-primary)] mb-2">
                  Fetch Complete
                </h3>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium text-emerald-700">
                      {successfulResults.length} Successful
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-700">
                      {failedResults.length} Failed
                    </span>
                  </div>
                </div>
              </div>

              {/* Successful results */}
              {successfulResults.length > 0 && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-emerald-50 border-b border-emerald-200">
                    <span className="text-sm font-medium text-emerald-700">
                      Successfully Fetched
                    </span>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {successfulResults.map((result) => (
                      <div
                        key={result.leadId}
                        className="px-3 py-2 text-sm border-b border-[var(--border)] last:border-0 flex justify-between items-center"
                      >
                        <span className="text-[var(--text-primary)]">
                          {result.leadName}
                        </span>
                        <span className="font-semibold text-emerald-600">
                          GPA: {result.gpa}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Failed results */}
              {failedResults.length > 0 && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-red-50 border-b border-red-200">
                    <span className="text-sm font-medium text-red-700">
                      Failed to Fetch
                    </span>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {failedResults.map((result) => (
                      <div
                        key={result.leadId}
                        className="px-3 py-2 text-sm border-b border-[var(--border)] last:border-0"
                      >
                        <span className="text-[var(--text-primary)]">
                          {result.leadName}
                        </span>
                        <span className="text-[var(--text-muted)] ml-2 text-xs">
                          {result.error}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          {step === "confirm" && (
            <>
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleFetch}
                disabled={eligibleLeads.length === 0 || fetching}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Fetch {eligibleLeads.length} GPA{eligibleLeads.length !== 1 ? "s" : ""}
              </Button>
            </>
          )}

          {step === "fetching" && (
            <Button variant="ghost" disabled>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </Button>
          )}

          {step === "complete" && (
            <Button onClick={handleClose}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
