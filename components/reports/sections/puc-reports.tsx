"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressRing } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Award,
  Users,
  CheckCircle2,
  XCircle,
  FolderOpen,
  FileText,
  Send,
  CreditCard,
  RefreshCw,
  TrendingDown,
  ArrowDown,
  Shield,
  Accessibility,
  Star,
  CalendarDays,
  Radio,
  UserCheck,
  Lock,
  Info,
  Target,
  ClipboardList,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { queryKeys } from "@/lib/hooks/query-keys"
import { MAJORS, LEAD_SOURCES } from "@/types"
import type { PUCReportData, PUCDailySubmission, PUCDailySourceRow, PUCAgentDailyRow, PUCAppliedStudentRow, PUCTargetAchievementData, PUCDocumentStatusBreakdown, PUCDocumentChecklist } from "@/lib/hooks/use-reports"
import type { IntendedMajor } from "@/types"

type PUCSubTab = "overview" | "daily" | "applied-students" | "preferences" | "sources" | "agent-daily" | "targets"

interface PUCPeriodInfo {
  periodId: string
  periodName: string
  startDate: string
  endDate: string
  isFrozen: boolean
  isArchived: boolean
}

interface PUCReportsProps {
  data: PUCReportData
  periodInfo?: PUCPeriodInfo | null
}

// Preference change shape from API
interface PUCPreferenceChange {
  id: string
  leadId: string
  leadName: string
  field: string
  oldValue: string | null
  newValue: string | null
  changedAt: string
  changedBy: string | null
  changedByName: string
}

