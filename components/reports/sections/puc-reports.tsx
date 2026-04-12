"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressRing } from "@/components/ui/progress"
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
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import { cn } from "@/lib/utils"
import type { PUCReportData } from "@/lib/hooks/use-reports"

type PUCSubTab = "overview" | "daily"

interface PUCReportsProps {
  data: PUCReportData
}

export function PUCReports({ data }: PUCReportsProps) {
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
  ]

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-sunken)] w-fit">
        {subTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSubTab(tab.key)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium transition-all",
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

function PUCDailySubmissions({ data }: { data: PUCReportData }) {
  const days = data.dailySubmissions
  const hasData = days.some(d => d.filesOpened > 0 || d.documentsSubmitted > 0 || d.applicationSubmitted > 0 || d.feePaid > 0)

  // Totals row
  const totals = days.reduce(
    (acc, d) => ({
      filesOpened: acc.filesOpened + d.filesOpened,
      documentsSubmitted: acc.documentsSubmitted + d.documentsSubmitted,
      applicationSubmitted: acc.applicationSubmitted + d.applicationSubmitted,
      feePaid: acc.feePaid + d.feePaid,
    }),
    { filesOpened: 0, documentsSubmitted: 0, applicationSubmitted: 0, feePaid: 0 }
  )

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
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
            <CalendarDays className="w-5 h-5 text-[var(--primary)]" />
            Day-by-Day PUC Submissions
          </CardTitle>
          <CardDescription>Daily breakdown of PUC pipeline progress</CardDescription>
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
                    <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pr-4">Date</th>
                    <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <FolderOpen className="w-3.5 h-3.5" />
                        Files Opened
                      </div>
                    </th>
                    <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        Docs Submitted
                      </div>
                    </th>
                    <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" />
                        Fee Paid
                      </div>
                    </th>
                    <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <Send className="w-3.5 h-3.5" />
                        App Submitted
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => {
                    const isEmpty = day.filesOpened === 0 && day.documentsSubmitted === 0 && day.applicationSubmitted === 0 && day.feePaid === 0
                    return (
                      <tr
                        key={day.date}
                        className={cn(
                          "border-b border-[var(--border)] last:border-0 transition-colors",
                          isEmpty ? "opacity-40" : "hover:bg-[var(--bg-sunken)]"
                        )}
                      >
                        <td className="py-3 pr-4">
                          <span className="text-sm font-medium text-[var(--text-primary)]">{formatDate(day.date)}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <CellValue value={day.filesOpened} color="var(--primary)" />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <CellValue value={day.documentsSubmitted} color="var(--info)" />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <CellValue value={day.feePaid} color="var(--success)" />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <CellValue value={day.applicationSubmitted} color="var(--accent)" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[var(--border)]">
                    <td className="py-3 pr-4 text-sm font-bold text-[var(--text-primary)]">Total</td>
                    <td className="py-3 px-3 text-center text-sm font-bold text-[var(--primary)]">{totals.filesOpened}</td>
                    <td className="py-3 px-3 text-center text-sm font-bold text-[var(--info)]">{totals.documentsSubmitted}</td>
                    <td className="py-3 px-3 text-center text-sm font-bold text-[var(--success)]">{totals.feePaid}</td>
                    <td className="py-3 px-3 text-center text-sm font-bold text-[var(--accent)]">{totals.applicationSubmitted}</td>
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

