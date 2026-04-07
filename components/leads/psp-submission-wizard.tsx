"use client"

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/modal"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import { PSPWizardContent } from "./psp-wizard-content"
import type { Lead } from "@/types"

interface PSPSubmissionWizardProps {
  isOpen: boolean
  onClose: () => void
  lead: Lead | null
  onSuccess: () => void
}

export function PSPSubmissionWizard({
  isOpen,
  onClose,
  lead,
  onSuccess,
}: PSPSubmissionWizardProps) {
  const handleClose = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[720px] p-0 overflow-hidden rounded-xl max-h-[90vh] flex flex-col">
        <VisuallyHidden.Root>
          <DialogTitle>PSP Submission</DialogTitle>
        </VisuallyHidden.Root>
        <PSPWizardContent
          lead={lead}
          isActive={isOpen}
          onClose={handleClose}
          onSuccess={onSuccess}
          variant="modal"
        />
      </DialogContent>
    </Dialog>
  )
}
