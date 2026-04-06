"use client"

import { useState } from "react"
import {
  Loader2,
  CreditCard,
  Banknote,
  CheckCircle2,
  Send,
  ArrowLeft,
  AlertCircle,
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
import { cn } from "@/lib/utils"
import type { Lead } from "@/types"
import { ENROLLMENT_PAYMENT_AMOUNT } from "@/lib/config/constants"
import { isDemoMode } from "@/lib/demo-data"

type Step = "select" | "finance" | "cash" | "link-sent" | "success" | "error"
type DialogMode = "enrollment" | "sf_downpayment"

interface EnrollmentPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: Lead
  onSuccess?: (studentId?: string) => Promise<void>
  mode?: DialogMode
  /** Start directly on a specific step (e.g. "cash" or "finance") */
  initialStep?: "select" | "finance" | "cash"
}

export function EnrollmentPaymentDialog({
  open,
  onOpenChange,
  lead,
  onSuccess,
  mode: modeProp,
  initialStep = "select",
}: EnrollmentPaymentDialogProps) {
  // Auto-detect mode from lead if not provided
  const mode: DialogMode = modeProp ?? (lead.funding_type === "self_funded" ? "sf_downpayment" : "enrollment")
  const isSF = mode === "sf_downpayment"
  const [step, setStep] = useState<Step>(initialStep)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Finance link state
  const [civilId, setCivilId] = useState(lead.civil_id || "")
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null)

  // Cash state
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [amount, setAmount] = useState(ENROLLMENT_PAYMENT_AMOUNT.toString())

  // Success state
  const [studentId, setStudentId] = useState<string | null>(null)

  const parsedAmount = parseFloat(amount) || 0

  const handleClose = () => {
    if (!loading) {
      // Reset state
      setStep(initialStep)
      setError(null)
      setCivilId(lead.civil_id || "")
      setInvoiceNumber("")
      setNotes("")
      setAmount(ENROLLMENT_PAYMENT_AMOUNT.toString())
      setTransactionId(null)
      setInvoiceUrl(null)
      setStudentId(null)
      onOpenChange(false)
    }
  }

  const handleCreatePaymentLink = async () => {
    if (!civilId.trim()) {
      setError("Civil ID is required")
      return
    }

    setLoading(true)
    setError(null)

    // Demo mode: simulate payment link sent
    if (isDemoMode()) {
      await new Promise(resolve => setTimeout(resolve, 500))
      setInvoiceUrl("https://demo.myfatoorah.com/payment/demo")
      setStep("link-sent")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/payments/myfatoorah/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          civilId: civilId.trim(),
          amount: parsedAmount > 0 ? parsedAmount : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment link")
      }

      setTransactionId(data.transactionId)
      setInvoiceUrl(data.invoiceUrl)
      setStep("link-sent")

      // Automatically send WhatsApp
      await handleSendWhatsApp(data.transactionId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create payment link")
    } finally {
      setLoading(false)
    }
  }

  const handleSendWhatsApp = async (txId?: string) => {
    const id = txId || transactionId
    if (!id) return

    setLoading(true)
    try {
      const response = await fetch("/api/payments/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send WhatsApp")
      }

      // WhatsApp sent successfully
    } catch (err) {
      // Don't fail - link is still created
      console.error("Failed to send WhatsApp:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCashPayment = async () => {
    if (!invoiceNumber.trim()) {
      setError("Invoice number is required")
      return
    }
    if (parsedAmount <= 0) {
      setError("Please enter a valid amount")
      return
    }

    setLoading(true)
    setError(null)

    // Demo mode: simulate success without calling the API
    if (isDemoMode()) {
      await new Promise(resolve => setTimeout(resolve, 500))
      setLoading(false)
      setStep("success")
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
          amount: parsedAmount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to process cash payment")
      }

      setStudentId(data.studentId)
      setStep("success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process payment")
    } finally {
      setLoading(false)
    }
  }

  const handleSuccessClose = async () => {
    if (onSuccess) {
      await onSuccess(studentId || undefined)
    }
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent size="md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              step === "success" ? "bg-emerald-100" : "bg-blue-100"
            )}>
              {step === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <CreditCard className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <DialogTitle>
                {step === "success"
                  ? (isSF ? "Payment Recorded!" : "Enrollment Complete!")
                  : (isSF ? "Down Payment" : "Enrollment Payment")}
              </DialogTitle>
              <DialogDescription>
                {step === "success"
                  ? (isSF
                    ? `${lead.first_name_ar || lead.first_name} ${lead.last_name_ar || lead.last_name} has been moved to Applicant`
                    : `${lead.first_name_ar || lead.first_name} ${lead.last_name_ar || lead.last_name} is now enrolled`)
                  : `Complete ${ENROLLMENT_PAYMENT_AMOUNT} KWD payment for ${lead.first_name_ar || lead.first_name} ${lead.last_name_ar || lead.last_name}`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          {/* Step: Select Payment Method */}
          {step === "select" && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Choose a payment method for the {isSF ? "down payment" : "enrollment fee"}.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setStep("finance")}
                  className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-sunken)] hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                >
                  <CreditCard className="w-8 h-8 text-blue-500 mb-2" />
                  <h3 className="font-medium text-[var(--text-primary)]">Online Payment</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Send payment link via WhatsApp
                  </p>
                </button>

                <button
                  onClick={() => setStep("cash")}
                  className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-sunken)] hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left"
                >
                  <Banknote className="w-8 h-8 text-emerald-500 mb-2" />
                  <h3 className="font-medium text-[var(--text-primary)]">Record Finance</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Cash or KNET entry
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Step: Finance Link Form */}
          {step === "finance" && (
            <div className="space-y-4">
              <button
                onClick={() => { setStep("select"); setError(null) }}
                className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Civil ID <span className="text-red-500">*</span>
                </label>
                <Input
                  value={civilId}
                  onChange={(e) => setCivilId(e.target.value)}
                  placeholder="Enter 12-digit civil ID"
                  maxLength={12}
                  className="w-full font-mono"
                />
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Required for MyFatoorah payment. Must be 12 digits starting with 2 or 3.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  A payment link will be created and sent to <strong>{lead.phone}</strong> via WhatsApp.
                </p>
              </div>
            </div>
          )}

          {/* Step: Link Sent */}
          {step === "link-sent" && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                <Send className="w-8 h-8 text-blue-600" />
              </div>

              <div>
                <h3 className="font-medium text-[var(--text-primary)]">Payment Link Sent!</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  The payment link has been sent to {lead.phone} via WhatsApp.
                </p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-left">
                <p className="text-sm text-amber-700">
                  <strong>Note:</strong> {isSF
                    ? "The lead will be automatically moved to Applicant once payment is confirmed."
                    : "The student will be automatically enrolled once payment is confirmed."}
                  {" "}You can close this dialog - no further action needed.
                </p>
              </div>

              {invoiceUrl && (
                <div className="p-3 bg-[var(--bg-sunken)] border border-[var(--border)] rounded-lg">
                  <p className="text-xs text-[var(--text-secondary)] mb-1">Payment Link:</p>
                  <a
                    href={invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline break-all"
                  >
                    {invoiceUrl}
                  </a>
                </div>
              )}

              <Button
                variant="ghost"
                onClick={() => handleSendWhatsApp()}
                disabled={loading}
                className="text-sm"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Resend WhatsApp
              </Button>
            </div>
          )}

          {/* Step: Cash Payment Form */}
          {step === "cash" && (
            <div className="space-y-4">
              <button
                onClick={() => { setStep("select"); setError(null) }}
                className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Amount (KWD) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="150"
                    min={1}
                    step={0.5}
                    className="w-full text-lg font-semibold pl-14"
                  />
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-[var(--text-muted)]">
                    KWD
                  </span>
                </div>
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
                  Recording cash payment of <strong>{parsedAmount} KWD</strong>.
                  {isSF ? " The lead will move to Applicant." : " The student will be enrolled immediately."}
                </p>
              </div>
            </div>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>

              <div>
                <h3 className="font-medium text-[var(--text-primary)]">
                  {isSF ? "Payment Recorded!" : "Student Enrolled!"}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  {isSF
                    ? `${lead.first_name_ar || lead.first_name} ${lead.last_name_ar || lead.last_name} has been moved to Applicant.`
                    : `${lead.first_name_ar || lead.first_name} ${lead.last_name_ar || lead.last_name} has been successfully enrolled.`}
                </p>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-700">
                  Payment of {parsedAmount || ENROLLMENT_PAYMENT_AMOUNT} KWD recorded.
                  {isSF ? "" : " A student record has been created."}
                </p>
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          {step === "select" && (
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
          )}

          {step === "finance" && (
            <>
              <Button variant="ghost" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleCreatePaymentLink} disabled={loading || !civilId.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Create & Send Link
                  </>
                )}
              </Button>
            </>
          )}

          {step === "link-sent" && (
            <Button onClick={handleClose}>
              Done
            </Button>
          )}

          {step === "cash" && (
            <>
              <Button variant="ghost" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleCashPayment} disabled={loading || !invoiceNumber.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {isSF ? "Confirm Down Payment" : "Confirm Payment & Enroll"}
                  </>
                )}
              </Button>
            </>
          )}

          {step === "success" && (
            <Button onClick={handleSuccessClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
