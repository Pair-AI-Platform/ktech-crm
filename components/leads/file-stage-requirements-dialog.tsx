"use client"

import { AlertCircle, ArrowRight, ClipboardCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/modal"
import type { Lead } from "@/types"
import { getLeadDisplayName } from "@/lib/lead-utils"

interface FileStageRequirementsDialogProps {
  open: boolean
  lead: Lead | null
  missingFields: string[]
  onOpenChange: (open: boolean) => void
  onFillRequiredFields: () => void
}

function formatFieldLabel(field: string) {
  const normalized = field.trim()
  if (normalized.toLowerCase() === "phone number") return "Phone number"
  if (normalized.toLowerCase() === "document education type") return "Document education type"
  if (normalized.toLowerCase() === "valid civil id") return "Valid Civil ID"
  if (normalized.toLowerCase() === "civil id") return "Civil ID"
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

export function FileStageRequirementsDialog({
  open,
  lead,
  missingFields,
  onOpenChange,
  onFillRequiredFields,
}: FileStageRequirementsDialogProps) {
  const leadName = lead ? getLeadDisplayName(lead) : "this lead"
  const uniqueFields = Array.from(new Set(missingFields.map(formatFieldLabel)))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader className="flex-row items-start gap-4 space-y-0">
          <div className="h-11 w-11 rounded-xl bg-[var(--warning-bg)] text-[var(--warning)] flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <DialogTitle>Finish required fields first</DialogTitle>
            <DialogDescription className="mt-2">
              {leadName} cannot move to File until the main file details are complete.
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-sunken)] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <ClipboardCheck className="h-4 w-4 text-[var(--primary)]" />
              Missing before File
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {uniqueFields.map((field) => (
                <span
                  key={field}
                  className="rounded-full border border-[var(--warning)]/25 bg-[var(--warning-bg)] px-3 py-1 text-xs font-medium text-[var(--warning)]"
                >
                  {field}
                </span>
              ))}
            </div>
          </div>

          <p className="text-sm text-[var(--text-secondary)]">
            Open the required fields form, complete the missing information, then move the lead to File again.
          </p>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onFillRequiredFields} rightIcon={<ArrowRight className="h-4 w-4" />}>
            Fill required fields
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
