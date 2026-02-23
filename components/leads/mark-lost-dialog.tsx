"use client"

import { useState } from "react"
import { Loader2, AlertTriangle, Check } from "lucide-react"
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
import type { LostReasonCategory, LeadStatus } from "@/types"
import { LEAD_STATUSES } from "@/types"

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

// Status-based multi-select dialog for marking leads as lost from the table
interface MarkLostStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (selectedStatuses: LeadStatus[], notes?: string) => Promise<void>
  leadName: string
  availableStatuses?: LeadStatus[]
}

export function MarkLostStatusDialog({
  open,
  onOpenChange,
  onConfirm,
  leadName,
  availableStatuses,
}: MarkLostStatusDialogProps) {
  const [selectedStatuses, setSelectedStatuses] = useState<LeadStatus[]>([])
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Filter to available statuses or show all
  const statusOptions = availableStatuses
    ? LEAD_STATUSES.filter(s => availableStatuses.includes(s.value))
    : LEAD_STATUSES

  const toggleStatus = (status: LeadStatus) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }

  const handleConfirm = async () => {
    if (selectedStatuses.length === 0) return
    setSubmitting(true)
    try {
      await onConfirm(selectedStatuses, notes.trim() || undefined)
      setSelectedStatuses([])
      setNotes("")
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      setSelectedStatuses([])
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
                Why was {leadName} lost? Select one or more reasons.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-4">
            {/* Status Multi-Select */}
            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">
                Select Reasons
              </h4>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => {
                  const isSelected = selectedStatuses.includes(status.value)
                  return (
                    <button
                      key={status.value}
                      onClick={() => toggleStatus(status.value)}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-lg border transition-all inline-flex items-center gap-1.5",
                        isSelected
                          ? "bg-red-500 border-red-500 text-white"
                          : "bg-[var(--bg-sunken)] border-[var(--border)] text-[var(--text-primary)] hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950/20"
                      )}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      {status.label}
                    </button>
                  )
                })}
              </div>
              {selectedStatuses.length > 0 && (
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  {selectedStatuses.length} reason{selectedStatuses.length !== 1 ? 's' : ''} selected
                </p>
              )}
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
            disabled={selectedStatuses.length === 0 || submitting}
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
