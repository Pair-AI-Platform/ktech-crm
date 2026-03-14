"use client"

import { motion } from "framer-motion"
import { Users, TrendingUp, TrendingDown, Calendar, CheckCircle2 } from "lucide-react"
import { StaticBlock } from "@/components/dashboard/notion"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { AgentStatus } from "@/lib/hooks/use-agent-presence"

interface AgentPresenceData {
  id: string
  name: string
  status: AgentStatus
  activeLeadCount: number
  filesOpenedThisMonth: number
  todayChanges: number
  conversionRate: number
  todayAppointments: number
  lastMonthFiles: number
  overdueFollowUps: number
}

interface AdminAgentHeatmapProps {
  agents: AgentPresenceData[]
  loading: boolean
}

export function AdminAgentHeatmap({ agents, loading }: AdminAgentHeatmapProps) {
  const statusConfig: Record<AgentStatus, {
    dot: string
    label: string
    labelColor: string
    cardBg: string
    cardBorder: string
    avatarRing: string
    avatarBg: string
    avatarText: string
    hoverBg: string
  }> = {
    online: {
      dot: "bg-emerald-500 shadow-[0_0_6px_2px_rgba(16,185,129,0.45)]",
      label: "Online",
      labelColor: "text-emerald-700",
      cardBg: "bg-emerald-50/60",
      cardBorder: "border-emerald-200/80",
      avatarRing: "ring-2 ring-emerald-400/50",
      avatarBg: "bg-emerald-100 text-emerald-700",
      avatarText: "text-emerald-700",
      hoverBg: "hover:bg-emerald-50/80",
    },
    meeting: {
      dot: "bg-blue-500 shadow-[0_0_6px_2px_rgba(59,130,246,0.4)]",
      label: "In Meeting",
      labelColor: "text-blue-700",
      cardBg: "bg-blue-50/50",
      cardBorder: "border-blue-200/70",
      avatarRing: "ring-2 ring-blue-400/50",
      avatarBg: "bg-blue-100 text-blue-700",
      avatarText: "text-blue-700",
      hoverBg: "hover:bg-blue-50/70",
    },
    break: {
      dot: "bg-amber-400 shadow-[0_0_6px_2px_rgba(251,191,36,0.4)]",
      label: "On Break",
      labelColor: "text-amber-700",
      cardBg: "bg-amber-50/50",
      cardBorder: "border-amber-200/70",
      avatarRing: "ring-2 ring-amber-300/50",
      avatarBg: "bg-amber-100 text-amber-700",
      avatarText: "text-amber-700",
      hoverBg: "hover:bg-amber-50/70",
    },
    offline: {
      dot: "bg-gray-300",
      label: "Offline",
      labelColor: "text-[var(--text-tertiary)]",
      cardBg: "bg-gray-50/40",
      cardBorder: "border-gray-200/50",
      avatarRing: "",
      avatarBg: "bg-gray-100 text-gray-400",
      avatarText: "text-gray-400",
      hoverBg: "hover:bg-gray-100/50",
    },
  }

  function getInitials(name: string): string {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  function getTrendInfo(current: number, lastMonth: number) {
    if (lastMonth === 0 && current === 0) return null
    if (lastMonth === 0) return { direction: 'up' as const, percent: 100 }
    const change = Math.round(((current - lastMonth) / lastMonth) * 100)
    if (change === 0) return null
    return { direction: change > 0 ? 'up' as const : 'down' as const, percent: Math.abs(change) }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <StaticBlock
        title={
          <span className="flex items-center gap-2">
            Team Status
            {!loading && agents.length > 0 && (
              <Badge variant="outline" size="sm" title="Total changes today across all agents">
                {agents.reduce((sum, a) => sum + a.todayChanges, 0)}
              </Badge>
            )}
          </span>
        }
        icon={<Users className="w-4 h-4 text-[var(--primary)]" />}
      >
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-sunken)]"
              >
                <div className="w-10 h-10 rounded-full bg-[var(--bg-hover)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[var(--bg-hover)] rounded w-3/4" />
                  <div className="h-3 bg-[var(--bg-hover)] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : agents.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)] text-center py-6">
            No agents found
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {agents.map((agent, index) => {
              const config = statusConfig[agent.status]
              const trend = getTrendInfo(agent.filesOpenedThisMonth, agent.lastMonthFiles)
              return (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "flex flex-col gap-2 p-3 rounded-xl",
                    "border transition-all",
                    config.cardBg,
                    config.cardBorder,
                    config.hoverBg,
                  )}
                >
                  {/* Top row: Avatar + Name + Badge */}
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className={cn("w-10 h-10", config.avatarRing)}>
                        <AvatarFallback className={cn(
                          "text-xs font-medium",
                          config.avatarBg
                        )}>
                          {getInitials(agent.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[var(--bg-sunken)]",
                          config.dot
                        )}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        agent.status === "offline"
                          ? "text-[var(--text-tertiary)]"
                          : "text-[var(--text-primary)]"
                      )}>
                        {agent.name}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "inline-block w-1.5 h-1.5 rounded-full",
                          agent.status === "online" && "bg-emerald-500",
                          agent.status === "meeting" && "bg-blue-500",
                          agent.status === "break" && "bg-amber-400",
                          agent.status === "offline" && "bg-gray-300"
                        )} />
                        <p className={cn("text-xs font-medium", config.labelColor)}>
                          {config.label}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" size="sm" title="Changes today (stage + status)">
                        {agent.todayChanges}
                      </Badge>
                    </div>
                  </div>

                  {/* Bottom row: Metrics */}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-[var(--border-subtle)]/50">
                    {/* Conversion Rate */}
                    <div className="flex items-center gap-1 flex-1 min-w-0" title="Conversion rate (enrolled / total assigned)">
                      <CheckCircle2 className="w-3 h-3 text-[var(--text-tertiary)] shrink-0" />
                      <span className={cn(
                        "text-[11px] font-semibold tabular-nums",
                        agent.conversionRate >= 20 ? "text-emerald-600" :
                        agent.conversionRate >= 10 ? "text-amber-600" :
                        "text-[var(--text-tertiary)]"
                      )}>
                        {agent.conversionRate}%
                      </span>
                    </div>

                    {/* Today's Appointments */}
                    {agent.todayAppointments > 0 && (
                      <div className="flex items-center gap-1" title="Appointments today">
                        <Calendar className="w-3 h-3 text-blue-500 shrink-0" />
                        <span className="text-[11px] font-medium text-blue-600 tabular-nums">
                          {agent.todayAppointments}
                        </span>
                      </div>
                    )}

                    {/* Overdue follow-ups */}
                    {agent.overdueFollowUps > 0 && (
                      <div className="flex items-center gap-1" title="Overdue follow-ups (no contact 5+ days)">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        <span className="text-[11px] font-medium text-red-600 tabular-nums">
                          {agent.overdueFollowUps}
                        </span>
                      </div>
                    )}

                    {/* Monthly files + trend */}
                    <div className="flex items-center gap-1 ml-auto" title={`Files opened this month${trend ? ` (${trend.direction === 'up' ? '+' : '-'}${trend.percent}% vs last month)` : ''}`}>
                      <span className={cn(
                        "text-[11px] tabular-nums font-medium",
                        "text-[var(--text-tertiary)]"
                      )}>
                        {agent.filesOpenedThisMonth} this mo.
                      </span>
                      {trend && (
                        trend.direction === 'up' ? (
                          <TrendingUp className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-400" />
                        )
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </StaticBlock>
    </motion.div>
  )
}

export type { AgentPresenceData, AdminAgentHeatmapProps }
