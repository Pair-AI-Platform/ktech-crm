"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Megaphone, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AgentPerformanceData } from "@/lib/hooks/use-reports"

interface AgentSourceBreakdownProps {
  data: AgentPerformanceData['sourcePerformance']
}

export function AgentSourceBreakdown({ data }: AgentSourceBreakdownProps) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)

  // Get all unique sources across agents, sorted by total leads
  const allSources = new Map<string, { label: string; totalLeads: number }>()
  data.forEach(agent => {
    agent.sources.forEach(s => {
      const existing = allSources.get(s.source)
      if (existing) {
        existing.totalLeads += s.leads
      } else {
        allSources.set(s.source, { label: s.label, totalLeads: s.leads })
      }
    })
  })
  const topSources = [...allSources.entries()]
    .sort((a, b) => b[1].totalLeads - a[1].totalLeads)
    .slice(0, 6)
    .map(([key, val]) => ({ source: key, label: val.label }))

  // Filter to agents that have at least some leads
  const activeAgents = data.filter(a => a.sources.length > 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.8 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[var(--accent)]" />
            Source Performance by Agent
          </CardTitle>
          <CardDescription>
            Top {topSources.length} lead sources - click an agent to see all sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeAgents.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-4">No source data available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-3 px-3 text-sm font-medium text-[var(--text-muted)]">Agent</th>
                    {topSources.map(s => (
                      <th key={s.source} className="text-center py-3 px-2 text-xs font-medium text-[var(--text-muted)] whitespace-nowrap">
                        {s.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeAgents.map((agent) => {
                    const isExpanded = expandedAgent === agent.agentId
                    const sourceMap = new Map(agent.sources.map(s => [s.source, s]))

                    return (
                      <>
                        <tr
                          key={agent.agentId}
                          className="border-b border-[var(--border)] hover:bg-[var(--bg-sunken)] transition-colors cursor-pointer"
                          onClick={() => setExpandedAgent(isExpanded ? null : agent.agentId)}
                        >
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <Avatar size="sm">
                                {agent.avatarUrl && <AvatarImage src={agent.avatarUrl} />}
                                <AvatarFallback>
                                  {agent.agentName.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-[var(--text-primary)] whitespace-nowrap">
                                {agent.agentName}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                              )}
                            </div>
                          </td>
                          {topSources.map(s => {
                            const agentSource = sourceMap.get(s.source)
                            if (!agentSource || agentSource.leads === 0) {
                              return (
                                <td key={s.source} className="text-center py-3 px-2">
                                  <span className="text-xs text-[var(--text-disabled)]">-</span>
                                </td>
                              )
                            }
                            return (
                              <td key={s.source} className="text-center py-3 px-2">
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className="text-sm font-medium text-[var(--text-primary)]">
                                    {agentSource.leads}
                                  </span>
                                  {agentSource.enrolled > 0 && (
                                    <Badge variant="success" size="sm">
                                      {agentSource.enrolled} enrolled
                                    </Badge>
                                  )}
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                        {isExpanded && (
                          <tr key={`${agent.agentId}-expanded`} className="border-b border-[var(--border)]">
                            <td colSpan={topSources.length + 1} className="py-3 px-6 bg-[var(--bg-sunken)]">
                              <div className="flex flex-wrap gap-2">
                                {agent.sources.map(s => (
                                  <div
                                    key={s.source}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]"
                                  >
                                    <span className="text-xs font-medium text-[var(--text-primary)]">{s.label}</span>
                                    <span className="text-xs text-[var(--text-muted)]">{s.leads} leads</span>
                                    {s.enrolled > 0 && (
                                      <Badge variant="success" size="sm">{s.enrolled}</Badge>
                                    )}
                                    {s.conversionRate > 0 && (
                                      <span className="text-xs text-green-600">{s.conversionRate}%</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
