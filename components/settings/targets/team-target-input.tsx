"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { UsersRound, ChevronDown, Zap } from "lucide-react"
import type { AgentTargetDraft } from "@/lib/hooks/use-target-settings"
import type { TargetCategory } from "./target-header"
import type { TargetSeason } from "@/types"

interface TeamTargetInputProps {
  onApplyToAll: (field: keyof AgentTargetDraft, value: number) => void
  agentCount: number
  activeCategories: Set<TargetCategory>
  selectedSeason?: TargetSeason | null
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

  const handleApply = () => {
    if (puc) onApplyToAll('puc_files', Math.floor((parseInt(puc) || 0) / agentCount))
    if (pucMale) onApplyToAll('puc_files_male', Math.floor((parseInt(pucMale) || 0) / agentCount))
    if (pucFemale) onApplyToAll('puc_files_female', Math.floor((parseInt(pucFemale) || 0) / agentCount))
    if (sf) onApplyToAll('sf_files', Math.floor((parseInt(sf) || 0) / agentCount))
    if (sfMale) onApplyToAll('sf_files_male', Math.floor((parseInt(sfMale) || 0) / agentCount))
    if (sfFemale) onApplyToAll('sf_files_female', Math.floor((parseInt(sfFemale) || 0) / agentCount))
    if (app) onApplyToAll('sf_applicants', Math.floor((parseInt(app) || 0) / agentCount))
    if (pucApp) onApplyToAll('puc_app_submission', Math.floor((parseInt(pucApp) || 0) / agentCount))
  }

  const hasValues = puc || pucMale || pucFemale || sf || sfMale || sfFemale || app || pucApp

  return (
    <div className={cn(
      "rounded-xl border transition-all",
      expanded
        ? "border-[var(--accent)]/30 bg-[var(--accent)]/5"
        : "border-dashed border-[var(--border)] hover:border-[var(--accent)]/30"
    )}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full p-3 text-left"
      >
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
            expanded ? "bg-[var(--accent)]/15" : "bg-[var(--bg-elevated)]"
          )}>
            <UsersRound className={cn(
              "w-3.5 h-3.5",
              expanded ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
            )} />
          </div>
          <div>
            <span className="text-sm font-medium text-[var(--text-primary)]">
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
            <div className="px-3 pb-3 space-y-3">
              {(() => {
                const colCount = activeCategories.size
                const gridClass = colCount === 1 ? "grid-cols-1" : colCount === 2 ? "grid-cols-2" : colCount === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"
                return (
                  <div className={cn("grid gap-3", gridClass)}>
                    {activeCategories.has('puc_files') && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1.5">
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
                          <p className="text-[10px] text-[var(--text-muted)]">
                            Each agent: {Math.floor((parseInt(puc) || 0) / agentCount)}
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <div>
                            <label className="text-[10px] text-[var(--text-muted)]">Male</label>
                            <Input
                              type="number"
                              value={pucMale}
                              onChange={(e) => setPucMale(e.target.value)}
                              placeholder="Male"
                              min={0}
                              className="h-7 text-xs"
                            />
                            {pucMale && (
                              <p className="text-[10px] text-[var(--text-muted)]">
                                Each: {Math.floor((parseInt(pucMale) || 0) / agentCount)}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="text-[10px] text-[var(--text-muted)]">Female</label>
                            <Input
                              type="number"
                              value={pucFemale}
                              onChange={(e) => setPucFemale(e.target.value)}
                              placeholder="Female"
                              min={0}
                              className="h-7 text-xs"
                            />
                            {pucFemale && (
                              <p className="text-[10px] text-[var(--text-muted)]">
                                Each: {Math.floor((parseInt(pucFemale) || 0) / agentCount)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {activeCategories.has('sf_files') && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1.5">
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
                          <p className="text-[10px] text-[var(--text-muted)]">
                            Each agent: {Math.floor((parseInt(sf) || 0) / agentCount)}
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <div>
                            <label className="text-[10px] text-[var(--text-muted)]">Male</label>
                            <Input
                              type="number"
                              value={sfMale}
                              onChange={(e) => setSfMale(e.target.value)}
                              placeholder="Male"
                              min={0}
                              className="h-7 text-xs"
                            />
                            {sfMale && (
                              <p className="text-[10px] text-[var(--text-muted)]">
                                Each: {Math.floor((parseInt(sfMale) || 0) / agentCount)}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="text-[10px] text-[var(--text-muted)]">Female</label>
                            <Input
                              type="number"
                              value={sfFemale}
                              onChange={(e) => setSfFemale(e.target.value)}
                              placeholder="Female"
                              min={0}
                              className="h-7 text-xs"
                            />
                            {sfFemale && (
                              <p className="text-[10px] text-[var(--text-muted)]">
                                Each: {Math.floor((parseInt(sfFemale) || 0) / agentCount)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {activeCategories.has('sf_applicants') && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1.5">
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
                          <p className="text-[10px] text-[var(--text-muted)]">
                            Each agent: {Math.floor((parseInt(app) || 0) / agentCount)}
                          </p>
                        )}
                      </div>
                    )}
                    {activeCategories.has('puc_app_submission') && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          PUC App Submission
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
                          <p className="text-[10px] text-[var(--text-muted)]">
                            Each agent: {Math.floor((parseInt(pucApp) || 0) / agentCount)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })()}

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-[var(--text-muted)]">
                  Only filled fields will be applied. Empty fields are skipped.
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
