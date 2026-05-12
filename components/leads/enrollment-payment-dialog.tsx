"use client"

import { useEffect, useState } from "react"
import { getLeadDisplayName } from "@/lib/lead-utils"
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
import { ENROLLMENT_PAYMENT_AMOUNT, FULL_TUITION_AMOUNT } from "@/lib/config/constants"
import { isDemoMode } from "@/lib/demo-data"
import { createClient } from "@/lib/supabase/client"

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

  // SF: how much has the lead already paid across completed transactions.
  // For non-SF flows this stays 0 and `remaining` falls back to the fixed
  // enrollment fee.
  const [paidSoFar, setPaidSoFar] = useState(0)
  const [loadingPaid, setLoadingPaid] = useState(false)

  // Cash state. `amount` is initialized to the default enrollment fee and
  // then reset to the remaining SF balance once we know paidSoFar.
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [amount, setAmount] = useState(
    isSF ? FULL_TUITION_AMOUNT.toString() : ENROLLMENT_PAYMENT_AMOUNT.toString(),
  )

  // Success state
  const [studentId, setStudentId] = useState<string | null>(null)

  // Fetch the sum of completed payments for this lead so the dialog can
  // show the remaining tuition balance instead of the legacy fixed 150.
  useEffect(() => {
    if (!open || !isSF) return
    let cancelled = false
    setLoadingPaid(true)

    if (isDemoMode()) {
      // Stable demo numbers so the UI is predictable when not connected to Supabase.
      if (!cancelled) {
        setPaidSoFar(150)
        setAmount(String(Math.max(0, FULL_TUITION_AMOUNT - 150)))
        setLoadingPaid(false)
      }
      return () => { cancelled = true }
    }

    const supabase = createClient()
    supabase
      .from("payment_transactions")
      .select("amount")
      .eq("lead_id", lead.id)
      .eq("status", "completed")
      .then((res: { data: Array<{ amount: number | string | null }> | null }) => {
        if (cancelled) return
        const total = (res.data ?? []).reduce(
          (sum: number, row) => sum + Number(row.amount || 0),
          0,
        )
        const remaining = Math.max(0, FULL_TUITION_AMOUNT - total)
        setPaidSoFar(total)
        setAmount(remaining.toString())
        setLoadingPaid(false)
      })

    return () => { cancelled = true }
  }, [open, isSF, lead.id])

  const parsedAmount = parseFloat(amount) || 0
  const remaining = isSF ? Math.max(0, FULL_TUITION_AMOUNT - paidSoFar) : ENROLLMENT_PAYMENT_AMOUNT
  const fullyPaid = isSF && remaining <= 0

  const handleClose = () => {
    if (!loading) {
      // Reset state
      setStep(initialStep)
      setError(null)
      setCivilId(lead.civil_id || "")
      setInvoiceNumber("")
      setNotes("")
      // Don't reset amount to the fixed 150 — the next time the dialog opens
      // the effect will refetch and set it to the actual remaining balance.
      setAmount(isSF ? "" : ENROLLMENT_PAYMENT_AMOUNT.toString())
      setPaidSoFar(0)
      setTransactionId(null)
      setInvoiceUrl(null)
      setStudentId(null)
      onOpenChange(false)
    }
  }

  const openWhatsAppLink = (paymentUrl: string) => {
    const leadName = lead.first_name_ar
    const paymentAmount = parsedAmount > 0 ? parsedAmount : ENROLLMENT_PAYMENT_AMOUNT

    const message = `مرحباً ${leadName}،\n\nلإتمام عملية التسجيل في كلية الكويت التقنية، يرجى دفع رسوم التسجيل بقيمة ${paymentAmount} د.ك من خلال الرابط التالي:\n\n${paymentUrl}\n\n---\n\nHello ${leadName},\n\nTo complete your enrollment at Kuwait Technical College, please pay the registration fee of ${paymentAmount} KD using the following link:\n\n${paymentUrl}\n\nشكراً لكم / Thank you`

    // Format phone for wa.me (digits only, with country code)
    let phone = (lead.phone || "").replace(/\D/g, "")
    if (!phone.startsWith("965")) {
      phone = `965${phone}`
    }

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank")
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
      const demoUrl = "https://demo.myfatoorah.com/payment/demo"
      setInvoiceUrl(demoUrl)
      setStep("link-sent")
      openWhatsAppLink(demoUrl)
      setLoading(false)
      return
    }

    if (isSF && parsedAmount > remaining) {
      setError(`Amount cannot exceed remaining balance of ${remaining} KWD`)
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

      // Open WhatsApp with payment link
      openWhatsAppLink(data.invoiceUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create payment link")
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
    if (isSF && parsedAmount > remaining) {
      setError(`Amount cannot exceed remaining balance of ${remaining} KWD`)
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

      // Optimistically reflect this payment in the local paid total so the
      // dialog success state can describe the new balance.
      if (response.ok) {
        setPaidSoFar((prev) => prev + parsedAmount)
      }

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
                  : (isSF ? "Tuition Payment" : "Enrollment Payment")}
              </DialogTitle>
              <DialogDescription>
                {step === "success"
                  ? `${getLeadDisplayName(lead)} is now enrolled`
                  : isSF
                    ? loadingPaid
                      ? `Loading tuition balance for ${getLeadDisplayName(lead)}…`
                      : `Remaining ${remaining} KWD of ${FULL_TUITION_AMOUNT} KWD for ${getLeadDisplayName(lead)}`
                    : `Complete ${ENROLLMENT_PAYMENT_AMOUNT} KWD payment for ${getLeadDisplayName(lead)}`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          {/* SF balance summary — paid vs remaining */}
          {isSF && (step === "select" || step === "cash" || step === "finance") && (
            <div className="mb-4 p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-amber-700">Paid</p>
                <p className="text-base font-semibold tabular-nums">{loadingPaid ? "—" : `${paidSoFar} KWD`}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-amber-700">Remaining</p>
                <p className="text-base font-semibold tabular-nums">{loadingPaid ? "—" : `${remaining} KWD`}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-amber-700">Total</p>
                <p className="text-base font-semibold tabular-nums">{FULL_TUITION_AMOUNT} KWD</p>
              </div>
            </div>
          )}

          {/* Step: Select Payment Method */}
          {step === "select" && (
            <div className="space-y-4">
              {fullyPaid ? (
                <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-sm text-emerald-800">
                  This lead has already paid the full tuition of {FULL_TUITION_AMOUNT} KWD. No further payment required.
                </div>
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">
                  Choose a payment method for the {isSF ? "remaining tuition" : "enrollment fee"}.
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setStep("finance")}
                  disabled={fullyPaid}
                  className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-sunken)] hover:border-blue-300 hover:bg-blue-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[var(--border)] disabled:hover:bg-[var(--bg-sunken)]"
                >
                  <CreditCard className="w-8 h-8 text-blue-500 mb-2" />
                  <h3 className="font-medium text-[var(--text-primary)]">Online Payment</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Send payment link via WhatsApp
                  </p>
                </button>

                <button
                  onClick={() => setStep("cash")}
                  disabled={fullyPaid}
                  className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-sunken)] hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[var(--border)] disabled:hover:bg-[var(--bg-sunken)]"
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
                    ? parsedAmount >= remaining
                      ? "The lead will be automatically enrolled once payment is confirmed."
                      : `Payment of ${parsedAmount} KWD will be recorded once confirmed. Remaining ${Math.max(0, remaining - parsedAmount)} KWD will still be due before enrollment.`
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

              {invoiceUrl && (
                <Button
                  variant="ghost"
                  onClick={() => openWhatsAppLink(invoiceUrl)}
                  className="text-sm"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Resend via WhatsApp
                </Button>
              )}
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
                  {isSF
                    ? parsedAmount >= remaining
                      ? " This completes tuition. The lead will be enrolled."
                      : ` ${Math.max(0, remaining - parsedAmount)} KWD will still be due before enrollment.`
                    : " The student will be enrolled immediately."}
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
                  {isSF && paidSoFar < FULL_TUITION_AMOUNT ? "Payment Recorded!" : "Student Enrolled!"}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  {isSF
                    ? paidSoFar >= FULL_TUITION_AMOUNT
                      ? `${getLeadDisplayName(lead)} has been enrolled — full tuition paid.`
                      : `${getLeadDisplayName(lead)}: ${paidSoFar} KWD paid, ${FULL_TUITION_AMOUNT - paidSoFar} KWD remaining.`
                    : `${getLeadDisplayName(lead)} has been successfully enrolled.`}
                </p>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-700">
                  Payment of {parsedAmount || ENROLLMENT_PAYMENT_AMOUNT} KWD recorded.
                  {!isSF && " A student record has been created."}
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
