"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Target,
  Users,
  History,
  Calendar,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StaticBlock } from "@/components/dashboard/notion"
import { cn } from "@/lib/utils"

interface WeeklyTarget {
  weekNumber: number
  weekLabel: string
  target: number
  applications: number
  progress: number
  isCurrent?: boolean
}

interface TargetSectionProps {
  myTargetProgress: {
    target: number
    applications: number
    progress: number
    remaining: number
    weeklyTargets?: WeeklyTarget[]
    categories?: {
      puc?: { target: number; applications: number; progress: number }
      sf?: { target: number; applications: number; progress: number }
    }
  } | null
  allAgentsProgress: Array<{
    agentId: string
    agentName: string
    target: number
    applications: number
    progress: number
    categories?: {
      puc?: { target: number; applications: number; progress: number }
      sf?: { target: number; applications: number; progress: number }
    }
  }>
  targetHistory: Array<{
    month: string
    monthLabel: string
    target: number
    applications: number
    progress: number
    weeklyTargets: WeeklyTarget[]
  }>
  targetHistoryLoading: boolean
  profileId?: string
}

function getProgressColor(progress: number) {
  if (progress >= 100) return "success"
  if (progress >= 70) return "primary"
  if (progress >= 40) return "warning"
  return "error"
}

export function TargetSection({
  myTargetProgress,
  allAgentsProgress,
  targetHistory,
  targetHistoryLoading,
  profileId,
}: TargetSectionProps) {
  const [expandedHistoryMonths, setExpandedHistoryMonths] = useState<Record<string, boolean>>({})

  const hasTarget = myTargetProgress && myTargetProgress.target > 0
  const hasTeamTargets = allAgentsProgress.length > 0 && allAgentsProgress.filter(a => a.target > 0).length > 0
  const hasHistory = hasTarget && targetHistory.length > 0

  return (
    <>
      {/* Monthly Target Progress — 3 Category Bars */}
      {hasTarget && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StaticBlock
            title="Monthly Target"
            icon={<Target className="w-4 h-4 text-[var(--success)]" />}
          >
            {/* Overall progress */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-3xl font-bold text-[var(--text-primary)]">
                  {myTargetProgress!.applications}
                  <span className="text-lg text-[var(--text-muted)] font-normal"> / {myTargetProgress!.target}</span>
                </p>
                <p className="text-sm text-[var(--text-muted)]">Total across all categories</p>
              </div>
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold",
                `bg-[var(--${getProgressColor(myTargetProgress!.progress)})]/10 text-[var(--${getProgressColor(myTargetProgress!.progress)})]`
              )}>
                {myTargetProgress!.progress}%
              </div>
            </div>

            {/* Per-category progress */}
            <div className="space-y-3">
              {myTargetProgress!.categories?.puc && myTargetProgress!.categories.puc.target > 0 && (
                <CategoryProgressBar
                  label="PUC Files"
                  color="bg-green-500"
                  cat={myTargetProgress!.categories.puc}
                />
              )}
              {myTargetProgress!.categories?.sf && myTargetProgress!.categories.sf.target > 0 && (
                <CategoryProgressBar
                  label="SF Files"
                  color="bg-orange-500"
                  cat={myTargetProgress!.categories.sf}
                />
              )}
            </div>

            <p className="text-sm text-[var(--text-muted)] mt-3">
              {myTargetProgress!.remaining > 0
                ? `${myTargetProgress!.remaining} more to reach target`
                : "Target reached! Great job!"}
            </p>

            {/* Weekly Sub-Targets */}
            {myTargetProgress!.weeklyTargets && myTargetProgress!.weeklyTargets.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Weekly Breakdown
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {myTargetProgress!.weeklyTargets.map((week) => (
                    <div
                      key={week.weekNumber}
                      className={cn(
                        "p-2.5 rounded-lg border",
                        week.isCurrent
                          ? "border-[var(--primary)] bg-[var(--primary)]/5"
                          : "border-[var(--border)] bg-[var(--bg-sunken)]"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={cn(
                          "text-xs font-medium",
                          week.isCurrent ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
                        )}>
                          {week.weekLabel.split(' (')[0]}
                          {week.isCurrent && (
                            <span className="ml-1 inline-block px-1.5 py-0 text-[10px] rounded bg-[var(--primary)] text-white">Now</span>
                          )}
                        </span>
                        <span className={cn(
                          "text-xs font-bold",
                          week.progress >= 100
                            ? "text-[var(--success)]"
                            : week.isCurrent
                              ? "text-[var(--primary)]"
                              : "text-[var(--text-muted)]"
                        )}>
                          {week.applications}/{week.target}
                        </span>
                      </div>
                      <div className="relative h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, week.progress)}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className={cn(
                            "absolute inset-y-0 left-0 rounded-full",
                            week.progress >= 100
                              ? "bg-[var(--success)]"
                              : week.isCurrent
                                ? "bg-[var(--primary)]"
                                : "bg-[var(--text-muted)]/40"
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </StaticBlock>
        </motion.div>
      )}

      {/* Team Application Targets — Table */}
      {hasTeamTargets && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <StaticBlock
            title="Team Targets"
            icon={<Users className="w-4 h-4 text-[var(--primary)]" />}
            headerActions={
              <Link href="/reports">
                <Button variant="ghost" size="sm" className="text-[var(--text-muted)]">
                  View Reports
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            }
          >
            <div className="text-xs text-[var(--text-muted)] mb-3">
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-2 px-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Agent</th>
                    <th className="text-center py-2 px-2 text-xs font-semibold text-green-500 uppercase tracking-wider">
                      <span className="flex items-center justify-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        PUC Files
                      </span>
                    </th>
                    <th className="text-center py-2 px-2 text-xs font-semibold text-orange-500 uppercase tracking-wider">
                      <span className="flex items-center justify-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        SF Files
                      </span>
                    </th>
                    <th className="text-center py-2 px-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Total</th>
                    <th className="text-center py-2 px-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {allAgentsProgress
                    .filter(agent => agent.target > 0)
                    .sort((a, b) => b.progress - a.progress)
                    .map((agent, index) => {
                      const isCurrentUser = agent.agentId === profileId
                      const puc = agent.categories?.puc
                      const sf = agent.categories?.sf
                      const progressColor = getProgressColor(agent.progress)
                      return (
                        <motion.tr
                          key={agent.agentId}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.03 }}
                          className={cn(
                            "border-b border-[var(--border)]/50 transition-colors",
                            isCurrentUser
                              ? "bg-[var(--primary)]/5"
                              : "hover:bg-[var(--bg-sunken)]"
                          )}
                        >
                          <td className="py-2.5 px-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-7 h-7">
                                <AvatarFallback className={cn(
                                  "text-[10px] font-medium",
                                  isCurrentUser
                                    ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                                    : "bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
                                )}>
                                  {agent.agentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <span className={cn(
                                "text-sm font-medium truncate max-w-[120px]",
                                isCurrentUser ? "text-[var(--primary)]" : "text-[var(--text-primary)]"
                              )}>
                                {agent.agentName}
                                {isCurrentUser && <span className="text-[10px] text-[var(--text-muted)] ml-1">(You)</span>}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            {puc && puc.target > 0 ? (
                              <div>
                                <span className="text-sm font-semibold text-[var(--text-primary)]">{puc.applications}</span>
                                <span className="text-xs text-[var(--text-muted)]"> / {puc.target}</span>
                                <div className="mt-1 mx-auto w-full max-w-[60px] h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                                  <div
                                    className={cn("h-full rounded-full", puc.progress >= 100 ? "bg-[var(--success)]" : "bg-green-500")}
                                    style={{ width: `${Math.min(100, puc.progress)}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-[var(--text-muted)]">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            {sf && sf.target > 0 ? (
                              <div>
                                <span className="text-sm font-semibold text-[var(--text-primary)]">{sf.applications}</span>
                                <span className="text-xs text-[var(--text-muted)]"> / {sf.target}</span>
                                <div className="mt-1 mx-auto w-full max-w-[60px] h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                                  <div
                                    className={cn("h-full rounded-full", sf.progress >= 100 ? "bg-[var(--success)]" : "bg-orange-500")}
                                    style={{ width: `${Math.min(100, sf.progress)}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-[var(--text-muted)]">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className="text-sm font-semibold text-[var(--text-primary)]">{agent.applications}</span>
                            <span className="text-xs text-[var(--text-muted)]"> / {agent.target}</span>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className={cn(
                              "inline-flex items-center justify-center min-w-[42px] px-1.5 py-0.5 rounded-full text-xs font-bold",
                              `bg-[var(--${progressColor})]/10 text-[var(--${progressColor})]`
                            )}>
                              {agent.progress}%
                            </span>
                          </td>
                        </motion.tr>
                      )
                    })}
                </tbody>
                {/* Team totals row */}
                {(() => {
                  const agents = allAgentsProgress.filter(a => a.target > 0)
                  const totalPucApps = agents.reduce((s, a) => s + (a.categories?.puc?.applications ?? 0), 0)
                  const totalPucTarget = agents.reduce((s, a) => s + (a.categories?.puc?.target ?? 0), 0)
                  const totalSfApps = agents.reduce((s, a) => s + (a.categories?.sf?.applications ?? 0), 0)
                  const totalSfTarget = agents.reduce((s, a) => s + (a.categories?.sf?.target ?? 0), 0)
                  const totalApps = agents.reduce((s, a) => s + a.applications, 0)
                  const totalTarget = agents.reduce((s, a) => s + a.target, 0)
                  const totalProgress = totalTarget > 0 ? Math.round((totalApps / totalTarget) * 100) : 0
                  const totalColor = getProgressColor(totalProgress)
                  return (
                    <tfoot>
                      <tr className="border-t-2 border-[var(--border)] bg-[var(--bg-sunken)]">
                        <td className="py-2.5 px-2 text-xs font-bold text-[var(--text-secondary)] uppercase">Team Total</td>
                        <td className="py-2.5 px-2 text-center">
                          {totalPucTarget > 0 && (
                            <span className="text-sm font-bold text-[var(--text-primary)]">{totalPucApps}<span className="text-xs text-[var(--text-muted)] font-normal"> / {totalPucTarget}</span></span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {totalSfTarget > 0 && (
                            <span className="text-sm font-bold text-[var(--text-primary)]">{totalSfApps}<span className="text-xs text-[var(--text-muted)] font-normal"> / {totalSfTarget}</span></span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="text-sm font-bold text-[var(--text-primary)]">{totalApps}<span className="text-xs text-[var(--text-muted)] font-normal"> / {totalTarget}</span></span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={cn(
                            "inline-flex items-center justify-center min-w-[42px] px-1.5 py-0.5 rounded-full text-xs font-bold",
                            `bg-[var(--${totalColor})]/10 text-[var(--${totalColor})]`
                          )}>
                            {totalProgress}%
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  )
                })()}
              </table>
            </div>
          </StaticBlock>
        </motion.div>
      )}

      {/* Target History */}
      {hasHistory && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <StaticBlock
            title="Target History"
            icon={<History className="w-4 h-4 text-[var(--accent)]" />}
          >
            <div className="space-y-2">
              {targetHistory.map((month) => {
                const isExpanded = expandedHistoryMonths[month.month]
                const color = getProgressColor(month.progress)
                return (
                  <div
                    key={month.month}
                    className="rounded-xl border border-[var(--border)] bg-[var(--bg-sunken)] overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedHistoryMonths(prev => ({
                        ...prev,
                        [month.month]: !prev[month.month]
                      }))}
                      className="w-full p-3 flex items-center justify-between hover:bg-[var(--bg-elevated)]/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                          `bg-[var(--${color})]/10 text-[var(--${color})]`
                        )}>
                          {month.progress}%
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-[var(--text-primary)]">{month.monthLabel}</p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {month.applications} / {month.target}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 relative h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                          <div
                            className={cn(
                              "absolute inset-y-0 left-0 rounded-full",
                              `bg-[var(--${color})]`
                            )}
                            style={{ width: `${Math.min(100, month.progress)}%` }}
                          />
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                        )}
                      </div>
                    </button>
                    {isExpanded && month.weeklyTargets.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="px-3 pb-3 grid grid-cols-2 gap-2"
                      >
                        {month.weeklyTargets.map((week) => (
                          <div
                            key={week.weekNumber}
                            className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-[var(--text-muted)]">
                                {week.weekLabel.split(' (')[0]}
                              </span>
                              <span className={cn(
                                "text-xs font-bold",
                                week.progress >= 100 ? "text-[var(--success)]" : "text-[var(--text-secondary)]"
                              )}>
                                {week.applications}/{week.target}
                              </span>
                            </div>
                            <div className="relative h-1 rounded-full bg-[var(--bg-sunken)] overflow-hidden">
                              <div
                                className={cn(
                                  "absolute inset-y-0 left-0 rounded-full",
                                  week.progress >= 100
                                    ? "bg-[var(--success)]"
                                    : "bg-[var(--text-muted)]/40"
                                )}
                                style={{ width: `${Math.min(100, week.progress)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                )
              })}
            </div>
          </StaticBlock>
        </motion.div>
      )}
    </>
  )
}

function CategoryProgressBar({ label, color, cat }: { label: string; color: string; cat: { target: number; applications: number; progress: number } }) {
  const progressColor = getProgressColor(cat.progress)
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-[var(--text-secondary)] flex items-center gap-1.5">
          <div className={cn("w-2.5 h-2.5 rounded-full", color)} />
          {label}
        </span>
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {cat.applications} / {cat.target}
          <span className={cn("ml-2 text-xs", `text-[var(--${progressColor})]`)}>{cat.progress}%</span>
        </span>
      </div>
      <div className="relative h-2.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, cat.progress)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("absolute inset-y-0 left-0 rounded-full", `bg-[var(--${progressColor})]`)}
        />
      </div>
    </div>
  )
}

