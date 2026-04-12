"use client"

import { useState } from "react"
import { getLeadDisplayName } from "@/lib/lead-utils"
import {
  Loader2,
  CreditCard,
  Banknote,
  CheckCircle2,
  Send,
  ArrowLeft,
  AlertCircle,
  GraduationCap,
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
import { TEST_FEE_AMOUNT } from "@/lib/config/constants"
import { isDemoMode } from "@/lib/demo-data"

type Step = "select" | "finance" | "cash" | "link-sent" | "success" | "error"

interface TestFeePaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: Lead
  onSuccess?: () => Promise<void>
}

export function TestFeePaymentDialog({
  open,
  onOpenChange,
  lead,
  onSuccess,
}: TestFeePaymentDialogProps) {
  const [step, setStep] = useState<Step>("select")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Finance link state
  const [civilId, setCivilId] = useState(lead.civil_id || "")
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null)

  // Cash state
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [notes, setNotes] = useState("")

  const handleClose = () => {
    if (!loading) {
      setStep("select")
      setError(null)
      setCivilId(lead.civil_id || "")
      setInvoiceNumber("")
      setNotes("")
      setInvoiceUrl(null)
      onOpenChange(false)
    }
  }

  const openWhatsAppLink = (paymentUrl: string) => {
    const leadName = lead.first_name_ar
    const message = `مرحباً ${leadName}،\n\nلإتمام تسجيلك لاختبار تحديد المستوى في كلية الكويت التقنية، يرجى دفع رسوم الاختبار بقيمة ${TEST_FEE_AMOUNT} د.ك من خلال الرابط التالي:\n\n${paymentUrl}\n\n---\n\nHello ${leadName},\n\nTo register for your placement test at Kuwait Technical College, please pay the test fee of ${TEST_FEE_AMOUNT} KD using the following link:\n\n${paymentUrl}\n\nشكراً لكم / Thank you`

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

    if (isDemoMode()) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const demoUrl = "https://demo.myfatoorah.com/payment/demo-test-fee"
      setInvoiceUrl(demoUrl)
      setStep("link-sent")
      openWhatsAppLink(demoUrl)
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/payments/test-fee/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          civilId: civilId.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment link")
      }

      setInvoiceUrl(data.invoiceUrl)
      setStep("link-sent")
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

    setLoading(true)
    setError(null)

    if (isDemoMode()) {
      await new Promise(resolve => setTimeout(resolve, 500))
      setLoading(false)
      setStep("success")
      return
    }

    try {
      const response = await fetch("/api/payments/test-fee/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          invoiceNumber: invoiceNumber.trim(),
          notes: notes.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to process payment")
      }

      setStep("success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process payment")
    } finally {
      setLoading(false)
    }
  }

  const handleSuccessClose = async () => {
    if (onSuccess) {
      await onSuccess()
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
              step === "success" ? "bg-emerald-100" : "bg-violet-100"
            )}>
              {step === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <GraduationCap className="w-5 h-5 text-violet-600" />
              )}
            </div>
            <div>
              <DialogTitle>
                {step === "success" ? "Test Fee Paid!" : "Test Fee Payment"}
              </DialogTitle>
              <DialogDescription>
                {step === "success"
                  ? `${getLeadDisplayName(lead)} has been moved to Test stage`
                  : `Complete ${TEST_FEE_AMOUNT} KWD test fee payment for ${getLeadDisplayName(lead)}`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          {/* Step: Select Payment Method */}
          {step === "select" && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                A test fee of <strong>{TEST_FEE_AMOUNT} KWD</strong> is required before this lead can move to the Test stage.
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
                  <h3 className="font-medium text-[var(--text-primary)]">Cash / KNET</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Record cash or KNET payment
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
                  A payment link for <strong>{TEST_FEE_AMOUNT} KWD</strong> will be created and sent to <strong>{lead.phone}</strong> via WhatsApp.
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
                  The test fee payment link has been sent to {lead.phone} via WhatsApp.
                </p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-left">
                <p className="text-sm text-amber-700">
                  <strong>Note:</strong> The lead will be moved to the Test stage once payment is confirmed.
                  You can close this dialog — no further action needed.
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

              <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg">
                <p className="text-sm text-violet-700">
                  Test fee amount: <strong>{TEST_FEE_AMOUNT} KWD</strong>
                </p>
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
                  Recording cash/KNET payment of <strong>{TEST_FEE_AMOUNT} KWD</strong>.
                  The lead will be moved to the Test stage.
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
                <h3 className="font-medium text-[var(--text-primary)]">Test Fee Paid!</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  {getLeadDisplayName(lead)} has been moved to the Test stage.
                </p>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-700">
                  Payment of {TEST_FEE_AMOUNT} KWD recorded successfully.
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
                    Confirm Payment
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
