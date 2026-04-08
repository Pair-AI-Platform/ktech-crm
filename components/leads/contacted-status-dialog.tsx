"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Loader2, Phone, Check, ChevronDown, Search } from "lucide-react"
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
  onConfirm: (status: LeadStatus, notes?: string) => Promise<void>
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
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [notes, setNotes] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setSelectedStatus(currentStatus ?? null)
      setSearch("")
      setNotes("")
      setDropdownOpen(false)
    }
  }, [open, currentStatus])

  useEffect(() => {
    if (dropdownOpen && searchRef.current) {
      searchRef.current.focus()
    }
  }, [dropdownOpen])

  const statusOptions = LEAD_STATUSES.filter(s => CONTACTED_STATUSES.includes(s.value))

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return statusOptions
    const q = search.toLowerCase()
    return statusOptions.filter(s => s.label.toLowerCase().includes(q))
  }, [search, statusOptions])

  const handleConfirm = async () => {
    if (!selectedStatus) return
    setSubmitting(true)
    try {
      await onConfirm(selectedStatus, notes.trim() || undefined)
      setSelectedStatus(null)
      setNotes("")
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
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg border transition-all",
                  "bg-[var(--bg-sunken)] border-[var(--border)] text-[var(--text-primary)]",
                  "hover:border-sky-300 dark:hover:border-sky-700",
                  dropdownOpen && "border-sky-500 ring-1 ring-sky-500/20"
                )}
              >
                <span className={cn(!selectedStatus && "text-[var(--text-tertiary)]")}>
                  {selectedStatus
                    ? statusOptions.find(s => s.value === selectedStatus)?.label
                    : "Select a status..."}
                </span>
                <ChevronDown className={cn("w-4 h-4 text-[var(--text-tertiary)] transition-transform", dropdownOpen && "rotate-180")} />
              </button>

              {dropdownOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] shadow-lg">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)]">
                    <Search className="w-4 h-4 text-[var(--text-tertiary)]" />
                    <input
                      ref={searchRef}
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search statuses..."
                      className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
                    />
                  </div>
                  <div className="max-h-52 overflow-y-auto py-1">
                    {filteredOptions.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-[var(--text-tertiary)]">No results found</div>
                    ) : (
                      filteredOptions.map((status) => {
                        const isSelected = selectedStatus === status.value
                        return (
                          <button
                            key={status.value}
                            onClick={() => {
                              setSelectedStatus(status.value)
                              setDropdownOpen(false)
                              setSearch("")
                            }}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left",
                              isSelected
                                ? "bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300"
                                : "text-[var(--text-primary)] hover:bg-[var(--bg-sunken)]"
                            )}
                          >
                            <div className={cn(
                              "w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0",
                              isSelected
                                ? "border-sky-500 bg-sky-500"
                                : "border-[var(--border)]"
                            )}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            {status.label}
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-[var(--text-primary)]">
              Notes
            </h4>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this contact..."
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-sunken)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 resize-none transition-all"
            />
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
