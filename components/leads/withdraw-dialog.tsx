"use client"

import { useState } from "react"
import { Loader2, UserMinus } from "lucide-react"
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
import { cn } from "@/lib/utils"
import type { WithdrawalReasonCategory } from "@/types"

// Withdrawal reasons for enrolled students
const WITHDRAWAL_REASONS: { id: string; category: WithdrawalReasonCategory; reason_en: string }[] = [
  // Academic
  { id: "wr-1", category: "academic", reason_en: "Academic difficulties" },
  { id: "wr-2", category: "academic", reason_en: "Failed placement test" },
  { id: "wr-3", category: "academic", reason_en: "Changed major interest" },
  { id: "wr-4", category: "academic", reason_en: "Academic probation" },

  // Financial
  { id: "wr-5", category: "financial", reason_en: "Cannot afford tuition" },
  { id: "wr-6", category: "financial", reason_en: "Lost scholarship/PUC" },
  { id: "wr-7", category: "financial", reason_en: "Payment issues" },
  { id: "wr-8", category: "financial", reason_en: "Financial emergency" },

  // Personal
  { id: "wr-9", category: "personal", reason_en: "Family circumstances" },
  { id: "wr-10", category: "personal", reason_en: "Health issues" },
  { id: "wr-11", category: "personal", reason_en: "Relocation" },
  { id: "wr-12", category: "personal", reason_en: "Military service" },
  { id: "wr-13", category: "personal", reason_en: "Got married" },

  // Transfer
  { id: "wr-14", category: "transfer", reason_en: "Transferring to another university" },
  { id: "wr-15", category: "transfer", reason_en: "Accepted at PAAET" },
  { id: "wr-16", category: "transfer", reason_en: "Accepted at Kuwait University" },
  { id: "wr-17", category: "transfer", reason_en: "Studying abroad" },

  // Other
  { id: "wr-18", category: "other", reason_en: "Changed mind" },
  { id: "wr-19", category: "other", reason_en: "No longer interested" },
  { id: "wr-20", category: "other", reason_en: "Other reason" },
]

const CATEGORY_LABELS: Record<WithdrawalReasonCategory, string> = {
  academic: "Academic",
  financial: "Financial",
  personal: "Personal",
  transfer: "Transfer",
  other: "Other",
}

interface WithdrawDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reasonId: string, reasonText: string, notes?: string) => Promise<void>
  studentName: string
}

export function WithdrawDialog({
  open,
  onOpenChange,
  onConfirm,
  studentName,
}: WithdrawDialogProps) {
  const [selectedReasonId, setSelectedReasonId] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Group reasons by category
  const groupedReasons = WITHDRAWAL_REASONS.reduce((acc, reason) => {
    if (!acc[reason.category]) {
      acc[reason.category] = []
    }
    acc[reason.category].push(reason)
    return acc
  }, {} as Record<WithdrawalReasonCategory, typeof WITHDRAWAL_REASONS>)

  const selectedReason = WITHDRAWAL_REASONS.find(r => r.id === selectedReasonId)

  const handleConfirm = async () => {
    if (!selectedReasonId || !selectedReason) return
    setSubmitting(true)
    try {
      await onConfirm(selectedReasonId, selectedReason.reason_en, notes.trim() || undefined)
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
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center">
              <UserMinus className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <DialogTitle>Withdraw Student</DialogTitle>
              <DialogDescription>
                Why is {studentName} withdrawing?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-4">
            {/* Reason Selection */}
            <div className="space-y-3">
              {Object.entries(groupedReasons).map(([category, categoryReasons]) => (
                <div key={category}>
                  <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">
                    {CATEGORY_LABELS[category as WithdrawalReasonCategory]}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {categoryReasons.map((reason) => (
                      <button
                        key={reason.id}
                        onClick={() => setSelectedReasonId(reason.id)}
                        className={cn(
                          "px-3 py-1.5 text-sm rounded-lg border transition-all",
                          selectedReasonId === reason.id
                            ? "bg-orange-500 border-orange-500 text-white"
                            : "bg-[var(--bg-sunken)] border-[var(--border)] text-[var(--text-primary)] hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/30"
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
                placeholder="Any additional details about the withdrawal..."
                rows={3}
                className="w-full"
              />
            </div>
          </div>
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
            onClick={handleConfirm}
            disabled={!selectedReasonId || submitting}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Withdrawing...
              </>
            ) : (
              "Confirm Withdrawal"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
