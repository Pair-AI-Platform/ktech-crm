"use client"

import { useSyncExternalStore } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProgressRing } from "@/components/ui/progress"
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
} from "lucide-react"
import type { PaymentReportData } from "@/lib/hooks/use-reports"

interface PaymentReportsProps {
  data: PaymentReportData
}

const COLORS = ['#F59E0B', '#3B82F6', '#22C55E']

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
      gradient: "from-[#445eb7] to-[#212e7f]"
    },
    {
      title: "Pending",
      value: `${data.pending}`,
      subtext: `${Math.round((data.pending / data.totalStudents) * 100) || 0}% of total`,
      icon: Clock,
      color: "warning",
      gradient: "from-[#F59E0B] to-[#D97706]"
    },
    {
      title: "Seat Reserved",
      value: `${data.seatReservedPercent}%`,
      subtext: `${data.seatReserved} students`,
      icon: CheckCircle2,
      color: "info",
      gradient: "from-[#3B82F6] to-[#2563EB]"
    },
    {
      title: "Full Payment",
      value: `${data.fullTuitionPercent}%`,
      subtext: `${data.fullTuition} students`,
      icon: TrendingUp,
      color: "success",
      gradient: "from-[#22C55E] to-[#16A34A]"
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
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
                {stat.subtext && (
                  <p className="text-xs text-[var(--text-muted)] mt-1">{stat.subtext}</p>
                )}
              </CardContent>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient} opacity-50`} />
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
    <div className="p-4 rounded-xl bg-[var(--bg-depth-3)] border border-[var(--border)]">
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
