"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BarChart3, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AgentPerformanceData } from "@/lib/hooks/use-reports"

interface AgentWorkloadProps {
  data: AgentPerformanceData
}

export function AgentWorkload({ data }: AgentWorkloadProps) {
  const { workload, totalLeads, avgLeadsPerAgent } = data
  const maxLeads = Math.max(...workload.map(w => w.leads), 1)

  // Flag agents who have > 2x or < 0.5x the average
  const getImbalance = (leads: number) => {
    if (avgLeadsPerAgent === 0) return null
    if (leads > avgLeadsPerAgent * 2) return 'overloaded'
    if (leads < avgLeadsPerAgent * 0.3 && leads > 0) return 'underloaded'
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[var(--primary)]" />
            Workload Distribution
          </CardTitle>
          <CardDescription>
            {totalLeads} total leads across {workload.length} agents (avg {avgLeadsPerAgent}/agent)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {workload.map((agent) => {
              const imbalance = getImbalance(agent.leads)
              const barWidth = maxLeads > 0 ? (agent.leads / maxLeads) * 100 : 0

              return (
                <div key={agent.agentId} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-36 flex-shrink-0">
                    <Avatar size="sm">
                      {agent.avatarUrl && <AvatarImage src={agent.avatarUrl} />}
                      <AvatarFallback>
                        {agent.agentName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {agent.agentName}
                    </span>
                  </div>

                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-7 bg-[var(--bg-sunken)] rounded-md overflow-hidden relative">
                      <motion.div
                        className={cn(
                          "h-full rounded-md",
                          imbalance === 'overloaded'
                            ? "bg-gradient-to-r from-red-400 to-red-500"
                            : "bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                      <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-white drop-shadow-sm">
                        {agent.leads} leads ({agent.percent}%)
                      </span>
                    </div>

                    {imbalance === 'overloaded' && (
                      <Badge variant="destructive" size="sm" className="flex-shrink-0 gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        High
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
