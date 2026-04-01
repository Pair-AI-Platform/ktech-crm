"use client"

import { Users, TrendingUp, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AgentTargetDraft } from "@/lib/hooks/use-target-settings"
import type { Profile, Semester } from "@/types"
import type { TargetCategory } from "./target-header"

interface TeamSummaryProps {
  agents: Profile[]
  getEffectiveTarget: (agentId: string, field: keyof AgentTargetDraft) => number
  activeCategories: Set<TargetCategory>
  selectedSeason?: Semester | null
}

const categoryBase = [
  { key: 'puc_files' as const, label: 'PUC Files', color: 'bg-green-500', lightBg: 'bg-green-50 dark:bg-green-500/10', textColor: 'text-green-700 dark:text-green-400', iconBg: 'bg-green-100 dark:bg-green-500/20', seasonal: false },
  { key: 'sf_files' as const, label: 'SF Files', color: 'bg-orange-500', lightBg: 'bg-orange-50 dark:bg-orange-500/10', textColor: 'text-orange-700 dark:text-orange-400', iconBg: 'bg-orange-100 dark:bg-orange-500/20', seasonal: false },
  { key: 'sf_applicants' as const, label: 'SF Enrolled', color: 'bg-blue-500', lightBg: 'bg-blue-50 dark:bg-blue-500/10', textColor: 'text-blue-700 dark:text-blue-400', iconBg: 'bg-blue-100 dark:bg-blue-500/20', seasonal: true },
  { key: 'puc_app_submission' as const, label: 'PUC Enrolled', color: 'bg-purple-500', lightBg: 'bg-purple-50 dark:bg-purple-500/10', textColor: 'text-purple-700 dark:text-purple-400', iconBg: 'bg-purple-100 dark:bg-purple-500/20', seasonal: true },
]

export function TeamSummary({ agents, getEffectiveTarget, activeCategories, selectedSeason }: TeamSummaryProps) {
  const categories = categoryBase.map(c => ({
    ...c,
    sublabel: c.seasonal ? (selectedSeason?.name ?? 'Season') : undefined,
  }))
  const filteredCategories = categories.filter(cat => activeCategories.has(cat.key))
  const totals = agents.reduce(
    (acc, agent) => ({
      puc_files: acc.puc_files + getEffectiveTarget(agent.id, 'puc_files'),
      sf_files: acc.sf_files + getEffectiveTarget(agent.id, 'sf_files'),
      sf_applicants: acc.sf_applicants + getEffectiveTarget(agent.id, 'sf_applicants'),
      puc_app_submission: acc.puc_app_submission + getEffectiveTarget(agent.id, 'puc_app_submission'),
    }),
    { puc_files: 0, sf_files: 0, sf_applicants: 0, puc_app_submission: 0 }
  )

  const grandTotal = filteredCategories.reduce((sum, cat) => sum + totals[cat.key], 0)
  const activeAgents = agents.filter(a => {
    return filteredCategories.some(cat => getEffectiveTarget(a.id, cat.key) > 0)
  }).length

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden">
      {/* Summary header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-gradient-to-r from-[var(--primary)]/5 to-transparent">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[var(--primary)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">Team Overview</span>
          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-sunken)] px-2 py-0.5 rounded-full">
            {activeAgents} of {agents.length} agents
          </span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-xl font-bold text-[var(--text-primary)] tabular-nums">{grandTotal}</span>
          <span className="text-xs text-[var(--text-muted)]">total</span>
        </div>
      </div>

      {/* Category cards */}
      <div className={cn(
        "grid gap-px bg-[var(--border)]",
        filteredCategories.length === 1 ? "grid-cols-1" :
        filteredCategories.length === 2 ? "grid-cols-2" :
        filteredCategories.length === 3 ? "grid-cols-3" :
        "grid-cols-2 sm:grid-cols-4"
      )}>
        {filteredCategories.map(cat => {
          const value = totals[cat.key]
          const perAgent = agents.length > 0 ? Math.round(value / agents.length) : 0
          return (
            <div
              key={cat.key}
              className={cn("p-4 bg-[var(--bg-elevated)]")}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", cat.color)} />
                <span className="text-xs font-medium text-[var(--text-secondary)]">{cat.label}</span>
                {cat.sublabel && (
                  <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-sunken)] px-1.5 py-0.5 rounded shrink-0">
                    {cat.sublabel}
                  </span>
                )}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <span className={cn("text-3xl font-bold tabular-nums", cat.textColor)}>{value}</span>
                  {agents.length > 0 && (
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      ~{perAgent} per agent
                    </p>
                  )}
                </div>
                {value > 0 && (
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", cat.iconBg)}>
                    <ArrowUpRight className={cn("w-4 h-4", cat.textColor)} />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
