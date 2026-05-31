"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Award } from "lucide-react"
import type { AgentPerformanceData } from "@/lib/hooks/use-reports"

interface AgentTopSourcesProps {
  data: AgentPerformanceData['sourcePerformance']
}

export function AgentTopSources({ data }: AgentTopSourcesProps) {
  // For each agent, find top 2 sources by enrolled count (minimum 1 lead)
  const agentTopSources = data
    .map(agent => {
      const ranked = [...agent.sources]
        .filter(s => s.leads > 0)
        .sort((a, b) => {
          if (b.enrolled !== a.enrolled) return b.enrolled - a.enrolled
          return b.leads - a.leads
        })

      return {
        agentId: agent.agentId,
        agentName: agent.agentName,
        avatarUrl: agent.avatarUrl,
        best: ranked[0] || null,
        second: ranked[1] || null,
      }
    })
    .filter(a => a.best !== null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.9 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[var(--accent)]" />
            Best Sources per Agent
          </CardTitle>
          <CardDescription>
            Top 2 performing sources per agent by enrolled count
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agentTopSources.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-4">No source data available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-3 px-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Agent</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                      <div className="flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                        Best Source
                      </div>
                    </th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Leads</th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Enrolled</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-slate-400" />
                        2nd Best
                      </div>
                    </th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Leads</th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Enrolled</th>
                  </tr>
                </thead>
                <tbody>
                  {agentTopSources.map((agent) => (
                    <tr
                      key={agent.agentId}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-sunken)] transition-colors"
                    >
                      {/* Agent */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <Avatar size="sm">
                            {agent.avatarUrl && <AvatarImage src={agent.avatarUrl} />}
                            <AvatarFallback>
                              {agent.agentName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm text-[var(--text-primary)] whitespace-nowrap">
                            {agent.agentName}
                          </span>
                        </div>
                      </td>

                      {/* Best Source */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-[var(--text-primary)]">
                            {agent.best!.label}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-sm text-[var(--text-secondary)]">{agent.best!.leads}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-sm font-semibold text-[var(--success)]">{agent.best!.enrolled}</span>
                      </td>

                      {/* 2nd Best Source */}
                      {agent.second ? (
                        <>
                          <td className="py-3 px-3">
                            <span className="text-sm font-medium text-[var(--text-primary)]">
                              {agent.second.label}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="text-sm text-[var(--text-secondary)]">{agent.second.leads}</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="text-sm font-semibold text-[var(--success)]">{agent.second.enrolled}</span>
                          </td>
                        </>
                      ) : (
                        <td colSpan={3} className="py-3 px-3 text-center">
                          <span className="text-xs text-[var(--text-disabled)]">Only 1 source</span>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
