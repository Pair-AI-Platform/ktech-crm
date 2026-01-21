"use client"

import { useState } from "react"
import { Loader2, AlertTriangle } from "lucide-react"
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
import { Textarea } from "@/components/ui/input"
import { useLostReasons } from "@/lib/hooks/use-leads"
import { cn } from "@/lib/utils"
import type { LostReasonCategory } from "@/types"

const CATEGORY_LABELS: Record<LostReasonCategory, string> = {
  competitors: "Competitors",
  military_security: "Military / Security",
  academic: "Academic",
  administrative: "Administrative",
  financial: "Financial",
  personal: "Personal",
}

interface MarkLostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reasonId: string, notes?: string) => Promise<void>
  leadName: string
}

export function MarkLostDialog({
  open,
  onOpenChange,
  onConfirm,
  leadName,
}: MarkLostDialogProps) {
  const { reasons, loading: reasonsLoading } = useLostReasons()
  const [selectedReasonId, setSelectedReasonId] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Group reasons by category
  const groupedReasons = reasons.reduce((acc, reason) => {
    const category = reason.category as LostReasonCategory
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(reason)
    return acc
  }, {} as Record<LostReasonCategory, typeof reasons>)

  const handleConfirm = async () => {
    if (!selectedReasonId) return
    setSubmitting(true)
    try {
      await onConfirm(selectedReasonId, notes.trim() || undefined)
      // Reset state on success
      setSelectedReasonId(null)
      setNotes("")
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      setSelectedReasonId(null)
      setNotes("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent size="md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <DialogTitle>Mark Lead as Lost</DialogTitle>
              <DialogDescription>
                Why did {leadName} not convert?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          {reasonsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Reason Selection */}
              <div className="space-y-3">
                {Object.entries(groupedReasons).map(([category, categoryReasons]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">
                      {CATEGORY_LABELS[category as LostReasonCategory] || category}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {categoryReasons.map((reason) => (
                        <button
                          key={reason.id}
                          onClick={() => setSelectedReasonId(reason.id)}
                          className={cn(
                            "px-3 py-1.5 text-sm rounded-lg border transition-all",
                            selectedReasonId === reason.id
                              ? "bg-red-500 border-red-500 text-white"
                              : "bg-[var(--bg-sunken)] border-[var(--border)] text-[var(--text-primary)] hover:border-red-300 hover:bg-red-50"
                          )}
                        >
                          {reason.reason_en}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Additional Notes (optional)
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional details about why this lead was lost..."
                  rows={3}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!selectedReasonId || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Marking Lost...
              </>
            ) : (
              "Mark as Lost"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
