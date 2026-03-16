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
} from "recharts"
import {
  CreditCard,
  Users,
  TrendingUp,
  CheckCircle2,
  Clock,
  FolderOpen,
} from "lucide-react"
import type { PaymentReportData } from "@/lib/hooks/use-reports"

interface PaymentReportsProps {
  data: PaymentReportData
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

export function PaymentReports({ data }: PaymentReportsProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  const pieData = [
    { name: 'Pending', value: data.pending, color: '#F59E0B' },
    { name: 'Seat Reserved', value: data.seatReserved, color: '#3B82F6' },
    { name: 'Full Tuition', value: data.fullTuition, color: '#22C55E' },
  ].filter(d => d.value > 0)

  const stats = [
    {
      title: "Total Students",
      value: data.totalStudents,
      icon: Users,
      color: "primary",
      colorClass: "bg-[var(--bg-sunken)]"
    },
    {
      title: "Pending",
      value: `${data.pending}`,
      subtext: `${Math.round((data.pending / data.totalStudents) * 100) || 0}% of total`,
      icon: Clock,
      color: "warning",
      colorClass: "bg-[var(--warning)]"
    },
    {
      title: "Seat Reserved",
      value: `${data.seatReservedPercent}%`,
      subtext: `${data.seatReserved} students`,
      icon: CheckCircle2,
      color: "info",
      colorClass: "bg-[var(--primary)]"
    },
    {
      title: "Full Payment",
      value: `${data.fullTuitionPercent}%`,
      subtext: `${data.fullTuition} students`,
      icon: TrendingUp,
      color: "success",
      colorClass: "bg-[var(--success)]"
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
                {stat.subtext && (
                  <p className="text-xs text-[var(--text-muted)] mt-1">{stat.subtext}</p>
                )}
              </CardContent>
              <div className={`absolute bottom-0 left-0 right-0 h-1 ${stat.colorClass} opacity-50`} />
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Payment Status Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
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
            <div className="h-[260px]" style={{ minWidth: 0 }}>
              {mounted && pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                  No data available
                </div>
              )}
            </div>
            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-[var(--text-secondary)]">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment Status Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Payment Status Breakdown</CardTitle>
            <CardDescription>Detailed view of payment stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatusCard
                icon={Clock}
                title="Pending"
                count={data.pending}
                total={data.totalStudents}
                color="warning"
                description="Payment not yet initiated"
              />
              <StatusCard
                icon={CheckCircle2}
                title="Seat Reserved"
                count={data.seatReserved}
                total={data.totalStudents}
                color="info"
                description="150+ KD paid"
              />
              <StatusCard
                icon={TrendingUp}
                title="Full Tuition"
                count={data.fullTuition}
                total={data.totalStudents}
                color="success"
                description="550 KD paid"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* File Stage Payment Breakdown by Agent */}
      {data.fileStageByAgent.length > 0 && (
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
    </div>
  )
}

function StatusCard({
  icon: Icon,
  title,
  count,
  total,
  color,
  description,
}: {
  icon: typeof Clock
  title: string
  count: number
  total: number
  color: 'warning' | 'info' | 'success'
  description: string
}) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0
  const colorClasses = {
    warning: 'bg-[var(--warning-bg)] text-[var(--warning)]',
    info: 'bg-[var(--info-bg)] text-[var(--info)]',
    success: 'bg-[var(--success-bg)] text-[var(--success)]',
  }

  return (
    <div className="p-4 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)]">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <Badge variant={color} size="sm">{percent}%</Badge>
      </div>
      <h4 className="font-semibold text-[var(--text-primary)]">{title}</h4>
      <p className="text-2xl font-bold text-[var(--text-primary)] my-1">{count}</p>
      <p className="text-xs text-[var(--text-muted)]">{description}</p>
    </div>
  )
}
