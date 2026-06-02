"use client"

import { useRef, useState } from "react"
import { getLeadDisplayName } from "@/lib/lead-utils"
import {
  Loader2,
  CreditCard,
  Banknote,
  CheckCircle2,
  Send,
  ArrowLeft,
  AlertCircle,
  FileText,
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
import { cn } from "@/lib/utils"
import type { Lead } from "@/types"
import { FILE_APPLICATION_FEE_AMOUNT, FILE_TEST_FEE_AMOUNT } from "@/lib/config/constants"
import { isDemoMode } from "@/lib/demo-data"

type Step = "select" | "finance" | "cash" | "link-sent" | "success" | "exempt-confirm" | "exempt-done"
type SuccessAction = 'paid' | 'sent' | 'exempt'

interface FileFeePaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: Lead
  onSuccess?: (action: 'paid' | 'sent' | 'exempt') => Promise<void>
  /**
   * Stage the lead lands on once the fee is settled. The file fee now gates
   * entry to the Test stage; 'application' is kept for legacy / reactivation.
   * Defaults to 'application'.
   */
  targetStage?: 'test' | 'application'
}

export function FileFeePaymentDialog({
  open,
  onOpenChange,
  lead,
  onSuccess,
  targetStage = 'application',
}: FileFeePaymentDialogProps) {
  const isTestGate = targetStage === 'test'
  const stageLabel = isTestGate ? 'Test' : 'File'
  const [step, setStep] = useState<Step>("select")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const notifiedActionRef = useRef<SuccessAction | null>(null)

  // Fee amounts
  const [testFee, setTestFee] = useState(lead.file_test_fee ?? FILE_TEST_FEE_AMOUNT)
  const applicationFee = FILE_APPLICATION_FEE_AMOUNT
  const totalFee = applicationFee + testFee

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
      notifiedActionRef.current = null
      setCivilId(lead.civil_id || "")
      setTestFee(lead.file_test_fee ?? FILE_TEST_FEE_AMOUNT)
      setInvoiceNumber("")
      setNotes("")
      setInvoiceUrl(null)
      onOpenChange(false)
    }
  }

  const notifySuccess = async (action: SuccessAction) => {
    if (notifiedActionRef.current === action) return
    notifiedActionRef.current = action
    await onSuccess?.(action)
  }

  const openWhatsAppLink = (paymentUrl: string) => {
    const leadName = getLeadDisplayName(lead)
    const message = `مرحباً ${leadName}،\n\nلإتمام ملف التسجيل في كلية الكويت التقنية، يرجى دفع الرسوم التالية:\n- رسوم الطلب: ${applicationFee} د.ك\n- رسوم الاختبار: ${testFee} د.ك\n- الإجمالي: ${totalFee} د.ك\n\nمن خلال الرابط التالي:\n${paymentUrl}\n\n---\n\nHello ${leadName},\n\nTo complete your registration file at Kuwait Technical College, please pay the following fees:\n- Application Fee: ${applicationFee} KD\n- Test Fee: ${testFee} KD\n- Total: ${totalFee} KD\n\nUsing the following link:\n${paymentUrl}\n\nشكراً لكم / Thank you`

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
      const demoUrl = "https://demo.myfatoorah.com/payment/demo-file-fee"
      setInvoiceUrl(demoUrl)
      setStep("link-sent")
      openWhatsAppLink(demoUrl)
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/payments/file-fee/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          civilId: civilId.trim(),
          testFeeAmount: testFee,
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
      await notifySuccess("paid")
      return
    }

    try {
      const response = await fetch("/api/payments/file-fee/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          invoiceNumber: invoiceNumber.trim(),
          testFeeAmount: testFee,
          notes: notes.trim() || undefined,
          targetStage,
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
      const response = await fetch("/api/payments/file-fee/exempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          targetStage,
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

  const handleSuccessClose = async () => {
    await notifySuccess(step === "exempt-done" ? "exempt" : step === "link-sent" ? "sent" : "paid")
    handleClose()
  }

  const isFinished = step === "success" || step === "exempt-done" || step === "link-sent"

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent size="md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              step === "success" || step === "exempt-done" ? "bg-emerald-100" : "bg-blue-100"
            )}>
              {step === "success" || step === "exempt-done" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <FileText className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <DialogTitle>
                {step === "success" ? "File Fees Paid!" : step === "exempt-done" ? "Fees Exempted" : `${stageLabel} Stage Fees`}
              </DialogTitle>
              <DialogDescription>
                {step === "success"
                  ? `${getLeadDisplayName(lead)} has been moved to ${stageLabel} stage`
                  : step === "exempt-done"
                  ? `${getLeadDisplayName(lead)} has been exempted from file fees`
                  : `Complete fee payment for ${getLeadDisplayName(lead)} to move to ${stageLabel} stage`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          {/* Step: Select Payment Method */}
          {step === "select" && (
            <div className="space-y-4">
              {/* Fee Breakdown */}
              <div className="p-4 bg-[var(--bg-sunken)] border border-[var(--border)] rounded-lg space-y-3">
                <h4 className="text-sm font-medium text-[var(--text-primary)]">Fee Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Application Fee</span>
                    <span className="font-medium text-[var(--text-primary)]">{applicationFee} KWD</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Test Fee</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={testFee}
                        onChange={(e) => setTestFee(Math.max(0, Number(e.target.value)))}
                        className="w-20 h-7 text-sm text-right font-medium"
                        min={0}
                        step={0.5}
                      />
                      <span className="text-xs text-[var(--text-secondary)]">KWD</span>
                    </div>
                  </div>
                  <div className="border-t border-[var(--border)] pt-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-[var(--text-primary)]">Total</span>
                    <span className="font-bold text-[var(--text-primary)]">{totalFee} KWD</span>
                  </div>
                </div>
              </div>

              <div className={cn("grid gap-3", isTestGate ? "grid-cols-1" : "grid-cols-2")}>
                {!isTestGate && (
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
                )}

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

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  Application Fee: <strong>{applicationFee} KWD</strong> + Test Fee: <strong>{testFee} KWD</strong> = Total: <strong>{totalFee} KWD</strong>
                </p>
              </div>

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
                  A payment link for <strong>{totalFee} KWD</strong> will be created and sent to <strong>{lead.phone}</strong> via WhatsApp.
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
                  The file fee payment link ({totalFee} KWD) has been sent to {lead.phone} via WhatsApp.
                </p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-left">
                <p className="text-sm text-amber-700">
                  <strong>Note:</strong> The lead will be moved to the File stage once payment is confirmed.
                  You can close this dialog.
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

              <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg space-y-1">
                <p className="text-sm text-violet-700">
                  Application Fee: <strong>{applicationFee} KWD</strong>
                </p>
                <p className="text-sm text-violet-700">
                  Test Fee: <strong>{testFee} KWD</strong>
                </p>
                <p className="text-sm text-violet-700 font-bold">
                  Total: {totalFee} KWD
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
                  Recording cash/KNET payment of <strong>{totalFee} KWD</strong>.
                  The lead will be moved to {stageLabel} stage.
                </p>
              </div>
            </div>
          )}

          {/* Step: Exempt Confirm */}
          {step === "exempt-confirm" && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
                <ShieldOff className="w-8 h-8 text-amber-600" />
              </div>

              <div>
                <h3 className="font-medium text-[var(--text-primary)]">Exempt from File Fees?</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  This will skip the {totalFee} KWD fee requirement and move {getLeadDisplayName(lead)} directly to the {stageLabel} stage.
                </p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-left">
                <p className="text-sm text-amber-700">
                  <strong>Warning:</strong> This action will be recorded in the lead&apos;s profile. The exemption cannot be undone.
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

          {/* Step: Exempt Done */}
          {step === "exempt-done" && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>

              <div>
                <h3 className="font-medium text-[var(--text-primary)]">Fees Exempted</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  {getLeadDisplayName(lead)} has been exempted from file fees and moved to {stageLabel} stage.
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
                <h3 className="font-medium text-[var(--text-primary)]">File Fees Paid!</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  {getLeadDisplayName(lead)} has been moved to the {stageLabel} stage.
                </p>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-700">
                  Payment of {totalFee} KWD recorded successfully.
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
                onClick={() => setStep("exempt-confirm")}
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
            <Button onClick={handleSuccessClose}>
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

          {step === "exempt-confirm" && (
            <>
              <Button variant="ghost" onClick={() => { setStep("select"); setError(null) }} disabled={loading}>
                Back
              </Button>
              <Button
                onClick={handleExempt}
                disabled={loading}
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

          {(step === "success" || step === "exempt-done") && (
            <Button onClick={handleSuccessClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
