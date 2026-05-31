"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ArrowUpDown,
  Users,
  Phone,
  Calendar,
  FileText,
  GraduationCap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { LeaderboardData } from "@/lib/hooks/use-reports"

interface AgentDateRangePerformanceProps {
  data: LeaderboardData[]
  dateLabel?: string
}

type SortKey = 'leads' | 'appointments' | 'pucFiles' | 'sfFiles' | 'enrolled'

const COLUMNS: { key: SortKey; label: string; shortLabel: string; icon: typeof Users; color: string }[] = [
  { key: 'leads', label: 'Leads', shortLabel: 'Leads', icon: Users, color: 'text-indigo-500' },
  { key: 'appointments', label: 'Appointments', shortLabel: 'Appts', icon: Calendar, color: 'text-sky-500' },
  { key: 'pucFiles', label: 'PUC Files', shortLabel: 'PUC', icon: FileText, color: 'text-emerald-500' },
  { key: 'sfFiles', label: 'SF Files', shortLabel: 'SF', icon: FileText, color: 'text-orange-500' },
  { key: 'enrolled', label: 'Enrolled', shortLabel: 'Enrl', icon: GraduationCap, color: 'text-green-500' },
]

export function AgentDateRangePerformance({ data, dateLabel }: AgentDateRangePerformanceProps) {
  const [sortBy, setSortBy] = useState<SortKey>('enrolled')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(key)
      setSortOrder('desc')
    }
  }

  const sorted = [...data].sort((a, b) => {
    const aVal = a[sortBy]
    const bVal = b[sortBy]
    return sortOrder === 'desc' ? bVal - aVal : aVal - bVal
  })

  const totalLeads = data.reduce((s, a) => s + a.leads, 0)
  const totalEnrolled = data.reduce((s, a) => s + a.enrolled, 0)
  const totalFiles = data.reduce((s, a) => s + a.pucFiles + a.sfFiles, 0)

  if (data.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className={cn(
        "rounded-2xl overflow-hidden",
        "bg-[var(--bg-surface)] border border-[var(--border-default)]",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                Agent Performance
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Detailed metrics per agent for selected period
              </p>
            </div>
          </div>
          {dateLabel && (
            <Badge variant="secondary" className="font-semibold text-xs px-3 py-1.5 rounded-lg">
              {dateLabel}
            </Badge>
          )}
        </div>

        {/* Summary Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[var(--border-subtle)]">
          {[
            { label: 'Total Leads', value: totalLeads, icon: Users, color: 'text-indigo-500' },
            { label: 'Total Files', value: totalFiles, icon: FileText, color: 'text-orange-500' },
            { label: 'Total Enrolled', value: totalEnrolled, icon: GraduationCap, color: 'text-green-500' },
          ].map((stat) => (
            <div key={stat.label} className="bg-[var(--bg-surface)] px-5 py-4 flex items-center gap-3">
              <stat.icon className={cn("w-4.5 h-4.5", stat.color)} />
              <div>
                <p className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{stat.value}</p>
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-sunken)]/50">
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider w-[180px]">
                  Agent
                </th>
                {COLUMNS.map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={cn(
                      "py-3 px-3 text-center text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors hover:text-[var(--text-primary)]",
                      sortBy === col.key ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span className="hidden sm:inline">{col.shortLabel}</span>
                      <span className="sm:hidden">{col.shortLabel.slice(0, 4)}</span>
                      <ArrowUpDown className={cn(
                        "w-3 h-3 transition-opacity",
                        sortBy === col.key ? "opacity-100" : "opacity-30"
                      )} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((agent, index) => {
                const maxLeads = Math.max(...data.map(a => a.leads), 1)
                const barWidth = (agent.leads / maxLeads) * 100

                return (
                  <motion.tr
                    key={agent.agentId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    className={cn(
                      "border-b border-[var(--border-subtle)] transition-colors hover:bg-[var(--bg-hover)]",
                      index === 0 && "bg-amber-500/[0.03]"
                    )}
                  >
                    {/* Agent */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar size="sm">
                            {agent.avatarUrl && <AvatarImage src={agent.avatarUrl} />}
                            <AvatarFallback className="text-xs bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white">
                              {agent.agentName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          {index < 3 && (
                            <div className={cn(
                              "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white",
                              index === 0 ? "bg-amber-500" : index === 1 ? "bg-gray-400" : "bg-amber-700"
                            )}>
                              {index + 1}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{agent.agentName}</p>
                          {/* Mini progress bar showing lead share */}
                          <div className="mt-1 h-1 w-20 rounded-full bg-[var(--bg-sunken)] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-indigo-500/60 transition-all duration-500"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Leads */}
                    <td className="py-3 px-3 text-center">
                      <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">{agent.leads}</span>
                    </td>

                    {/* Appointments */}
                    <td className="py-3 px-3 text-center">
                      <span className="text-sm font-medium text-[var(--text-secondary)] tabular-nums">{agent.appointments}</span>
                    </td>

                    {/* PUC Files */}
                    <td className="py-3 px-3 text-center">
                      <span className={cn(
                        "inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-md text-sm font-semibold tabular-nums",
                        agent.pucFiles > 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "text-[var(--text-muted)]"
                      )}>
                        {agent.pucFiles}
                      </span>
                    </td>

                    {/* SF Files */}
                    <td className="py-3 px-3 text-center">
                      <span className={cn(
                        "inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-md text-sm font-semibold tabular-nums",
                        agent.sfFiles > 0 ? "bg-orange-500/10 text-orange-600 dark:text-orange-400" : "text-[var(--text-muted)]"
                      )}>
                        {agent.sfFiles}
                      </span>
                    </td>

                    {/* Enrolled */}
                    <td className="py-3 px-3 text-center">
                      <span className={cn(
                        "inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-md text-sm font-bold tabular-nums",
                        agent.enrolled > 0 ? "bg-green-500/10 text-green-600 dark:text-green-400" : "text-[var(--text-muted)]"
                      )}>
                        {agent.enrolled}
                      </span>
                    </td>

                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}
