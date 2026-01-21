"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { type PipelineStage } from "@/types"

interface PipelineFunnelProps {
  byStage: Record<PipelineStage, number>
  total: number
}

export function PipelineFunnel({ byStage, total }: PipelineFunnelProps) {
  const applications = byStage.application || 0
  const conversionRate = total > 0 ? Math.round((applications / total) * 100) : 0

  // Determine current semester
  const month = new Date().getMonth() // 0-11
  const year = new Date().getFullYear()
  const semester = month >= 0 && month <= 5 ? 'Spring' : 'Fall'

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[280px]">
      {/* Hero number */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <span className="text-[72px] font-extralight tracking-tight text-[var(--text-primary)] leading-none">
          {applications}
        </span>
        <p className="text-[14px] text-[var(--text-muted)] mt-2">
          {semester} {year}
        </p>
      </motion.div>

      {/* Divider */}
      <div className="w-32 h-px bg-[var(--border)] my-6" />

      {/* Journey line */}
      <motion.div
        className="flex items-center gap-3 text-[13px]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <span className="text-[var(--text-muted)]">
          {total} leads
        </span>
        <ArrowRight className="w-4 h-4 text-[var(--text-muted)]" />
        <span className="text-emerald-500 font-medium">
          {conversionRate}% converted
        </span>
      </motion.div>
    </div>
  )
}
