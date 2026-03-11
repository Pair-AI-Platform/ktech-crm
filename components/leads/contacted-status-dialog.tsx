"use client"

import { useState, useEffect } from "react"
import { Loader2, Phone, Check } from "lucide-react"
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
import { cn } from "@/lib/utils"
import { LEAD_STATUSES } from "@/types"
import type { LeadStatus } from "@/types"

const CONTACTED_STATUSES: LeadStatus[] = [
  'no_answer', 'switched_off', 'interested',
  'not_interested', 'high_gpa', 'wrong_number', 'will_see',
  'by_mistake', 'disconnected', 'rude', 'asking_bachelors', 'courses_masters',
  'current_student', 'seeking_job', 'cant_reach', 'competitor',
]

interface ContactedStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (status: LeadStatus) => Promise<void>
  leadName: string
  currentStatus?: LeadStatus | null
}

export function ContactedStatusDialog({
  open,
  onOpenChange,
  onConfirm,
  leadName,
  currentStatus,
}: ContactedStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | null>(currentStatus ?? null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedStatus(currentStatus ?? null)
    }
  }, [open, currentStatus])

  const statusOptions = LEAD_STATUSES.filter(s => CONTACTED_STATUSES.includes(s.value))

  const handleConfirm = async () => {
    if (!selectedStatus) return
    setSubmitting(true)
    try {
      await onConfirm(selectedStatus)
      setSelectedStatus(null)
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      setSelectedStatus(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent size="md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
              <Phone className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <DialogTitle>Select Contact Status</DialogTitle>
              <DialogDescription>
                What was the result of contacting {leadName}?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-[var(--text-primary)]">
              Status <span className="text-red-500">*</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => {
                const isSelected = selectedStatus === status.value
                return (
                  <button
                    key={status.value}
                    onClick={() => setSelectedStatus(status.value)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-lg border transition-all inline-flex items-center gap-1.5",
                      isSelected
                        ? "bg-sky-500 border-sky-500 text-white"
                        : "bg-[var(--bg-sunken)] border-[var(--border)] text-[var(--text-primary)] hover:border-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/20"
                    )}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    {status.label}
                  </button>
                )
              })}
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
            disabled={!selectedStatus || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Confirm"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
