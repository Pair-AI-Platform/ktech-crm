"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Calendar, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { StatGrid } from "@/components/dashboard/notion"
import type { DashboardLead } from "@/lib/hooks/use-dashboard-stats"

interface QuickStatsSectionProps {
  appointmentsLoading: boolean
  leadsLoading: boolean
  appointmentStats: { today: number }
  myLeads: DashboardLead[]
  isLoading: boolean
  fastStats?: {
    todayAppointments: number
    todayCallbacks: number
  }
}

export function QuickStatsSection({
  appointmentsLoading,
  leadsLoading,
  appointmentStats,
  myLeads,
  isLoading,
  fastStats,
}: QuickStatsSectionProps) {
  const router = useRouter()

  const callbackLeads = useMemo(() => {
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    return myLeads.filter(l => l.status === 'callback' && l.callback_date === todayStr).length
  }, [myLeads])

  const statItems = [
    {
      id: "today-appts",
      value: appointmentsLoading ? "..." : (fastStats?.todayAppointments ?? appointmentStats.today),
      label: "Today's Appts",
      icon: <Calendar className="w-5 h-5 text-[var(--primary)]" />,
      iconBg: "bg-[var(--primary)]/10",
      onClick: () => router.push("/calendar"),
    },
    {
      id: "callbacks",
      value: leadsLoading ? "..." : (fastStats?.todayCallbacks ?? callbackLeads),
      label: "Today's Callbacks",
      icon: <Clock className="w-5 h-5 text-[var(--warning)]" />,
      iconBg: "bg-[var(--warning)]/10",
      onClick: () => router.push("/leads?status=callback"),
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <StatGrid stats={statItems} columns={2} loading={isLoading} />
    </motion.div>
  )
}
