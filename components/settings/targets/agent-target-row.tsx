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
  const total = pucFiles + sfFiles + sfApplicants + pucAppSubmission

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className={cn(
        "rounded-xl border transition-all",
        expanded
          ? "border-[var(--primary)]/20 bg-[var(--bg-sunken)] shadow-sm"
          : "border-[var(--border)] bg-[var(--bg-sunken)] hover:border-[var(--primary)]/10"
      )}
    >
      {/* Collapsible header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 w-full p-3 text-left"
      >
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={agent.avatar_url} />
          <AvatarFallback className="bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 text-[var(--primary)] text-xs">
            {agent.full_name.split(" ").map((n) => n[0]).join("").toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{agent.full_name}</p>
          <p className="text-[11px] text-[var(--text-muted)] truncate">{agent.email}</p>
        </div>

        {/* Inline target pills - visible in collapsed state */}
        <div className="hidden sm:flex items-center gap-1.5">
          {activeCategories.has('puc_files') && <TargetPill color="bg-green-500" value={pucFiles} />}
          {activeCategories.has('sf_files') && <TargetPill color="bg-orange-500" value={sfFiles} />}
          {activeCategories.has('sf_applicants') && <TargetPill color="bg-blue-500" value={sfApplicants} />}
          {activeCategories.has('puc_app_submission') && <TargetPill color="bg-purple-500" value={pucAppSubmission} />}
        </div>

        <Badge
          variant={total > 0 ? "default" : "secondary"}
          size="sm"
          className="tabular-nums"
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
            <div className="px-3 pb-3 space-y-3">
              {/* Category inputs */}
              {(() => {
                const colCount = activeCategories.size
                const gridClass = colCount === 1 ? "grid-cols-1" : colCount === 2 ? "grid-cols-2" : colCount === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"
                return (
                  <div className={cn("grid gap-3 p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]", gridClass)}>
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
                        label="SF Applicants"
                        sublabel={selectedSeason?.name ?? "Season"}
                        color="bg-blue-500"
                        value={sfApplicants}
                        onChange={(v) => updateTarget(agent.id, 'sf_applicants', v)}
                      />
                    )}
                    {activeCategories.has('puc_app_submission') && (
                      <CategoryInput
                        label="PUC App Submission"
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
                      label="PUC App Submission"
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

function TargetPill({ color, value }: { color: string; value: number }) {
  return (
    <div className={cn(
      "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs tabular-nums",
      value > 0
        ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium"
        : "text-[var(--text-muted)]"
    )}>
      <div className={cn("w-1.5 h-1.5 rounded-full", color, value === 0 && "opacity-30")} />
      {value}
    </div>
  )
}
