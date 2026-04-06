"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Banknote,
  CreditCard,
  CheckCircle2,
  Receipt,
  Loader2,
  Send,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { ENROLLMENT_PAYMENT_AMOUNT } from "@/lib/config/constants"
import type { Lead, PaymentTransaction } from "@/types"
import { isDemoMode } from "@/lib/demo-data"

type PaymentMode = "initial" | "cash" | "online" | "pending"

interface SFDownPaymentCardProps {
  lead: Lead
  onSuccess?: () => void
}

export function SFDownPaymentCard({ lead, onSuccess }: SFDownPaymentCardProps) {
  const shouldShow =
    lead.funding_type === "self_funded" &&
    (lead.pipeline_stage === "application" || lead.pipeline_stage === "applicant")

  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null)
  const [loadingInit, setLoadingInit] = useState(shouldShow)

  // Payment state
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("initial")
  const [amount, setAmount] = useState(ENROLLMENT_PAYMENT_AMOUNT.toString())
  const [civilId, setCivilId] = useState(lead.civil_id || "")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)

  // Fetch existing transaction
  useEffect(() => {
    if (!shouldShow) return

    let cancelled = false
    const supabase = createClient()

    supabase
      .from("payment_transactions")
      .select("*")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          setTransaction(data)
          if (data) {
            if (data.status === "completed") {
              setIsCompleted(true)
            } else if (
              data.status === "pending" &&
              data.payment_method === "myfatoorah" &&
              data.myfatoorah_invoice_url
            ) {
              setPaymentMode("pending")
              setInvoiceUrl(data.myfatoorah_invoice_url)
              if (data.amount) setAmount(data.amount.toString())
            }
          }
          setLoadingInit(false)
        }
      })

    return () => { cancelled = true }
  }, [lead.id, lead.pipeline_stage, shouldShow])

  if (!shouldShow || loadingInit) return null

  const parsedAmount = parseFloat(amount) || 0

  // Completed + applicant state
  if (isCompleted && transaction && lead.pipeline_stage === "applicant") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--bg-surface)] border border-emerald-200 dark:border-emerald-800/50 rounded-3xl overflow-hidden"
      >
        <div className="px-5 py-4 bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-200 dark:border-emerald-800/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-emerald-800 dark:text-emerald-300">Down Payment Received</h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">{transaction.amount} KWD confirmed</p>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">Method</p>
              <p className="text-sm font-medium text-[var(--text-primary)] capitalize">
                {transaction.payment_method === "myfatoorah" ? "Online" : transaction.payment_method}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">Invoice</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {transaction.cash_invoice_number || transaction.myfatoorah_invoice_id || "\u2014"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">Date</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {transaction.completed_at
                  ? new Date(transaction.completed_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "\u2014"}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // Payment handlers
  const handleSendPaymentLink = async () => {
    if (!civilId.trim()) {
      setError("Civil ID is required")
      return
    }
    if (parsedAmount <= 0) {
      setError("Please enter a valid amount")
      return
    }

    setLoading(true)
    setError(null)

    // Demo mode: simulate payment link sent
    if (isDemoMode()) {
      await new Promise(resolve => setTimeout(resolve, 500))
      setInvoiceUrl("https://demo.myfatoorah.com/payment/demo")
      setPaymentMode("pending")
      setLoading(false)
      return
    }

    try {
      const createResponse = await fetch("/api/payments/myfatoorah/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          civilId: civilId.trim(),
          amount: parsedAmount,
        }),
      })
      const createData = await createResponse.json()
      if (!createResponse.ok) throw new Error(createData.error || "Failed to create payment link")

      setInvoiceUrl(createData.invoiceUrl)

      // Send via WhatsApp
      const sendResponse = await fetch("/api/payments/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: createData.transactionId }),
      })
      if (!sendResponse.ok) console.error("WhatsApp send failed, but link was created")

      // Refresh transaction
      const supabase = createClient()
      const { data: tx } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("id", createData.transactionId)
        .single()
      if (tx) setTransaction(tx)

      setPaymentMode("pending")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send payment link")
    } finally {
      setLoading(false)
    }
  }

  const handleRecordCash = async () => {
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
      setIsCompleted(true)
      setLoading(false)
      onSuccess?.()
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
      if (!response.ok) throw new Error(data.error || "Failed to process cash payment")

      const supabase = createClient()
      const { data: tx } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("id", data.transactionId)
        .single()
      if (tx) setTransaction(tx)

      setIsCompleted(true)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process payment")
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshStatus = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: tx } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (tx) {
        setTransaction(tx)
        if (tx.status === "completed") {
          setIsCompleted(true)
          onSuccess?.()
        }
      }
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  const handleResendLink = async () => {
    if (!transaction?.id) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/payments/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: transaction.id }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to resend")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend payment link")
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      data-sf-wizard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--bg-surface)] border border-amber-200 dark:border-amber-800/50 rounded-3xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/50">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center shadow-sm shadow-amber-500/25">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-semibold text-amber-800 dark:text-amber-300">SF Down Payment</span>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-normal mt-0.5">
              {lead.first_name_ar || lead.first_name} {lead.last_name_ar || lead.last_name} — Self-funded
            </p>
          </div>
        </div>
      </div>

      {/* Payment Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {/* Payment Mode: Initial — Amount + Method Selection */}
          {paymentMode === "initial" && (
            <motion.div
              key="pay-initial"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Payment
                </h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  Set amount and send payment link or record cash
                </p>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                  Amount (KWD)
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

              {/* Payment Method Selection */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setError(null); setPaymentMode("cash") }}
                    className={cn(
                      "p-4 rounded-xl border text-center transition-all",
                      "border-[var(--border)] bg-[var(--bg-sunken)] hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                    )}
                  >
                    <Banknote className="w-7 h-7 mx-auto mb-2 text-amber-500" />
                    <h4 className="font-medium text-sm text-[var(--text-primary)]">Record Finance</h4>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Cash or KNET entry</p>
                  </button>

                  <button
                    onClick={() => { setError(null); setPaymentMode("online") }}
                    className={cn(
                      "p-4 rounded-xl border text-center transition-all",
                      "border-[var(--border)] bg-[var(--bg-sunken)] hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                    )}
                  >
                    <Send className="w-7 h-7 mx-auto mb-2 text-blue-500" />
                    <h4 className="font-medium text-sm text-[var(--text-primary)]">Send Link</h4>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Via WhatsApp</p>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Payment Mode: Cash */}
          {paymentMode === "cash" && (
            <motion.div
              key="pay-cash"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <button
                onClick={() => { setPaymentMode("initial"); setError(null) }}
                className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl">
                <span className="text-sm text-amber-700 dark:text-amber-300">Amount</span>
                <span className="text-lg font-bold text-amber-800 dark:text-amber-200">{parsedAmount} KWD</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
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
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                  Notes (optional)
                </label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional details..."
                  className="w-full"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 dark:bg-red-950/20 dark:border-red-800/40 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleRecordCash}
                disabled={loading || !invoiceNumber.trim()}
                className="w-full"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4 mr-2" />Confirm Cash Payment</>
                )}
              </Button>
            </motion.div>
          )}

          {/* Payment Mode: Online */}
          {paymentMode === "online" && (
            <motion.div
              key="pay-online"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <button
                onClick={() => { setPaymentMode("initial"); setError(null) }}
                className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-xl">
                <span className="text-sm text-blue-700 dark:text-blue-300">Amount</span>
                <span className="text-lg font-bold text-blue-800 dark:text-blue-200">{parsedAmount} KWD</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                  Civil ID <span className="text-red-500">*</span>
                </label>
                <Input
                  value={civilId}
                  onChange={(e) => setCivilId(e.target.value)}
                  placeholder="Enter 12-digit civil ID"
                  maxLength={12}
                  className="w-full font-mono"
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Required for MyFatoorah. Must be 12 digits starting with 2 or 3.
                </p>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  A payment link for <strong>{parsedAmount} KWD</strong> will be created and sent to <strong>{lead.phone}</strong> via WhatsApp.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 dark:bg-red-950/20 dark:border-red-800/40 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleSendPaymentLink}
                disabled={loading || !civilId.trim()}
                className="w-full"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating & Sending...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" />Send Payment Link</>
                )}
              </Button>
            </motion.div>
          )}

          {/* Payment Mode: Pending */}
          {paymentMode === "pending" && (
            <motion.div
              key="pay-pending"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Payment Link Sent</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                    {transaction?.amount || parsedAmount} KWD — Sent to {lead.phone} via WhatsApp
                  </p>
                </div>
                <Clock className="w-5 h-5 text-blue-400 shrink-0 animate-pulse" />
              </div>

              {invoiceUrl && (
                <div className="p-3 bg-[var(--bg-sunken)] border border-[var(--border)] rounded-xl">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">Payment Link</p>
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

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 dark:bg-red-950/20 dark:border-red-800/40 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={handleRefreshStatus} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Refresh Status
                </Button>
                <Button variant="outline" onClick={handleResendLink} disabled={loading} className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  Resend Link
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
