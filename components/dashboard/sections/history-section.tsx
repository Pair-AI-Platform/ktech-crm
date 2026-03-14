"use client"

import { motion } from "framer-motion"
import {
  History,
  Users,
  CheckCircle2,
  GraduationCap,
  ClipboardList,
  Calendar,
  CalendarCheck,
} from "lucide-react"
import { StaticBlock } from "@/components/dashboard/notion"
import { cn } from "@/lib/utils"

interface HistorySectionProps {
  agentHistory: {
    memberSince: string | null
    totalLeads: number
    totalContacted: number
    enrolled: number
    applicants: number
    totalAppointments: number
    completedAppointments: number
  }
  loading: boolean
}

export function HistorySection({ agentHistory, loading }: HistorySectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <StaticBlock
        title="My History at KTECH"
        icon={<History className="w-4 h-4 text-[var(--accent)]" />}
      >
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse p-3 rounded-xl bg-[var(--bg-sunken)]">
                <div className="h-8 bg-[var(--bg-elevated)] rounded w-12 mb-2" />
                <div className="h-3 bg-[var(--bg-elevated)] rounded w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Member since */}
            {agentHistory.memberSince && (
              <p className="text-xs text-[var(--text-muted)]">
                Member since {new Date(agentHistory.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                {
                  value: agentHistory.totalLeads,
                  label: "Total Leads",
                  icon: <Users className="w-4 h-4 text-[var(--primary)]" />,
                  bg: "bg-[var(--primary)]/10",
                },
                {
                  value: agentHistory.totalContacted,
                  label: "Total Contacted",
                  icon: <CheckCircle2 className="w-4 h-4 text-[var(--accent)]" />,
                  bg: "bg-[var(--accent)]/10",
                },
                {
                  value: agentHistory.enrolled,
                  label: "Enrolled",
                  icon: <GraduationCap className="w-4 h-4 text-[var(--success)]" />,
                  bg: "bg-[var(--success)]/10",
                },
                {
                  value: agentHistory.applicants,
                  label: "Applicants",
                  icon: <ClipboardList className="w-4 h-4 text-[var(--info)]" />,
                  bg: "bg-[var(--info)]/10",
                },
                {
                  value: agentHistory.totalAppointments,
                  label: "Total Appts",
                  icon: <Calendar className="w-4 h-4 text-[var(--warning)]" />,
                  bg: "bg-[var(--warning)]/10",
                },
                {
                  value: agentHistory.completedAppointments,
                  label: "Completed Appts",
                  icon: <CalendarCheck className="w-4 h-4 text-[var(--success)]" />,
                  bg: "bg-[var(--success)]/10",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-3 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border-subtle)]"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", stat.bg)}>
                      {stat.icon}
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                    {stat.value}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Conversion Rate */}
            {agentHistory.totalLeads > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border-subtle)]">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Lifetime Conversion</p>
                  <p className="text-xs text-[var(--text-muted)]">Enrolled / Total Leads</p>
                </div>
                <div className={cn(
                  "text-xl font-bold",
                  Math.round((agentHistory.enrolled / agentHistory.totalLeads) * 100) >= 20
                    ? "text-[var(--success)]"
                    : Math.round((agentHistory.enrolled / agentHistory.totalLeads) * 100) >= 10
                      ? "text-[var(--warning)]"
                      : "text-[var(--text-secondary)]"
                )}>
                  {Math.round((agentHistory.enrolled / agentHistory.totalLeads) * 100)}%
                </div>
              </div>
            )}
          </div>
        )}
      </StaticBlock>
    </motion.div>
  )
}
