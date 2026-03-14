"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Users, GraduationCap, Layers, FileText, FolderOpen } from "lucide-react"
import { StatGrid } from "@/components/dashboard/notion"
import type { DashboardLead } from "@/lib/hooks/use-dashboard-stats"

interface AdminKpiSectionProps {
  allLeads: DashboardLead[]
  loading: boolean
}

export function AdminKpiSection({ allLeads, loading }: AdminKpiSectionProps) {
  const stats = useMemo(() => {
    const total = allLeads.length
    const pucCount = allLeads.filter((l) => l.funding_type === "puc").length
    const sfCount = allLeads.filter((l) => l.funding_type === "self_funded").length
    const totalFiles = allLeads.filter((l) => l.pipeline_stage === "application").length
    const pucFiles = allLeads.filter((l) => l.pipeline_stage === "application" && l.funding_type === "puc").length
    const sfFiles = allLeads.filter((l) => l.pipeline_stage === "application" && l.funding_type === "self_funded").length

    return [
      // Row 1: categories
      {
        id: "total-leads",
        value: total,
        label: "Active Leads",
        icon: <Users className="w-5 h-5 text-[var(--primary)]" />,
        iconBg: "bg-[var(--primary)]/10",
      },
      {
        id: "puc-leads",
        value: pucCount,
        label: "PUC",
        icon: <GraduationCap className="w-5 h-5 text-[var(--success)]" />,
        iconBg: "bg-[var(--success)]/10",
      },
      {
        id: "sf-leads",
        value: sfCount,
        label: "SF",
        icon: <Layers className="w-5 h-5 text-[var(--info)]" />,
        iconBg: "bg-[var(--info)]/10",
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
    ]
  }, [allLeads])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <StatGrid stats={stats} columns={3} loading={loading} />
    </motion.div>
  )
}
