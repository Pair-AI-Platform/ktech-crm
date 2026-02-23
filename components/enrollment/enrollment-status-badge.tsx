"use client"

import { cn } from "@/lib/utils"
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Wallet,
  Building2,
} from "lucide-react"
import type { Student } from "@/types"
import { SF_DOCUMENTS, PUC_DOCUMENTS } from "@/types"

interface EnrollmentStatusBadgeProps {
  student: Student
  showDocuments?: boolean
  size?: "sm" | "md"
  className?: string
}

export function EnrollmentStatusBadge({
  student,
  showDocuments = false,
  size = "md",
  className,
}: EnrollmentStatusBadgeProps) {
  const isSF = student.funding_type === "self_funded"
  const isPUC = student.funding_type === "puc"

  // Calculate document progress
  const getDocumentProgress = () => {
    let total = 0
    let submitted = 0

    if (isSF) {
      SF_DOCUMENTS.forEach((doc) => {
        if ('transferOnly' in doc && doc.transferOnly && !student.transfer_type) return
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

  // Get overall status
  const getStatus = () => {
    if (student.is_withdrawn) {
      return { status: "withdrawn", label: "Withdrawn", color: "destructive" }
    }

    if (isPUC) {
      switch (student.puc_stage) {
        case "enrolled":
          return { status: "enrolled", label: "Enrolled", color: "success" }
        case "puc_decision":
          return { status: "puc_decision", label: "PUC Decision", color: "warning" }
        case "puc_submission":
          return { status: "puc_submission", label: "PUC Submission", color: "info" }
        case "paci_verification":
          return { status: "paci_verification", label: "PACI Verification", color: "info" }
        case "withdrawn":
          return { status: "withdrawn", label: "Withdrawn", color: "destructive" }
        default:
          return { status: "application", label: "File", color: "secondary" }
      }
    }

    // SF Status
    if (student.sf_enrolled_stage) {
      if (student.sf_enrolled_stage === "400" || student.sf_enrolled_stage === "other") {
        return { status: "enrolled", label: "Enrolled", color: "success" }
      }
      if (student.sf_enrolled_stage === "150") {
        return { status: "seat_reserved", label: "Seat Reserved", color: "warning" }
      }
    }

    if (student.amount_paid >= 550) {
      return { status: "enrolled", label: "Enrolled", color: "success" }
    }
    if (student.amount_paid >= 150) {
      return { status: "seat_reserved", label: "Seat Reserved", color: "warning" }
    }

    return { status: "pending", label: "Pending", color: "secondary" }
  }

  const status = getStatus()
  const docProgress = getDocumentProgress()

  const colorMap = {
    success: "bg-emerald-100 text-emerald-700 border-emerald-200",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
    info: "bg-blue-100 text-blue-700 border-blue-200",
    destructive: "bg-red-100 text-red-700 border-red-200",
    secondary: "bg-gray-100 text-gray-700 border-gray-200",
  }

  const iconMap = {
    enrolled: CheckCircle2,
    seat_reserved: Clock,
    withdrawn: AlertCircle,
    puc_decision: Clock,
    puc_submission: FileText,
    paci_verification: Clock,
    pending: Clock,
    application: FileText,
  }

  const StatusIcon = iconMap[status.status as keyof typeof iconMap] || Clock

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Funding Type Badge */}
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium",
          isSF
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : "bg-purple-50 text-purple-700 border-purple-200",
          size === "sm" && "text-[10px] px-1.5 py-0"
        )}
      >
        {isSF ? (
          <Wallet className={cn("w-3 h-3", size === "sm" && "w-2.5 h-2.5")} />
        ) : (
          <Building2 className={cn("w-3 h-3", size === "sm" && "w-2.5 h-2.5")} />
        )}
        {isSF ? "SF" : "PUC"}
      </span>

      {/* Status Badge */}
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium",
          colorMap[status.color as keyof typeof colorMap],
          size === "sm" && "text-[10px] px-1.5 py-0"
        )}
      >
        <StatusIcon className={cn("w-3 h-3", size === "sm" && "w-2.5 h-2.5")} />
        {status.label}
      </span>

      {/* Document Progress (optional) */}
      {showDocuments && (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium",
            docProgress.percentage === 100
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-gray-50 text-gray-700 border-gray-200",
            size === "sm" && "text-[10px] px-1.5 py-0"
          )}
        >
          <FileText className={cn("w-3 h-3", size === "sm" && "w-2.5 h-2.5")} />
          {docProgress.submitted}/{docProgress.total}
        </span>
      )}
    </div>
  )
}
