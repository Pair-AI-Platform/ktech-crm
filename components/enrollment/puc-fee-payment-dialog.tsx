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
  MessageCircle,
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
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { Student } from "@/types"
import { PUC_FEE_AMOUNT } from "@/types"

type Step = "select" | "whatsapp" | "cash" | "link-sent" | "success"

interface PUCFeePaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student
  onSuccess: () => Promise<void>
}

export function PUCFeePaymentDialog({
  open,
  onOpenChange,
  student,
  onSuccess,
}: PUCFeePaymentDialogProps) {
  const [step, setStep] = useState<Step>("select")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // WhatsApp payment state
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null)

  // Cash state
  const [receiptNumber, setReceiptNumber] = useState("")

  const handleClose = () => {
    if (!loading) {
      setStep("select")
      setError(null)
      setTransactionId(null)
      setInvoiceUrl(null)
      setReceiptNumber("")
      onOpenChange(false)
    }
  }

  const handleCreatePaymentLink = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/payments/puc-fee/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          civilId: student.civil_id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment link")
      }

      setTransactionId(data.transactionId)
      setInvoiceUrl(data.invoiceUrl)

      // Automatically send WhatsApp
      await handleSendWhatsApp(data.transactionId)
      setStep("link-sent")
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
      const response = await fetch("/api/payments/puc-fee/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send WhatsApp")
      }
    } catch (err) {
      console.error("Failed to send WhatsApp:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCashPayment = async () => {
    if (!receiptNumber.trim()) {
      setError("Receipt number is required")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/payments/puc-fee/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          receiptNumber: receiptNumber.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to record cash payment")
      }

      setStep("success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment")
    } finally {
      setLoading(false)
    }
  }

  const handleSuccessClose = async () => {
    await onSuccess()
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent size="md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              step === "success" ? "bg-emerald-100" : "bg-purple-100"
            )}>
              {step === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <CreditCard className="w-5 h-5 text-purple-600" />
              )}
            </div>
            <div>
              <DialogTitle>
                {step === "success" ? "PUC Fee Paid!" : "PUC Fee Payment"}
              </DialogTitle>
              <DialogDescription>
                {step === "success"
                  ? `${PUC_FEE_AMOUNT} KD fee has been recorded`
                  : `Collect ${PUC_FEE_AMOUNT} KD PUC fee for ${student.first_name} ${student.last_name}`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          {/* Step: Select Payment Method */}
          {step === "select" && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                How will the student pay the {PUC_FEE_AMOUNT} KD PUC fee?
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setStep("whatsapp")}
                  className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-sunken)] hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left"
                >
                  <MessageCircle className="w-8 h-8 text-emerald-500 mb-2" />
                  <h3 className="font-medium text-[var(--text-primary)]">WhatsApp Payment</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Send payment link via WhatsApp
                  </p>
                </button>

                <button
                  onClick={() => setStep("cash")}
                  className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-sunken)] hover:border-amber-300 hover:bg-amber-50 transition-all text-left"
                >
                  <Banknote className="w-8 h-8 text-amber-500 mb-2" />
                  <h3 className="font-medium text-[var(--text-primary)]">Cash Payment</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Record cash payment with receipt
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Step: WhatsApp Payment */}
          {step === "whatsapp" && (
            <div className="space-y-4">
              <button
                onClick={() => { setStep("select"); setError(null) }}
                className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium text-emerald-700">Send via WhatsApp</span>
                </div>
                <p className="text-sm text-emerald-700">
                  A payment link for <strong>{PUC_FEE_AMOUNT} KD</strong> will be sent to{" "}
                  <strong>{student.phone}</strong> via WhatsApp.
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

          {/* Step: Link Sent */}
          {step === "link-sent" && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                <Send className="w-8 h-8 text-emerald-600" />
              </div>

              <div>
                <h3 className="font-medium text-[var(--text-primary)]">Payment Link Sent!</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  The {PUC_FEE_AMOUNT} KD payment link has been sent to {student.phone} via WhatsApp.
                </p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-left">
                <p className="text-sm text-amber-700">
                  <strong>Note:</strong> The fee will be marked as paid automatically once payment is confirmed.
                  You can close this dialog - no further action needed.
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
                  Receipt Number <span className="text-red-500">*</span>
                </label>
                <Input
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="Enter receipt/invoice number"
                  className="w-full"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-700">
                  Recording cash payment of <strong>{PUC_FEE_AMOUNT} KD</strong>.
                  The PUC fee will be marked as paid immediately.
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
                <h3 className="font-medium text-[var(--text-primary)]">PUC Fee Paid!</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  The {PUC_FEE_AMOUNT} KD PUC fee has been recorded for {student.first_name} {student.last_name}.
                </p>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-700">
                  Payment receipt can now be downloaded from the documents section.
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

          {step === "whatsapp" && (
            <>
              <Button variant="ghost" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleCreatePaymentLink} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Payment Link
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
              <Button onClick={handleCashPayment} disabled={loading || !receiptNumber.trim()}>
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
