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

      {/* Team Application Targets */}
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
            <div className="space-y-3">
              {allAgentsProgress
                .filter(agent => agent.target > 0)
                .sort((a, b) => b.progress - a.progress)
                .slice(0, 5)
                .map((agent, index) => {
                  const isCurrentUser = agent.agentId === profileId
                  return (
                    <motion.div
                      key={agent.agentId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "p-3 rounded-xl border",
                        isCurrentUser
                          ? "border-[var(--primary)]/30 bg-[var(--primary)]/5"
                          : "border-[var(--border)] bg-[var(--bg-sunken)]"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className={cn(
                              "text-xs font-medium",
                              isCurrentUser
                                ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                                : "bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
                            )}>
                              {agent.agentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className={cn(
                              "text-sm font-medium",
                              isCurrentUser ? "text-[var(--primary)]" : "text-[var(--text-primary)]"
                            )}>
                              {agent.agentName}
                              {isCurrentUser && <span className="text-xs text-[var(--text-muted)] ml-1">(You)</span>}
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* Per-category mini bars */}
                      <div className="space-y-1.5">
                        {agent.categories?.puc && agent.categories.puc.target > 0 && (
                          <MiniCategoryBar label="PUC" color="bg-green-500" cat={agent.categories.puc} />
                        )}
                        {agent.categories?.sf && agent.categories.sf.target > 0 && (
                          <MiniCategoryBar label="SF" color="bg-orange-500" cat={agent.categories.sf} />
                        )}
                      </div>
                    </motion.div>
                  )
                })}
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

function MiniCategoryBar({ label, color, cat }: { label: string; color: string; cat: { target: number; applications: number; progress: number } }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("w-2 h-2 rounded-full flex-shrink-0", color)} />
      <span className="text-[10px] text-[var(--text-muted)] w-6">{label}</span>
      <div className="flex-1 relative h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, cat.progress)}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={cn(
            "absolute inset-y-0 left-0 rounded-full",
            cat.progress >= 100 ? "bg-[var(--success)]" : color
          )}
        />
      </div>
      <span className="text-[10px] font-medium text-[var(--text-muted)] w-10 text-right">{cat.applications}/{cat.target}</span>
    </div>
  )
}
