"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts"
import { AlertTriangle, Clock, TrendingDown, Users, Info } from "lucide-react"
import type { EarlyWithdrawalData } from "@/lib/hooks/use-reports"

export interface EarlyWithdrawalReportsProps {
  data: EarlyWithdrawalData
  isAgent?: boolean
}

function formatDate(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

const WEEK_COLORS = ["#DC2626", "#EA580C", "#F59E0B", "#EAB308", "#84CC16", "#22C55E", "#14B8A6", "#06B6D4"]

export function EarlyWithdrawalReports({ data, isAgent }: EarlyWithdrawalReportsProps) {
  const hasData = data.total > 0

  return (
    <div className="space-y-6">
      {/* Intro */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-[var(--border)] bg-[var(--bg-sunken)] p-4 flex items-start gap-3"
      >
        <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-[var(--text-primary)] text-sm">Early Withdrawals</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Students who withdrew within the first 8 weeks of the term, measured from each
            term&apos;s course start date. Early attrition is a leading indicator of onboarding,
            placement, or expectation-setting problems.
          </p>
          {data.excludedMissingAnchor > 0 && (
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              {data.excludedMissingAnchor} withdrawn student{data.excludedMissingAnchor === 1 ? "" : "s"} excluded
              because their term has no course start date set.{" "}
              {!isAgent && <span className="opacity-80">Set it in Settings → Education Cycles.</span>}
            </p>
          )}
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs mb-2">
              <TrendingDown className="w-4 h-4" />
              Total Early Withdrawals
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)]">{data.total}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">Within first 8 weeks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs mb-2">
              <Users className="w-4 h-4" />
              % of Enrolled
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)]">{data.percentOfEnrolled}%</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">
              of {data.totalEnrolledWithAnchor} enrolled w/ known start
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs mb-2">
              <Clock className="w-4 h-4" />
              Avg. Week of Withdrawal
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)]">
              {hasData ? data.avgWeek : "—"}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-1">
              {hasData ? "Week number when they left" : "No withdrawals yet"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* By Week Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Withdrawals by Week</CardTitle>
          <CardDescription>Distribution across the first 8 weeks from course start</CardDescription>
        </CardHeader>
        <CardContent>
          {hasData ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byWeek}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="week"
                    tickFormatter={(w) => `W${w}`}
                    stroke="var(--text-muted)"
                    fontSize={12}
                  />
                  <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                    }}
                    labelFormatter={(w) => `Week ${w}`}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {data.byWeek.map((entry, idx) => (
                      <Cell key={idx} fill={WEEK_COLORS[idx % WEEK_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="No early withdrawals recorded in this period." />
          )}
        </CardContent>
      </Card>

      {/* By Agent + By Reason */}
      {!isAgent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">By Agent</CardTitle>
              <CardDescription>Which agents saw the most early departures</CardDescription>
            </CardHeader>
            <CardContent>
              {data.byAgent.length === 0 ? (
                <EmptyState message="No data." />
              ) : (
                <div className="space-y-2">
                  {data.byAgent.map((a) => (
                    <div
                      key={a.agentId}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-hover)]"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={a.avatarUrl || undefined} />
                        <AvatarFallback>{getInitials(a.agentName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {a.agentName}
                        </p>
                      </div>
                      <Badge variant="secondary" size="sm">
                        {a.count} ({a.percent}%)
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">By Reason</CardTitle>
              <CardDescription>Top reasons cited for early withdrawal</CardDescription>
            </CardHeader>
            <CardContent>
              {data.byReason.length === 0 ? (
                <EmptyState message="No reasons recorded." />
              ) : (
                <div className="space-y-2">
                  {data.byReason.map((r) => (
                    <div
                      key={r.reasonId}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--bg-hover)]"
                    >
                      <span className="text-sm text-[var(--text-primary)]">{r.reason}</span>
                      <Badge variant="secondary" size="sm">
                        {r.count} ({r.percent}%)
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Row-level table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Students</CardTitle>
          <CardDescription>
            {data.rows.length} student{data.rows.length === 1 ? "" : "s"} — sorted by most recent withdrawal
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.rows.length === 0 ? (
            <EmptyState message="No early withdrawals in this period." />
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[var(--text-muted)] border-b border-[var(--border)]">
                    <th className="py-2 px-3 font-medium">Student</th>
                    {!isAgent && <th className="py-2 px-3 font-medium">Agent</th>}
                    <th className="py-2 px-3 font-medium">Term</th>
                    <th className="py-2 px-3 font-medium">Course Start</th>
                    <th className="py-2 px-3 font-medium">Withdrew</th>
                    <th className="py-2 px-3 font-medium">Week</th>
                    <th className="py-2 px-3 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr
                      key={r.studentId}
                      className="border-b border-[var(--border)]/50 hover:bg-[var(--bg-hover)]"
                    >
                      <td className="py-2 px-3 font-medium text-[var(--text-primary)]">
                        {r.studentName}
                        <span className="ml-2 text-[10px] uppercase text-[var(--text-muted)]">
                          {r.fundingType === "self_funded" ? "SF" : r.fundingType === "puc" ? "PUC" : ""}
                        </span>
                      </td>
                      {!isAgent && <td className="py-2 px-3 text-[var(--text-secondary)]">{r.agentName}</td>}
                      <td className="py-2 px-3 text-[var(--text-secondary)]">{r.semesterName}</td>
                      <td className="py-2 px-3 text-[var(--text-muted)]">{formatDate(r.courseStartDate)}</td>
                      <td className="py-2 px-3 text-[var(--text-muted)]">{formatDate(r.withdrawalDate)}</td>
                      <td className="py-2 px-3">
                        <Badge variant="secondary" size="sm">W{r.week}</Badge>
                      </td>
                      <td className="py-2 px-3 text-[var(--text-secondary)]">{r.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8 text-sm text-[var(--text-muted)]">{message}</div>
  )
}
