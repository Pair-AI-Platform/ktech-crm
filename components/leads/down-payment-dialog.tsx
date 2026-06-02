"use client"

import { useRef, useState } from "react"
import { getLeadDisplayName } from "@/lib/lead-utils"
import {
  Loader2,
  Banknote,
  CheckCircle2,
  ArrowLeft,
  AlertCircle,
  Receipt,
  ShieldOff,
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
import { Input, Textarea } from "@/components/ui/input"
import type { Lead } from "@/types"
import { ENROLLMENT_PAYMENT_AMOUNT, FULL_TUITION_AMOUNT } from "@/lib/config/constants"
import { isDemoMode } from "@/lib/demo-data"

type Step = "select" | "cash" | "exempt-confirm" | "success" | "exempt-done"
type SuccessAction = "paid" | "exempt"

interface DownPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: Lead
  /** Called after a successful payment (advance lead to File) or exemption (lead already moved server-side). */
  onSuccess?: (action: SuccessAction) => Promise<void>
}

/**
 * Seat-reservation down payment (150 KWD) collected when a self-funded lead
 * moves from Test → File. Cash/KNET or an admin exemption only — no online
 * link. The amount counts toward the full {FULL_TUITION_AMOUNT} KWD tuition.
 */
export function DownPaymentDialog({ open, onOpenChange, lead, onSuccess }: DownPaymentDialogProps) {
  const amount = ENROLLMENT_PAYMENT_AMOUNT
  const remainingAfter = Math.max(0, FULL_TUITION_AMOUNT - amount)

  const [step, setStep] = useState<Step>("select")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const notifiedActionRef = useRef<SuccessAction | null>(null)

  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [exemptNote, setExemptNote] = useState("")

  const handleClose = () => {
    if (loading) return
    setStep("select")
    setError(null)
    notifiedActionRef.current = null
    setInvoiceNumber("")
    setNotes("")
    setExemptNote("")
    onOpenChange(false)
  }

  const notifySuccess = async (action: SuccessAction) => {
    if (notifiedActionRef.current === action) return
    notifiedActionRef.current = action
    await onSuccess?.(action)
  }

  const handleCashPayment = async () => {
    if (!invoiceNumber.trim()) {
      setError("Invoice number is required")
      return
    }

    setLoading(true)
    setError(null)

    if (isDemoMode()) {
      await new Promise(resolve => setTimeout(resolve, 500))
      setLoading(false)
      setStep("success")
      await notifySuccess("paid")
      return
    }

    try {
      const response = await fetch("/api/payments/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          invoiceNumber: invoiceNumber.trim(),
          notes: notes.trim() || undefined,
          amount,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to process payment")
      }

      setStep("success")
      await notifySuccess("paid")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process payment")
    } finally {
      setLoading(false)
    }
  }

  const handleExempt = async () => {
    if (!exemptNote.trim()) {
      setError("An exemption note is required")
      return
    }

    setLoading(true)
    setError(null)

    if (isDemoMode()) {
      await new Promise(resolve => setTimeout(resolve, 500))
      setLoading(false)
      setStep("exempt-done")
      await notifySuccess("exempt")
      return
    }

    try {
      const response = await fetch("/api/payments/tuition-exempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          note: exemptNote.trim(),
          targetStage: "application",
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to exempt lead")
      }

      setStep("exempt-done")
      await notifySuccess("exempt")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to exempt lead")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent size="md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={
              step === "success" || step === "exempt-done"
                ? "w-10 h-10 rounded-full flex items-center justify-center bg-emerald-100"
                : "w-10 h-10 rounded-full flex items-center justify-center bg-amber-100"
            }>
              {step === "success" || step === "exempt-done" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <Receipt className="w-5 h-5 text-amber-600" />
              )}
            </div>
            <div>
              <DialogTitle>
                {step === "success" ? "Down Payment Received" : step === "exempt-done" ? "Payment Exempted" : "Down Payment"}
              </DialogTitle>
              <DialogDescription>
                {step === "success"
                  ? `${getLeadDisplayName(lead)} has been moved to File stage`
                  : step === "exempt-done"
                  ? `${getLeadDisplayName(lead)} has been exempted and moved to File stage`
                  : `Collect the ${amount} KWD deposit for ${getLeadDisplayName(lead)} to move to File stage`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          {/* Step: Select method */}
          {step === "select" && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-900">Seat Reservation Deposit</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Counts toward the {FULL_TUITION_AMOUNT} KWD tuition — {remainingAfter} KWD remaining before enrollment.
                  </p>
                </div>
                <span className="text-xl font-bold text-amber-800 tabular-nums">{amount} KWD</span>
              </div>

              <button
                onClick={() => { setError(null); setStep("cash") }}
                className="w-full p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-sunken)] hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left"
              >
                <Banknote className="w-8 h-8 text-emerald-500 mb-2" />
                <h3 className="font-medium text-[var(--text-primary)]">Cash / KNET</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Record a cash or KNET payment of {amount} KWD
                </p>
              </button>
            </div>
          )}

          {/* Step: Cash form */}
          {step === "cash" && (
            <div className="space-y-4">
              <button
                onClick={() => { setStep("select"); setError(null) }}
                className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="text-sm text-amber-700">Amount</span>
                <span className="text-lg font-bold text-amber-800 tabular-nums">{amount} KWD</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Invoice Number <span className="text-red-500">*</span>
                </label>
                <Input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Enter invoice/receipt number"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Notes (optional)
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional payment details..."
                  rows={2}
                  className="w-full"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-700">
                  Recording cash/KNET payment of <strong>{amount} KWD</strong>. The lead will be moved to File stage.
                </p>
              </div>
            </div>
          )}

          {/* Step: Exempt confirm */}
          {step === "exempt-confirm" && (
            <div className="space-y-4">
              <button
                onClick={() => { setStep("select"); setError(null) }}
                className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
                  <ShieldOff className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="font-medium text-[var(--text-primary)] mt-3">Exempt from tuition payment?</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  This waives the tuition requirement and moves {getLeadDisplayName(lead)} to the File stage.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Exemption Note <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={exemptNote}
                  onChange={(e) => setExemptNote(e.target.value)}
                  placeholder="Reason for the exemption (recorded on the lead)..."
                  rows={2}
                  className="w-full"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-700">
                  <strong>Warning:</strong> This waives the full tuition requirement and is recorded on the lead&apos;s profile.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-medium text-[var(--text-primary)]">Down Payment Received!</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  {getLeadDisplayName(lead)} has been moved to the File stage.
                </p>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-700">
                  Payment of {amount} KWD recorded. {remainingAfter} KWD remaining before enrollment.
                </p>
              </div>
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
                  {getLeadDisplayName(lead)} has been exempted from tuition and moved to the File stage.
                </p>
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          {step === "select" && (
            <div className="flex items-center justify-between w-full">
              <Button
                variant="ghost"
                onClick={() => { setError(null); setStep("exempt-confirm") }}
                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
              >
                <ShieldOff className="w-4 h-4 mr-2" />
                Exempt
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            </div>
          )}

          {step === "cash" && (
            <>
              <Button variant="ghost" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleCashPayment} disabled={loading || !invoiceNumber.trim()}>
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4 mr-2" />Confirm Payment</>
                )}
              </Button>
            </>
          )}

          {step === "exempt-confirm" && (
            <>
              <Button variant="ghost" onClick={() => { setStep("select"); setError(null) }} disabled={loading}>
                Back
              </Button>
              <Button
                onClick={handleExempt}
                disabled={loading || !exemptNote.trim()}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                ) : (
                  <><ShieldOff className="w-4 h-4 mr-2" />Confirm Exemption</>
                )}
              </Button>
            </>
          )}

          {(step === "success" || step === "exempt-done") && (
            <Button onClick={handleClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
