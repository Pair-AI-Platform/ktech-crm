"use client"

import { useState } from "react"
import { Loader2, ShieldAlert } from "lucide-react"
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
import { SUBMISSION_BLOCKED_REASONS, type SubmissionBlockedReason } from "@/types"

interface BlockedReasonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: SubmissionBlockedReason, notes?: string) => Promise<void>
  leadName: string
}

export function BlockedReasonDialog({
  open,
  onOpenChange,
  onConfirm,
  leadName,
}: BlockedReasonDialogProps) {
  const [selectedReason, setSelectedReason] = useState<SubmissionBlockedReason | null>(null)
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
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <DialogTitle>Submission Blocked</DialogTitle>
              <DialogDescription>
                Why is {leadName}&apos;s submission blocked?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">
                Select Block Reason
              </h4>
              <div className="flex flex-wrap gap-2">
                {SUBMISSION_BLOCKED_REASONS.map((reason) => (
                  <button
                    key={reason.value}
                    onClick={() => setSelectedReason(reason.value)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-lg border transition-all",
                      selectedReason === reason.value
                        ? "bg-orange-500 border-orange-500 text-white"
                        : "bg-[var(--bg-sunken)] border-[var(--border)] text-[var(--text-primary)] hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                    )}
                  >
                    {reason.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                Additional Notes (optional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional details about the block reason..."
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
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Block Reason"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
