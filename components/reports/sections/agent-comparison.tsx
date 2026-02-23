"use client"

import { useSyncExternalStore } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getInitials } from "@/lib/utils"
import { ProgressBar } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts"
import {
  Users,
  Trophy,
  TrendingUp,
} from "lucide-react"
import type { AgentComparisonData } from "@/lib/hooks/use-reports"

interface AgentComparisonProps {
  data: AgentComparisonData[]
}

const emptySubscribe = () => () => {}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs font-medium text-[var(--text-primary)] mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}%
          </p>
        ))}
      </div>
    )
  }
  return null
}


export function AgentComparison({ data }: AgentComparisonProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  const barChartData = data.map(agent => ({
    name: agent.agentName.split(' ')[0],
    'Contact %': agent.contactRate,
    'Appointment %': agent.appointmentRate,
    'Enrollment %': agent.enrollmentRate,
  }))

  const radarData = [
    { metric: 'Contact Rate', ...Object.fromEntries(data.slice(0, 4).map(a => [a.agentName.split(' ')[0], a.contactRate])) },
    { metric: 'Appt Rate', ...Object.fromEntries(data.slice(0, 4).map(a => [a.agentName.split(' ')[0], a.appointmentRate])) },
    { metric: 'Enroll Rate', ...Object.fromEntries(data.slice(0, 4).map(a => [a.agentName.split(' ')[0], a.enrollmentRate])) },
    { metric: 'Volume', ...Object.fromEntries(data.slice(0, 4).map(a => {
      const maxLeads = Math.max(...data.map(d => d.totalLeads), 1)
      return [a.agentName.split(' ')[0], Math.round((a.totalLeads / maxLeads) * 100)]
    })) },
  ]

  const RADAR_COLORS = ['var(--primary)', 'var(--success)', 'var(--warning)', 'var(--accent)']

  const bestEnroller = data[0]
  const bestContactor = [...data].sort((a, b) => b.contactRate - a.contactRate)[0]
  const totalEnrolled = data.reduce((sum, a) => sum + a.enrolled, 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card hover glow className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-[var(--success)] shadow-sm">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <Badge variant="success" size="sm">Top Converter</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Highest Enrollment Rate</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{bestEnroller?.agentName || 'N/A'}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {bestEnroller?.enrollmentRate || 0}% enrollment rate
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card hover glow className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-[var(--primary)] shadow-sm">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <Badge variant="info" size="sm">Best Contact</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Highest Contact Rate</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{bestContactor?.agentName || 'N/A'}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {bestContactor?.contactRate || 0}% contact rate
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card hover glow className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-[var(--accent)] shadow-sm">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <Badge variant="secondary" size="sm">Team</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Total Enrollments</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{totalEnrolled}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Across {data.length} active agents
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grouped Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[var(--primary)]" />
                Rate Comparison
              </CardTitle>
              <CardDescription>Contact, appointment, and enrollment rates per agent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]" style={{ minWidth: 0 }}>
                {mounted && barChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ left: 10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                      />
                      <YAxis
                        tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="Contact %" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Appointment %" fill="var(--warning)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Enrollment %" fill="var(--success)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                    No agent data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Radar Chart (top 4 agents) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[var(--accent)]" />
                Agent Radar
              </CardTitle>
              <CardDescription>Multi-metric comparison (top 4 agents)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]" style={{ minWidth: 0 }}>
                {mounted && data.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="var(--border)" />
                      <PolarAngleAxis
                        dataKey="metric"
                        tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                      />
                      {data.slice(0, 4).map((agent, idx) => (
                        <Radar
                          key={agent.agentId}
                          name={agent.agentName.split(' ')[0]}
                          dataKey={agent.agentName.split(' ')[0]}
                          stroke={RADAR_COLORS[idx]}
                          fill={RADAR_COLORS[idx]}
                          fillOpacity={0.1}
                        />
                      ))}
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                    No agent data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Agent Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Agent Performance Details</CardTitle>
            <CardDescription>Full comparison of all agents sorted by enrollment rate</CardDescription>
          </CardHeader>
          <CardContent>
            {data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pr-4">#</th>
                      <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pr-4">Agent</th>
                      <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Leads</th>
                      <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Contacted</th>
                      <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Appts</th>
                      <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Enrolled</th>
                      <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Lost</th>
                      <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Contact %</th>
                      <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 px-3">Enroll %</th>
                      <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide py-3 pl-4 w-32">Funnel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((agent, index) => (
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
                          <span className="text-sm font-semibold text-[var(--text-primary)]">{agent.totalLeads}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-sm text-[var(--text-secondary)]">{agent.contacted}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-sm text-[var(--text-secondary)]">{agent.appointments}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-sm font-semibold text-[var(--success)]">{agent.enrolled}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-sm text-[var(--error)]">{agent.lost}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge variant={agent.contactRate >= 70 ? 'success' : agent.contactRate >= 40 ? 'warning' : 'secondary'} size="sm">
                            {agent.contactRate}%
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge variant={agent.enrollmentRate >= 20 ? 'success' : agent.enrollmentRate >= 10 ? 'warning' : 'secondary'} size="sm">
                            {agent.enrollmentRate}%
                          </Badge>
                        </td>
                        <td className="py-3 pl-4">
                          <ProgressBar value={agent.enrollmentRate} max={100} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)]">
                No agent comparison data available
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
