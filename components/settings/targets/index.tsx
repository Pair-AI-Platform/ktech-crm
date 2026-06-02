"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTargetSettings } from "@/lib/hooks/use-target-settings"
import { useUser } from "@/lib/hooks/use-user"
import { TargetHeader, type TargetCategory } from "./target-header"
import { TeamSummary } from "./team-summary"
import { TeamTargetInput } from "./team-target-input"
import { AgentTargetRow } from "./agent-target-row"
import { TargetHistory } from "./target-history"
import { AgentTargetView } from "./agent-target-view"
import { Input } from "@/components/ui/input"
import { Search, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AgentTargetDraft } from "@/lib/hooks/use-target-settings"

const categoryLabels: { key: TargetCategory; label: string }[] = [
  { key: 'puc_files', label: 'PUC' },
  { key: 'sf_files', label: 'SF' },
  { key: 'sf_applicants', label: 'SF Enr' },
  { key: 'puc_app_submission', label: 'PUC Enrolled' },
]

export function TargetSettings() {
  const { isAdmin } = useUser()

  if (!isAdmin) {
    return <AgentTargetView />
  }

  return <AdminTargetSettings />
}

function AdminTargetSettings() {
  const {
    agents,
    historyTargets,
    historyLoading,
    seasons,
    selectedSeason,
    month,
    changeMonth,
    changeSeason,
    loading,
    saving,
    hasUnsavedChanges,
    getEffectiveTarget,
    getWeekly,
    updateTarget,
    updateWeekly,
    saveAll,
  } = useTargetSettings()

  const [direction, setDirection] = useState<1 | -1>(1)

  // Allow planning targets up to 12 months into the future
  const maxMonth = (() => {
    const now = new Date()
    const d = new Date(now.getFullYear(), now.getMonth() + 12, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })()
  const canGoNext = month < maxMonth

  const handlePrevMonth = () => {
    setDirection(-1)
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m - 2, 1)
    changeMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const handleNextMonth = () => {
    setDirection(1)
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m, 1)
    changeMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const [saveSuccess, setSaveSuccess] = useState(false)
  const [search, setSearch] = useState("")
  const [activeCategories, setActiveCategories] = useState<Set<TargetCategory>>(
    new Set<TargetCategory>(['puc_files', 'sf_files', 'sf_applicants', 'puc_app_submission'])
  )

  const handleToggleCategory = (cat: TargetCategory) => {
    setActiveCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) {
        if (next.size > 1) next.delete(cat)
      } else {
        next.add(cat)
      }
      return next
    })
  }

  const handleSave = async () => {
    await saveAll()
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }

  const applyToAll = (field: keyof AgentTargetDraft, total: number) => {
    const base = Math.floor(total / agents.length)
    const remainder = total % agents.length
    agents.forEach((agent, i) => {
      updateTarget(agent.id, field, i < remainder ? base + 1 : base)
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
          <p className="text-sm text-[var(--text-muted)]">Loading targets...</p>
        </div>
      </div>
    )
  }

  const filteredAgents = search
    ? agents.filter(a =>
        a.full_name.toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase())
      )
    : agents

  const slideVariants = {
    enter: (dir: number) => ({ x: dir * 40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir * -40, opacity: 0 }),
  }

  const activeCats = categoryLabels.filter(c => activeCategories.has(c.key))

  return (
    <div className="space-y-6">
      <TargetHeader
        month={month}
        saving={saving}
        saveSuccess={saveSuccess}
        onSave={handleSave}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        canGoNext={canGoNext}
        hasUnsavedChanges={hasUnsavedChanges}
        activeCategories={activeCategories}
        onToggleCategory={handleToggleCategory}
        seasons={seasons}
        selectedSeason={selectedSeason}
        onChangeSeason={changeSeason}
        direction={direction}
      />

      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`${month}-${selectedSeason?.id ?? 'none'}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="space-y-6"
          >
            <TeamSummary
              agents={agents}
              getEffectiveTarget={getEffectiveTarget}
              activeCategories={activeCategories}
              selectedSeason={selectedSeason}
            />

            <TeamTargetInput
              onApplyToAll={applyToAll}
              agentCount={agents.length}
              activeCategories={activeCategories}
              selectedSeason={selectedSeason}
            />

            {/* Agent list section */}
            <div className="space-y-3">
              {/* Section header with search */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="text-sm font-semibold text-[var(--text-primary)]">Individual Targets</span>
                  <span className="text-xs text-[var(--text-muted)]">{agents.length} agents</span>
                </div>
                {agents.length > 5 && (
                  <div className="relative w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <Input
                      placeholder="Search agents..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 h-8 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Column headers */}
              <div className="hidden sm:flex items-center px-4 py-2 rounded-lg bg-[var(--bg-sunken)] border border-[var(--border)]">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9" /> {/* Avatar spacer */}
                  <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Agent</span>
                </div>
                <div className="grid gap-2 mr-[76px]" style={{ gridTemplateColumns: `repeat(${activeCats.length}, 64px)` }}>
                  {activeCats.map(cat => (
                    <span key={cat.key} className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider text-center">
                      {cat.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Agent list */}
              <div className="space-y-2">
                {filteredAgents.map((agent, index) => (
                  <AgentTargetRow
                    key={agent.id}
                    agent={agent}
                    index={index}
                    getEffectiveTarget={getEffectiveTarget}
                    updateTarget={updateTarget}
                    updateWeekly={updateWeekly}
                    weeklyPucFiles={getWeekly(agent.id, 'weekly_puc_files')}
                    weeklySfFiles={getWeekly(agent.id, 'weekly_sf_files')}
                    weeklySfApplicants={getWeekly(agent.id, 'weekly_sf_applicants')}
                    weeklyPucAppSubmission={getWeekly(agent.id, 'weekly_puc_app_submission')}
                    activeCategories={activeCategories}
                    selectedSeason={selectedSeason}
                  />
                ))}
                {search && filteredAgents.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Search className="w-8 h-8 text-[var(--text-muted)] mb-2 opacity-40" />
                    <p className="text-sm text-[var(--text-muted)]">
                      No agents found matching &ldquo;{search}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <TargetHistory
        historyTargets={historyTargets}
        agents={agents}
        loading={historyLoading}
      />
    </div>
  )
}
