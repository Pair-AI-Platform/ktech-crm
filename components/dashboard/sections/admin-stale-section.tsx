"use client"

import { motion } from "framer-motion"
import { AlertTriangle, ChevronRight, UserX, Clock, Pause } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StaticBlock } from "@/components/dashboard/notion"
import { cn } from "@/lib/utils"
import type { DashboardLead } from "@/lib/hooks/use-dashboard-stats"

interface StaleLead {
  lead: DashboardLead
  agentName?: string
  daysSince: number
  category: "no_contact" | "unassigned" | "stuck"
}

interface AdminStaleSectionProps {
  staleByAgent: Array<{ agentName: string; count: number }>
  unassignedCount: number
  stuckLeads: Array<{ lead: DashboardLead; agentName?: string; days: number }>
  loading: boolean
}

export function AdminStaleSection({
  staleByAgent,
  unassignedCount,
  stuckLeads,
  loading,
}: AdminStaleSectionProps) {
  const router = useRouter()

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <StaticBlock
          title="At-Risk Leads"
          icon={<AlertTriangle className="w-4 h-4 text-[var(--error)]" />}
        >
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 bg-[var(--bg-sunken)] rounded w-32" />
                <div className="h-10 bg-[var(--bg-sunken)] rounded" />
              </div>
            ))}
          </div>
        </StaticBlock>
      </motion.div>
    )
  }

  const totalAtRisk = staleByAgent.reduce((sum, a) => sum + a.count, 0) + unassignedCount + stuckLeads.length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <StaticBlock
        title="At-Risk Leads"
        icon={<AlertTriangle className="w-4 h-4 text-[var(--error)]" />}
        headerActions={
          totalAtRisk > 0 ? (
            <Badge variant="destructive" size="sm">
              {totalAtRisk}
            </Badge>
          ) : undefined
        }
      >
        {totalAtRisk === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)] text-center py-6">
            No at-risk leads right now
          </p>
        ) : (
          <div className="space-y-5">
            {/* No Contact 5+ Days */}
            {staleByAgent.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                  <Clock className="w-4 h-4 text-[var(--warning)]" />
                  No Contact 5+ Days
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {staleByAgent.map((agent) => (
                    <div
                      key={agent.agentName}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-lg",
                        "bg-[var(--bg-sunken)] hover:bg-[var(--bg-hover)] transition-colors"
                      )}
                    >
                      <span className="text-sm text-[var(--text-primary)]">
                        {agent.agentName}
                      </span>
                      <Badge variant="warning" size="sm">
                        {agent.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unassigned Leads */}
            {unassignedCount > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                  <UserX className="w-4 h-4 text-[var(--error)]" />
                  Unassigned Leads
                </div>
                <Link href="/leads?assigned=unassigned">
                  <div
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg",
                      "bg-[var(--bg-sunken)] hover:bg-[var(--bg-hover)] transition-colors",
                      "cursor-pointer"
                    )}
                  >
                    <span className="text-sm text-[var(--text-primary)]">
                      {unassignedCount} lead{unassignedCount !== 1 ? "s" : ""} without an agent
                    </span>
                    <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
                  </div>
                </Link>
              </div>
            )}

            {/* Stuck in Stage */}
            {stuckLeads.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                  <Pause className="w-4 h-4 text-[var(--info)]" />
                  Stuck in Stage
                </div>
                <div className="space-y-1">
                  {stuckLeads.slice(0, 5).map((item) => (
                    <div
                      key={item.lead.id}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-lg",
                        "bg-[var(--bg-sunken)] hover:bg-[var(--bg-hover)] transition-colors",
                        "cursor-pointer"
                      )}
                      onClick={() => router.push(`/leads/${item.lead.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-primary)] truncate">
                          {item.lead.first_name} {item.lead.last_name}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {item.agentName || "Unassigned"} &middot;{" "}
                          {item.lead.pipeline_stage.replace(/_/g, " ")}
                        </p>
                      </div>
                      <Badge variant="outline" size="sm">
                        {item.days}d
                      </Badge>
                    </div>
                  ))}
                  {stuckLeads.length > 5 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-[var(--accent)]"
                      onClick={() => router.push("/leads")}
                    >
                      View all {stuckLeads.length} stuck leads
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </StaticBlock>
    </motion.div>
  )
}

export type { StaleLead, AdminStaleSectionProps }
