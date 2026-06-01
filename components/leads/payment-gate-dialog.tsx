"use client"

import { useState } from "react"
import { getLeadDisplayName } from "@/lib/lead-utils"
import {
  Loader2,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ShieldOff,
  Wallet,
} from "lucide-react"
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
import type { Lead, PipelineStage } from "@/types"
import { FULL_TUITION_AMOUNT } from "@/lib/config/constants"
import { PIPELINE_STAGES } from "@/types"
import { isDemoMode } from "@/lib/demo-data"

type Step = "info" | "exempt" | "exempt-done"

interface PaymentGateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: Lead
  /** KWD that must be paid before this transition is allowed (150 or 550). */
  required: number
  /** KWD paid so far. */
  paid: number
  /** Stage the lead is trying to move to. */
  targetStage: PipelineStage
  /** Open the normal payment flow so the agent can collect the money. */
  onRecordPayment: () => void
  /** Exemption was granted — lead has been moved server-side. */
  onExempted: () => void
}

function stageLabel(stage: PipelineStage): string {
  return PIPELINE_STAGES.find((s) => s.value === stage)?.label ?? stage
}

export function PaymentGateDialog({
  open,
  onOpenChange,
  lead,
  required,
  paid,
  targetStage,
  onRecordPayment,
  onExempted,
}: PaymentGateDialogProps) {
  const [step, setStep] = useState<Step>("info")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remaining = Math.max(0, required - paid)
  const isFull = required >= FULL_TUITION_AMOUNT

  const handleClose = () => {
    if (loading) return
    setStep("info")
    setNote("")
    setError(null)
    onOpenChange(false)
  }

  const handleExempt = async () => {
    if (!note.trim()) {
      setError("Please add a note explaining the exemption")
      return
    }
    setLoading(true)
    setError(null)

    if (isDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      setLoading(false)
      setStep("exempt-done")
      return
    }

    try {
      const response = await fetch("/api/payments/tuition-exempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          note: note.trim(),
          targetStage,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to exempt lead")
      }
      setStep("exempt-done")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to exempt lead")
    } finally {
      setLoading(false)
    }
  }

  const handleDone = () => {
    onExempted()
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent size="md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                step === "exempt-done" ? "bg-emerald-100" : "bg-amber-100"
              )}
            >
              {step === "exempt-done" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <Wallet className="w-5 h-5 text-amber-600" />
              )}
            </div>
            <div>
              <DialogTitle>
                {step === "exempt-done"
                  ? "Payment Exempted"
                  : `Payment Required for ${stageLabel(targetStage)}`}
              </DialogTitle>
              <DialogDescription>
                {step === "exempt-done"
                  ? `${getLeadDisplayName(lead)} has been moved to ${stageLabel(targetStage)}.`
                  : isFull
                    ? `${getLeadDisplayName(lead)} must pay the full ${FULL_TUITION_AMOUNT} KWD tuition before moving to ${stageLabel(targetStage)}.`
                    : `${getLeadDisplayName(lead)} must pay at least ${required} KWD before moving to ${stageLabel(targetStage)}.`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          {/* Step: Info — paid vs required */}
          {step === "info" && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-amber-700">Paid</p>
                  <p className="text-base font-semibold tabular-nums">{paid} KWD</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-amber-700">Required</p>
                  <p className="text-base font-semibold tabular-nums">{required} KWD</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-amber-700">Short by</p>
                  <p className="text-base font-semibold tabular-nums">{remaining} KWD</p>
                </div>
              </div>

              <p className="text-sm text-[var(--text-secondary)]">
                Record the outstanding payment to move {getLeadDisplayName(lead)} forward, or
                exempt them from this requirement with a note.
              </p>
            </div>
          )}

          {/* Step: Exempt — require a note */}
          {step === "exempt" && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-left">
                <p className="text-sm text-amber-700">
                  <strong>Warning:</strong> This waives the tuition payment requirement for{" "}
                  {getLeadDisplayName(lead)} and moves them to {stageLabel(targetStage)}. The
                  exemption and your note are recorded on the lead.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Exemption note <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Why is this lead being exempted from the payment requirement?"
                  rows={3}
                  className="w-full"
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Step: Exempt done */}
          {step === "exempt-done" && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-medium text-[var(--text-primary)]">Payment Exempted</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  {getLeadDisplayName(lead)} has been exempted from the tuition payment requirement
                  and moved to {stageLabel(targetStage)}.
                </p>
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          {step === "info" && (
            <div className="flex items-center justify-between w-full">
              <Button
                variant="ghost"
                onClick={() => { setStep("exempt"); setError(null) }}
                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
              >
                <ShieldOff className="w-4 h-4 mr-2" />
                Exempt with note
              </Button>
              <Button onClick={() => { onRecordPayment(); handleClose() }}>
                <CreditCard className="w-4 h-4 mr-2" />
                Record Payment
              </Button>
            </div>
          )}

          {step === "exempt" && (
            <>
              <Button variant="ghost" onClick={() => { setStep("info"); setError(null) }} disabled={loading}>
                Back
              </Button>
              <Button
                onClick={handleExempt}
                disabled={loading || !note.trim()}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShieldOff className="w-4 h-4 mr-2" />
                    Confirm Exemption
                  </>
                )}
              </Button>
            </>
          )}

          {step === "exempt-done" && (
            <Button onClick={handleDone}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
