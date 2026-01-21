"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  FileText,
  CheckCircle2,
  Circle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck,
  MessageCircle,
  Download,
  CreditCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  SF_DOCUMENTS,
  PUC_DOCUMENTS,
  PUC_FEE_AMOUNT,
  HIGH_SCHOOL_CERTIFICATE_TYPES,
} from "@/types"
import type { Student, HighSchoolCertificateType } from "@/types"
import { PUCFeePaymentDialog } from "./puc-fee-payment-dialog"

interface DocumentChecklistProps {
  student: Student
  onUpdateDocument: (field: string, value: boolean | string) => Promise<void>
  onVerifyDocuments?: () => Promise<void>
  isLoading?: boolean
  className?: string
}

export function DocumentChecklist({
  student,
  onUpdateDocument,
  onVerifyDocuments,
  isLoading,
  className,
}: DocumentChecklistProps) {
  const [expanded, setExpanded] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)

  const isSF = student.funding_type === "self_funded"
  const isPUC = student.funding_type === "puc"
  const isTransfer = !!student.transfer_type

  const documents = isSF ? SF_DOCUMENTS : PUC_DOCUMENTS

  // Calculate progress
  const getProgress = () => {
    let total = 0
    let submitted = 0

    if (isSF) {
      SF_DOCUMENTS.forEach((doc) => {
        // Skip transcript if not transfer student
        if ('transferOnly' in doc && doc.transferOnly && !isTransfer) return
        total++
        if (student[doc.key as keyof Student]) submitted++
      })
    } else {
      PUC_DOCUMENTS.forEach((doc) => {
        total++
        if (student[doc.key as keyof Student]) submitted++
      })
    }

    return { total, submitted, percentage: total > 0 ? Math.round((submitted / total) * 100) : 0 }
  }

  const progress = getProgress()

  const handleToggleDocument = async (key: string, currentValue: boolean) => {
    setUpdating(key)
    try {
      await onUpdateDocument(key, !currentValue)
    } finally {
      setUpdating(null)
    }
  }

  const handleCertificateTypeChange = async (type: HighSchoolCertificateType) => {
    setUpdating("puc_high_school_certificate_type")
    try {
      await onUpdateDocument("puc_high_school_certificate_type", type)
    } finally {
      setUpdating(null)
    }
  }

  const handleTogglePUCFee = async () => {
    setUpdating("puc_fee_paid")
    try {
      await onUpdateDocument("puc_fee_paid", !student.puc_fee_paid)
    } finally {
      setUpdating(null)
    }
  }

  const allRequiredSubmitted = isPUC
    ? PUC_DOCUMENTS.every((doc) => student[doc.key as keyof Student])
    : true

  const canVerify = isPUC
    ? allRequiredSubmitted && student.puc_fee_paid
    : progress.percentage > 0

  return (
    <div className={cn("rounded-lg border border-[var(--border)] overflow-hidden", className)}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-[var(--bg-sunken)] hover:bg-[var(--bg-elevated)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              isSF ? "bg-blue-100" : "bg-purple-100"
            )}
          >
            <FileText className={cn("w-4 h-4", isSF ? "text-blue-600" : "text-purple-600")} />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">
              {isSF ? "SF Documents" : "PUC Documents"}
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              {isSF ? "Optional documents" : "Required documents (10 KD fee)"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress */}
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-[var(--border)] rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  progress.percentage === 100
                    ? "bg-emerald-500"
                    : progress.percentage > 50
                    ? "bg-amber-500"
                    : "bg-blue-500"
                )}
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <span className="text-xs text-[var(--text-secondary)] tabular-nums">
              {progress.submitted}/{progress.total}
            </span>
          </div>

          {expanded ? (
            <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
          )}
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div className="p-4 space-y-4">
          {/* PUC Fee Status */}
          {isPUC && (
            <div
              className={cn(
                "p-4 rounded-lg border",
                student.puc_fee_paid
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-amber-50 border-amber-200"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {student.puc_fee_paid ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <CreditCard className="w-5 h-5 text-amber-600" />
                  )}
                  <div>
                    <span
                      className={cn(
                        "text-sm font-medium block",
                        student.puc_fee_paid ? "text-emerald-700" : "text-amber-700"
                      )}
                    >
                      PUC Fee ({PUC_FEE_AMOUNT} KD)
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {student.puc_fee_paid ? "Payment confirmed" : "Payment required for PUC registration"}
                    </span>
                  </div>
                </div>

                {student.puc_fee_paid ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                      Paid
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                      onClick={() => {
                        // Generate download link for receipt
                        window.open(`/api/receipts/puc-fee/${student.id}`, '_blank')
                      }}
                    >
                      <Download className="w-3.5 h-3.5" />
                      Receipt
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setShowPaymentDialog(true)}
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Pay via WhatsApp
                  </Button>
                )}
              </div>

              {!student.puc_fee_paid && (
                <div className="mt-3 pt-3 border-t border-amber-200 flex items-center justify-between">
                  <span className="text-xs text-amber-600">Or mark as paid manually:</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleTogglePUCFee}
                    disabled={updating === "puc_fee_paid" || isLoading}
                    className="text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-100"
                  >
                    Mark as Paid
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Document List */}
          <div className="space-y-2">
            {documents.map((doc) => {
              // Skip transcript if not transfer student
              if ("transferOnly" in doc && doc.transferOnly && !isTransfer) return null

              const isSubmitted = student[doc.key as keyof Student] as boolean
              const isUpdating = updating === doc.key

              return (
                <div key={doc.key} className="space-y-1">
                  <button
                    onClick={() => handleToggleDocument(doc.key, isSubmitted)}
                    disabled={isUpdating || isLoading}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border transition-all",
                      isSubmitted
                        ? "bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                        : "bg-[var(--bg-sunken)] border-[var(--border)] hover:bg-[var(--bg-elevated)]",
                      (isUpdating || isLoading) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isSubmitted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-[var(--text-secondary)] shrink-0" />
                    )}

                    <div className="flex-1 text-left">
                      <span
                        className={cn(
                          "text-sm",
                          isSubmitted ? "text-emerald-700" : "text-[var(--text-primary)]"
                        )}
                      >
                        {doc.label}
                      </span>
                      {"note" in doc && doc.note && (
                        <span className="text-xs text-[var(--text-secondary)] ml-2">
                          ({doc.note})
                        </span>
                      )}
                    </div>

                    {doc.required && !isSubmitted && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded">
                        Required
                      </span>
                    )}

                    {"transferOnly" in doc && doc.transferOnly && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded">
                        Transfer
                      </span>
                    )}
                  </button>

                  {/* High School Certificate Type Selector */}
                  {doc.key === "puc_high_school_certificate_submitted" && isSubmitted && (
                    <div className="ml-8 flex items-center gap-2">
                      <span className="text-xs text-[var(--text-secondary)]">Type:</span>
                      {HIGH_SCHOOL_CERTIFICATE_TYPES.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => handleCertificateTypeChange(type.value)}
                          disabled={updating === "puc_high_school_certificate_type" || isLoading}
                          className={cn(
                            "px-2 py-1 text-xs rounded border transition-all",
                            student.puc_high_school_certificate_type === type.value
                              ? "bg-purple-100 border-purple-300 text-purple-700"
                              : "bg-[var(--bg-sunken)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                          )}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Info Box */}
          {isSF && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                SF documents are optional. Students can submit them later if needed.
                {isTransfer && " Official transcript is required for transfer students."}
              </p>
            </div>
          )}

          {isPUC && !allRequiredSubmitted && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                All PUC documents are required for enrollment. Please ensure all documents
                are submitted and the 10 KD fee is paid before verification.
              </p>
            </div>
          )}

          {/* Verify Button */}
          {onVerifyDocuments && canVerify && (
            <Button
              onClick={onVerifyDocuments}
              disabled={isLoading}
              className="w-full"
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              Verify Documents
            </Button>
          )}
        </div>
      )}

      {/* PUC Fee Payment Dialog */}
      {isPUC && (
        <PUCFeePaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          student={student}
          onSuccess={async () => {
            // Update the puc_fee_paid status after successful payment
            await onUpdateDocument("puc_fee_paid", true)
          }}
        />
      )}
    </div>
  )
}
