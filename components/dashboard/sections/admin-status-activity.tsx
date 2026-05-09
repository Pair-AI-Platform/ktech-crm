"use client"

import { motion } from "framer-motion"
import { Coffee, Video, Activity } from "lucide-react"
import { StaticBlock } from "@/components/dashboard/notion"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { AgentStatusTotals } from "@/lib/hooks/use-agent-status-history"

interface AdminStatusActivityProps {
  agents: { id: string; name: string }[]
  totals: AgentStatusTotals[]
  loading: boolean
}

function formatSeconds(sec: number): string {
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const rem = min % 60
  return rem === 0 ? `${h}h` : `${h}h ${rem}m`
}

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
}

export function AdminStatusActivity({ agents, totals, loading }: AdminStatusActivityProps) {
  const byUser = new Map(totals.map((t) => [t.userId, t]))

  const rows = agents
    .map((a) => ({
      agent: a,
      totals: byUser.get(a.id),
    }))
    .filter((r) => r.totals && (r.totals.breakSeconds > 0 || r.totals.meetingSeconds > 0))
    .sort((a, b) => {
      const aTotal = (a.totals?.breakSeconds ?? 0) + (a.totals?.meetingSeconds ?? 0)
      const bTotal = (b.totals?.breakSeconds ?? 0) + (b.totals?.meetingSeconds ?? 0)
      return bTotal - aTotal
    })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <StaticBlock
        title="Status Activity Today"
        icon={<Activity className="w-4 h-4 text-[var(--primary)]" />}
      >
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse h-10 rounded-lg bg-[var(--bg-sunken)]" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)] text-center py-6">
            No meeting or break activity logged today.
          </p>
        ) : (
          <div className="space-y-1.5">
            {rows.map(({ agent, totals: t }) => (
              <div
                key={agent.id}
                className={cn(
                  "flex items-center gap-3 px-2.5 py-2 rounded-lg",
                  "bg-[var(--bg-sunken)] border border-[var(--border-subtle)]",
                  "hover:bg-[var(--bg-hover)] transition-colors"
                )}
              >
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="text-[10px] font-medium bg-[var(--bg-hover)]">
                    {getInitials(agent.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 text-sm font-medium text-[var(--text-primary)] truncate">
                  {agent.name}
                </span>
                {t && t.meetingSeconds > 0 && (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-full bg-blue-100 text-blue-700"
                    title={`${t.meetingCount} meeting session${t.meetingCount === 1 ? "" : "s"}`}
                  >
                    <Video className="w-3 h-3" />
                    {formatSeconds(t.meetingSeconds)}
                  </span>
                )}
                {t && t.breakSeconds > 0 && (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"
                    title={`${t.breakCount} break${t.breakCount === 1 ? "" : "s"}`}
                  >
                    <Coffee className="w-3 h-3" />
                    {formatSeconds(t.breakSeconds)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </StaticBlock>
    </motion.div>
  )
}
