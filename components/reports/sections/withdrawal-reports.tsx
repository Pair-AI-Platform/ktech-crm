"use client"

import { useSyncExternalStore } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  UserMinus,
  TrendingDown,
  AlertTriangle,
  UserX,
  Users,
} from "lucide-react"
import type { EnrollmentReportData, WithdrawalsByAgentData } from "@/lib/hooks/use-reports"

export interface WithdrawalReportsProps {
  enrollmentData: EnrollmentReportData
  withdrawalsByAgent: WithdrawalsByAgentData
  isAgent?: boolean
}

const emptySubscribe = () => () => {}

interface TooltipPayload {
  payload: { reason: string; percent: number }
  value: number
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-[var(--text-muted)]">{payload[0].payload.reason}</p>
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {payload[0].value} students ({payload[0].payload.percent}%)
        </p>
      </div>
    )
  }
  return null
}

const COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981']

// Demo data when no real withdrawal data exists
const DEMO_ENROLLMENT: EnrollmentReportData = {
  totalEnrolled: 156,
  pucEnrolled: 62,
  sfEnrolled: 94,
  byAgent: [],
  withdrawals: {
    total: 23,
    rate: 13,
    byReason: [
      { reasonId: 'payment_issue', reason: 'Payment Issue', count: 6, percent: 26 },
      { reasonId: 'far_away', reason: 'Far Away', count: 5, percent: 22 },
      { reasonId: 'personal_reasons', reason: 'Personal Reasons', count: 4, percent: 17 },
      { reasonId: 'competitor_gust', reason: 'GUST', count: 3, percent: 13 },
      { reasonId: 'studying_abroad', reason: 'Studying Abroad', count: 3, percent: 13 },
      { reasonId: 'language_issues', reason: 'Language Issues', count: 2, percent: 9 },
    ],
  },
}

const DEMO_WITHDRAWALS: WithdrawalsByAgentData = {
  totalWithdrawnSF: 14,
  totalWithdrawnPUC: 9,
  byAgent: [
    { agentId: '1', agentName: 'Ahmed Al-Rashidi', avatarUrl: null, sfWithdrawn: 5, pucWithdrawn: 3, total: 8, applicantCount: 20, ratio: 40 },
    { agentId: '2', agentName: 'Sara Al-Mutairi', avatarUrl: null, sfWithdrawn: 4, pucWithdrawn: 2, total: 6, applicantCount: 18, ratio: 33 },
    { agentId: '3', agentName: 'Fahad Al-Dosari', avatarUrl: null, sfWithdrawn: 3, pucWithdrawn: 2, total: 5, applicantCount: 15, ratio: 33 },
    { agentId: '4', agentName: 'Noura Al-Harbi', avatarUrl: null, sfWithdrawn: 2, pucWithdrawn: 2, total: 4, applicantCount: 12, ratio: 33 },
  ],
}

export function WithdrawalReports({ enrollmentData, withdrawalsByAgent, isAgent }: WithdrawalReportsProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  // Use demo data when no real withdrawal data exists
  const hasRealData = withdrawalsByAgent.totalWithdrawnSF + withdrawalsByAgent.totalWithdrawnPUC > 0 || enrollmentData.withdrawals.total > 0
  const displayEnrollment = hasRealData ? enrollmentData : DEMO_ENROLLMENT
  const displayWithdrawals = hasRealData ? withdrawalsByAgent : DEMO_WITHDRAWALS

  const pieData = displayEnrollment.withdrawals.byReason.map((item, index) => ({
    name: item.reason,
    reason: item.reason,
    value: item.count,
    percent: item.percent,
    color: COLORS[index % COLORS.length],
  }))

  const totalWithdrawals = displayWithdrawals.totalWithdrawnSF + displayWithdrawals.totalWithdrawnPUC

  return (
    <div className="space-y-6">
      {!hasRealData && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--warning-bg)] border border-[var(--warning)]/20">
          <AlertTriangle className="w-4 h-4 text-[var(--warning)] shrink-0" />
          <p className="text-sm text-[var(--warning)]">
            Showing demo data — no withdrawal records found for the selected period.
          </p>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.0 }}>
          <Card hover glow>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-[var(--error-bg)] shadow-sm">
                  <UserX className="w-5 h-5 text-[var(--error)]" />
                </div>
                <Badge variant="error" size="sm">Total</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Total Withdrawals</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{totalWithdrawals}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card hover glow>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-[var(--primary-muted)] shadow-sm">
                  <Users className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <Badge variant="secondary" size="sm">SF</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">SF Withdrawals</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{displayWithdrawals.totalWithdrawnSF}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card hover glow>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-[var(--warning-bg)] shadow-sm">
                  <Users className="w-5 h-5 text-[var(--warning)]" />
                </div>
                <Badge variant="warning" size="sm">PUC</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">PUC Withdrawals</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{displayWithdrawals.totalWithdrawnPUC}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card hover glow>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-[var(--warning-bg)] shadow-sm">
                  <TrendingDown className="w-5 h-5 text-[var(--warning)]" />
                </div>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Withdrawal Rate</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{displayEnrollment.withdrawals.rate}%</p>
            </CardContent>
          </Card>
        </motion.div>

      </div>

      {/* Withdrawal Reasons Chart */}
      <div className="grid grid-cols-1 gap-6">
        {/* Withdrawal Reasons Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserMinus className="w-5 h-5 text-[var(--error)]" />
                Withdrawal Reasons
              </CardTitle>
              <CardDescription>Why students withdraw</CardDescription>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <>
                  <div className="h-[200px]" style={{ minWidth: 0 }}>
                    {mounted ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
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
                      <div className="h-full bg-[var(--bg-sunken)] rounded animate-pulse" />
                    )}
                  </div>
                  {/* Legend */}
                  <div className="space-y-2 mt-4">
                    {pieData.slice(0, 5).map((item) => (
                      <div key={item.reason} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm text-[var(--text-secondary)] truncate max-w-[150px]">
                            {item.reason}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {item.value} ({item.percent}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-[var(--text-muted)]">
                  No withdrawal data
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Withdrawals per Agent Table — admin only */}
      {!isAgent && (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-[var(--error)]" />
              Withdrawals per Agent
            </CardTitle>
            <CardDescription>Breakdown of withdrawals by funding type per agent</CardDescription>
          </CardHeader>
          <CardContent>
            {displayWithdrawals.byAgent.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pr-4">#</th>
                      <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pr-4">Agent</th>
                      <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">SF</th>
                      <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">PUC</th>
                      <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Total</th>
                      <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3" title="Percentage of the agent's total applicants that withdrew">
                        <span className="inline-flex items-center gap-1">
                          Ratio
                          <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[var(--text-muted)]/20 text-[9px] font-bold text-[var(--text-muted)] cursor-help" title="Withdrawals ÷ Total Applicants × 100">?</span>
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayWithdrawals.byAgent.map((agent, index) => (
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
                          <span className="text-sm font-semibold text-[var(--primary)]">{agent.sfWithdrawn}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-sm font-semibold text-[var(--warning)]">{agent.pucWithdrawn}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge variant="error" size="sm">{agent.total}</Badge>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`text-sm font-semibold ${agent.ratio >= 50 ? 'text-[var(--error)]' : agent.ratio >= 30 ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`}>
                            {agent.ratio}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)]">
                No withdrawal data available
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
      )}
    </div>
  )
}
