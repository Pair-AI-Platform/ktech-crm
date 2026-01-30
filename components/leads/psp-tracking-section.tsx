"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  FileText,
  CheckCircle,
  Clock,
  CreditCard,
  Shield,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { PSPSubstageProgress } from "./psp-substage-progress"
import type { Lead, SubmissionSubstage, SubmissionBlockedReason } from "@/types"
import { SUBMISSION_SUBSTAGES, SUBMISSION_BLOCKED_REASONS } from "@/types"

interface PSPTrackingSectionProps {
  lead: Lead
  className?: string
  onOpenWizard?: () => void
}

interface DocumentStatus {
  total: number
  uploaded: number
  verified: number
  expired: number
  percentage: number
}

export function PSPTrackingSection({
  lead,
  className,
  onOpenWizard,
}: PSPTrackingSectionProps) {
  const [expanded, setExpanded] = useState(true)
  const [documentStatus, setDocumentStatus] = useState<DocumentStatus | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch document status
  useEffect(() => {
    fetchDocumentStatus()
  }, [lead.id])

  const fetchDocumentStatus = async () => {
    try {
      const response = await fetch(`/api/psp/documents/verify?lead_id=${lead.id}`)
      if (response.ok) {
        const data = await response.json()
        setDocumentStatus({
          total: data.summary?.total || 0,
          uploaded: data.summary?.total || 0,
          verified: data.summary?.verified || 0,
          expired: data.documents?.filter((d: { is_expired?: boolean }) => d.is_expired).length || 0,
          percentage: data.summary?.total
            ? Math.round((data.summary.verified / data.summary.total) * 100)
            : 0,
        })
      }
    } catch (err) {
      console.error("Failed to fetch document status:", err)
    } finally {
      setLoading(false)
    }
  }

  // Get substage info
  const substage = lead.submission_substage || 'pending'
  const substageConfig = SUBMISSION_SUBSTAGES.find(s => s.value === substage)
  const blockedReason = lead.submission_blocked_reason
  const blockedReasonConfig = blockedReason
    ? SUBMISSION_BLOCKED_REASONS.find(r => r.value === blockedReason)
    : null

  // Calculate progress indicators
  const getOverallProgress = () => {
    const stages = ['pending', 'documents', 'ready', 'submitted']
    const currentIndex = stages.indexOf(substage)
    if (currentIndex === -1) return 0 // blocked or lost
    return Math.round(((currentIndex + 1) / stages.length) * 100)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">
              PSP Submission Tracking
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              PUC Submission Pipeline Status
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Status Badge */}
          <Badge
            variant={
              substage === 'submitted' ? 'success' :
              substage === 'blocked' ? 'warning' :
              substage === 'lost' ? 'destructive' :
              'secondary'
            }
            className="gap-1"
          >
            {substageConfig?.label || substage}
          </Badge>

          <Button variant="ghost" size="icon" className="h-8 w-8">
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-[var(--border)]"
        >
          {/* Substage Progress */}
          <div className="p-4 border-b border-[var(--border)]">
            <PSPSubstageProgress
              currentSubstage={substage as SubmissionSubstage}
              blockedReason={blockedReason as SubmissionBlockedReason}
            />
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-2 gap-4 p-4">
            {/* Document Status */}
            <div className="p-4 rounded-xl bg-[var(--bg-sunken)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    Documents
                  </span>
                </div>
                {documentStatus && (
                  <span className="text-xs text-[var(--text-muted)]">
                    {documentStatus.uploaded} uploaded
                  </span>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
                </div>
              ) : documentStatus ? (
                <>
                  {/* Verification Progress */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-muted)]">Verified</span>
                      <span className="font-medium text-[var(--success)]">
                        {documentStatus.verified}/{documentStatus.total}
                      </span>
                    </div>
                    <div className="w-full bg-[var(--border)] rounded-full h-1.5">
                      <div
                        className="bg-[var(--success)] h-1.5 rounded-full transition-all"
                        style={{ width: `${documentStatus.percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Warning for expired docs */}
                  {documentStatus.expired > 0 && (
                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                      <AlertCircle className="w-3 h-3" />
                      <span>{documentStatus.expired} document(s) expired</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-[var(--text-muted)]">
                  No documents uploaded yet
                </p>
              )}
            </div>

            {/* Verification Status */}
            <div className="p-4 rounded-xl bg-[var(--bg-sunken)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    Verification
                  </span>
                </div>
              </div>

              {documentStatus?.verified === documentStatus?.total && (documentStatus?.total ?? 0) > 0 ? (
                <div className="flex items-center gap-2 text-[var(--success)]">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-sm font-medium">All Verified</span>
                </div>
              ) : documentStatus?.verified && documentStatus.verified > 0 ? (
                <div className="flex items-center gap-2 text-amber-500">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {(documentStatus.total ?? 0) - documentStatus.verified} pending
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[var(--text-muted)]">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm font-medium">Not started</span>
                </div>
              )}
            </div>

            {/* Blocked Reason (if applicable) */}
            {substage === 'blocked' && blockedReasonConfig && (
              <div className="col-span-2 p-4 rounded-xl bg-orange-50 border border-orange-200 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-800">
                    Blocked Reason
                  </span>
                </div>
                <p className="text-sm text-orange-700">
                  {blockedReasonConfig.label}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-[var(--border)] flex items-center gap-3">
            {onOpenWizard && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenWizard}
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                Open Submission Wizard
              </Button>
            )}

            {/* PUC Portal Link */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('https://portal.puc.edu.kw', '_blank')}
              className="gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              PUC Portal
            </Button>

            {/* Refresh Status */}
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchDocumentStatus}
              className="gap-2 ml-auto"
              disabled={loading}
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
