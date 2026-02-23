"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Banknote,
  CreditCard,
  CheckCircle2,
  Clock,
  Receipt,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { ENROLLMENT_PAYMENT_AMOUNT } from "@/types"
import type { Lead, PaymentTransaction } from "@/types"

interface SFDownPaymentCardProps {
  lead: Lead
  onRecordCash: () => void
  onSendLink: () => void
}

export function SFDownPaymentCard({ lead, onRecordCash, onSendLink }: SFDownPaymentCardProps) {
  // Only show for self_funded leads at application or applicant stage
  const shouldShow =
    lead.funding_type === "self_funded" &&
    (lead.pipeline_stage === "application" || lead.pipeline_stage === "applicant")

  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null)
  const [loading, setLoading] = useState(shouldShow)

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
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [lead.id, lead.pipeline_stage, shouldShow])

  if (!shouldShow || loading) return null

  const isCompleted =
    lead.pipeline_stage === "applicant" &&
    transaction?.status === "completed"

  const hasPendingLink =
    transaction?.status === "pending" &&
    transaction.payment_method === "myfatoorah" &&
    !!transaction.myfatoorah_invoice_url

  // Completed state - green card
  if (isCompleted && transaction) {
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
            <p className="text-xs text-emerald-600 dark:text-emerald-400">{ENROLLMENT_PAYMENT_AMOUNT} KWD confirmed</p>
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
                {transaction.cash_invoice_number || transaction.myfatoorah_invoice_id || "—"}
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
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // Payment needed state - amber card
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--bg-surface)] border border-amber-200 dark:border-amber-800/50 rounded-3xl overflow-hidden"
    >
      <div className="px-5 py-4 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
          <Receipt className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-amber-800 dark:text-amber-300">Down Payment Required</h3>
          <p className="text-xs text-amber-600 dark:text-amber-400">{ENROLLMENT_PAYMENT_AMOUNT} KWD to move to Applicant</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Pending payment link banner */}
        {hasPendingLink && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50">
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Awaiting Online Payment</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                Payment link sent — waiting for confirmation
              </p>
            </div>
            <Clock className="w-4 h-4 text-blue-400 shrink-0" />
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={onRecordCash}
            variant="outline"
            className={cn(
              "h-auto py-3 flex flex-col items-center gap-1.5",
              "border-amber-200 dark:border-amber-800/50 hover:bg-amber-50 dark:hover:bg-amber-950/30"
            )}
          >
            <Banknote className="w-5 h-5 text-amber-600" />
            <span className="text-xs font-medium">Record Cash</span>
          </Button>
          <Button
            onClick={onSendLink}
            variant="outline"
            className={cn(
              "h-auto py-3 flex flex-col items-center gap-1.5",
              "border-blue-200 dark:border-blue-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/30"
            )}
          >
            <CreditCard className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-medium">Send Payment Link</span>
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
