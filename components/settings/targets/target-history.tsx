"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { History, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AgentTarget, Profile } from "@/types"

interface TargetHistoryProps {
  historyTargets: AgentTarget[]
  agents: Profile[]
  loading: boolean
}

export function TargetHistory({ historyTargets, agents, loading }: TargetHistoryProps) {
  const [expanded, setExpanded] = useState(false)

  if (loading || historyTargets.length === 0) return null

  // Group by month
  const byMonth = historyTargets.reduce<Record<string, AgentTarget[]>>((acc, t) => {
    if (!acc[t.month]) acc[t.month] = []
    acc[t.month].push(t)
    return acc
  }, {})

  const months = Object.keys(byMonth).sort().reverse().slice(0, 6)

  return (
    <div className={cn(
      "rounded-xl border transition-all",
      expanded ? "border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm" : "border-dashed border-[var(--border)] bg-[var(--bg-elevated)]"
    )}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-4 py-3"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
            expanded ? "bg-[var(--primary)]/10" : "bg-[var(--bg-sunken)]"
          )}>
            <History className={cn(
              "w-4 h-4",
              expanded ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
            )} />
          </div>
          <div>
            <span className="text-sm font-semibold text-[var(--text-primary)]">Past Months</span>
            <p className="text-[11px] text-[var(--text-muted)]">View historical target data</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" size="sm">{months.length}</Badge>
          <ChevronDown className={cn(
            "w-4 h-4 text-[var(--text-muted)] transition-transform",
            expanded && "rotate-180"
          )} />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2 border-t border-[var(--border)] pt-3">
              {months.map((month) => {
                const targets = byMonth[month]
                const [y, m] = month.split('-')
                const label = new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })
                const totalPuc = targets.reduce((s, t) => s + t.puc_files, 0)
                const totalSf = targets.reduce((s, t) => s + t.sf_files, 0)
                const totalApp = targets.reduce((s, t) => s + t.sf_applicants, 0)
                const totalPucApp = targets.reduce((s, t) => s + (t.puc_app_submission || 0), 0)
                const grandTotal = totalPuc + totalSf + totalApp + totalPucApp

                return (
                  <div
                    key={month}
                    className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-sunken)] hover:bg-[var(--bg-elevated)] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">{targets.length} agents</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="font-semibold tabular-nums">{totalPuc}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                        <span className="font-semibold tabular-nums">{totalSf}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="font-semibold tabular-nums">{totalApp}</span>
                      </div>
                      {totalPucApp > 0 && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          <span className="font-semibold tabular-nums">{totalPucApp}</span>
                        </div>
                      )}
                      <Badge variant="secondary" size="sm" className="ml-1 tabular-nums min-w-[32px] justify-center">
                        {grandTotal}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
