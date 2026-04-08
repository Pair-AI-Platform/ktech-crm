"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Calendar, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StaticBlock, ListBlock } from "@/components/dashboard/notion"
import { APPOINTMENT_TYPES } from "@/types"
import { getLeadDisplayName } from "@/lib/lead-utils"
import type { Appointment } from "@/types"

interface AppointmentsSectionProps {
  todayAppointments: Appointment[]
  loading: boolean
}

export function AppointmentsSection({ todayAppointments, loading }: AppointmentsSectionProps) {
  const router = useRouter()

  const appointmentItems = useMemo(() => {
    return todayAppointments.slice(0, 5).map((apt) => {
      const aptLeads = apt.appointment_leads?.map(al => al.lead).filter(Boolean) || []
      const leadName = aptLeads.length > 0
        ? aptLeads.length === 1
          ? getLeadDisplayName(aptLeads[0]!)
          : `${getLeadDisplayName(aptLeads[0]!)} +${aptLeads.length - 1}`
        : apt.lead
        ? getLeadDisplayName(apt.lead)
        : 'Unknown'
      const typeInfo = APPOINTMENT_TYPES.find(t => apt.appointment_type.includes(t.value))

      return {
        id: apt.id,
        title: leadName,
        subtitle: typeInfo?.label || apt.appointment_type.join(', '),
        metadata: apt.scheduled_time?.slice(0, 5),
        badge: (
          <Badge
            variant={apt.status === 'confirmed' ? 'success' : apt.status === 'on_the_way' ? 'info' : apt.status === 'no_answer' || apt.status === 'cant_reach' ? 'warning' : 'outline'}
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
  }, [todayAppointments, router])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <StaticBlock
        title="Today's Appointments"
        icon={<Calendar className="w-4 h-4 text-[var(--primary)]" />}
        headerActions={
          <Link href="/calendar">
            <Button variant="ghost" size="sm" className="text-[var(--text-muted)]">
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        }
      >
        <ListBlock
          items={appointmentItems}
          loading={loading}
          emptyMessage="No appointments today"
          emptyIcon={<Calendar className="w-8 h-8 text-[var(--text-muted)]" />}
          showMoreHref="/calendar"
          onShowMore={() => router.push("/calendar")}
        />
      </StaticBlock>
    </motion.div>
  )
}
