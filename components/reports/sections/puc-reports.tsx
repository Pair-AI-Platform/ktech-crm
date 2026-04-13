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
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { queryKeys } from "@/lib/hooks/query-keys"
import { MAJORS, LEAD_SOURCES } from "@/types"
import type { PUCReportData, PUCDailySubmission, PUCDailySourceRow, PUCAgentDailyRow } from "@/lib/hooks/use-reports"
import type { IntendedMajor } from "@/types"

type PUCSubTab = "overview" | "daily" | "preferences" | "sources" | "agent-daily"

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
    { key: "preferences", label: "Change Preferences", icon: RefreshCw },
    { key: "sources", label: "Daily Sources", icon: Radio },
    { key: "agent-daily", label: "Agent Performance", icon: UserCheck },
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
      {subTab === "preferences" && <PUCPreferenceChanges periodInfo={periodInfo} />}
      {subTab === "sources" && <PUCDailySources data={data.dailySources} />}
      {subTab === "agent-daily" && <PUCAgentDaily data={data.agentDaily} />}

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
  const agentTotals: Record<string, { name: string; filesOpened: number; documentsSubmitted: number; applicationSubmitted: number }> = {}
  for (const day of data) {
    for (const agent of day.agents) {
      if (!agentTotals[agent.agentId]) {
        agentTotals[agent.agentId] = { name: agent.agentName, filesOpened: 0, documentsSubmitted: 0, applicationSubmitted: 0 }
      }
      agentTotals[agent.agentId].filesOpened += agent.filesOpened
      agentTotals[agent.agentId].documentsSubmitted += agent.documentsSubmitted
      agentTotals[agent.agentId].applicationSubmitted += agent.applicationSubmitted
    }
  }

  // Get unique agents sorted by total activity
  const uniqueAgents = Object.entries(agentTotals)
    .map(([id, t]) => ({ agentId: id, ...t }))
    .sort((a, b) => (b.filesOpened + b.documentsSubmitted + b.applicationSubmitted) - (a.filesOpened + a.documentsSubmitted + a.applicationSubmitted))

  // Build a lookup map: day -> agentId -> counts
  const dayAgentMap: Record<string, Record<string, { filesOpened: number; documentsSubmitted: number; applicationSubmitted: number }>> = {}
  for (const day of data) {
    dayAgentMap[day.date] = {}
    for (const agent of day.agents) {
      dayAgentMap[day.date][agent.agentId] = {
        filesOpened: agent.filesOpened,
        documentsSubmitted: agent.documentsSubmitted,
        applicationSubmitted: agent.applicationSubmitted,
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
          <CardDescription>Daily agent-level breakdown: Files Opened / Docs Submitted / App Submitted</CardDescription>
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
                      <th key={agent.agentId} colSpan={3} className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-1.5 px-1 border-l border-[var(--border)]">
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
      <th className="text-center text-[10px] font-medium text-[var(--text-muted)] py-1 px-1">App</th>
    </>
  )
}

function AgentDayCells({ filesOpened, documentsSubmitted, applicationSubmitted, isBold }: {
  filesOpened: number
  documentsSubmitted: number
  applicationSubmitted: number
  isBold?: boolean
}) {
  if (isBold) {
    return (
      <>
        <td className="py-3 px-1 text-center text-xs font-bold text-[var(--primary)] border-l border-[var(--border)]">{filesOpened}</td>
        <td className="py-3 px-1 text-center text-xs font-bold text-[var(--info)]">{documentsSubmitted}</td>
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
        <CellValueSmall value={applicationSubmitted} color="var(--accent)" />
      </td>
    </>
  )
}
