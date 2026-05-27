"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Users, FileText, FolderOpen, Calendar, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { StatGrid } from "@/components/dashboard/notion"
import type { DashboardLead } from "@/lib/hooks/use-dashboard-stats"

interface AdminKpiSectionProps {
  allLeads: DashboardLead[]
  loading: boolean
  todayAppointments: number
  todayCallbacks: number
  appointmentsLoading: boolean
  fastStats?: {
    activeLeads: number
    totalFiles: number
    pucFiles: number
    sfFiles: number
  }
}

export function AdminKpiSection({ allLeads, loading, todayAppointments, todayCallbacks, appointmentsLoading, fastStats }: AdminKpiSectionProps) {
  const router = useRouter()

  const stats = useMemo(() => {
    const total = fastStats?.activeLeads ?? allLeads.length
    const totalFiles = fastStats?.totalFiles ?? allLeads.filter((l) => l.pipeline_stage === "application").length
    const pucFiles = fastStats?.pucFiles ?? allLeads.filter((l) => l.pipeline_stage === "application" && l.funding_type === "puc").length
    const sfFiles = fastStats?.sfFiles ?? allLeads.filter((l) => l.pipeline_stage === "application" && l.funding_type === "self_funded").length

    return [
      // Row 1: categories
      {
        id: "total-leads",
        value: total,
        label: "Active Leads",
        icon: <Users className="w-5 h-5 text-[var(--primary)]" />,
        iconBg: "bg-[var(--primary)]/10",
      },
      // Row 2: files
      {
        id: "total-files",
        value: totalFiles,
        label: "Total Files",
        icon: <FileText className="w-5 h-5 text-[var(--warning)]" />,
        iconBg: "bg-[var(--warning)]/10",
      },
      {
        id: "puc-files",
        value: pucFiles,
        label: "Files from PUC",
        icon: <FolderOpen className="w-5 h-5 text-[var(--success)]" />,
        iconBg: "bg-[var(--success)]/10",
      },
      {
        id: "sf-files",
        value: sfFiles,
        label: "Files from SF",
        icon: <FolderOpen className="w-5 h-5 text-[var(--info)]" />,
        iconBg: "bg-[var(--info)]/10",
      },
      // Row 3: today's activity
      {
        id: "today-appts",
        value: appointmentsLoading ? "..." : todayAppointments,
        label: "Today's Appts",
        icon: <Calendar className="w-5 h-5 text-[var(--primary)]" />,
        iconBg: "bg-[var(--primary)]/10",
        onClick: () => router.push("/calendar"),
      },
      {
        id: "callbacks",
        value: appointmentsLoading ? "..." : todayCallbacks,
        label: "Today's Callbacks",
        icon: <Clock className="w-5 h-5 text-[var(--warning)]" />,
        iconBg: "bg-[var(--warning)]/10",
        onClick: () => router.push("/leads?status=callback"),
      },
    ]
  }, [allLeads, fastStats, todayAppointments, todayCallbacks, appointmentsLoading, router])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <StatGrid stats={stats} columns={3} loading={loading} />
    </motion.div>
  )
}
