"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTargetSettings } from "@/lib/hooks/use-target-settings"
import { TargetHeader, type TargetCategory } from "./target-header"
import { TeamSummary } from "./team-summary"
import { TeamTargetInput } from "./team-target-input"
import { AgentTargetRow } from "./agent-target-row"
import { TargetHistory } from "./target-history"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import type { AgentTargetDraft } from "@/lib/hooks/use-target-settings"

export function TargetSettings() {
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

  const directionRef = { current: 1 as 1 | -1 }

  const currentMonth = (() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })()
  const canGoNext = month < currentMonth

  const handlePrevMonth = () => {
    directionRef.current = -1
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m - 2, 1)
    changeMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const handleNextMonth = () => {
    directionRef.current = 1
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

  const applyToAll = (field: keyof AgentTargetDraft, value: number) => {
    agents.forEach(agent => updateTarget(agent.id, field, value))
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

  return (
    <div className="space-y-5">
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
      />

      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={directionRef.current}>
          <motion.div
            key={`${month}-${selectedSeason?.id ?? 'none'}`}
            custom={directionRef.current}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="space-y-5"
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

            {/* Agent search */}
            {agents.length > 5 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <Input
                  placeholder="Search agents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            )}

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
                <p className="text-sm text-[var(--text-muted)] text-center py-8">
                  No agents found matching &ldquo;{search}&rdquo;
                </p>
              )}
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
