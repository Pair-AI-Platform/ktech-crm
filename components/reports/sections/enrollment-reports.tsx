"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProgressBar } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  GraduationCap,
  Target,
  Building2,
  Wallet,
} from "lucide-react"
import type { EnrollmentReportData } from "@/lib/hooks/use-reports"

interface EnrollmentReportsProps {
  data: EnrollmentReportData
}

export function EnrollmentReports({ data }: EnrollmentReportsProps) {
  const stats = [
    {
      title: "Total Enrolled",
      value: data.totalEnrolled,
      icon: GraduationCap,
      colorClass: "bg-[var(--success)]"
    },
    {
      title: "PUC Enrolled",
      value: data.pucEnrolled,
      icon: Building2,
      colorClass: "bg-[var(--primary)]"
    },
    {
      title: "Self-Funded Enrolled",
      value: data.sfEnrolled,
      icon: Wallet,
      colorClass: "bg-[var(--warning)]"
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* Agent Performance Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[var(--primary)]" />
              Enrollment by Agent
            </CardTitle>
            <CardDescription>Performance against monthly targets</CardDescription>
          </CardHeader>
          <CardContent>
            {data.byAgent.length > 0 ? (
              <div className="space-y-4">
                {data.byAgent.map((agent, index) => (
                  <AgentRow
                    key={agent.agentId}
                    rank={index + 1}
                    agent={agent}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)]">
                No enrollment data available
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

    </div>
  )
}

function AgentRow({
  rank,
  agent,
}: {
  rank: number
  agent: EnrollmentReportData['byAgent'][0]
}) {
  const progressColor = agent.progress >= 100 ? 'success' : agent.progress >= 50 ? 'warning' : 'error'

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)]">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-lg font-bold text-[var(--text-muted)] w-6">{rank}</span>
        <Avatar size="sm">
          {agent.avatarUrl && <AvatarImage src={agent.avatarUrl} />}
          <AvatarFallback>
            {agent.agentName.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-medium text-[var(--text-primary)] truncate">{agent.agentName}</p>
          <p className="text-xs text-[var(--text-muted)]">
            Target: {agent.target}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-xl font-bold text-[var(--text-primary)]">{agent.enrolled}</p>
          <p className="text-xs text-[var(--text-muted)]">enrolled</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-[var(--primary)]">{agent.pucEnrolled}</p>
          <p className="text-xs text-[var(--text-muted)]">PUC</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-[var(--warning)]">{agent.sfEnrolled}</p>
          <p className="text-xs text-[var(--text-muted)]">Self</p>
        </div>
        <div className="w-24">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[var(--text-muted)]">Progress</span>
            <Badge variant={progressColor} size="sm">{agent.progress}%</Badge>
          </div>
          <ProgressBar
            value={agent.progress}
            max={100}
            size="sm"
            variant={progressColor === 'success' ? 'success' : progressColor === 'warning' ? 'warning' : 'error'}
          />
        </div>
      </div>
    </div>
  )
}
