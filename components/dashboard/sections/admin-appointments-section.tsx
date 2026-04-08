"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Calendar, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StaticBlock, ListBlock } from "@/components/dashboard/notion"
import { APPOINTMENT_TYPES } from "@/types"
import type { Appointment } from "@/types"

interface AdminAppointmentsSectionProps {
  todayAppointments: Appointment[]
  loading: boolean
}

export function AdminAppointmentsSection({ todayAppointments, loading }: AdminAppointmentsSectionProps) {
  const router = useRouter()
  const [agentFilter, setAgentFilter] = useState<string | null>(null)

  // Group appointments by agent
  const agents = useMemo(() => {
    const agentMap = new Map<string, string>()
    todayAppointments.forEach(apt => {
      const agentId = apt.assigned_agent || apt.assigned_agent_profile?.id || 'unassigned'
      const agentName = apt.assigned_agent_profile?.full_name || 'Unassigned'
      agentMap.set(agentId, agentName)
    })
    return Array.from(agentMap.entries()).map(([id, name]) => ({ id, name }))
  }, [todayAppointments])

  const filteredAppointments = useMemo(() => {
    if (!agentFilter) return todayAppointments
    return todayAppointments.filter(apt => {
      const agentId = apt.assigned_agent || apt.assigned_agent_profile?.id || 'unassigned'
      return agentId === agentFilter
    })
  }, [todayAppointments, agentFilter])

  const appointmentItems = useMemo(() => {
    return filteredAppointments.slice(0, 10).map((apt) => {
      const aptLeads = apt.appointment_leads?.map(al => al.lead).filter(Boolean) || []
      const leadName = aptLeads.length > 0
        ? aptLeads.length === 1
          ? `${aptLeads[0]!.first_name_ar} ${aptLeads[0]!.last_name_ar}`
          : `${aptLeads[0]!.first_name_ar} ${aptLeads[0]!.last_name_ar} +${aptLeads.length - 1}`
        : apt.lead
        ? `${apt.lead.first_name_ar} ${apt.lead.last_name_ar}`
        : 'Unknown'
      const typeInfo = APPOINTMENT_TYPES.find(t => apt.appointment_type.includes(t.value))
      const agentName = apt.assigned_agent_profile?.full_name

      return {
        id: apt.id,
        title: leadName,
        subtitle: `${typeInfo?.label || apt.appointment_type.join(', ')}${agentName ? ` · ${agentName}` : ''}`,
        metadata: apt.scheduled_time?.slice(0, 5),
        badge: (
          <Badge
            variant={apt.status === 'confirmed' ? 'success' : apt.status === 'completed' ? 'success' : apt.status === 'on_the_way' ? 'info' : apt.status === 'no_answer' || apt.status === 'cant_reach' ? 'warning' : 'outline'}
            size="sm"
          >
            {apt.status}
          </Badge>
        ),
        icon: (
          <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
            <span className="text-sm font-bold text-[var(--primary)]">
              {apt.scheduled_time?.slice(0, 2)}
            </span>
          </div>
        ),
        onClick: () => router.push(`/calendar?date=${apt.scheduled_date}&appointmentId=${apt.id}`),
      }
    })
  }, [filteredAppointments, router])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <StaticBlock
        title="Team Appointments Today"
        icon={<Calendar className="w-4 h-4 text-[var(--primary)]" />}
        headerActions={
          <div className="flex items-center gap-2">
            {agents.length > 1 && (
              <select
                value={agentFilter || ''}
                onChange={(e) => setAgentFilter(e.target.value || null)}
                className="text-xs bg-[var(--bg-elevated)] border border-[var(--border)] rounded-md px-2 py-1 text-[var(--text-secondary)]"
              >
                <option value="">All Agents ({todayAppointments.length})</option>
                {agents.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            )}
            <Link href="/calendar">
              <Button variant="ghost" size="sm" className="text-[var(--text-muted)]">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        }
      >
        <ListBlock
          items={appointmentItems}
          loading={loading}
          maxItems={10}
          emptyMessage="No team appointments today"
          emptyIcon={<Calendar className="w-8 h-8 text-[var(--text-muted)]" />}
          showMoreHref="/calendar"
          onShowMore={() => router.push("/calendar")}
        />
      </StaticBlock>
    </motion.div>
  )
}
