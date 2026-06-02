"use client"

import { AlertCircle, ArrowRight, FileText } from "lucide-react"
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
import type { Lead, PipelineStage } from "@/types"
import { getLeadDisplayName } from "@/lib/lead-utils"

interface SfDocumentsRequirementsDialogProps {
  open: boolean
  lead: Lead | null
  missingDocs: { key: string; label: string }[]
  targetStage: PipelineStage
  onOpenChange: (open: boolean) => void
  onOpenDocuments: () => void
}

const STAGE_LABEL: Partial<Record<PipelineStage, string>> = {
  applicant: "Applicant",
  enrolled: "Enrolled",
}

export function SfDocumentsRequirementsDialog({
  open,
  lead,
  missingDocs,
  targetStage,
  onOpenChange,
  onOpenDocuments,
}: SfDocumentsRequirementsDialogProps) {
  const leadName = lead ? getLeadDisplayName(lead) : "this lead"
  const stageLabel = STAGE_LABEL[targetStage] ?? targetStage

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader className="flex-row items-start gap-4 space-y-0">
          <div className="h-11 w-11 rounded-xl bg-[var(--warning-bg)] text-[var(--warning)] flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <DialogTitle>Documents not complete</DialogTitle>
            <DialogDescription className="mt-2">
              {leadName} cannot move to {stageLabel} until all documents have been submitted.
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-sunken)] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <FileText className="h-4 w-4 text-[var(--primary)]" />
              Missing documents ({missingDocs.length})
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {missingDocs.map((doc) => (
                <span
                  key={doc.key}
                  className="rounded-full border border-[var(--warning)]/25 bg-[var(--warning-bg)] px-3 py-1 text-xs font-medium text-[var(--warning)]"
                >
                  {doc.label}
                </span>
              ))}
            </div>
          </div>

          <p className="text-sm text-[var(--text-secondary)]">
            Open the lead, mark every document as submitted in the Documents section, then move the lead to {stageLabel} again.
          </p>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onOpenDocuments} rightIcon={<ArrowRight className="h-4 w-4" />}>
            Open lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
