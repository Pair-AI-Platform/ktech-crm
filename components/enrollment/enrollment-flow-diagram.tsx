"use client"

import { cn } from "@/lib/utils"
import {
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowDown,
  Building2,
  Wallet,
} from "lucide-react"
import type { Student, FundingType } from "@/types"
import { SF_ENROLLED_STAGES } from "@/types"

interface EnrollmentFlowDiagramProps {
  student?: Student
  fundingType?: FundingType
  className?: string
}

export function EnrollmentFlowDiagram({
  student,
  fundingType,
  className,
}: EnrollmentFlowDiagramProps) {
  const currentFundingType = student?.funding_type || fundingType || "self_funded"
  const isSF = currentFundingType === "self_funded"
  const isPUC = currentFundingType === "puc"

  // Calculate SF progress
  const getSFProgress = () => {
    if (!student) return "application"
    if (student.sf_enrolled_stage === "400" || student.sf_enrolled_stage === "other") return "enrolled"
    if (student.sf_enrolled_stage === "150") return "seat_reserved"
    if (student.amount_paid >= 150) return "seat_reserved"
    return "application"
  }

  // Calculate PUC progress
  const getPUCProgress = () => {
    if (!student) return "application"
    if (student.puc_stage === "enrolled") return "enrolled"
    if (student.puc_stage === "puc_decision") return "puc_decision"
    if (student.puc_stage === "puc_submission") return "puc_submission"
    if (student.puc_stage === "paci_verification") return "paci_verification"
    return "application"
  }

  const sfProgress = getSFProgress()
  const pucProgress = getPUCProgress()

  const sfStages = [
    { id: "application", label: "Application", labelAr: "الطلب" },
    { id: "seat_reserved", label: "Seat Reserved", labelAr: "حجز مقعد", subLabel: "150 KWD" },
    { id: "enrolled", label: "Enrolled", labelAr: "مسجل", subLabel: "400 KWD+" },
  ]

  const pucStages = [
    { id: "application", label: "Application", labelAr: "الطلب" },
    { id: "paci_verification", label: "PACI Verification", labelAr: "تحقق الهيئة" },
    { id: "puc_submission", label: "PUC Submission", labelAr: "تقديم ديوان الخدمة" },
    { id: "puc_decision", label: "PUC Decision", labelAr: "قرار ديوان الخدمة" },
    { id: "enrolled", label: "Enrolled", labelAr: "مسجل" },
  ]

  const getStageStatus = (stageId: string, stages: typeof sfStages, currentProgress: string) => {
    const currentIdx = stages.findIndex((s) => s.id === currentProgress)
    const stageIdx = stages.findIndex((s) => s.id === stageId)
    if (stageIdx < currentIdx) return "completed"
    if (stageIdx === currentIdx) return "current"
    return "pending"
  }

  return (
    <div className={cn("p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-sunken)]", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[var(--text-primary)]">
          Enrollment Flow
        </h3>
        <span
          className={cn(
            "px-2 py-0.5 text-xs font-medium rounded-full",
            isSF
              ? "bg-blue-100 text-blue-700"
              : "bg-purple-100 text-purple-700"
          )}
        >
          {isSF ? "Self-Funded" : "PUC"}
        </span>
      </div>

      {/* Flow Diagram */}
      <div className="space-y-2">
        {/* Application Start */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg">
            <FileText className="w-4 h-4 text-[var(--text-secondary)]" />
            <span className="text-sm font-medium text-[var(--text-primary)]">
              APPLICATION
            </span>
          </div>
        </div>

        {/* Split Arrow */}
        <div className="flex items-center justify-center gap-8">
          <div className={cn(
            "flex flex-col items-center",
            !isSF && "opacity-40"
          )}>
            <ArrowDown className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-blue-600 font-medium">SF</span>
          </div>
          <div className={cn(
            "flex flex-col items-center",
            !isPUC && "opacity-40"
          )}>
            <ArrowDown className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-purple-600 font-medium">PUC</span>
          </div>
        </div>

        {/* Two Paths */}
        <div className="grid grid-cols-2 gap-4">
          {/* SF Path */}
          <div className={cn(
            "space-y-2 p-3 rounded-lg border",
            isSF
              ? "border-blue-200 bg-blue-50/50"
              : "border-[var(--border)] bg-[var(--bg-elevated)] opacity-50"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-blue-700">Self-Funded</span>
            </div>

            {sfStages.map((stage, idx) => {
              const status = isSF ? getStageStatus(stage.id, sfStages, sfProgress) : "pending"
              return (
                <div key={stage.id} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                      status === "completed" && "bg-emerald-100",
                      status === "current" && "bg-blue-100",
                      status === "pending" && "bg-gray-100"
                    )}
                  >
                    {status === "completed" ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : status === "current" ? (
                      <Clock className="w-3 h-3 text-blue-600" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span
                      className={cn(
                        "text-xs block",
                        status === "completed" && "text-emerald-700",
                        status === "current" && "text-blue-700 font-medium",
                        status === "pending" && "text-[var(--text-secondary)]"
                      )}
                    >
                      {stage.label}
                    </span>
                    {stage.subLabel && (
                      <span className="text-[10px] text-[var(--text-tertiary)]">
                        {stage.subLabel}
                      </span>
                    )}
                  </div>
                  {idx < sfStages.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-[var(--border)] shrink-0" />
                  )}
                </div>
              )
            })}

            {/* SF Stage Indicator */}
            {isSF && student?.sf_enrolled_stage && (
              <div className="mt-2 pt-2 border-t border-blue-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-secondary)]">Status:</span>
                  <span
                    className={cn(
                      "px-2 py-0.5 text-xs font-medium rounded-full",
                      SF_ENROLLED_STAGES.find((s) => s.value === student.sf_enrolled_stage)?.color === "warning"
                        ? "bg-amber-100 text-amber-700"
                        : SF_ENROLLED_STAGES.find((s) => s.value === student.sf_enrolled_stage)?.color === "success"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-700"
                    )}
                  >
                    {SF_ENROLLED_STAGES.find((s) => s.value === student.sf_enrolled_stage)?.label || student.sf_enrolled_stage}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* PUC Path */}
          <div className={cn(
            "space-y-2 p-3 rounded-lg border",
            isPUC
              ? "border-purple-200 bg-purple-50/50"
              : "border-[var(--border)] bg-[var(--bg-elevated)] opacity-50"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-medium text-purple-700">PUC</span>
            </div>

            {pucStages.map((stage, idx) => {
              const status = isPUC ? getStageStatus(stage.id, pucStages, pucProgress) : "pending"
              return (
                <div key={stage.id} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                      status === "completed" && "bg-emerald-100",
                      status === "current" && "bg-purple-100",
                      status === "pending" && "bg-gray-100"
                    )}
                  >
                    {status === "completed" ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : status === "current" ? (
                      <Clock className="w-3 h-3 text-purple-600" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs flex-1",
                      status === "completed" && "text-emerald-700",
                      status === "current" && "text-purple-700 font-medium",
                      status === "pending" && "text-[var(--text-secondary)]"
                    )}
                  >
                    {stage.label}
                  </span>
                  {idx < pucStages.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-[var(--border)] shrink-0" />
                  )}
                </div>
              )
            })}

            {/* PUC Fee Note */}
            {isPUC && (
              <div className="mt-2 pt-2 border-t border-purple-200">
                <span className="text-[10px] text-purple-600">
                  Fee: 10 KD
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Converging Arrow */}
        <div className="flex items-center justify-center">
          <ArrowDown className="w-4 h-4 text-[var(--text-secondary)]" />
        </div>

        {/* Enrolled */}
        <div className="flex items-center justify-center">
          <div
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg border",
              (sfProgress === "enrolled" || pucProgress === "enrolled")
                ? "bg-emerald-100 border-emerald-200"
                : "bg-[var(--bg-elevated)] border-[var(--border)]"
            )}
          >
            <CheckCircle2
              className={cn(
                "w-4 h-4",
                (sfProgress === "enrolled" || pucProgress === "enrolled")
                  ? "text-emerald-600"
                  : "text-[var(--text-secondary)]"
              )}
            />
            <span
              className={cn(
                "text-sm font-medium",
                (sfProgress === "enrolled" || pucProgress === "enrolled")
                  ? "text-emerald-700"
                  : "text-[var(--text-secondary)]"
              )}
            >
              ENROLLED
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
