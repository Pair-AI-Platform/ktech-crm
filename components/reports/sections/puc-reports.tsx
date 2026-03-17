"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressRing } from "@/components/ui/progress"
import {
  Award,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  FolderOpen,
  FileText,
  Send,
  CreditCard,
  RefreshCw,
  TrendingDown,
  ArrowDown,
} from "lucide-react"
import type { PUCReportData } from "@/lib/hooks/use-reports"

interface PUCReportsProps {
  data: PUCReportData
}

export function PUCReports({ data }: PUCReportsProps) {
  const stats = [
    {
      title: "Total Applied",
      value: data.totalApplied,
      icon: Users,
      colorClass: "bg-[var(--bg-sunken)]"
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
      title: "Pending",
      value: data.pending,
      icon: Clock,
      colorClass: "bg-[var(--warning)]"
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card hover glow className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 rounded-xl ${stat.colorClass} shadow-sm`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
              </CardContent>
              <div className={`absolute bottom-0 left-0 right-0 h-1 ${stat.colorClass} opacity-50`} />
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
                <div className="text-center p-3 rounded-lg bg-[var(--error-bg)]">
                  <p className="text-2xl font-bold text-[var(--error)]">{data.rejected}</p>
                  <p className="text-xs text-[var(--text-muted)]">Rejected</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-[var(--warning-bg)]">
                  <p className="text-2xl font-bold text-[var(--warning)]">{data.pending}</p>
                  <p className="text-xs text-[var(--text-muted)]">Pending</p>
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
                { label: 'Application Submitted', labelAr: 'قدم طلب', value: data.applicationSubmitted, icon: Send, color: 'var(--accent)' },
                { label: 'Fee Paid (10 KD)', labelAr: 'دفع رسوم البعثات', value: data.feePaid, icon: CreditCard, color: 'var(--success)' },
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
                { label: 'Application Submitted', value: data.applicationSubmitted },
                { label: 'Fee Paid', value: data.feePaid },
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
                          {data.filesOpened - data.feePaid}
                        </span>
                        <span className="text-sm text-[var(--text-muted)] ml-2">
                          ({data.filesOpened > 0 ? Math.round(((data.filesOpened - data.feePaid) / data.filesOpened) * 100) : 0}% of {data.filesOpened})
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

      {/* Converted to Self-Funded */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[var(--info-bg)]">
                  <RefreshCw className="w-6 h-6 text-[var(--info)]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Converted to Self-Funded
                  </h3>
                  <p className="text-sm text-[var(--text-muted)]">
                    PUC rejected students who converted to self-funded enrollment
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-[var(--text-primary)]">{data.convertedToSF}</p>
                <p className="text-sm text-[var(--text-muted)]">
                  {data.rejected > 0 ? Math.round((data.convertedToSF / data.rejected) * 100) : 0}% of rejected
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* PUC Process Info */}
    </div>
  )
}

