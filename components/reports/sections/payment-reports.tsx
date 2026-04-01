"use client"

import { useSyncExternalStore } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import {
  CreditCard,
  Users,
  TrendingUp,
  CheckCircle2,
  Clock,
  FolderOpen,
  BarChart3,
  Percent,
} from "lucide-react"
import { ProgressBar } from "@/components/ui/progress"
import type { PaymentReportData } from "@/lib/hooks/use-reports"

interface PaymentReportsProps {
  data: PaymentReportData
  isAgent?: boolean
}

const emptySubscribe = () => () => {}

interface TooltipPayload {
  name: string
  value: number
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-[var(--text-muted)]">{payload[0].name}</p>
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {payload[0].value} students
        </p>
      </div>
    )
  }
  return null
}

function BarTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { agentName: string; amount: number; count: number } }> }) {
  if (active && payload && payload.length) {
    const d = payload[0].payload
    return (
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-xl">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{d.agentName}</p>
        <p className="text-xs text-[var(--text-muted)]">{d.amount.toLocaleString()} KD &middot; {d.count} students</p>
      </div>
    )
  }
  return null
}

function EnrolledTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { agentName: string; count: number } }> }) {
  if (active && payload && payload.length) {
    const d = payload[0].payload
    return (
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-xl">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{d.agentName}</p>
        <p className="text-xs text-[var(--text-muted)]">{d.count} students</p>
      </div>
    )
  }
  return null
}

