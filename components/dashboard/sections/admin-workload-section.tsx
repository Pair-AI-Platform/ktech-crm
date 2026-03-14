"use client"

import { motion } from "framer-motion"
import { BarChart3 } from "lucide-react"
import { StaticBlock } from "@/components/dashboard/notion"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface AgentWorkload {
  id: string
  name: string
  activeLeads: number
  newThisMonth: number
  enrolled: number
}

interface AdminWorkloadSectionProps {
  agents: AgentWorkload[]
  loading: boolean
}

export function AdminWorkloadSection({ agents, loading }: AdminWorkloadSectionProps) {
  const maxLeads = Math.max(...agents.map(a => a.activeLeads), 1)
  const avgLeads = agents.length > 0 ? Math.round(agents.reduce((s, a) => s + a.activeLeads, 0) / agents.length) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <StaticBlock
        title={
          <span className="flex items-center gap-2">
            Workload Distribution
            {!loading && agents.length > 0 && (
              <Badge variant="outline" size="sm" title="Average active leads per agent">
                avg {avgLeads}
              </Badge>
            )}
          </span>
        }
        icon={<BarChart3 className="w-4 h-4 text-[var(--primary)]" />}
        defaultCollapsed={false}
      >
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="h-3 bg-[var(--bg-hover)] rounded w-16" />
                <div className="flex-1 h-6 bg-[var(--bg-hover)] rounded" />
              </div>
            ))}
          </div>
        ) : agents.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)] text-center py-6">
            No agent data available
          </p>
        ) : (
          <div className="space-y-2">
            {agents.map((agent, index) => {
              const barWidth = (agent.activeLeads / maxLeads) * 100
              const isOverloaded = agent.activeLeads > avgLeads * 1.5
              const isUnderloaded = agent.activeLeads < avgLeads * 0.5 && avgLeads > 0
              return (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-[11px] font-medium text-[var(--text-secondary)] w-20 truncate text-right shrink-0">
                    {agent.name.split(' ')[0]}
                  </span>
                  <div className="flex-1 relative h-7 bg-[var(--bg-sunken)] rounded-lg overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.5, delay: index * 0.03 }}
                      className={cn(
                        "absolute inset-y-0 left-0 rounded-lg flex items-center",
                        isOverloaded
                          ? "bg-gradient-to-r from-red-300/80 to-red-400/80"
                          : isUnderloaded
                          ? "bg-gradient-to-r from-amber-200/80 to-amber-300/80"
                          : "bg-gradient-to-r from-blue-300/70 to-blue-400/70"
                      )}
                    />
                    <div className="absolute inset-y-0 left-0 right-0 flex items-center px-2 justify-between">
                      <span className={cn(
                        "text-[11px] font-semibold tabular-nums",
                        barWidth > 20 ? "text-white/90" : "text-[var(--text-secondary)]",
                        barWidth > 20 ? "drop-shadow-sm" : ""
                      )}>
                        {agent.activeLeads} active
                      </span>
                      <div className="flex items-center gap-2">
                        {agent.newThisMonth > 0 && (
                          <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums">
                            +{agent.newThisMonth} new
                          </span>
                        )}
                        {agent.enrolled > 0 && (
                          <span className="text-[10px] text-emerald-600 font-medium tabular-nums">
                            {agent.enrolled} enrolled
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
            {/* Avg line indicator */}
            <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <div className="flex items-center gap-3 text-[10px] text-[var(--text-tertiary)]">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-2 rounded-sm bg-red-400/80" /> Overloaded (&gt;{Math.round(avgLeads * 1.5)})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-2 rounded-sm bg-amber-300/80" /> Low (&lt;{Math.round(avgLeads * 0.5)})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-2 rounded-sm bg-blue-400/70" /> Balanced
                </span>
              </div>
            </div>
          </div>
        )}
      </StaticBlock>
    </motion.div>
  )
}

export type { AgentWorkload, AdminWorkloadSectionProps }
