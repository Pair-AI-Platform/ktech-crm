"use client"

import { motion } from "framer-motion"
import {
  FileText,
  CheckCircle,
  Send,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { SubmissionSubstage } from "@/types"
import { SUBMISSION_SUBSTAGES } from "@/types"

interface PSPSubstageProgressProps {
  currentSubstage: SubmissionSubstage
  blockedReason?: string | null
  className?: string
  compact?: boolean
}

// Main substages in order (excluding lost which is a branch)
const MAIN_SUBSTAGES: SubmissionSubstage[] = ['documents', 'submissions']

// Map substages to their icons
const SUBSTAGE_ICONS: Record<SubmissionSubstage, typeof FileText> = {
  documents: FileText,
  submissions: Send,
  sf_srj: FileText,
  lost: XCircle,
}

// Map substages to colors
const SUBSTAGE_COLORS: Record<SubmissionSubstage, { from: string; to: string; bg: string }> = {
  documents: { from: '#F59E0B', to: '#D97706', bg: 'bg-amber-100' },
  submissions: { from: '#3B82F6', to: '#2563EB', bg: 'bg-blue-100' },
  sf_srj: { from: '#6366F1', to: '#4F46E5', bg: 'bg-indigo-100' },
  lost: { from: '#EF4444', to: '#DC2626', bg: 'bg-red-100' },
}

function getSubstageIndex(substage: SubmissionSubstage): number {
  const index = MAIN_SUBSTAGES.indexOf(substage)
  return index === -1 ? -1 : index
}

export function PSPSubstageProgress({
  currentSubstage,
  className,
  compact = false,
}: PSPSubstageProgressProps) {
  const isLost = currentSubstage === 'lost'
  const currentIndex = getSubstageIndex(currentSubstage)

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Progress Steps */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {MAIN_SUBSTAGES.map((substage, idx) => {
            const Icon = SUBSTAGE_ICONS[substage]
            const colors = SUBSTAGE_COLORS[substage]
            const substageConfig = SUBMISSION_SUBSTAGES.find(s => s.value === substage)
            const label = substageConfig?.label || substage

            const isCompleted = currentIndex > idx
            const isCurrent = currentSubstage === substage
            const isPending = currentIndex < idx && !isLost

            return (
              <div
                key={substage}
                className={cn(
                  "flex flex-col items-center relative z-10",
                  compact ? "gap-1" : "gap-2"
                )}
              >
                {/* Step Circle */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className={cn(
                    "flex items-center justify-center rounded-full border-2 transition-all",
                    compact ? "w-8 h-8" : "w-10 h-10",
                    isCompleted && "border-transparent",
                    isCurrent && "border-transparent ring-4 ring-offset-2",
                    isPending && "border-[var(--border)] bg-[var(--bg-surface)]",
                    isLost && idx >= currentIndex && "border-[var(--border)] bg-[var(--bg-surface)] opacity-50"
                  )}
                  style={{
                    background: isCompleted || isCurrent
                      ? `linear-gradient(135deg, ${colors.from}, ${colors.to})`
                      : undefined,
                    ...(isCurrent && {
                      '--tw-ring-color': colors.from,
                    } as React.CSSProperties),
                  }}
                >
                  {isCompleted ? (
                    <CheckCircle className={cn("text-white", compact ? "w-4 h-4" : "w-5 h-5")} strokeWidth={2.5} />
                  ) : isCurrent ? (
                    <Icon className={cn("text-white", compact ? "w-4 h-4" : "w-5 h-5")} />
                  ) : (
                    <span className={cn(
                      "font-medium text-[var(--text-muted)]",
                      compact ? "text-xs" : "text-sm"
                    )}>
                      {idx + 1}
                    </span>
                  )}
                </motion.div>

                {/* Step Label */}
                <span
                  className={cn(
                    "font-medium text-center whitespace-nowrap transition-colors",
                    compact ? "text-[10px]" : "text-xs",
                    isCompleted || isCurrent
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-muted)]"
                  )}
                >
                  {label}
                </span>

                {/* Connecting Line */}
                {idx < MAIN_SUBSTAGES.length - 1 && (
                  <div
                    className={cn(
                      "absolute top-4 h-0.5 -z-10",
                      compact ? "left-[calc(50%+12px)] w-[calc(100%-24px)]" : "left-[calc(50%+16px)] w-[calc(100%-32px)]"
                    )}
                    style={{
                      width: 'calc(100% + 40px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isCompleted || currentIndex > idx
                          ? "bg-[var(--success)]"
                          : "bg-[var(--border)]"
                      )}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Progress line underneath */}
        <div className="absolute top-4 left-0 right-0 h-0.5 -z-10">
          <div className="relative w-full h-full bg-[var(--border)] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: isLost
                  ? '0%'
                  : `${(currentIndex / (MAIN_SUBSTAGES.length - 1)) * 100}%`
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--success)] to-[var(--primary)] rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Lost Branch Indicator */}
      {isLost && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 rounded-xl border bg-red-50 border-red-200"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-500">
            <XCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm text-red-800">
              Submission Lost
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Compact inline version for lists
export function PSPSubstageIndicator({
  substage,
  className,
}: {
  substage: SubmissionSubstage
  className?: string
}) {
  const Icon = SUBSTAGE_ICONS[substage]
  const colors = SUBSTAGE_COLORS[substage]
  const substageConfig = SUBMISSION_SUBSTAGES.find(s => s.value === substage)

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${colors.from}20, ${colors.to}20)`,
        color: colors.from,
      }}
    >
      <Icon className="w-3 h-3" />
      <span>{substageConfig?.label || substage}</span>
    </div>
  )
}