export function PaymentReports({ data, isAgent }: PaymentReportsProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  const pieData = [
    { name: 'Pending', value: data.pending, color: '#F59E0B' },
    { name: 'Seat Reserved', value: data.seatReserved, color: '#3B82F6' },
    { name: 'Full Tuition', value: data.fullTuition, color: '#22C55E' },
  ].filter(d => d.value > 0)

  const collectionRate = data.totalStudents > 0
    ? Math.round(((data.seatReserved + data.fullTuition) / data.totalStudents) * 100)
    : 0

  const stats = [
    {
      title: "Total Students",
      value: data.totalStudents,
      icon: Users,
      color: "default" as const,
      colorClass: "bg-[var(--bg-sunken)]",
      barColor: "bg-[var(--text-muted)]",
      percent: 100,
    },
    {
      title: "Pending",
      value: data.pending,
      subtext: `${data.totalStudents > 0 ? Math.round((data.pending / data.totalStudents) * 100) : 0}% of total`,
      icon: Clock,
      color: "warning" as const,
      colorClass: "bg-[var(--warning)]",
      barColor: "bg-[var(--warning)]",
      percent: data.totalStudents > 0 ? Math.round((data.pending / data.totalStudents) * 100) : 0,
    },
    {
      title: "Seat Reserved",
      value: data.seatReserved,
      subtext: `${data.seatReservedPercent}% of files`,
      icon: CheckCircle2,
      color: "info" as const,
      colorClass: "bg-[var(--primary)]",
      barColor: "bg-[var(--primary)]",
      percent: data.seatReservedPercent,
    },
    {
      title: "Full Payment",
      value: data.fullTuition,
      subtext: `${data.fullTuitionPercent}% of files`,
      icon: TrendingUp,
      color: "success" as const,
      colorClass: "bg-[var(--success)]",
      barColor: "bg-[var(--success)]",
      percent: data.fullTuitionPercent,
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
            transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
          >
            <Card hover glow className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 rounded-xl ${stat.colorClass} shadow-sm`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  {stat.title !== "Total Students" && (
                    <Badge variant={stat.color} size="sm">{stat.percent}%</Badge>
                  )}
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
                {stat.subtext && (
                  <p className="text-xs text-[var(--text-muted)] mt-1">{stat.subtext}</p>
                )}
                {/* Progress bar */}
                {stat.title !== "Total Students" && (
                  <div className="w-full h-1.5 rounded-full bg-[var(--bg-sunken)] mt-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${stat.barColor} transition-all duration-700`}
                      style={{ width: `${stat.percent}%` }}
                    />
                  </div>
                )}
              </CardContent>
              <div className={`absolute bottom-0 left-0 right-0 h-1 ${stat.colorClass} opacity-50`} />
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Payment Status Distribution — Donut with center label */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[var(--primary)]" />
              Payment Status
            </CardTitle>
            <CardDescription>Distribution by payment stage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] relative" style={{ minWidth: 0 }}>
              {mounted && pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-3xl font-bold text-[var(--text-primary)]">{data.totalStudents}</p>
                    <p className="text-xs text-[var(--text-muted)]">Total</p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <CreditCard className="w-10 h-10 text-[var(--text-muted)] opacity-30" />
                  <p className="text-sm text-[var(--text-muted)]">No payment data available</p>
                </div>
              )}
            </div>
            {/* Legend */}
            {pieData.length > 0 && (
              <div className="flex items-center justify-center gap-6 mt-4">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-[var(--text-secondary)]">
                      {item.name} <span className="text-[var(--text-muted)]">({item.value})</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Enrolled Students by Agent — bar chart (admin only) */}
      {!isAgent && data.byAgent.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[var(--primary)]" />
                Enrolled Students by Agent
              </CardTitle>
              <CardDescription>Total enrolled students per agent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]" style={{ minWidth: 0 }}>
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.byAgent}
                      layout="vertical"
                      margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                      <YAxis
                        type="category"
                        dataKey="agentName"
                        width={100}
                        tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                      />
                      <Tooltip content={<EnrolledTooltip />} cursor={{ fill: 'var(--bg-sunken)', opacity: 0.5 }} />
                      <Bar dataKey="count" fill="var(--primary)" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* File Stage Payment Breakdown by Agent — admin only */}
      {!isAgent && data.fileStageByAgent.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-[var(--primary)]" />
                File Stage — Payment per Agent
              </CardTitle>
              <CardDescription>Leads in File stage grouped by agent and payment status</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Summary row */}
              {(() => {
                const totals = data.fileStageByAgent.reduce(
                  (acc, a) => ({
                    total: acc.total + a.total,
                    notPaid: acc.notPaid + a.notPaid,
                    paid150: acc.paid150 + a.paid150,
                    paidFull: acc.paidFull + a.paidFull,
                  }),
                  { total: 0, notPaid: 0, paid150: 0, paidFull: 0 }
                )
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="p-3 rounded-lg bg-[var(--bg-sunken)] border border-[var(--border)] text-center">
                      <p className="text-xs text-[var(--text-muted)]">Total in Files</p>
                      <p className="text-xl font-bold text-[var(--text-primary)]">{totals.total}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--warning-bg)] border border-[var(--warning)]/20 text-center">
                      <p className="text-xs text-[var(--warning)]">Not Paid</p>
                      <p className="text-xl font-bold text-[var(--warning)]">{totals.notPaid}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--info-bg)] border border-[var(--info)]/20 text-center">
                      <p className="text-xs text-[var(--info)]">Paid 150 KD</p>
                      <p className="text-xl font-bold text-[var(--info)]">{totals.paid150}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--success-bg)] border border-[var(--success)]/20 text-center">
                      <p className="text-xs text-[var(--success)]">Full Payment</p>
                      <p className="text-xl font-bold text-[var(--success)]">{totals.paidFull}</p>
                    </div>
                  </div>
                )
              })()}

              {/* Agent table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left py-3 px-3 text-[var(--text-secondary)] font-medium">Agent</th>
                      <th className="text-center py-3 px-3 text-[var(--text-secondary)] font-medium">Total</th>
                      <th className="text-center py-3 px-3 text-[var(--warning)] font-medium">Not Paid</th>
                      <th className="text-center py-3 px-3 text-[var(--info)] font-medium">Paid 150</th>
                      <th className="text-center py-3 px-3 text-[var(--success)] font-medium">Full Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.fileStageByAgent.map((agent) => (
                      <tr key={agent.agentId} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-sunken)] transition-colors">
                        <td className="py-3 px-3 font-medium text-[var(--text-primary)]">{agent.agentName}</td>
                        <td className="py-3 px-3 text-center text-[var(--text-primary)] font-semibold">{agent.total}</td>
                        <td className="py-3 px-3 text-center">
                          <Badge variant="warning" size="sm">{agent.notPaid}</Badge>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge variant="info" size="sm">{agent.paid150}</Badge>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge variant="success" size="sm">{agent.paidFull}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Discount Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.9 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-[var(--warning)]" />
              Discount Analysis
            </CardTitle>
            <CardDescription>Students by discount type</CardDescription>
          </CardHeader>
          <CardContent>
            {data.discountAnalysis.length > 0 ? (
              <div className="space-y-4">
                {data.discountAnalysis.map((discount) => (
                  <div key={discount.discountType} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {discount.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" size="sm">{discount.count} students</Badge>
                      </div>
                    </div>
                    <ProgressBar
                      value={discount.count}
                      max={Math.max(...data.discountAnalysis.map(d => d.count)) || 1}
                      size="sm"
                      variant="gradient"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)]">
                No discount data available
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