export function PUCReports({ data, periodInfo }: PUCReportsProps) {
  const [subTab, setSubTab] = useState<PUCSubTab>("overview")
  const stats = [
    {
      title: "Total Applied",
      value: data.totalApplied,
      icon: Users,
      colorClass: "bg-[var(--primary)]"
    },
    {
      title: "Accepted",
      value: data.accepted,
      icon: CheckCircle2,
      colorClass: "bg-[var(--success)]"
    },
    {
      title: "Rejected",
      value: data.rejected,
      icon: XCircle,
      colorClass: "bg-[var(--error)]"
    },
    {
      title: "Second Choice",
      value: data.accepted2ndChoice,
      icon: Star,
      colorClass: "bg-amber-500"
    },
    {
      title: "Diplomatics",
      value: data.diplomaticCount,
      icon: Shield,
      colorClass: "bg-[var(--accent)]"
    },
    {
      title: "Special Needs",
      value: data.specialNeedsCount,
      icon: Accessibility,
      colorClass: "bg-[var(--info)]"
    },
  ]

  const subTabs: { key: PUCSubTab; label: string; icon: typeof Users }[] = [
    { key: "overview", label: "Overview", icon: Users },
    { key: "daily", label: "Daily Submissions", icon: CalendarDays },
    { key: "applied-students", label: "Applied Students", icon: ClipboardList },
    { key: "preferences", label: "Change Preferences", icon: RefreshCw },
    { key: "sources", label: "Daily Sources", icon: Radio },
    { key: "agent-daily", label: "Agent Performance", icon: UserCheck },
    { key: "targets", label: "Target Achievement", icon: Target },
  ]

  return (
    <div className="space-y-6">
      {/* PUC Period Banner */}
      {periodInfo && (
        <div className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg border",
          periodInfo.isFrozen
            ? "bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800"
            : periodInfo.isArchived
            ? "bg-gray-50 border-gray-200 dark:bg-gray-900/10 dark:border-gray-800"
            : "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800"
        )}>
          {periodInfo.isFrozen ? (
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              PUC Period: {periodInfo.periodName}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {formatDate(periodInfo.startDate)} — {formatDate(periodInfo.endDate)}
            </p>
          </div>
          <Badge className={cn(
            "text-xs shrink-0",
            periodInfo.isFrozen
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              : periodInfo.isArchived
              ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          )}>
            {periodInfo.isFrozen ? "Frozen — Historical Snapshot" : periodInfo.isArchived ? "Archived" : "Active"}
          </Badge>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-sunken)] w-fit overflow-x-auto">
        {subTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSubTab(tab.key)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap",
              subTab === tab.key
                ? "bg-white dark:bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === "daily" && <PUCDailySubmissions data={data} />}
      {subTab === "applied-students" && <PUCDailyAppliedStudents data={data.dailyAppliedStudents} />}
      {subTab === "preferences" && <PUCPreferenceChanges periodInfo={periodInfo} />}
      {subTab === "sources" && <PUCDailySources data={data.dailySources} />}
      {subTab === "agent-daily" && <PUCAgentDaily data={data.agentDaily} />}
      {subTab === "targets" && <PUCTargetAchievement data={data.targetAchievement} />}

      {subTab === "overview" && <>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card hover glow className="h-full">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 rounded-xl ${stat.colorClass} shadow-sm`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Document Status Breakdown & Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[var(--info)]" />
                Document Status
              </CardTitle>
              <CardDescription>Status of PUC documents for file-stage leads</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const ds = data.documentStatusBreakdown
                const total = ds.ready_to_apply + ds.pending_payment + ds.missing_document + ds.not_set
                const items = [
                  { label: 'Ready to Apply', value: ds.ready_to_apply, color: 'var(--success)', bg: 'var(--success-bg)' },
                  { label: 'Pending Payment', value: ds.pending_payment, color: 'var(--warning)', bg: 'var(--warning-bg)' },
                  { label: 'Missing Document', value: ds.missing_document, color: 'var(--error)', bg: 'var(--error-bg)' },
                  { label: 'Not Set', value: ds.not_set, color: 'var(--text-muted)', bg: 'var(--bg-sunken)' },
                ]
                return (
                  <div className="space-y-3">
                    {/* Horizontal bar */}
                    {total > 0 && (
                      <div className="flex h-4 rounded-full overflow-hidden bg-[var(--bg-sunken)]">
                        {items.filter(i => i.value > 0).map((item) => (
                          <div
                            key={item.label}
                            className="h-full transition-all duration-500"
                            style={{ width: `${(item.value / total) * 100}%`, backgroundColor: item.color }}
                            title={`${item.label}: ${item.value}`}
                          />
                        ))}
                      </div>
                    )}
                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-3">
                      {items.map((item) => (
                        <div key={item.label} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: item.bg }}>
                          <span className="text-sm text-[var(--text-secondary)]">{item.label}</span>
                          <span className="text-lg font-bold" style={{ color: item.color }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </motion.div>

        {/* Document Checklist Completion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.38 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[var(--accent)]" />
                Document Checklist
              </CardTitle>
              <CardDescription>
                How many PUC students have submitted each document ({data.documentChecklist.total} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.documentChecklist.total === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-[var(--text-muted)]">
                  <ClipboardList className="w-8 h-8 opacity-30" />
                  <p className="text-sm">No PUC students in selected period</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {[
                    { label: 'High School Certificate', key: 'high_school_certificate' as const },
                    { label: 'Civil ID', key: 'civil_id' as const },
                    { label: 'Parent Civil ID', key: 'parent_civil_id' as const },
                    { label: 'Passport', key: 'passport' as const },
                    { label: 'Nationality Document', key: 'nationality_document' as const },
                    { label: 'Payment Receipt', key: 'payment_receipt' as const },
                    { label: 'Acceptance Letter', key: 'acceptance_letter' as const },
                    { label: 'PUC Fee Paid', key: 'fee_paid' as const },
                  ].map((doc) => {
                    const count = data.documentChecklist[doc.key]
                    const total = data.documentChecklist.total
                    const pct = Math.round((count / total) * 100)
                    return (
                      <div key={doc.key} className="flex items-center gap-3">
                        <span className="text-sm text-[var(--text-secondary)] w-40 shrink-0">{doc.label}</span>
                        <div className="flex-1 h-2 rounded-full bg-[var(--bg-sunken)] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--error)',
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-[var(--text-primary)] w-16 text-right">
                          {count}/{total}
                        </span>
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full w-12 text-center",
                          pct >= 80 ? 'bg-[var(--success-bg)] text-[var(--success)]' :
                          pct >= 50 ? 'bg-[var(--warning-bg)] text-[var(--warning)]' :
                          'bg-[var(--error-bg)] text-[var(--error)]'
                        )}>
                          {pct}%
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Conversion Rate & Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[var(--primary)]" />
                PUC Conversion Rate
              </CardTitle>
              <CardDescription>Acceptance rate for PUC applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <ProgressRing
                  value={data.conversionRate}
                  max={100}
                  size={180}
                  strokeWidth={16}
                  showValue
                />
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 rounded-lg bg-[var(--success-bg)]">
                  <p className="text-2xl font-bold text-[var(--success)]">{data.accepted}</p>
                  <p className="text-xs text-[var(--text-muted)]">Accepted</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-[var(--warning-bg)]">
                  <p className="text-2xl font-bold text-[var(--warning)]">{data.accepted2ndChoice}</p>
                  <p className="text-xs text-[var(--text-muted)]">Accepted 2nd Choice</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-[var(--error-bg)]">
                  <p className="text-2xl font-bold text-[var(--error)]">{data.rejected}</p>
                  <p className="text-xs text-[var(--text-muted)]">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* PUC Pipeline Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[var(--accent)]" />
                PUC Pipeline Breakdown
              </CardTitle>
              <CardDescription>File opening, submissions & fee payment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Files Opened', labelAr: 'فتح ملف', value: data.filesOpened, icon: FolderOpen, color: 'var(--primary)' },
                { label: 'Documents Submitted', labelAr: 'تسليم مستندات', value: data.documentsSubmitted, icon: FileText, color: 'var(--info)' },
                { label: 'Fee Paid (10 KD)', labelAr: 'دفع رسوم البعثات', value: data.feePaid, icon: CreditCard, color: 'var(--success)' },
                { label: 'Application Submitted', labelAr: 'قدم طلب', value: data.applicationSubmitted, icon: Send, color: 'var(--accent)' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-sunken)]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${item.color} 15%, transparent)` }}>
                      <item.icon className="w-4 h-4" style={{ color: item.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{item.label}</p>
                      <p className="text-xs text-[var(--text-muted)]">{item.labelAr}</p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-[var(--text-primary)]">{item.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Where They Get Lost */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.55 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-[var(--error)]" />
              Where They Get Lost
            </CardTitle>
            <CardDescription>Drop-off between each pipeline stage</CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const stages = [
                { label: 'Files Opened', value: data.filesOpened },
                { label: 'Documents Submitted', value: data.documentsSubmitted },
                { label: 'Fee Paid', value: data.feePaid },
                { label: 'Application Submitted', value: data.applicationSubmitted },
              ]
              const dropoffs = stages.slice(0, -1).map((stage, i) => {
                const next = stages[i + 1]
                const lost = stage.value - next.value
                const pct = stage.value > 0 ? Math.round((lost / stage.value) * 100) : 0
                return { from: stage.label, to: next.label, lost, pct, fromValue: stage.value, toValue: next.value }
              })
              const maxLost = Math.max(...dropoffs.map(d => d.lost), 1)

              return (
                <div className="space-y-4">
                  {dropoffs.map((d) => (
                    <div key={d.from} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                          <span className="font-medium text-[var(--text-primary)]">{d.from}</span>
                          <ArrowDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <span className="font-medium text-[var(--text-primary)]">{d.to}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[var(--error)] font-semibold">-{d.lost}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            d.pct >= 50
                              ? 'bg-[var(--error-bg)] text-[var(--error)]'
                              : d.pct >= 25
                              ? 'bg-[var(--warning-bg)] text-[var(--warning)]'
                              : 'bg-[var(--success-bg)] text-[var(--success)]'
                          }`}>
                            {d.pct}% lost
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--bg-sunken)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${maxLost > 0 ? (d.lost / maxLost) * 100 : 0}%`,
                            backgroundColor: d.pct >= 50 ? 'var(--error)' : d.pct >= 25 ? 'var(--warning)' : 'var(--success)',
                            opacity: 0.7,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-[var(--text-muted)]">
                        <span>{d.fromValue} students</span>
                        <span>{d.toValue} continued</span>
                      </div>
                    </div>
                  ))}

                  {/* Total loss summary */}
                  <div className="mt-4 pt-4 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[var(--text-secondary)]">Total pipeline loss</span>
                      <div className="text-right">
                        <span className="text-lg font-bold text-[var(--error)]">
                          {data.filesOpened - data.applicationSubmitted}
                        </span>
                        <span className="text-sm text-[var(--text-muted)] ml-2">
                          ({data.filesOpened > 0 ? Math.round(((data.filesOpened - data.applicationSubmitted) / data.filesOpened) * 100) : 0}% of {data.filesOpened})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      </motion.div>

      {/* Converted to Self-Funded — per agent table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-[var(--info)]" />
              Converted to Self-Funded
            </CardTitle>
            <CardDescription>
              Leads auto-converted to self-funded due to GPA below 70% — breakdown per agent
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.convertedToSFByAgent.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pr-4">#</th>
                    <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pr-4">Agent</th>
                    <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Converted</th>
                    <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">% of Total</th>
                    <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pl-4 w-40">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {data.convertedToSFByAgent.map((agent, index) => (
                    <tr key={agent.agentId} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-sunken)] transition-colors">
                      <td className="py-3 pr-4">
                        <span className="text-sm font-bold text-[var(--text-muted)]">{index + 1}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={agent.avatarUrl || undefined} />
                            <AvatarFallback className="text-xs">{getInitials(agent.agentName)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-[var(--text-primary)]">{agent.agentName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-sm font-bold text-[var(--info)]">{agent.count}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">{agent.percent}%</span>
                      </td>
                      <td className="py-3 pl-4">
                        <div className="w-full h-2 rounded-full bg-[var(--bg-sunken)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[var(--info)] transition-all duration-500"
                            style={{ width: `${agent.percent}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[var(--border)]">
                    <td colSpan={2} className="py-3 pr-4 text-sm font-semibold text-[var(--text-secondary)]">Total</td>
                    <td className="py-3 px-3 text-center text-sm font-bold text-[var(--text-primary)]">{data.convertedToSF}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-[var(--text-muted)]">
                <RefreshCw className="w-8 h-8 opacity-30" />
                <p className="text-sm">No conversions in selected period</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* PUC Process Info */}
      </>}
    </div>
  )
}

// =============================
// HELPER
// =============================

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatDateLong(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function CellValue({ value, color }: { value: number; color: string }) {
  if (value === 0) return <span className="text-sm text-[var(--text-muted)]">—</span>
  return (
    <span
      className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-sm font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {value}
    </span>
  )
}

function CellValueSmall({ value, color }: { value: number; color: string }) {
  if (value === 0) return <span className="text-xs text-[var(--text-muted)]">—</span>
  return (
    <span
      className="inline-flex items-center justify-center min-w-[22px] px-1.5 py-0 rounded-full text-xs font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {value}
    </span>
  )
}

const MAJOR_LABELS: Record<IntendedMajor, string> = {
  cyber_security: 'Cyber',
  cis: 'CIS',
  marketing: 'Mkt',
  accounting: 'Acct',
  network_security: 'NetSec',
  other: 'Other',
}

// =============================
// DAILY SUBMISSIONS (ENHANCED)
// =============================

function PUCDailySubmissions({ data }: { data: PUCReportData }) {
  const days = data.dailySubmissions
  const hasData = days.some(d => d.dailyTotal > 0)

  // Totals row
  const totals = days.reduce(
    (acc, d) => ({
      filesOpened: acc.filesOpened + d.filesOpened,
      documentsSubmitted: acc.documentsSubmitted + d.documentsSubmitted,
      applicationSubmitted: acc.applicationSubmitted + d.applicationSubmitted,
      feePaid: acc.feePaid + d.feePaid,
      maleCount: acc.maleCount + d.maleCount,
      femaleCount: acc.femaleCount + d.femaleCount,
      dailyTotal: acc.dailyTotal + d.dailyTotal,
      majorBreakdown: Object.keys(acc.majorBreakdown).reduce((mb, key) => {
        const k = key as IntendedMajor
        mb[k] = acc.majorBreakdown[k] + (d.majorBreakdown[k] || 0)
        return mb
      }, {} as Record<IntendedMajor, number>),
    }),
    {
      filesOpened: 0, documentsSubmitted: 0, applicationSubmitted: 0, feePaid: 0,
      maleCount: 0, femaleCount: 0, dailyTotal: 0,
      majorBreakdown: { cyber_security: 0, cis: 0, marketing: 0, accounting: 0, network_security: 0, other: 0 } as Record<IntendedMajor, number>,
    }
  )

  const majorKeys = Object.keys(MAJOR_LABELS) as IntendedMajor[]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[var(--primary)]" />
            Day-by-Day PUC Submissions
          </CardTitle>
          <CardDescription>Daily breakdown of PUC pipeline progress, gender, and majors</CardDescription>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-[var(--text-muted)]">
              <CalendarDays className="w-8 h-8 opacity-30" />
              <p className="text-sm">No submissions in selected period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pr-4 sticky left-0 bg-white dark:bg-[var(--bg-primary)] z-10">Date</th>
                    <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-2">
                      <div className="flex items-center justify-center gap-1">
                        <FolderOpen className="w-3 h-3" />Files
                      </div>
                    </th>
                    <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-2">
                      <div className="flex items-center justify-center gap-1">
                        <FileText className="w-3 h-3" />Docs
                      </div>
                    </th>
                    <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-2">
                      <div className="flex items-center justify-center gap-1">
                        <CreditCard className="w-3 h-3" />Fee
                      </div>
                    </th>
                    <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-2">
                      <div className="flex items-center justify-center gap-1">
                        <Send className="w-3 h-3" />App
                      </div>
                    </th>
                    <th className="text-center text-xs font-semibold text-blue-500 uppercase tracking-wide py-3 px-2 border-l border-[var(--border)]">Male</th>
                    <th className="text-center text-xs font-semibold text-pink-500 uppercase tracking-wide py-3 px-2">Female</th>
                    <th className="text-center text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wide py-3 px-2">Total</th>
                    {majorKeys.map(key => (
                      <th key={key} className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-2 border-l border-[var(--border)] first:border-l">
                        {MAJOR_LABELS[key]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => {
                    const isEmpty = day.dailyTotal === 0
                    return (
                      <tr
                        key={day.date}
                        className={cn(
                          "border-b border-[var(--border)] last:border-0 transition-colors",
                          isEmpty ? "opacity-40" : "hover:bg-[var(--bg-sunken)]"
                        )}
                      >
                        <td className="py-2.5 pr-4 sticky left-0 bg-white dark:bg-[var(--bg-primary)] z-10">
                          <span className="text-sm font-medium text-[var(--text-primary)]">{formatDate(day.date)}</span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <CellValue value={day.filesOpened} color="var(--primary)" />
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <CellValue value={day.documentsSubmitted} color="var(--info)" />
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <CellValue value={day.feePaid} color="var(--success)" />
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <CellValue value={day.applicationSubmitted} color="var(--accent)" />
                        </td>
                        <td className="py-2.5 px-2 text-center border-l border-[var(--border)]">
                          <CellValueSmall value={day.maleCount} color="#3b82f6" />
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <CellValueSmall value={day.femaleCount} color="#ec4899" />
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {day.dailyTotal > 0 ? (
                            <span className="text-sm font-bold text-[var(--text-primary)]">{day.dailyTotal}</span>
                          ) : (
                            <span className="text-sm text-[var(--text-muted)]">—</span>
                          )}
                        </td>
                        {majorKeys.map(key => (
                          <td key={key} className="py-2.5 px-2 text-center border-l border-[var(--border)]">
                            <CellValueSmall value={day.majorBreakdown[key] || 0} color="var(--primary)" />
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[var(--border)]">
                    <td className="py-3 pr-4 text-sm font-bold text-[var(--text-primary)] sticky left-0 bg-white dark:bg-[var(--bg-primary)] z-10">Total</td>
                    <td className="py-3 px-2 text-center text-sm font-bold text-[var(--primary)]">{totals.filesOpened}</td>
                    <td className="py-3 px-2 text-center text-sm font-bold text-[var(--info)]">{totals.documentsSubmitted}</td>
                    <td className="py-3 px-2 text-center text-sm font-bold text-[var(--success)]">{totals.feePaid}</td>
                    <td className="py-3 px-2 text-center text-sm font-bold text-[var(--accent)]">{totals.applicationSubmitted}</td>
                    <td className="py-3 px-2 text-center text-sm font-bold text-blue-500 border-l border-[var(--border)]">{totals.maleCount}</td>
                    <td className="py-3 px-2 text-center text-sm font-bold text-pink-500">{totals.femaleCount}</td>
                    <td className="py-3 px-2 text-center text-sm font-bold text-[var(--text-primary)]">{totals.dailyTotal}</td>
                    {majorKeys.map(key => (
                      <td key={key} className="py-3 px-2 text-center text-sm font-bold text-[var(--primary)] border-l border-[var(--border)]">{totals.majorBreakdown[key]}</td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// =============================
// CHANGE PREFERENCES
// =============================

function PUCPreferenceChanges({ periodInfo }: { periodInfo?: PUCPeriodInfo | null }) {
  const startDate = periodInfo?.startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const endDate = periodInfo?.endDate || new Date().toISOString().split('T')[0]

  const { data: changes, isLoading } = useQuery({
    queryKey: queryKeys.pucPreferenceChanges.list({ startDate, endDate }),
    queryFn: async () => {
      const res = await fetch(`/api/reports/puc-preference-changes?start_date=${startDate}&end_date=${endDate}`)
      if (!res.ok) throw new Error("Failed to fetch preference changes")
      return res.json() as Promise<PUCPreferenceChange[]>
    },
  })

  const fieldLabels: Record<string, string> = {
    intended_major: 'Intended Major',
    preferred_major: 'Preferred Major',
  }

  const majorLabel = (value: string | null) => {
    if (!value) return '—'
    const found = MAJORS.find(m => m.value === value)
    return found ? found.label : value
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-[var(--accent)]" />
            Preference Changes
          </CardTitle>
          <CardDescription>Leads who changed their intended or preferred major during the PUC period</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-[var(--text-muted)]">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              Loading changes...
            </div>
          ) : !changes || changes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-[var(--text-muted)]">
              <RefreshCw className="w-8 h-8 opacity-30" />
              <p className="text-sm">No preference changes in selected period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pr-4">Lead</th>
                    <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Field</th>
                    <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">From</th>
                    <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">To</th>
                    <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Changed By</th>
                    <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pl-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {changes.map((change) => (
                    <tr key={change.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-sunken)] transition-colors">
                      <td className="py-3 pr-4">
                        <span className="text-sm font-medium text-[var(--text-primary)]">{change.leadName}</span>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="outline" className="text-xs">
                          {fieldLabels[change.field] || change.field}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm text-[var(--error)]">{majorLabel(change.oldValue)}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm text-[var(--success)]">{majorLabel(change.newValue)}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm text-[var(--text-secondary)]">{change.changedByName}</span>
                      </td>
                      <td className="py-3 pl-3">
                        <span className="text-xs text-[var(--text-muted)]">
                          {new Date(change.changedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 text-xs text-[var(--text-muted)] text-right">
                {changes.length} change{changes.length !== 1 ? 's' : ''} found
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// =============================
// DAILY SOURCES
// =============================

function PUCDailySources({ data }: { data: PUCDailySourceRow[] }) {
  // Find all sources that appear in the data
  const allSources = new Set<string>()
  for (const day of data) {
    for (const src of Object.keys(day.sources)) {
      if (day.sources[src] > 0) allSources.add(src)
    }
  }
  const activeSources = Array.from(allSources)
  const hasData = data.some(d => d.total > 0)

  // Source label lookup
  const sourceLabel = (src: string) => {
    const found = LEAD_SOURCES.find(s => s.value === src)
    return found ? found.label : src
  }

  // Compute totals per source
  const sourceTotals: Record<string, number> = {}
  let grandTotal = 0
  for (const day of data) {
    for (const src of activeSources) {
      sourceTotals[src] = (sourceTotals[src] || 0) + (day.sources[src] || 0)
    }
    grandTotal += day.total
  }

  // Sort sources by total descending
  activeSources.sort((a, b) => (sourceTotals[b] || 0) - (sourceTotals[a] || 0))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-[var(--info)]" />
            Daily Lead Sources
          </CardTitle>
          <CardDescription>Day-by-day breakdown of which sources generate PUC applications</CardDescription>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-[var(--text-muted)]">
              <Radio className="w-8 h-8 opacity-30" />
              <p className="text-sm">No source data in selected period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pr-4 sticky left-0 bg-white dark:bg-[var(--bg-primary)] z-10">Date</th>
                    {activeSources.map(src => (
                      <th key={src} className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-2 whitespace-nowrap">
                        {sourceLabel(src)}
                      </th>
                    ))}
                    <th className="text-center text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wide py-3 px-2 border-l border-[var(--border)]">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((day) => {
                    const isEmpty = day.total === 0
                    return (
                      <tr
                        key={day.date}
                        className={cn(
                          "border-b border-[var(--border)] last:border-0 transition-colors",
                          isEmpty ? "opacity-40" : "hover:bg-[var(--bg-sunken)]"
                        )}
                      >
                        <td className="py-2.5 pr-4 sticky left-0 bg-white dark:bg-[var(--bg-primary)] z-10">
                          <span className="text-sm font-medium text-[var(--text-primary)]">{formatDate(day.date)}</span>
                        </td>
                        {activeSources.map(src => (
                          <td key={src} className="py-2.5 px-2 text-center">
                            <CellValueSmall value={day.sources[src] || 0} color="var(--info)" />
                          </td>
                        ))}
                        <td className="py-2.5 px-2 text-center border-l border-[var(--border)]">
                          {day.total > 0 ? (
                            <span className="text-sm font-bold text-[var(--text-primary)]">{day.total}</span>
                          ) : (
                            <span className="text-sm text-[var(--text-muted)]">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[var(--border)]">
                    <td className="py-3 pr-4 text-sm font-bold text-[var(--text-primary)] sticky left-0 bg-white dark:bg-[var(--bg-primary)] z-10">Total</td>
                    {activeSources.map(src => (
                      <td key={src} className="py-3 px-2 text-center text-sm font-bold text-[var(--info)]">{sourceTotals[src] || 0}</td>
                    ))}
                    <td className="py-3 px-2 text-center text-sm font-bold text-[var(--text-primary)] border-l border-[var(--border)]">{grandTotal}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// =============================
// AGENT PERFORMANCE DAILY
// =============================

function PUCAgentDaily({ data }: { data: PUCAgentDailyRow[] }) {
  const hasData = data.some(d => d.agents.length > 0)

  // Compute agent totals across all days
  const agentTotals: Record<string, { name: string; filesOpened: number; documentsSubmitted: number; applicationSubmitted: number; feePaid: number }> = {}
  for (const day of data) {
    for (const agent of day.agents) {
      if (!agentTotals[agent.agentId]) {
        agentTotals[agent.agentId] = { name: agent.agentName, filesOpened: 0, documentsSubmitted: 0, applicationSubmitted: 0, feePaid: 0 }
      }
      agentTotals[agent.agentId].filesOpened += agent.filesOpened
      agentTotals[agent.agentId].documentsSubmitted += agent.documentsSubmitted
      agentTotals[agent.agentId].applicationSubmitted += agent.applicationSubmitted
      agentTotals[agent.agentId].feePaid += agent.feePaid
    }
  }

  // Get unique agents sorted by total activity
  const uniqueAgents = Object.entries(agentTotals)
    .map(([id, t]) => ({ agentId: id, ...t }))
    .sort((a, b) => (b.filesOpened + b.documentsSubmitted + b.applicationSubmitted) - (a.filesOpened + a.documentsSubmitted + a.applicationSubmitted))

  // Build a lookup map: day -> agentId -> counts
  const dayAgentMap: Record<string, Record<string, { filesOpened: number; documentsSubmitted: number; applicationSubmitted: number; feePaid: number }>> = {}
  for (const day of data) {
    dayAgentMap[day.date] = {}
    for (const agent of day.agents) {
      dayAgentMap[day.date][agent.agentId] = {
        filesOpened: agent.filesOpened,
        documentsSubmitted: agent.documentsSubmitted,
        applicationSubmitted: agent.applicationSubmitted,
        feePaid: agent.feePaid,
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[var(--success)]" />
            Agent Performance Daily
          </CardTitle>
          <CardDescription>Daily agent-level breakdown: Files / Docs / Fee / App</CardDescription>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-[var(--text-muted)]">
              <UserCheck className="w-8 h-8 opacity-30" />
              <p className="text-sm">No agent activity in selected period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pr-4 sticky left-0 bg-white dark:bg-[var(--bg-primary)] z-10">Date</th>
                    {uniqueAgents.map(agent => (
                      <th key={agent.agentId} colSpan={4} className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-1.5 px-1 border-l border-[var(--border)]">
                        {agent.name}
                      </th>
                    ))}
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <th className="sticky left-0 bg-white dark:bg-[var(--bg-primary)] z-10" />
                    {uniqueAgents.map(agent => (
                      <AgentSubHeaders key={agent.agentId} />
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((day) => {
                    const isEmpty = day.agents.length === 0
                    return (
                      <tr
                        key={day.date}
                        className={cn(
                          "border-b border-[var(--border)] last:border-0 transition-colors",
                          isEmpty ? "opacity-40" : "hover:bg-[var(--bg-sunken)]"
                        )}
                      >
                        <td className="py-2.5 pr-4 sticky left-0 bg-white dark:bg-[var(--bg-primary)] z-10">
                          <span className="text-sm font-medium text-[var(--text-primary)]">{formatDate(day.date)}</span>
                        </td>
                        {uniqueAgents.map(agent => {
                          const agentData = dayAgentMap[day.date]?.[agent.agentId]
                          return (
                            <AgentDayCells
                              key={agent.agentId}
                              filesOpened={agentData?.filesOpened || 0}
                              documentsSubmitted={agentData?.documentsSubmitted || 0}
                              applicationSubmitted={agentData?.applicationSubmitted || 0}
                              feePaid={agentData?.feePaid || 0}
                            />
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[var(--border)]">
                    <td className="py-3 pr-4 text-sm font-bold text-[var(--text-primary)] sticky left-0 bg-white dark:bg-[var(--bg-primary)] z-10">Total</td>
                    {uniqueAgents.map(agent => (
                      <AgentDayCells
                        key={agent.agentId}
                        filesOpened={agent.filesOpened}
                        documentsSubmitted={agent.documentsSubmitted}
                        applicationSubmitted={agent.applicationSubmitted}
                        feePaid={agent.feePaid}
                        isBold
                      />
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function AgentSubHeaders() {
  return (
    <>
      <th className="text-center text-[10px] font-medium text-[var(--text-muted)] py-1 px-1 border-l border-[var(--border)]">Files</th>
      <th className="text-center text-[10px] font-medium text-[var(--text-muted)] py-1 px-1">Docs</th>
      <th className="text-center text-[10px] font-medium text-[var(--text-muted)] py-1 px-1">Fee</th>
      <th className="text-center text-[10px] font-medium text-[var(--text-muted)] py-1 px-1">App</th>
    </>
  )
}

function AgentDayCells({ filesOpened, documentsSubmitted, applicationSubmitted, feePaid, isBold }: {
  filesOpened: number
  documentsSubmitted: number
  applicationSubmitted: number
  feePaid: number
  isBold?: boolean
}) {
  if (isBold) {
    return (
      <>
        <td className="py-3 px-1 text-center text-xs font-bold text-[var(--primary)] border-l border-[var(--border)]">{filesOpened}</td>
        <td className="py-3 px-1 text-center text-xs font-bold text-[var(--info)]">{documentsSubmitted}</td>
        <td className="py-3 px-1 text-center text-xs font-bold text-[var(--success)]">{feePaid}</td>
        <td className="py-3 px-1 text-center text-xs font-bold text-[var(--accent)]">{applicationSubmitted}</td>
      </>
    )
  }
  return (
    <>
      <td className="py-2.5 px-1 text-center border-l border-[var(--border)]">
        <CellValueSmall value={filesOpened} color="var(--primary)" />
      </td>
      <td className="py-2.5 px-1 text-center">
        <CellValueSmall value={documentsSubmitted} color="var(--info)" />
      </td>
      <td className="py-2.5 px-1 text-center">
        <CellValueSmall value={feePaid} color="var(--success)" />
      </td>
      <td className="py-2.5 px-1 text-center">
        <CellValueSmall value={applicationSubmitted} color="var(--accent)" />
      </td>
    </>
  )
}

// =============================
// DAILY APPLIED STUDENTS
// =============================

const PAGE_SIZE = 50

const SOURCE_LABELS: Record<string, string> = Object.fromEntries(
  LEAD_SOURCES.map(s => [s.value, s.label])
)

function PUCDailyAppliedStudents({ data }: { data: PUCAppliedStudentRow[] }) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<'date' | 'studentName' | 'source' | 'major' | 'gpa' | 'gender' | 'assignedAgent'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0)

  const filtered = data.filter(row => {
    if (!search) return true
    const q = search.toLowerCase()
    return row.studentName.toLowerCase().includes(q) ||
      row.assignedAgent.toLowerCase().includes(q) ||
      (SOURCE_LABELS[row.source] || row.source).toLowerCase().includes(q)
  })

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    if (sortKey === 'gpa') {
      return ((a.gpa ?? -1) - (b.gpa ?? -1)) * dir
    }
    const av = a[sortKey] || ''
    const bv = b[sortKey] || ''
    return av.localeCompare(bv) * dir
  })

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const pageData = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
    setPage(0)
  }

  const renderSortHeader = (label: string, field: typeof sortKey) => (
    <th
      key={field}
      className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3 cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortKey === field && (
          <span className="text-[10px]">{sortDir === 'asc' ? '▲' : '▼'}</span>
        )}
      </span>
    </th>
  )

  const stageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      application: 'File',
      puc_document_submission: 'Docs',
      puc_application_submission: 'App Submitted',
      applicant: 'Applicant',
      enrolled: 'Enrolled',
    }
    return labels[stage] || stage
  }

  const docStatusLabel = (status: string | null) => {
    if (!status) return '—'
    const labels: Record<string, { text: string; color: string }> = {
      ready_to_apply: { text: 'Ready', color: 'var(--success)' },
      pending_payment: { text: 'Pending Pay', color: 'var(--warning)' },
      missing_document: { text: 'Missing', color: 'var(--error)' },
    }
    const item = labels[status]
    if (!item) return status
    return item
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[var(--primary)]" />
            Applied Students — Daily Report
          </CardTitle>
          <CardDescription>Detailed list of PUC students who reached file stage or beyond</CardDescription>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-[var(--text-muted)]">
              <ClipboardList className="w-8 h-8 opacity-30" />
              <p className="text-sm">No applied students in selected period</p>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(0) }}
                    placeholder="Search by name, agent, or source..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
                  />
                </div>
                <span className="text-sm text-[var(--text-muted)]">
                  {filtered.length} student{filtered.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      {renderSortHeader("Date", "date")}
                      {renderSortHeader("Student", "studentName")}
                      {renderSortHeader("Source", "source")}
                      {renderSortHeader("Major", "major")}
                      {renderSortHeader("GPA", "gpa")}
                      {renderSortHeader("Gender", "gender")}
                      {renderSortHeader("Agent", "assignedAgent")}
                      <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Stage</th>
                      <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Doc Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageData.map((row) => {
                      const ds = docStatusLabel(row.pucDocumentStatus)
                      const dsObj = typeof ds === 'object' ? ds : null
                      return (
                        <tr key={row.leadId} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-sunken)] transition-colors">
                          <td className="py-2.5 px-3 text-sm text-[var(--text-primary)]">{formatDate(row.date)}</td>
                          <td className="py-2.5 px-3 text-sm font-medium text-[var(--text-primary)]">{row.studentName}</td>
                          <td className="py-2.5 px-3 text-sm text-[var(--text-secondary)]">{SOURCE_LABELS[row.source] || row.source}</td>
                          <td className="py-2.5 px-3 text-sm text-[var(--text-secondary)]">{MAJOR_LABELS[row.major as IntendedMajor] || row.major}</td>
                          <td className="py-2.5 px-3 text-sm text-[var(--text-primary)] font-medium">
                            {row.gpa !== null ? row.gpa.toFixed(1) : '—'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={cn(
                              "text-xs font-medium px-2 py-0.5 rounded-full",
                              row.gender === 'male' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              row.gender === 'female' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' :
                              'bg-gray-100 text-gray-600'
                            )}>
                              {row.gender === 'male' ? 'M' : row.gender === 'female' ? 'F' : '—'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-sm text-[var(--text-secondary)]">{row.assignedAgent}</td>
                          <td className="py-2.5 px-3">
                            <Badge variant="outline" className="text-xs">{stageLabel(row.pipelineStage)}</Badge>
                          </td>
                          <td className="py-2.5 px-3">
                            {dsObj ? (
                              <span className="text-xs font-medium" style={{ color: dsObj.color }}>{dsObj.text}</span>
                            ) : (
                              <span className="text-xs text-[var(--text-muted)]">{typeof ds === 'string' ? ds : '—'}</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border)]">
                  <span className="text-sm text-[var(--text-muted)]">
                    Page {page + 1} of {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// =============================
// TARGET ACHIEVEMENT
// =============================

function PUCTargetAchievement({ data }: { data: PUCTargetAchievementData }) {
  const hasTargets = data.teamTarget.pucFiles > 0 || data.teamTarget.pucAppSubmission > 0
  const hasActivity = data.byAgent.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Team Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PUC Files Target */}
        <Card hover glow>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderOpen className="w-5 h-5 text-[var(--primary)]" />
              PUC Files Target
            </CardTitle>
            <CardDescription>Team progress on PUC file openings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-4">
              <ProgressRing
                value={data.teamProgress.pucFiles}
                max={100}
                size={140}
                strokeWidth={14}
                showValue
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 rounded-lg bg-[var(--bg-sunken)]">
                <p className="text-2xl font-bold text-[var(--primary)]">{data.teamActual.pucFiles}</p>
                <p className="text-xs text-[var(--text-muted)]">Actual</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-[var(--bg-sunken)]">
                <p className="text-2xl font-bold text-[var(--text-primary)]">{data.teamTarget.pucFiles}</p>
                <p className="text-xs text-[var(--text-muted)]">Target</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PUC App Submission Target */}
        <Card hover glow>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Send className="w-5 h-5 text-[var(--accent)]" />
              PUC App Submission Target
            </CardTitle>
            <CardDescription>Team progress on PUC application submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-4">
              <ProgressRing
                value={data.teamProgress.pucAppSubmission}
                max={100}
                size={140}
                strokeWidth={14}
                showValue
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 rounded-lg bg-[var(--bg-sunken)]">
                <p className="text-2xl font-bold text-[var(--accent)]">{data.teamActual.pucAppSubmission}</p>
                <p className="text-xs text-[var(--text-muted)]">Actual</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-[var(--bg-sunken)]">
                <p className="text-2xl font-bold text-[var(--text-primary)]">{data.teamTarget.pucAppSubmission}</p>
                <p className="text-xs text-[var(--text-muted)]">Target</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-Agent Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-[var(--success)]" />
            Agent Target Progress
          </CardTitle>
          <CardDescription>Individual agent achievement against PUC targets</CardDescription>
        </CardHeader>
        <CardContent>
          {!hasActivity && !hasTargets ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-[var(--text-muted)]">
              <Target className="w-8 h-8 opacity-30" />
              <p className="text-sm">No targets configured or no activity in selected period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pr-4">Agent</th>
                    <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3" colSpan={3}>
                      PUC Files
                    </th>
                    <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3 border-l border-[var(--border)]" colSpan={3}>
                      App Submission
                    </th>
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <th />
                    <th className="text-center text-[10px] font-medium text-[var(--text-muted)] py-1 px-2">Actual</th>
                    <th className="text-center text-[10px] font-medium text-[var(--text-muted)] py-1 px-2">Target</th>
                    <th className="text-center text-[10px] font-medium text-[var(--text-muted)] py-1 px-2 w-24">Progress</th>
                    <th className="text-center text-[10px] font-medium text-[var(--text-muted)] py-1 px-2 border-l border-[var(--border)]">Actual</th>
                    <th className="text-center text-[10px] font-medium text-[var(--text-muted)] py-1 px-2">Target</th>
                    <th className="text-center text-[10px] font-medium text-[var(--text-muted)] py-1 px-2 w-24">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byAgent.map((agent) => (
                    <tr key={agent.agentId} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-sunken)] transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={agent.avatarUrl || undefined} />
                            <AvatarFallback className="text-xs">{getInitials(agent.agentName)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-[var(--text-primary)]">{agent.agentName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center text-sm font-bold text-[var(--primary)]">{agent.actualPucFiles}</td>
                      <td className="py-3 px-2 text-center text-sm text-[var(--text-muted)]">{agent.targetPucFiles || '—'}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-[var(--bg-sunken)] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, agent.progressPucFiles)}%`,
                                backgroundColor: agent.progressPucFiles >= 100 ? 'var(--success)' : agent.progressPucFiles >= 50 ? 'var(--primary)' : 'var(--warning)',
                              }}
                            />
                          </div>
                          <span className={cn(
                            "text-xs font-semibold w-10 text-right",
                            agent.progressPucFiles >= 100 ? 'text-[var(--success)]' : 'text-[var(--text-secondary)]'
                          )}>
                            {agent.progressPucFiles}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center text-sm font-bold text-[var(--accent)] border-l border-[var(--border)]">{agent.actualPucAppSubmission}</td>
                      <td className="py-3 px-2 text-center text-sm text-[var(--text-muted)]">{agent.targetPucAppSubmission || '—'}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-[var(--bg-sunken)] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, agent.progressPucAppSubmission)}%`,
                                backgroundColor: agent.progressPucAppSubmission >= 100 ? 'var(--success)' : agent.progressPucAppSubmission >= 50 ? 'var(--accent)' : 'var(--warning)',
                              }}
                            />
                          </div>
                          <span className={cn(
                            "text-xs font-semibold w-10 text-right",
                            agent.progressPucAppSubmission >= 100 ? 'text-[var(--success)]' : 'text-[var(--text-secondary)]'
                          )}>
                            {agent.progressPucAppSubmission}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[var(--border)]">
                    <td className="py-3 pr-4 text-sm font-semibold text-[var(--text-secondary)]">Team Total</td>
                    <td className="py-3 px-2 text-center text-sm font-bold text-[var(--primary)]">{data.teamActual.pucFiles}</td>
                    <td className="py-3 px-2 text-center text-sm font-bold text-[var(--text-primary)]">{data.teamTarget.pucFiles}</td>
                    <td className="py-3 px-2">
                      <span className={cn(
                        "text-sm font-bold",
                        data.teamProgress.pucFiles >= 100 ? 'text-[var(--success)]' : 'text-[var(--text-primary)]'
                      )}>
                        {data.teamProgress.pucFiles}%
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center text-sm font-bold text-[var(--accent)] border-l border-[var(--border)]">{data.teamActual.pucAppSubmission}</td>
                    <td className="py-3 px-2 text-center text-sm font-bold text-[var(--text-primary)]">{data.teamTarget.pucAppSubmission}</td>
                    <td className="py-3 px-2">
                      <span className={cn(
                        "text-sm font-bold",
                        data.teamProgress.pucAppSubmission >= 100 ? 'text-[var(--success)]' : 'text-[var(--text-primary)]'
                      )}>
                        {data.teamProgress.pucAppSubmission}%
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
