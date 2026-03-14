"use client"

import { Badge } from "@/components/ui/badge"
import { Users, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AgentTargetDraft } from "@/lib/hooks/use-target-settings"
import type { Profile, TargetSeason } from "@/types"
import type { TargetCategory, SEASONAL_CATEGORIES } from "./target-header"

interface TeamSummaryProps {
  agents: Profile[]
  getEffectiveTarget: (agentId: string, field: keyof AgentTargetDraft) => number
  activeCategories: Set<TargetCategory>
  selectedSeason?: TargetSeason | null
}

const categoryBase = [
  { key: 'puc_files' as const, label: 'PUC Files', color: 'bg-green-500', lightBg: 'bg-green-500/10', textColor: 'text-green-600 dark:text-green-400', seasonal: false },
  { key: 'sf_files' as const, label: 'SF Files', color: 'bg-orange-500', lightBg: 'bg-orange-500/10', textColor: 'text-orange-600 dark:text-orange-400', seasonal: false },
  { key: 'sf_applicants' as const, label: 'SF Applicants', color: 'bg-blue-500', lightBg: 'bg-blue-500/10', textColor: 'text-blue-600 dark:text-blue-400', seasonal: true },
  { key: 'puc_app_submission' as const, label: 'PUC App Submission', color: 'bg-purple-500', lightBg: 'bg-purple-500/10', textColor: 'text-purple-600 dark:text-purple-400', seasonal: true },
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

  const grandTotal = totals.puc_files + totals.sf_files + totals.sf_applicants + totals.puc_app_submission
  const activeAgents = agents.filter(a => {
    const t = getEffectiveTarget(a.id, 'puc_files') + getEffectiveTarget(a.id, 'sf_files') + getEffectiveTarget(a.id, 'sf_applicants') + getEffectiveTarget(a.id, 'puc_app_submission')
    return t > 0
  }).length

  return (
    <div className="p-4 rounded-xl border border-[var(--border)] bg-gradient-to-r from-[var(--primary)]/5 via-transparent to-[var(--accent)]/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[var(--primary)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            Team Overview
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            {activeAgents} of {agents.length} agents with targets
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span className="text-lg font-bold text-[var(--text-primary)]">{grandTotal}</span>
          <span className="text-xs text-[var(--text-muted)]">total</span>
        </div>
      </div>
      <div className={cn("grid gap-3", filteredCategories.length === 1 ? "grid-cols-1" : filteredCategories.length === 2 ? "grid-cols-2" : filteredCategories.length === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3")}>
        {filteredCategories.map(cat => {
          const value = totals[cat.key]
          const pct = grandTotal > 0 ? Math.round((value / grandTotal) * 100) : 0
          return (
            <div
              key={cat.key}
              className={cn(
                "relative overflow-hidden rounded-xl p-3 border border-[var(--border)]",
                cat.lightBg
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", cat.color)} />
                <span className="text-xs font-medium text-[var(--text-secondary)] truncate">{cat.label}</span>
                {'sublabel' in cat && cat.sublabel && (
                  <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-sunken)] px-1 rounded shrink-0">
                    {cat.sublabel}
                  </span>
                )}
              </div>
              <div className="flex items-end justify-between">
                <span className={cn("text-2xl font-bold", cat.textColor)}>{value}</span>
                {grandTotal > 0 && (
                  <span className="text-[10px] text-[var(--text-muted)] mb-1">{pct}%</span>
                )}
              </div>
              {/* Progress bar at bottom */}
              <div className="mt-2 h-1 rounded-full bg-[var(--border)] overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", cat.color)}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
