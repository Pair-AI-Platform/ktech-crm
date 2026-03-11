"use client"

import React, { useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { InlineTagSelect, type RowVariant } from "@/components/ui/notion-tag-select"
import {
  Phone,
  Mail,
  Check,
  PhoneForwarded,
  FileText,
  Banknote,
  Pencil,
  Lock,
  XCircle,
  CheckCircle2,
  Wand2,
} from "lucide-react"
import { SimpleTooltip } from "@/components/ui/tooltip"
import {
  PIPELINE_STAGES,
  SCHOOLS,
  LEAD_STATUSES,
  APPLICANT_ONLY_STATUSES,
  LOCKED_STAGES,
  SUBMISSION_SUBSTAGES,
  SUBMISSION_STATUSES,
  SF_DOCUMENTS,
  PUC_DOCUMENT_STATUSES,
  ORIENTATION_STATUSES,
  MAJORS,
  type Lead,
  type PipelineStage,
  type LeadStatus,
  type SubmissionSubstage,
  type SubmissionStatus,
  type PUCDocumentStatus,
  type OrientationStatus,
} from "@/types"
import { computePUCDocumentStatus } from "@/lib/psp/document-status"
import { formatKuwaitPhone, getInitials } from "@/lib/utils"
import { LeadAppointmentsPopover } from "@/components/leads/lead-appointments-popover"
import {
  getLeadTemperature,
  temperatureConfig,
  PROGRESS_MAX,
  CIRCLE_RADIUS,
  CIRCLE_CIRCUMFERENCE,
  PUC_PIPELINE_STAGES,
} from "./lead-table-utils"

export interface LeadTableRowProps {
  lead: Lead
  index: number
  isSelected: boolean
  isSubmissionView: boolean
  isLostView: boolean
  isWithdrawView: boolean
  isPucSrjView: boolean
  isPucApplicantView: boolean
  isPucDocSubmissionView: boolean
  isPucContactedView: boolean
  showSubstageColumn: boolean
  currentStageFilter?: PipelineStage | "all"
  documentCompleteLeads: Set<string>
  sfPaymentData: Record<string, { amount_paid: number; sf_enrolled_stage?: string }>
  registrationSentLeads: Set<string>
  pucPaymentLeads: Set<string>
  pucDocCounts: Record<string, { uploaded: number; required: number }>
  copiedPhone: string | null
  editingStage: string | null
  editingSchool: string | null
  editingStatus: string | null
  editingGpa: { leadId: string; field: 'expected_gpa' | 'actual_gpa' } | null
  gpaInputValue: string
  editingSubmissionSubstage: string | null
  editingSubmissionStatus: string | null
  editingOrientationStatus: string | null
  onSelectLead: (id: string) => void
  onLeadClick?: (lead: Lead) => void
  setCopiedPhone: (phone: string | null) => void
  handleStageChange: (leadId: string, newStage: PipelineStage) => void
  handleSchoolChange: (leadId: string, newSchool: string) => void
  handleStatusChange: (leadId: string, newStatus: LeadStatus) => void
  handleSubmissionSubstageChange: (leadId: string, newSubstage: SubmissionSubstage) => void
  handleSubmissionStatusChange: (leadId: string, newStatus: SubmissionStatus) => void
  handleOrientationStatusChange: (leadId: string, newStatus: OrientationStatus | '') => void
  handleDocStatusOverrideChange: (leadId: string, newStatus: PUCDocumentStatus | '') => void
  editingDocStatus: string | null
  handleGpaEdit: (leadId: string, field: 'expected_gpa' | 'actual_gpa', currentValue?: number) => void
  handleGpaSave: () => void
  setEditingGpa: (val: { leadId: string; field: 'expected_gpa' | 'actual_gpa' } | null) => void
  setGpaInputValue: (val: string) => void
  setBookingLead: (lead: Lead) => void
  setBookingSimpleMode: (val: boolean) => void
  setBookingCallbackMode: (val: boolean) => void
  setCallbackLead: (lead: Lead) => void
  setCallbackFromStage: (stage: PipelineStage | undefined) => void
  setLostDialogLead: (lead: Lead) => void
  setPspWizardLead: (lead: Lead) => void
  setViewingAppointment: (apt: import("@/types").Appointment | null) => void
  getEffectiveValue: <K extends keyof Lead>(leadId: string, field: K, originalValue: Lead[K]) => Lead[K]
  onEditWithdrawReason?: (lead: Lead) => void
}

export const LeadTableRow = React.memo(function LeadTableRow({
  lead,
  index,
  isSelected,
  isSubmissionView,
  isLostView,
  isWithdrawView,
  isPucSrjView,
  isPucApplicantView,
  isPucDocSubmissionView,
  isPucContactedView,
  showSubstageColumn,
  currentStageFilter,
  documentCompleteLeads,
  sfPaymentData,
  registrationSentLeads,
  pucPaymentLeads,
  pucDocCounts,
  copiedPhone,
  editingStage,
  editingSchool,
  editingStatus,
  editingGpa,
  gpaInputValue,
  editingSubmissionSubstage,
  editingSubmissionStatus,
  editingOrientationStatus,
  onSelectLead,
  onLeadClick,
  setCopiedPhone,
  handleStageChange,
  handleSchoolChange,
  handleStatusChange,
  handleSubmissionSubstageChange,
  handleSubmissionStatusChange,
  handleOrientationStatusChange,
  handleDocStatusOverrideChange,
  editingDocStatus,
  handleGpaEdit,
  handleGpaSave,
  setEditingGpa,
  setGpaInputValue,
  setBookingLead,
  setBookingSimpleMode,
  setBookingCallbackMode,
  setCallbackLead,
  setCallbackFromStage,
  setLostDialogLead,
  setPspWizardLead,
  setViewingAppointment,
  getEffectiveValue,
  onEditWithdrawReason,
}: LeadTableRowProps) {
  // Determine row variant for substage/status tag coloring
  const isInSubmissionFlow = ['application', 'applicant'].includes(lead.pipeline_stage)
  const isSubmissionSubmitted = lead.pipeline_stage === 'applicant'

  const rowVariant: RowVariant = lead.pipeline_stage === 'lost'
    ? 'lost'
    : lead.ministry_blocked
      ? 'blocked'
      : isSubmissionSubmitted || documentCompleteLeads.has(lead.id)
        ? 'documents-complete'
        : isInSubmissionFlow
          ? 'submission'
          : 'default'

  const isSentToRegistration = registrationSentLeads.has(lead.id)

  const handleRowClick = useCallback(() => {
    onLeadClick?.(lead)
  }, [onLeadClick, lead])

  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    onSelectLead(lead.id)
  }, [onSelectLead, lead.id])

  const handleCopyPhone = useCallback((e: React.MouseEvent, phone: string) => {
    e.stopPropagation()
    navigator.clipboard.writeText(phone)
    setCopiedPhone(phone)
    setTimeout(() => setCopiedPhone(null), 1500)
  }, [setCopiedPhone])

  const handleOpenPspWizard = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setPspWizardLead(lead)
  }, [setPspWizardLead, lead])

  const handleBookNew = useCallback(() => {
    setBookingSimpleMode(false)
    setBookingCallbackMode(false)
    setBookingLead(lead)
  }, [setBookingSimpleMode, setBookingCallbackMode, setBookingLead, lead])

  const handleScheduleCallback = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setCallbackFromStage(lead.pipeline_stage)
    setCallbackLead(lead)
  }, [setCallbackFromStage, setCallbackLead, lead])

  const handleMarkLost = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setLostDialogLead(lead)
  }, [setLostDialogLead, lead])

  return (
    <motion.tr
      key={lead.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.015 }}
      onClick={handleRowClick}
      className={cn(
        "border-b border-[var(--border)] transition-all duration-150 group/row",
        "bg-white dark:bg-[var(--bg-surface)]",
        onLeadClick && "cursor-pointer",
        isSentToRegistration
          ? "border-l-[3px] border-l-emerald-500 hover:bg-[var(--bg-hover)]"
          : isSelected
            ? "border-l-2 border-l-[var(--primary)]"
            : "hover:bg-[var(--bg-hover)] border-l-2 border-l-transparent hover:border-l-[var(--border-emphasis)]"
      )}
    >
      <td className="px-3 py-3 sticky left-0 z-10 bg-inherit" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
            className="w-4 h-4 rounded-md border-2 border-[var(--border)] bg-[var(--bg-surface)] text-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-muted)] focus:ring-offset-0 cursor-pointer transition-all hover:border-[var(--primary)]"
          />
        </div>
      </td>
      <td className="px-3 py-3 w-[180px] min-w-[180px] max-w-[180px] sticky left-10 z-10 bg-inherit after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:bg-[var(--border)]">
        {(() => {
          const { temperature, description } = getLeadTemperature(lead)
          const config = temperatureConfig[temperature]
          const Icon = config.icon
          const tempLabel = temperature === "hot" ? "Hot" : temperature === "warm" ? "Warm" : "Cold"
          return (
            <Link href={`/leads/${lead.id}${currentStageFilter && currentStageFilter !== "all" ? `?stage=${currentStageFilter}` : ""}`} className="flex items-center gap-2 group" onClick={isSubmissionView ? (e: React.MouseEvent) => e.preventDefault() : undefined}>
              <SimpleTooltip
                content={
                  <div className="max-w-[250px]">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={cn("w-4 h-4 flex-shrink-0", config.color)} />
                      <span className="font-semibold">{tempLabel} Lead</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] whitespace-normal break-words">{description}</p>
                  </div>
                }
                side="right"
              >
                {(() => {
                  const effectiveCount = getEffectiveValue(lead.id, 'contact_count', lead.contact_count) || 0
                  const progress = Math.min(effectiveCount / PROGRESS_MAX, 1)
                  const dashOffset = CIRCLE_CIRCUMFERENCE * (1 - progress)
                  const isFull = effectiveCount >= PROGRESS_MAX
                  return (
                    <div className="relative cursor-help flex items-center justify-center w-9 h-9">
                      <svg width="36" height="36" className="absolute inset-0 -rotate-90">
                        {/* Background track */}
                        <circle
                          cx="18" cy="18" r={CIRCLE_RADIUS}
                          fill="none"
                          stroke="var(--border)"
                          strokeWidth="3"
                          strokeDasharray={effectiveCount === 0 ? "3 4" : undefined}
                          opacity={0.5}
                        />
                        {/* Progress arc */}
                        {effectiveCount > 0 && (
                          <circle
                            cx="18" cy="18" r={CIRCLE_RADIUS}
                            fill="none"
                            stroke={config.stroke}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={CIRCLE_CIRCUMFERENCE}
                            strokeDashoffset={dashOffset}
                            className="transition-all duration-500 ease-out"
                          />
                        )}
                      </svg>
                      <span className={cn(
                        "relative z-10 font-bold text-xs transition-colors",
                        isFull
                          ? config.color
                          : effectiveCount > 0
                            ? "text-[var(--text-primary)]"
                            : "text-[var(--text-muted)]"
                      )}>
                        {effectiveCount}
                      </span>
                    </div>
                  )
                })()}
              </SimpleTooltip>
              <div className="min-w-0">
                {/* SF Document completion indicator */}
                {lead.funding_type === "self_funded" && (() => {
                  const sfChecked = SF_DOCUMENTS.filter(
                    (doc) => lead[doc.key as keyof Lead] === true
                  ).length
                  const sfTotal = SF_DOCUMENTS.length
                  const isComplete = sfChecked === sfTotal
                  if (isComplete) return null
                  const missingDocs = SF_DOCUMENTS.filter(
                    (doc) => lead[doc.key as keyof Lead] !== true
                  )
                  return (
                    <SimpleTooltip
                      content={
                        <div className="max-w-[220px]">
                          <p className="font-semibold text-xs mb-1.5">Missing Documents ({sfTotal - sfChecked})</p>
                          <ul className="space-y-0.5">
                            {missingDocs.map((doc) => (
                              <li key={doc.key} className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                                {doc.label}
                              </li>
                            ))}
                          </ul>
                        </div>
                      }
                      side="top"
                    >
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md mb-0.5 cursor-help",
                        sfChecked === 0
                          ? "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                      )}>
                        <FileText className="w-3 h-3" />
                        {sfChecked}/{sfTotal}
                      </span>
                    </SimpleTooltip>
                  )
                })()}
                {/* PUC Document completion + Choice rank row */}
                {lead.funding_type === "puc" && (() => {
                  const docInfo = pucDocCounts[lead.id]
                  const uploaded = docInfo?.uploaded ?? 0
                  const required = docInfo?.required ?? 0
                  const showDocBadge = !(required > 0 && uploaded >= required)
                  const showChoiceBadge = !!lead.puc_choice
                  if (!showDocBadge && !showChoiceBadge) return null
                  return (
                    <div className="flex items-center gap-1 mb-0.5">
                      {showDocBadge && (
                        <SimpleTooltip
                          content={
                            <div className="max-w-[200px]">
                              <p className="font-semibold text-xs mb-1">PUC Documents</p>
                              <p className="text-[11px] text-[var(--text-muted)]">
                                {uploaded} of {required || '?'} documents uploaded
                              </p>
                            </div>
                          }
                          side="top"
                        >
                          <span className={cn(
                            "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md cursor-help",
                            uploaded === 0
                              ? "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                          )}>
                            <FileText className="w-3 h-3" />
                            {uploaded}/{required || '?'}
                          </span>
                        </SimpleTooltip>
                      )}
                      {showChoiceBadge && (
                        <span className={cn(
                          "inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-md",
                          lead.puc_choice === "1"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                        )}>
                          {lead.puc_choice === "1" ? "1st" : lead.puc_choice === "2" ? "2nd" : lead.puc_choice === "3" ? "3rd" : "4th"}
                        </span>
                      )}
                    </div>
                  )
                })()}
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors truncate">
                    {lead.first_name} {lead.last_name}
                  </p>
                  {isSentToRegistration && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 whitespace-nowrap flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      Reg.
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge
                    variant={lead.funding_type === "puc" ? "solid-primary" : "secondary"}
                    size="xs"
                    shape="pill"
                  >
                    {lead.funding_type === "puc" ? "PUC" : "SF"}
                  </Badge>
                  {lead.is_kuwaiti && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent-muted)] text-[var(--accent)] font-medium">KW</span>
                  )}
                  {lead.ministry_blocked && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 font-medium">
                      Blocked
                    </span>
                  )}
                  {/* SF Payment milestone indicator */}
                  {lead.funding_type === "self_funded" && (() => {
                    const payment = sfPaymentData[lead.id]
                    const paid = payment?.amount_paid ?? 0
                    const milestone1 = 150
                    const milestone2 = 600 // 150 + 450
                    const phase1Done = paid >= milestone1
                    const phase2Done = paid >= milestone2
                    return (
                      <SimpleTooltip
                        content={
                          <div className="max-w-[200px] space-y-1.5">
                            <p className="font-semibold text-xs">Payment Progress</p>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className={phase1Done ? "text-emerald-400" : "text-[var(--text-muted)]"}>
                                  {phase1Done ? "\u2713" : "\u25CB"} Phase 1: 150 KD
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px]">
                                <span className={phase2Done ? "text-emerald-400" : "text-[var(--text-muted)]"}>
                                  {phase2Done ? "\u2713" : "\u25CB"} Phase 2: 450 KD
                                </span>
                              </div>
                            </div>
                            <p className="text-[10px] text-[var(--text-muted)] pt-0.5 border-t border-white/10">
                              Total paid: {paid} / {milestone2} KD
                            </p>
                          </div>
                        }
                        side="top"
                      >
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full cursor-help",
                          phase2Done
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : phase1Done
                              ? "bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400"
                              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400"
                        )}>
                          <Banknote className="w-3 h-3" />
                          {paid}/{milestone2}
                        </span>
                      </SimpleTooltip>
                    )
                  })()}
                </div>
              </div>
            </Link>
          )
        })()}
      </td>
      <td className="px-3 py-3">
        <div className="space-y-1.5">
          <button
            onClick={(e) => handleCopyPhone(e, lead.phone)}
            className="flex items-center gap-2 text-sm text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors group cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-[var(--bg-sunken)] flex items-center justify-center group-hover:bg-[var(--primary-muted)] transition-colors">
              {copiedPhone === lead.phone ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Phone className="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--primary)]" />
              )}
            </div>
            <span className="font-medium whitespace-nowrap">
              {copiedPhone === lead.phone ? "Copied!" : formatKuwaitPhone(lead.phone)}
            </span>
          </button>
          {lead.phone_secondary && (
            <button
              onClick={(e) => handleCopyPhone(e, lead.phone_secondary!)}
              className="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors group cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                {copiedPhone === lead.phone_secondary ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <Phone className="w-3 h-3 text-blue-500" />
                )}
              </div>
              <span className="font-medium whitespace-nowrap">
                {copiedPhone === lead.phone_secondary ? "Copied!" : formatKuwaitPhone(lead.phone_secondary)}
              </span>
            </button>
          )}
          {lead.email && (
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <div className="w-6 h-6 rounded-lg bg-[var(--bg-sunken)] flex items-center justify-center">
                <Mail className="w-3 h-3" />
              </div>
              <span className="truncate max-w-[120px]">{lead.email}</span>
            </div>
          )}
        </div>
      </td>
      {/* Submission-specific columns */}
      {isSubmissionView ? (
        <>
          {/* Stage column */}
          <td className="px-3 py-3 min-w-[160px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {isPucSrjView ? (
              <InlineTagSelect
                value={getEffectiveValue(lead.id, 'pipeline_stage', lead.pipeline_stage)}
                options={PUC_PIPELINE_STAGES.map((stage) => ({
                  value: stage.value,
                  label: stage.label,
                  color: stage.value,
                }))}
                onChange={(value) => handleStageChange(lead.id, value as PipelineStage)}
                disabled={editingStage === lead.id}
                loading={editingStage === lead.id}
              />
            ) : (() => {
              const currentStage = getEffectiveValue(lead.id, 'pipeline_stage', lead.pipeline_stage) as PipelineStage
              const isStageLocked = LOCKED_STAGES.includes(currentStage)
              const stageInfo = PIPELINE_STAGES.find(s => s.value === currentStage)

              if (isStageLocked && stageInfo) {
                return (
                  <SimpleTooltip content="This stage is locked and cannot be changed">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
                      <Lock className="w-3 h-3 text-[var(--text-muted)]" />
                      <span className="text-xs font-medium text-[var(--text-secondary)]">{stageInfo.label}</span>
                    </div>
                  </SimpleTooltip>
                )
              }

              return (
                <InlineTagSelect
                  value={currentStage}
                  options={PIPELINE_STAGES.filter((stage) => stage.value !== 'lost').map((stage) => ({
                    value: stage.value,
                    label: stage.label,
                    color: stage.value,
                  }))}
                  onChange={(value) => handleStageChange(lead.id, value as PipelineStage)}
                  disabled={editingStage === lead.id}
                  loading={editingStage === lead.id}
                />
              )
            })()}
          </td>
          {/* Status column for PUC view (hidden for PUC Applicant - uses orientation instead) */}
          {isPucSrjView && !isPucApplicantView && (
            <td className="px-3 py-3 min-w-[150px]" onClick={(e) => e.stopPropagation()}>
              {(() => {
                const effectiveStage = getEffectiveValue(lead.id, 'pipeline_stage', lead.pipeline_stage) as PipelineStage

                const PUC_STAGE_STATUSES: Record<PipelineStage, LeadStatus[] | 'none'> = {
                  new: 'none',
                  contacted: ['no_answer', 'switched_off', 'interested', 'not_interested', 'high_gpa', 'wrong_number', 'will_see'],
                  visit: ['no_answer', 'cant_reach', 'interested', 'not_interested'],
                  test: ['online', 'on_campus'],
                  application: ['no_answer', 'switched_off', 'interested', 'not_interested', 'high_gpa', 'wrong_number', 'will_see'],
                  lost: 'none',
                  applicant: ['no_answer', 'cant_reach', 'informed', 'travelling', 'might_withdraw'],
                  enrolled: 'none',
                  withdraw: 'none',
                  puc_document_submission: ['no_answer', 'cant_reach', 'interested', 'not_interested', 'will_see'],
                  puc_application_submission: ['applied', 'blocked_ku', 'blocked_paaet', 'blocked_abroad', 'blocked_aasu', 'blocked_paci', 'blocked_puc', 'blocked_other'],
                }

                const stageConfig = PUC_STAGE_STATUSES[effectiveStage] ?? 'none'
                const isStatusDisabled = stageConfig === 'none'
                const leadStatus = getEffectiveValue(lead.id, 'status', lead.status)
                const availableStatuses = isStatusDisabled
                  ? []
                  : LEAD_STATUSES.filter(s => (stageConfig as LeadStatus[]).includes(s.value))

                // For strict stages, don't carry over statuses from previous stages
                const pucStrictStages: PipelineStage[] = ['puc_application_submission']
                if (leadStatus && !availableStatuses.find(s => s.value === leadStatus) && !isStatusDisabled && !pucStrictStages.includes(effectiveStage as PipelineStage)) {
                  const currentStatusDef = LEAD_STATUSES.find(s => s.value === leadStatus)
                  if (currentStatusDef) availableStatuses.unshift(currentStatusDef)
                }

                const isPucAppSubmission = effectiveStage === 'puc_application_submission'

                return isStatusDisabled ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)]">
                    <span className="text-xs">&mdash;</span>
                  </div>
                ) : (
                  <InlineTagSelect
                    value={leadStatus || ''}
                    options={availableStatuses.map((status) => ({
                      value: status.value,
                      label: status.label,
                      color: status.color,
                    }))}
                    onChange={(value) => handleStatusChange(lead.id, value as LeadStatus)}
                    disabled={editingStatus === lead.id}
                    loading={editingStatus === lead.id}
                    compact={isPucAppSubmission}
                  />
                )
              })()}
            </td>
          )}
          {/* PUC Doc Status column - overridable by agent */}
          {isPucDocSubmissionView && (
            <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
              {(() => {
                const effectiveStage = getEffectiveValue(lead.id, 'pipeline_stage', lead.pipeline_stage) as PipelineStage
                if (effectiveStage !== 'puc_document_submission') {
                  return (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)]">
                      <span className="text-xs">&mdash;</span>
                    </div>
                  )
                }

                const displayStatus = getEffectiveValue(lead.id, 'puc_document_status_override', lead.puc_document_status_override) as PUCDocumentStatus | null | undefined
                  || computePUCDocumentStatus(lead.submission_substage, (() => { const d = pucDocCounts[lead.id]; return d ? (d.required > 0 && d.uploaded >= d.required) : false })(), pucPaymentLeads.has(lead.id))

                if (!displayStatus) {
                  return (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)]">
                      <span className="text-xs">&mdash;</span>
                    </div>
                  )
                }

                const statusColorMap: Record<string, string> = {
                  missing_document: 'red',
                  pending_payment: 'orange',
                  ready_to_apply: 'green',
                  applied: 'blue',
                  blocked: 'warning',
                }

                return (
                  <InlineTagSelect
                    value={displayStatus}
                    options={PUC_DOCUMENT_STATUSES.map(s => ({
                      value: s.value,
                      label: s.label,
                      color: statusColorMap[s.value] || 'gray',
                    }))}
                    onChange={(value) => handleDocStatusOverrideChange(lead.id, value as PUCDocumentStatus | '')}
                    disabled={editingDocStatus === lead.id}
                    loading={editingDocStatus === lead.id}
                  />
                )
              })()}
            </td>
          )}
          {/* Substage column - hidden for PUC SRJ view and when all visible leads are self-funded applicants */}
          {!isPucSrjView && showSubstageColumn && (
            <td className="px-3 py-3 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {!(lead.funding_type === 'self_funded' && lead.pipeline_stage === 'applicant') && (
                <InlineTagSelect
                  value={getEffectiveValue(lead.id, 'submission_substage', lead.submission_substage) || ''}
                  options={SUBMISSION_SUBSTAGES.map((substage) => ({
                    value: substage.value,
                    label: substage.label,
                    color: "gray",
                  }))}
                  onChange={(value) => handleSubmissionSubstageChange(lead.id, value as SubmissionSubstage)}
                  disabled={editingSubmissionSubstage === lead.id}
                  loading={editingSubmissionSubstage === lead.id}
                />
              )}
            </td>
          )}
          {/* Orientation column - non-PUC view or PUC Applicant view */}
          {(!isPucSrjView || isPucApplicantView) && (
            <td className="px-3 py-3 min-w-[120px] overflow-hidden">
              {(() => {
                const isSF = lead.funding_type === 'self_funded'
                const amountPaid = isSF ? (sfPaymentData[lead.id]?.amount_paid ?? 0) : 0
                const autoPaid = isSF && amountPaid >= 550
                const orientationValue = autoPaid
                  ? 'paid'
                  : (getEffectiveValue(lead.id, 'orientation_status', lead.orientation_status) || '')
                return (
                  <InlineTagSelect
                    value={orientationValue}
                    options={ORIENTATION_STATUSES.map((s) => ({
                      value: s.value,
                      label: s.label,
                      color: s.color,
                    }))}
                    onChange={(value) => handleOrientationStatusChange(lead.id, value as OrientationStatus | '')}
                    disabled={editingOrientationStatus === lead.id || autoPaid}
                    loading={editingOrientationStatus === lead.id}
                  />
                )
              })()}
            </td>
          )}
          {/* Submission Status column (hidden in PUC view) */}
          {!isPucSrjView && (
          <td className="px-3 py-3 min-w-[150px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <InlineTagSelect
                value={getEffectiveValue(lead.id, 'submission_status', lead.submission_status) || ''}
                options={SUBMISSION_STATUSES.map((status) => ({
                  value: status.value,
                  label: status.label,
                  color: "gray",
                }))}
                onChange={(value) => handleSubmissionStatusChange(lead.id, value as SubmissionStatus)}
                disabled={editingSubmissionStatus === lead.id}
                loading={editingSubmissionStatus === lead.id}
                rowVariant={rowVariant}
              />
          </td>
          )}
          {/* PUC Contacted: Intended Major + GPA columns */}
          {isPucContactedView && (
            <>
              <td className="px-3 py-3">
                <span className="text-sm text-[var(--text-secondary)] whitespace-nowrap">
                  {lead.intended_major
                    ? (MAJORS.find(m => m.value === lead.intended_major)?.label ?? lead.intended_major)
                    : <span className="text-xs text-[var(--text-muted)]">&mdash;</span>}
                </span>
              </td>
              <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                {editingGpa?.leadId === lead.id && editingGpa.field === 'expected_gpa' ? (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    autoFocus
                    value={gpaInputValue}
                    onChange={(e) => setGpaInputValue(e.target.value)}
                    onBlur={handleGpaSave}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleGpaSave()
                      if (e.key === 'Escape') setEditingGpa(null)
                    }}
                    className="w-20 text-sm border border-[var(--border)] rounded px-2 py-1 bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                ) : (() => {
                    const val = getEffectiveValue(lead.id, 'expected_gpa', lead.expected_gpa)
                    const hasValue = val != null
                    return (
                      <button
                        className={cn(
                          "group flex items-center gap-1 rounded px-2 py-1 text-sm transition-colors",
                          hasValue
                            ? "text-[var(--text-primary)] hover:bg-[var(--accent-muted)]"
                            : "border border-dashed border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                        )}
                        onClick={() => handleGpaEdit(lead.id, 'expected_gpa', lead.expected_gpa ?? undefined)}
                      >
                        {hasValue ? `${val}%` : <><Pencil className="w-3 h-3" /><span>Add</span></>}
                      </button>
                    )
                  })()}
              </td>
              <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                {editingGpa?.leadId === lead.id && editingGpa.field === 'actual_gpa' ? (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    autoFocus
                    value={gpaInputValue}
                    onChange={(e) => setGpaInputValue(e.target.value)}
                    onBlur={handleGpaSave}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleGpaSave()
                      if (e.key === 'Escape') setEditingGpa(null)
                    }}
                    className="w-20 text-sm border border-[var(--border)] rounded px-2 py-1 bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                ) : (() => {
                    const val = getEffectiveValue(lead.id, 'actual_gpa', lead.actual_gpa)
                    const hasValue = val != null
                    return (
                      <button
                        className={cn(
                          "group flex items-center gap-1 rounded px-2 py-1 text-sm transition-colors",
                          hasValue
                            ? "text-[var(--text-primary)] hover:bg-[var(--accent-muted)]"
                            : "border border-dashed border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                        )}
                        onClick={() => handleGpaEdit(lead.id, 'actual_gpa', lead.actual_gpa ?? undefined)}
                      >
                        {hasValue ? `${val}%` : <><Pencil className="w-3 h-3" /><span>Add</span></>}
                      </button>
                    )
                  })()}
              </td>
            </>
          )}
          {/* Agent column - hidden in PUC Contacted view */}
          {!isPucContactedView && (
          <td className="px-3 py-3">
            <div className="flex items-center gap-2">
              {lead.assigned_agent ? (
                <>
                  <span className="text-sm text-[var(--text-secondary)] whitespace-nowrap">
                    {lead.assigned_agent.full_name}
                  </span>
                </>
              ) : (
                <span className="text-xs text-[var(--text-muted)]">&mdash;</span>
              )}
            </div>
          </td>
          )}
        </>
      ) : isLostView ? (
        <>
          {/* Lost At stage */}
          <td className="px-3 py-3 overflow-hidden">
            {(() => {
              const lostAtStage = lead.lost_at_stage
              const stageInfo = lostAtStage ? PIPELINE_STAGES.find(s => s.value === lostAtStage) : null
              return stageInfo ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--bg-sunken)] text-[var(--text-secondary)] border border-[var(--border)]">
                  {stageInfo.label}
                </span>
              ) : (
                <span className="text-xs text-[var(--text-muted)]">&mdash;</span>
              )
            })()}
          </td>
          {/* Lost Reason */}
          <td className="px-3 py-3 overflow-hidden">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                {lead.lost_reason?.reason_en || <span className="text-[var(--text-muted)]">&mdash;</span>}
              </span>
              {lead.lost_reason_notes && (
                <span className="text-[10px] text-[var(--text-muted)] italic truncate max-w-[160px]" title={lead.lost_reason_notes}>
                  {lead.lost_reason_notes}
                </span>
              )}
            </div>
          </td>
          {/* Status */}
          <td className="px-3 py-3 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const isSelfFunded = lead.funding_type === 'self_funded'
              const availableStatuses = LEAD_STATUSES
                .filter(s => !APPLICANT_ONLY_STATUSES.includes(s.value))
                .filter(s => s.value !== 'pay_later' || isSelfFunded)

              return (
                <InlineTagSelect
                  value={getEffectiveValue(lead.id, 'status', lead.status) || ''}
                  options={availableStatuses.map((status) => ({
                    value: status.value,
                    label: status.label,
                    color: "gray",
                  }))}
                  onChange={(value) => handleStatusChange(lead.id, value as LeadStatus)}
                  disabled={editingStatus === lead.id}
                  loading={editingStatus === lead.id}
                />
              )
            })()}
          </td>
          {/* School */}
          <td className="px-3 py-3 overflow-hidden">
            <InlineTagSelect
              value={getEffectiveValue(lead.id, 'school', lead.school) || ""}
              options={SCHOOLS.map((school) => ({
                value: school.value,
                label: school.label,
                color: "gray",
              }))}
              onChange={(value) => handleSchoolChange(lead.id, value)}
              disabled={editingSchool === lead.id}
              loading={editingSchool === lead.id}
            />
          </td>
        </>
      ) : isWithdrawView ? (
        <>
          {/* Stage column */}
          <td className="px-3 py-3 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <InlineTagSelect
              value={lead.pipeline_stage}
              options={PIPELINE_STAGES.filter((stage) => stage.value !== 'lost').map((stage) => ({
                value: stage.value,
                label: stage.label,
                color: stage.value,
              }))}
              onChange={(value) => handleStageChange(lead.id, value as PipelineStage)}
              disabled={editingStage === lead.id}
              loading={editingStage === lead.id}
            />
          </td>
          {/* Reason column */}
          <td className="px-3 py-3 overflow-hidden">
            {(() => {
              const WITHDRAWAL_REASON_LABELS: Record<string, string> = {
                payment_issue: "Payment Issue",
                far_away: "Far Away",
                language_issues: "Language Issues",
                academic_reason: "Academic Reason",
                accepted_second_choice: "Second Choice",
                personal_reasons: "Personal Reasons",
                medical_travel_abroad: "Medical Travel",
                traveling: "Traveling",
                studying_abroad: "Studying Abroad",
                competitor_acm: "ACM", competitor_aum: "AUM", competitor_auk: "AUK",
                competitor_gust: "GUST", competitor_paaet: "PAAET", competitor_ku: "KU",
                competitor_kilaw: "KILAW", competitor_iuk: "IUK", competitor_cat: "CAT",
                competitor_kcst: "KCST", competitor_cck: "CCK", competitor_aou: "AOU",
                competitor_aiu: "AIU", competitor_au: "AU", competitor_boxhill: "BOXHILL",
                military: "Military", police: "Police", fire_force: "Fire Force",
                army: "Army", national_guard: "National Guard",
              }
              const reason = getEffectiveValue(lead.id, 'withdrawal_reason', lead.withdrawal_reason)
              const label = reason ? WITHDRAWAL_REASON_LABELS[reason] || reason.replace(/_/g, ' ') : null
              return label ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onEditWithdrawReason?.(lead) }}
                  className="inline-flex items-center px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium dark:bg-red-950/30 dark:border-red-800 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                >
                  {label}
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onEditWithdrawReason?.(lead) }}
                  className="text-xs text-[var(--text-muted)] hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 px-2.5 py-1 rounded-lg border border-transparent hover:border-amber-300 transition-colors cursor-pointer"
                >
                  + Add reason
                </button>
              )
            })()}
          </td>
          {/* Agent column */}
          <td className="px-3 py-3">
            <div className="flex items-center gap-2">
              {lead.assigned_agent ? (
                <>
                  <span className="text-sm text-[var(--text-secondary)] whitespace-nowrap">
                    {lead.assigned_agent.full_name}
                  </span>
                </>
              ) : (
                <span className="text-xs text-[var(--text-muted)]">&mdash;</span>
              )}
            </div>
          </td>
        </>
      ) : (
        <>
          <td className="px-3 py-3 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const currentStage = getEffectiveValue(lead.id, 'pipeline_stage', lead.pipeline_stage) as PipelineStage
              const isStageLocked = LOCKED_STAGES.includes(currentStage)
              const stageInfo = PIPELINE_STAGES.find(s => s.value === currentStage)

              if (isStageLocked && stageInfo) {
                return (
                  <SimpleTooltip content="This stage is locked and cannot be changed">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
                      <Lock className="w-3 h-3 text-[var(--text-muted)]" />
                      <span className="text-xs font-medium text-[var(--text-secondary)]">{stageInfo.label}</span>
                    </div>
                  </SimpleTooltip>
                )
              }

              return (
                <InlineTagSelect
                  value={currentStage}
                  options={PIPELINE_STAGES.filter((stage) => stage.value !== 'lost').map((stage) => ({
                    value: stage.value,
                    label: stage.label,
                    color: stage.value,
                  }))}
                  onChange={(value) => handleStageChange(lead.id, value as PipelineStage)}
                  disabled={editingStage === lead.id}
                  loading={editingStage === lead.id}
                />
              )
            })()}
          </td>
          <td className="px-3 py-3 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const effectiveStage = getEffectiveValue(lead.id, 'pipeline_stage', lead.pipeline_stage)

              // Filter statuses based on stage
              const STAGE_STATUSES: Record<PipelineStage, LeadStatus[] | 'all' | 'none'> = {
                new: 'none',
                contacted: ['no_answer', 'switched_off', 'interested', 'not_interested', 'high_gpa', 'wrong_number', 'will_see', 'pay_later'],
                visit: ['no_answer', 'cant_reach', 'interested', 'not_interested', 'pay_later'],
                test: ['online', 'on_campus'],
                application: ['no_answer', 'switched_off', 'interested', 'not_interested', 'high_gpa', 'wrong_number', 'will_see', 'pay_later'],
                lost: 'all',
                applicant: ['no_answer', 'cant_reach', 'informed', 'travelling', 'might_withdraw', 'pay_later'],
                enrolled: 'none',
                withdraw: 'all',
                puc_document_submission: ['no_answer', 'cant_reach', 'interested', 'not_interested', 'will_see'],
                puc_application_submission: ['applied', 'blocked_ku', 'blocked_paaet', 'blocked_abroad', 'blocked_aasu', 'blocked_paci', 'blocked_puc', 'blocked_other'],
              }
              const stageConfig = effectiveStage ? STAGE_STATUSES[effectiveStage as PipelineStage] : 'all'
              const isStatusDisabled = stageConfig === 'none'
              const isSelfFunded = lead.funding_type === 'self_funded'
              const leadStatus = getEffectiveValue(lead.id, 'status', lead.status)
              const availableStatuses = (stageConfig === 'none'
                ? []
                : stageConfig === 'all'
                ? LEAD_STATUSES.filter(s => !APPLICANT_ONLY_STATUSES.includes(s.value))
                : LEAD_STATUSES.filter(s => (stageConfig as LeadStatus[]).includes(s.value))
              ).filter(s => s.value !== 'pay_later' || isSelfFunded)

              // Include the lead's current status in options even if it's not in the stage's default list
              const strictStages: PipelineStage[] = ['test']
              if (leadStatus && !availableStatuses.find(s => s.value === leadStatus) && !strictStages.includes(effectiveStage as PipelineStage)) {
                const currentStatusDef = LEAD_STATUSES.find(s => s.value === leadStatus)
                if (currentStatusDef) {
                  availableStatuses.unshift(currentStatusDef)
                }
              }

              return isStatusDisabled ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)]">
                  <span className="text-xs">&mdash;</span>
                </div>
              ) : (
                <InlineTagSelect
                  value={getEffectiveValue(lead.id, 'status', lead.status) || ''}
                  options={availableStatuses.map((status) => ({
                    value: status.value,
                    label: status.label,
                    color: "gray",
                  }))}
                  onChange={(value) => handleStatusChange(lead.id, value as LeadStatus)}
                  disabled={editingStatus === lead.id}
                  loading={editingStatus === lead.id}
                />
              )
            })()}
          </td>
          <td className="px-3 py-3">
            <InlineTagSelect
              value={getEffectiveValue(lead.id, 'school', lead.school) || ""}
              options={SCHOOLS.map((school) => ({
                value: school.value,
                label: school.label,
                color: "gray",
              }))}
              onChange={(value) => handleSchoolChange(lead.id, value)}
              disabled={editingSchool === lead.id}
              loading={editingSchool === lead.id}
            />
          </td>
          <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
            {editingGpa?.leadId === lead.id && editingGpa.field === 'expected_gpa' ? (
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                autoFocus
                value={gpaInputValue}
                onChange={(e) => setGpaInputValue(e.target.value)}
                onBlur={handleGpaSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGpaSave()
                  if (e.key === 'Escape') setEditingGpa(null)
                }}
                className="w-20 text-sm border border-[var(--border)] rounded px-2 py-1 bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            ) : (() => {
                const val = getEffectiveValue(lead.id, 'expected_gpa', lead.expected_gpa)
                const hasValue = val != null
                return (
                  <button
                    className={cn(
                      "group flex items-center gap-1 rounded px-2 py-1 text-sm transition-colors",
                      hasValue
                        ? "text-[var(--text-primary)] hover:bg-[var(--accent-muted)]"
                        : "border border-dashed border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                    )}
                    onClick={() => handleGpaEdit(lead.id, 'expected_gpa', lead.expected_gpa ?? undefined)}
                  >
                    {hasValue ? `${val}%` : <><Pencil className="w-3 h-3" /><span>Add</span></>}
                  </button>
                )
              })()}
          </td>
          <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
            {editingGpa?.leadId === lead.id && editingGpa.field === 'actual_gpa' ? (
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                autoFocus
                value={gpaInputValue}
                onChange={(e) => setGpaInputValue(e.target.value)}
                onBlur={handleGpaSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGpaSave()
                  if (e.key === 'Escape') setEditingGpa(null)
                }}
                className="w-20 text-sm border border-[var(--border)] rounded px-2 py-1 bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            ) : (() => {
                const val = getEffectiveValue(lead.id, 'actual_gpa', lead.actual_gpa)
                const hasValue = val != null
                return (
                  <button
                    className={cn(
                      "group flex items-center gap-1 rounded px-2 py-1 text-sm transition-colors",
                      hasValue
                        ? "text-[var(--text-primary)] hover:bg-[var(--accent-muted)]"
                        : "border border-dashed border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                    )}
                    onClick={() => handleGpaEdit(lead.id, 'actual_gpa', lead.actual_gpa ?? undefined)}
                  >
                    {hasValue ? `${val}%` : <><Pencil className="w-3 h-3" /><span>Add</span></>}
                  </button>
                )
              })()}
          </td>
        </>
      )}
      <td className="px-3 py-3 min-w-[130px] sticky right-0 z-10 bg-inherit">
        <div className="flex items-center gap-1">
          {lead.funding_type === 'puc' && ['puc_document_submission', 'puc_application_submission', 'applicant', 'enrolled', 'withdraw'].includes(lead.pipeline_stage) && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="group/btn hover:bg-purple-50"
              onClick={handleOpenPspWizard}
              title="Open PSP Wizard"
            >
              <Wand2 className="w-4 h-4 text-purple-400/70 group-hover/btn:!text-purple-600" />
            </Button>
          )}
          <LeadAppointmentsPopover
            lead={lead}
            onBookNew={handleBookNew}
            onAppointmentClick={(apt) => setViewingAppointment(apt)}
          />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              className="group/btn hover:bg-green-50"
              onClick={handleScheduleCallback}
              title="Schedule callback"
            >
              <PhoneForwarded className="w-4 h-4 text-green-400/70 group-hover/btn:!text-green-600" />
            </Button>
            {lead.pipeline_stage === 'lost' ? (
              <SimpleTooltip
                content={
                  <div className="text-xs space-y-1">
                    <div className="font-medium">Lost Reason</div>
                    <div>{lead.lost_reason?.reason_en || 'No reason specified'}</div>
                    {lead.lost_reason_notes && (
                      <div className="text-[var(--text-muted)] italic">{lead.lost_reason_notes}</div>
                    )}
                  </div>
                }
              >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="group/btn hover:bg-[var(--error-bg)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <XCircle className="w-4 h-4 text-red-400 group-hover/btn:!text-red-600" />
                </Button>
              </SimpleTooltip>
            ) : (
              <Button
                variant="ghost"
                size="icon-sm"
                className="group/btn hover:bg-[var(--error-bg)]"
                onClick={handleMarkLost}
                title="Mark as lost"
              >
                <XCircle className="w-4 h-4 text-red-300 group-hover/btn:!text-red-600" />
              </Button>
            )}
          </div>
        </div>
      </td>
    </motion.tr>
  )
})
