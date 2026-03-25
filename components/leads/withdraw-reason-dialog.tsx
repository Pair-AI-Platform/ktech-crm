"use client"

import { useState } from "react"
import { Loader2, LogOut, Check } from "lucide-react"
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
import { WITHDRAWAL_REASONS, COMPETITOR_OPTIONS, MILITARY_SECURITY_OPTIONS } from "@/lib/config/withdrawal-reasons"

interface WithdrawReasonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string, notes?: string) => Promise<void>
  leadName: string
}

export function WithdrawReasonDialog({
  open,
  onOpenChange,
  onConfirm,
  leadName,
}: WithdrawReasonDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = async () => {
    if (!selectedReason) return
    setSubmitting(true)
    try {
      await onConfirm(selectedReason, notes.trim() || undefined)
      setSelectedReason(null)
      setNotes("")
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      setSelectedReason(null)
      setNotes("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent size="md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <DialogTitle>Withdraw Student</DialogTitle>
              <DialogDescription>
                Why is {leadName} withdrawing?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-4">
            {/* General Reasons */}
            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">
                Select Reason
              </h4>
              <div className="flex flex-wrap gap-2">
                {WITHDRAWAL_REASONS.map((reason) => (
                  <button
                    key={reason.id}
                    onClick={() => setSelectedReason(reason.id)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-lg border transition-all inline-flex items-center gap-1.5",
                      selectedReason === reason.id
                        ? "bg-amber-500 border-amber-500 text-white"
                        : "bg-[var(--bg-sunken)] border-[var(--border)] text-[var(--text-primary)] hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                    )}
                  >
                    {selectedReason === reason.id && <Check className="w-3.5 h-3.5" />}
                    {reason.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Competitors */}
            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">
                Competitors
              </h4>
              <div className="flex flex-wrap gap-2">
                {COMPETITOR_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedReason(option.id)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-lg border transition-all inline-flex items-center gap-1.5",
                      selectedReason === option.id
                        ? "bg-amber-500 border-amber-500 text-white"
                        : "bg-[var(--bg-sunken)] border-[var(--border)] text-[var(--text-primary)] hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                    )}
                  >
                    {selectedReason === option.id && <Check className="w-3.5 h-3.5" />}
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Military / Security */}
            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">
                Military / Security
              </h4>
              <div className="flex flex-wrap gap-2">
                {MILITARY_SECURITY_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedReason(option.id)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-lg border transition-all inline-flex items-center gap-1.5",
                      selectedReason === option.id
                        ? "bg-amber-500 border-amber-500 text-white"
                        : "bg-[var(--bg-sunken)] border-[var(--border)] text-[var(--text-primary)] hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                    )}
                  >
                    {selectedReason === option.id && <Check className="w-3.5 h-3.5" />}
                    {option.label}
                  </button>
                ))}
              </div>
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
            disabled={!selectedReason || submitting}
            className="bg-amber-500 hover:bg-amber-600 text-white"
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
