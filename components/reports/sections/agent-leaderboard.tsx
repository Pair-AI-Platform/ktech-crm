"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProgressBar } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Trophy,
  Medal,
  Users,
  GraduationCap,
  TrendingUp,
  ArrowUpDown,
  Crown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { LeaderboardData } from "@/lib/hooks/use-reports"

interface AgentLeaderboardProps {
  data: LeaderboardData[]
}

type SortKey = 'rank' | 'leads' | 'appointments' | 'applications' | 'enrolled' | 'conversionRate'

export function AgentLeaderboard({ data }: AgentLeaderboardProps) {
  const [sortBy, setSortBy] = useState<SortKey>('enrolled')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const sortedData = [...data].sort((a, b) => {
    const aVal = a[sortBy]
    const bVal = b[sortBy]
    return sortOrder === 'desc' ? bVal - aVal : aVal - bVal
  }).map((item, index) => ({ ...item, rank: index + 1 }))

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(key)
      setSortOrder('desc')
    }
  }

  const topPerformers = sortedData.slice(0, 3)
  const totalLeads = data.reduce((sum, a) => sum + a.leads, 0)
  const totalEnrolled = data.reduce((sum, a) => sum + a.enrolled, 0)
  const avgConversion = data.length > 0
    ? Math.round(data.reduce((sum, a) => sum + a.conversionRate, 0) / data.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Top 3 Performers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topPerformers.map((agent, index) => (
          <motion.div
            key={agent.agentId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card
              hover
              glow
              className={cn(
                "relative overflow-hidden",
                index === 0 && "ring-2 ring-[var(--warning)]"
              )}
            >
              <CardContent className="p-5">
                {/* Rank Badge */}
                <div className="absolute top-3 right-3">
                  {index === 0 && (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                  )}
                  {index === 1 && (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow-lg">
                      <Medal className="w-5 h-5 text-white" />
                    </div>
                  )}
                  {index === 2 && (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg">
                      <Medal className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <Avatar size="lg">
                    {agent.avatarUrl && <AvatarImage src={agent.avatarUrl} />}
                    <AvatarFallback className="text-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white">
                      {agent.agentName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{agent.agentName}</p>
                    <p className="text-sm text-[var(--text-muted)]">Rank #{agent.rank}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Stat label="Enrolled" value={agent.enrolled} />
                  <Stat label="Leads" value={agent.leads} />
                  <Stat label="Conv. Rate" value={`${agent.conversionRate}%`} />
                  <Stat label="Progress" value={`${agent.progress}%`} />
                </div>

                {/* Target Progress - always 3 categories */}
                <div className="mt-4 space-y-2">
                  {agent.categories?.puc && agent.categories.puc.target > 0 && (
                    <CategoryBar label="PUC Files" color="green" cat={agent.categories.puc} />
                  )}
                  {agent.categories?.sf && agent.categories.sf.target > 0 && (
                    <CategoryBar label="SF Files" color="orange" cat={agent.categories.sf} />
                  )}
                </div>
              </CardContent>
              <div className={cn(
                "absolute bottom-0 left-0 right-0 h-1 opacity-50",
                index === 0 ? "bg-gradient-to-r from-amber-400 to-amber-600" :
                index === 1 ? "bg-gradient-to-r from-gray-300 to-gray-500" :
                "bg-gradient-to-r from-amber-600 to-amber-800"
              )} />
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-[var(--bg-sunken)]">
                <Users className="w-5 h-5 mx-auto mb-2 text-[var(--primary)]" />
                <p className="text-2xl font-bold text-[var(--text-primary)]">{data.length}</p>
                <p className="text-xs text-[var(--text-muted)]">Active Agents</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-[var(--bg-sunken)]">
                <Users className="w-5 h-5 mx-auto mb-2 text-[var(--info)]" />
                <p className="text-2xl font-bold text-[var(--text-primary)]">{totalLeads}</p>
                <p className="text-xs text-[var(--text-muted)]">Total Leads</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-[var(--bg-sunken)]">
                <GraduationCap className="w-5 h-5 mx-auto mb-2 text-[var(--success)]" />
                <p className="text-2xl font-bold text-[var(--text-primary)]">{totalEnrolled}</p>
                <p className="text-xs text-[var(--text-muted)]">Total Enrolled</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-[var(--bg-sunken)]">
                <TrendingUp className="w-5 h-5 mx-auto mb-2 text-[var(--accent)]" />
                <p className="text-2xl font-bold text-[var(--text-primary)]">{avgConversion}%</p>
                <p className="text-xs text-[var(--text-muted)]">Avg Conversion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Full Leaderboard Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[var(--warning)]" />
              Full Leaderboard
            </CardTitle>
            <CardDescription>Click column headers to sort</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">
                      Rank
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">
                      Agent
                    </th>
                    <SortHeader label="Leads" sortKey="leads" currentSort={sortBy} onSort={handleSort} />
                    <SortHeader label="Appointments" sortKey="appointments" currentSort={sortBy} onSort={handleSort} />
                    <SortHeader label="Applications" sortKey="applications" currentSort={sortBy} onSort={handleSort} />
                    <SortHeader label="Enrolled" sortKey="enrolled" currentSort={sortBy} onSort={handleSort} />
                    <SortHeader label="Conv %" sortKey="conversionRate" currentSort={sortBy} onSort={handleSort} />
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">
                      Targets
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((agent) => (
                    <tr
                      key={agent.agentId}
                      className="border-b border-[var(--border)] hover:bg-[var(--bg-sunken)] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <RankBadge rank={agent.rank} />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar size="sm">
                            {agent.avatarUrl && <AvatarImage src={agent.avatarUrl} />}
                            <AvatarFallback>
                              {agent.agentName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-[var(--text-primary)]">{agent.agentName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-[var(--text-primary)]">{agent.leads}</td>
                      <td className="py-3 px-4 text-sm text-[var(--text-primary)]">{agent.appointments}</td>
                      <td className="py-3 px-4 text-sm text-[var(--text-primary)]">{agent.applications}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-[var(--text-primary)]">{agent.enrolled}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={agent.conversionRate >= 40 ? 'success' : agent.conversionRate >= 20 ? 'warning' : 'secondary'}
                          size="sm"
                        >
                          {agent.conversionRate}%
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {agent.categories?.puc && agent.categories.puc.target > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                              <div className="w-16">
                                <ProgressBar value={agent.categories.puc.progress} max={100} size="sm" className="[--progress-gradient-from:theme(colors.green.400)] [--progress-gradient-to:theme(colors.green.600)]" variant={agent.categories.puc.progress >= 100 ? 'success' : 'gradient'} />
                              </div>
                              <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">{agent.categories.puc.applications}/{agent.categories.puc.target}</span>
                            </div>
                          )}
                          {agent.categories?.sf && agent.categories.sf.target > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                              <div className="w-16">
                                <ProgressBar value={agent.categories.sf.progress} max={100} size="sm" className="[--progress-gradient-from:theme(colors.orange.400)] [--progress-gradient-to:theme(colors.orange.600)]" variant={agent.categories.sf.progress >= 100 ? 'success' : 'gradient'} />
                              </div>
                              <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">{agent.categories.sf.applications}/{agent.categories.sf.target}</span>
                            </div>
                          )}
                          {(!agent.categories?.puc?.target && !agent.categories?.sf?.target) && (
                            <span className="text-xs text-[var(--text-muted)]">No target</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

function CategoryBar({ label, color, cat }: { label: string; color: string; cat: { target: number; applications: number; progress: number } }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full bg-${color}-500`} />
          {label}
        </span>
        <span className="text-xs font-medium text-[var(--text-primary)]">
          {cat.applications} / {cat.target}
        </span>
      </div>
      <ProgressBar
        value={cat.progress}
        max={100}
        size="sm"
        className={`[--progress-gradient-from:theme(colors.${color}.400)] [--progress-gradient-to:theme(colors.${color}.600)]`}
        variant={cat.progress >= 100 ? 'success' : 'gradient'}
      />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center p-2 rounded-lg bg-[var(--bg-sunken)]">
      <p className="text-lg font-bold text-[var(--text-primary)]">{value}</p>
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
    </div>
  )
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
        <span className="text-xs font-bold text-white">1</span>
      </div>
    )
  }
  if (rank === 2) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center">
        <span className="text-xs font-bold text-white">2</span>
      </div>
    )
  }
  if (rank === 3) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center">
        <span className="text-xs font-bold text-white">3</span>
      </div>
    )
  }
  return (
    <div className="w-8 h-8 rounded-full bg-[var(--bg-sunken)] flex items-center justify-center">
      <span className="text-xs font-bold text-[var(--text-muted)]">{rank}</span>
    </div>
  )
}

function SortHeader({
  label,
  sortKey,
  currentSort,
  onSort,
}: {
  label: string
  sortKey: SortKey
  currentSort: SortKey
  onSort: (key: SortKey) => void
}) {
  const isActive = currentSort === sortKey

  return (
    <th
      className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-primary)] transition-colors"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={cn(
          "w-3 h-3 transition-colors",
          isActive ? "text-[var(--primary)]" : "text-[var(--text-disabled)]"
        )} />
      </div>
    </th>
  )
}
