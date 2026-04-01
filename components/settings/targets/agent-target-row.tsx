"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { CategoryInput } from "./category-input"
import { WeeklyBreakdown } from "./weekly-breakdown"
import type { Profile, Semester } from "@/types"
import type { AgentTargetDraft } from "@/lib/hooks/use-target-settings"
import type { TargetCategory } from "./target-header"

interface AgentTargetRowProps {
  agent: Profile
  index: number
  getEffectiveTarget: (agentId: string, field: keyof AgentTargetDraft) => number
  updateTarget: (agentId: string, field: keyof AgentTargetDraft, value: number) => void
  updateWeekly: (agentId: string, field: 'weekly_puc_files' | 'weekly_sf_files' | 'weekly_sf_applicants' | 'weekly_puc_app_submission', value: number[]) => void
  weeklyPucFiles?: number[] | null
  weeklySfFiles?: number[] | null
  weeklySfApplicants?: number[] | null
  weeklyPucAppSubmission?: number[] | null
  defaultExpanded?: boolean
  activeCategories: Set<TargetCategory>
  selectedSeason?: Semester | null
}

const categoryColors: Record<TargetCategory, { dot: string; text: string; bg: string }> = {
  puc_files: { dot: 'bg-green-500', text: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10' },
  sf_files: { dot: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10' },
  sf_applicants: { dot: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  puc_app_submission: { dot: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10' },
}

export function AgentTargetRow({
  agent,
  index,
  getEffectiveTarget,
  updateTarget,
  updateWeekly,
  weeklyPucFiles,
  weeklySfFiles,
  weeklySfApplicants,
  weeklyPucAppSubmission,
  defaultExpanded = false,
  activeCategories,
  selectedSeason,
}: AgentTargetRowProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const pucFiles = getEffectiveTarget(agent.id, 'puc_files')
  const sfFiles = getEffectiveTarget(agent.id, 'sf_files')
  const sfApplicants = getEffectiveTarget(agent.id, 'sf_applicants')
  const pucAppSubmission = getEffectiveTarget(agent.id, 'puc_app_submission')
  const total = (activeCategories.has('puc_files') ? pucFiles : 0) +
    (activeCategories.has('sf_files') ? sfFiles : 0) +
    (activeCategories.has('sf_applicants') ? sfApplicants : 0) +
    (activeCategories.has('puc_app_submission') ? pucAppSubmission : 0)

  const activeCats = (['puc_files', 'sf_files', 'sf_applicants', 'puc_app_submission'] as TargetCategory[])
    .filter(c => activeCategories.has(c))

  const values: Record<TargetCategory, number> = {
    puc_files: pucFiles,
    sf_files: sfFiles,
    sf_applicants: sfApplicants,
    puc_app_submission: pucAppSubmission,
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className={cn(
        "rounded-xl border transition-all",
        expanded
          ? "border-[var(--primary)]/20 bg-[var(--bg-elevated)] shadow-sm ring-1 ring-[var(--primary)]/5"
          : "border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--primary)]/10 hover:shadow-sm"
      )}
    >
      {/* Collapsible header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center w-full px-4 py-3 text-left gap-3"
      >
        <Avatar className="w-9 h-9 flex-shrink-0">
          <AvatarImage src={agent.avatar_url} />
          <AvatarFallback className="bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 text-[var(--primary)] text-xs font-semibold">
            {agent.full_name.split(" ").map((n) => n[0]).join("").toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 mr-2">
          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{agent.full_name}</p>
          <p className="text-[11px] text-[var(--text-muted)] truncate">{agent.email}</p>
        </div>

        {/* Target values in aligned columns */}
        <div className="hidden sm:grid gap-2" style={{ gridTemplateColumns: `repeat(${activeCats.length}, 64px)` }}>
          {activeCats.map(cat => {
            const val = values[cat]
            const colors = categoryColors[cat]
            return (
              <div
                key={cat}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg text-xs tabular-nums font-semibold",
                  val > 0
                    ? cn(colors.bg, colors.text)
                    : "text-[var(--text-muted)] bg-[var(--bg-sunken)]"
                )}
              >
                <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", colors.dot, val === 0 && "opacity-30")} />
                {val}
              </div>
            )
          })}
        </div>

        <Badge
          variant={total > 0 ? "default" : "secondary"}
          size="sm"
          className="tabular-nums min-w-[32px] justify-center"
        >
          {total}
        </Badge>

        <ChevronDown className={cn(
          "w-4 h-4 text-[var(--text-muted)] transition-transform flex-shrink-0",
          expanded && "rotate-180"
        )} />
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-[var(--border)] pt-3">
              {/* Category inputs */}
              {(() => {
                const colCount = activeCategories.size
                const gridClass = colCount === 1 ? "grid-cols-1" : colCount === 2 ? "grid-cols-2" : colCount === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"
                return (
                  <div className={cn("grid gap-3 p-3 rounded-lg bg-[var(--bg-sunken)] border border-[var(--border)]", gridClass)}>
                    {activeCategories.has('puc_files') && (
                      <CategoryInput
                        label="PUC Files"
                        color="bg-green-500"
                        value={pucFiles}
                        onChange={(v) => updateTarget(agent.id, 'puc_files', v)}
                        maleValue={getEffectiveTarget(agent.id, 'puc_files_male')}
                        femaleValue={getEffectiveTarget(agent.id, 'puc_files_female')}
                        onMaleChange={(v) => updateTarget(agent.id, 'puc_files_male', v)}
                        onFemaleChange={(v) => updateTarget(agent.id, 'puc_files_female', v)}
                      />
                    )}
                    {activeCategories.has('sf_files') && (
                      <CategoryInput
                        label="SF Files"
                        color="bg-orange-500"
                        value={sfFiles}
                        onChange={(v) => updateTarget(agent.id, 'sf_files', v)}
                        maleValue={getEffectiveTarget(agent.id, 'sf_files_male')}
                        femaleValue={getEffectiveTarget(agent.id, 'sf_files_female')}
                        onMaleChange={(v) => updateTarget(agent.id, 'sf_files_male', v)}
                        onFemaleChange={(v) => updateTarget(agent.id, 'sf_files_female', v)}
                      />
                    )}
                    {activeCategories.has('sf_applicants') && (
                      <CategoryInput
                        label="SF Enrolled"
                        sublabel={selectedSeason?.name ?? "Season"}
                        color="bg-blue-500"
                        value={sfApplicants}
                        onChange={(v) => updateTarget(agent.id, 'sf_applicants', v)}
                      />
                    )}
                    {activeCategories.has('puc_app_submission') && (
                      <CategoryInput
                        label="PUC Enrolled"
                        sublabel={selectedSeason?.name ?? "Season"}
                        color="bg-purple-500"
                        value={pucAppSubmission}
                        onChange={(v) => updateTarget(agent.id, 'puc_app_submission', v)}
                      />
                    )}
                  </div>
                )
              })()}

              {/* Weekly breakdowns */}
              {total > 0 && (
                <div className="space-y-1">
                  {activeCategories.has('puc_files') && pucFiles > 0 && (
                    <WeeklyBreakdown
                      category="puc_files"
                      label="PUC Files"
                      total={pucFiles}
                      weekly={weeklyPucFiles}
                      onWeeklyChange={(v) => updateWeekly(agent.id, 'weekly_puc_files', v)}
                    />
                  )}
                  {activeCategories.has('sf_files') && sfFiles > 0 && (
                    <WeeklyBreakdown
                      category="sf_files"
                      label="SF Files"
                      total={sfFiles}
                      weekly={weeklySfFiles}
                      onWeeklyChange={(v) => updateWeekly(agent.id, 'weekly_sf_files', v)}
                    />
                  )}
                  {activeCategories.has('puc_app_submission') && pucAppSubmission > 0 && (
                    <WeeklyBreakdown
                      category="puc_app_submission"
                      label="PUC Enrolled"
                      total={pucAppSubmission}
                      weekly={weeklyPucAppSubmission}
                      onWeeklyChange={(v) => updateWeekly(agent.id, 'weekly_puc_app_submission', v)}
                    />
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
