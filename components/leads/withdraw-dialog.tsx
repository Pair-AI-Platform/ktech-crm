"use client"

import { useState } from "react"
import { Loader2, UserMinus, Check } from "lucide-react"
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

  const allOptions = [
    ...WITHDRAWAL_REASONS.map(r => ({ id: r.id, label: r.label })),
    ...COMPETITOR_OPTIONS,
    ...MILITARY_SECURITY_OPTIONS,
  ]
  const selectedOption = allOptions.find(r => r.id === selectedReasonId)

  const handleConfirm = async () => {
    if (!selectedReasonId || !selectedOption) return
    setSubmitting(true)
    try {
      await onConfirm(selectedReasonId, selectedOption.label, notes.trim() || undefined)
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

  const renderButtons = (options: ReadonlyArray<{ id: string; label: string }>) => (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => setSelectedReasonId(option.id)}
          className={cn(
            "px-3 py-1.5 text-sm rounded-lg border transition-all inline-flex items-center gap-1.5",
            selectedReasonId === option.id
              ? "bg-orange-500 border-orange-500 text-white"
              : "bg-[var(--bg-sunken)] border-[var(--border)] text-[var(--text-primary)] hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/30"
          )}
        >
          {selectedReasonId === option.id && <Check className="w-3.5 h-3.5" />}
          {option.label}
        </button>
      ))}
    </div>
  )

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
            {/* General Reasons */}
            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">
                Select Reason
              </h4>
              {renderButtons(WITHDRAWAL_REASONS)}
            </div>

            {/* Competitors */}
            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">
                Competitors
              </h4>
              {renderButtons(COMPETITOR_OPTIONS)}
            </div>

            {/* Military / Security */}
            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">
                Military / Security
              </h4>
              {renderButtons(MILITARY_SECURITY_OPTIONS)}
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