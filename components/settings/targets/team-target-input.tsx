"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { UsersRound, ChevronDown, Zap } from "lucide-react"
import type { AgentTargetDraft } from "@/lib/hooks/use-target-settings"
import type { TargetCategory } from "./target-header"
import type { Semester } from "@/types"

interface TeamTargetInputProps {
  onApplyToAll: (field: keyof AgentTargetDraft, value: number) => void
  agentCount: number
  activeCategories: Set<TargetCategory>
  selectedSeason?: Semester | null
}

export function TeamTargetInput({ onApplyToAll, agentCount, activeCategories, selectedSeason }: TeamTargetInputProps) {
  const [expanded, setExpanded] = useState(false)
  const [puc, setPuc] = useState("")
  const [pucMale, setPucMale] = useState("")
  const [pucFemale, setPucFemale] = useState("")
  const [sf, setSf] = useState("")
  const [sfMale, setSfMale] = useState("")
  const [sfFemale, setSfFemale] = useState("")
  const [app, setApp] = useState("")
  const [pucApp, setPucApp] = useState("")

  // Auto-fill Male = Total - Female
  useEffect(() => {
    const total = parseInt(puc) || 0
    const female = parseInt(pucFemale) || 0
    if (puc && total >= female) {
      setPucMale(String(total - female))
    }
  }, [puc, pucFemale])

  useEffect(() => {
    const total = parseInt(sf) || 0
    const female = parseInt(sfFemale) || 0
    if (sf && total >= female) {
      setSfMale(String(total - female))
    }
  }, [sf, sfFemale])

  const handleApply = () => {
    if (puc) onApplyToAll('puc_files', parseInt(puc) || 0)
    if (pucMale) onApplyToAll('puc_files_male', parseInt(pucMale) || 0)
    if (pucFemale) onApplyToAll('puc_files_female', parseInt(pucFemale) || 0)
    if (sf) onApplyToAll('sf_files', parseInt(sf) || 0)
    if (sfMale) onApplyToAll('sf_files_male', parseInt(sfMale) || 0)
    if (sfFemale) onApplyToAll('sf_files_female', parseInt(sfFemale) || 0)
    if (app) onApplyToAll('sf_applicants', parseInt(app) || 0)
    if (pucApp) onApplyToAll('puc_app_submission', parseInt(pucApp) || 0)
  }

  const hasValues = puc || pucMale || pucFemale || sf || sfMale || sfFemale || app || pucApp

  return (
    <div className={cn(
      "rounded-xl border transition-all",
      expanded
        ? "border-[var(--accent)]/30 bg-[var(--bg-elevated)] shadow-sm"
        : "border-dashed border-[var(--border)] hover:border-[var(--accent)]/20 bg-[var(--bg-elevated)]"
    )}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
            expanded ? "bg-[var(--accent)]/15" : "bg-[var(--bg-sunken)]"
          )}>
            <UsersRound className={cn(
              "w-4 h-4",
              expanded ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
            )} />
          </div>
          <div>
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              Set Target for Whole Team
            </span>
            <p className="text-[11px] text-[var(--text-muted)]">
              Set a total target split across all {agentCount} agents
            </p>
          </div>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-[var(--text-muted)] transition-transform",
          expanded && "rotate-180"
        )} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-[var(--border)] pt-3">
              {(() => {
                const colCount = activeCategories.size
                const gridClass = colCount === 1 ? "grid-cols-1" : colCount === 2 ? "grid-cols-2" : colCount === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"
                return (
                  <div className={cn("grid gap-4", gridClass)}>
                    {activeCategories.has('puc_files') && (
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          PUC Files
                        </label>
                        <Input
                          type="number"
                          value={puc}
                          onChange={(e) => setPuc(e.target.value)}
                          placeholder="Team total"
                          min={0}
                          className="h-9 font-semibold"
                        />
                        {puc && (
                          <p className="text-[11px] text-[var(--primary)] font-medium">
                            ~{Math.floor((parseInt(puc) || 0) / agentCount)} per agent
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <label className="text-[10px] text-[var(--text-muted)] font-medium">Male</label>
                            <Input
                              type="number"
                              value={pucMale}
                              onChange={(e) => setPucMale(e.target.value)}
                              placeholder="0"
                              min={0}
                              className="h-7 text-xs"
                            />
                            {pucMale && (
                              <p className="text-[10px] text-[var(--text-muted)]">
                                ~{Math.floor((parseInt(pucMale) || 0) / agentCount)} each
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="text-[10px] text-[var(--text-muted)] font-medium">Female</label>
                            <Input
                              type="number"
                              value={pucFemale}
                              onChange={(e) => setPucFemale(e.target.value)}
                              placeholder="0"
                              min={0}
                              className="h-7 text-xs"
                            />
                            {pucFemale && (
                              <p className="text-[10px] text-[var(--text-muted)]">
                                ~{Math.floor((parseInt(pucFemale) || 0) / agentCount)} each
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {activeCategories.has('sf_files') && (
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          SF Files
                        </label>
                        <Input
                          type="number"
                          value={sf}
                          onChange={(e) => setSf(e.target.value)}
                          placeholder="Team total"
                          min={0}
                          className="h-9 font-semibold"
                        />
                        {sf && (
                          <p className="text-[11px] text-[var(--primary)] font-medium">
                            ~{Math.floor((parseInt(sf) || 0) / agentCount)} per agent
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <label className="text-[10px] text-[var(--text-muted)] font-medium">Male</label>
                            <Input
                              type="number"
                              value={sfMale}
                              onChange={(e) => setSfMale(e.target.value)}
                              placeholder="0"
                              min={0}
                              className="h-7 text-xs"
                            />
                            {sfMale && (
                              <p className="text-[10px] text-[var(--text-muted)]">
                                ~{Math.floor((parseInt(sfMale) || 0) / agentCount)} each
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="text-[10px] text-[var(--text-muted)] font-medium">Female</label>
                            <Input
                              type="number"
                              value={sfFemale}
                              onChange={(e) => setSfFemale(e.target.value)}
                              placeholder="0"
                              min={0}
                              className="h-7 text-xs"
                            />
                            {sfFemale && (
                              <p className="text-[10px] text-[var(--text-muted)]">
                                ~{Math.floor((parseInt(sfFemale) || 0) / agentCount)} each
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {activeCategories.has('sf_applicants') && (
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          SF Applicants
                          <span className="text-[10px] font-normal bg-[var(--bg-sunken)] px-1.5 py-0.5 rounded">
                            {selectedSeason?.name ?? 'Season'}
                          </span>
                        </label>
                        <Input
                          type="number"
                          value={app}
                          onChange={(e) => setApp(e.target.value)}
                          placeholder="Team total"
                          min={0}
                          className="h-9 font-semibold"
                        />
                        {app && (
                          <p className="text-[11px] text-[var(--primary)] font-medium">
                            ~{Math.floor((parseInt(app) || 0) / agentCount)} per agent
                          </p>
                        )}
                      </div>
                    )}
                    {activeCategories.has('puc_app_submission') && (
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          PUC App
                          <span className="text-[10px] font-normal bg-[var(--bg-sunken)] px-1.5 py-0.5 rounded">
                            {selectedSeason?.name ?? 'Season'}
                          </span>
                        </label>
                        <Input
                          type="number"
                          value={pucApp}
                          onChange={(e) => setPucApp(e.target.value)}
                          placeholder="Team total"
                          min={0}
                          className="h-9 font-semibold"
                        />
                        {pucApp && (
                          <p className="text-[11px] text-[var(--primary)] font-medium">
                            ~{Math.floor((parseInt(pucApp) || 0) / agentCount)} per agent
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })()}

              <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                <p className="text-[11px] text-[var(--text-muted)]">
                  Only filled fields will be applied
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleApply}
                  disabled={!hasValues}
                  className="gap-1.5"
                >
                  <Zap className="w-3 h-3" />
                  Apply to All
                  <Badge variant="secondary" size="sm" className="ml-0.5 text-[10px]">
                    {agentCount}
                  </Badge>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
