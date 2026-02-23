"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProgressBar, ProgressRing } from "@/components/ui/progress"
import {
  Award,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RefreshCw,
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

        {/* PUC Funnel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-[var(--accent)]" />
                PUC Application Funnel
              </CardTitle>
              <CardDescription>Stage-by-stage progression</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.byStage.map((stage, index) => (
                <FunnelStage
                  key={stage.stage}
                  stage={stage.stage}
                  count={stage.count}
                  total={data.totalApplied}
                  isLast={index === data.byStage.length - 1}
                />
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>PUC Application Process</CardTitle>
            <CardDescription>Understanding the PUC student flow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { step: 1, title: "Ktech Application", desc: "Student completes Ktech application" },
                { step: 2, title: "PACI Verification", desc: "Verified through PACI system" },
                { step: 3, title: "PUC Submission", desc: "Student applies via PUC portal" },
                { step: 4, title: "PUC Decision", desc: "Accepted or rejected" },
                { step: 5, title: "Enrolled", desc: "Documents collected" },
              ].map((item, index) => (
                <div key={item.step} className="relative">
                  <div className="p-4 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)] text-center">
                    <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center mx-auto mb-2 text-sm font-bold">
                      {item.step}
                    </div>
                    <h4 className="font-medium text-[var(--text-primary)] text-sm">{item.title}</h4>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{item.desc}</p>
                  </div>
                  {index < 4 && (
                    <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                      <ArrowRight className="w-4 h-4 text-[var(--text-muted)]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

function FunnelStage({
  stage,
  count,
  total,
  isLast,
}: {
  stage: string
  count: number
  total: number
  isLast: boolean
}) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[var(--text-primary)]">{stage}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--text-primary)]">{count}</span>
          <Badge variant="secondary" size="sm">{percent}%</Badge>
        </div>
      </div>
      <ProgressBar
        value={count}
        max={total || 1}
        variant="gradient"
        size="md"
      />
      {!isLast && (
        <div className="flex justify-center my-2">
          <ArrowRight className="w-4 h-4 text-[var(--text-muted)] rotate-90" />
        </div>
      )}
    </div>
  )
}
