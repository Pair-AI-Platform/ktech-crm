"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Layers, GraduationCap, ChevronRight, TrendingUp, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import type { DashboardLead } from "@/lib/hooks/use-dashboard-stats"

interface PipelineSectionProps {
  sfLeads: DashboardLead[]
  pucLeads: DashboardLead[]
  loading: boolean
}

interface StageData {
  key: string
  label: string
  count: number
  color: string
  percentage: number
}

function PipelineRow({
  label,
  icon,
  href,
  stages,
  total,
  conversionRate,
  loading,
  onStageClick,
  delay = 0,
}: {
  label: string
  icon: React.ReactNode
  href: string
  stages: StageData[]
  total: number
  conversionRate: number
  loading: boolean
  onStageClick: (stage: string) => void
  delay?: number
}) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-3 py-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-24 bg-[var(--bg-sunken)] rounded" />
          <div className="h-4 w-16 bg-[var(--bg-sunken)] rounded ml-auto" />
        </div>
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 flex-1 bg-[var(--bg-sunken)] rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const maxCount = Math.max(...stages.map(s => s.count), 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href={href}
          className="flex items-center gap-2 group/link"
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--accent)]/10">
            {icon}
          </div>
          <span className="text-sm font-semibold text-[var(--text-primary)] group-hover/link:text-[var(--accent)] transition-colors">
            {label}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-[var(--text-tertiary)] group-hover/link:text-[var(--accent)] group-hover/link:translate-x-0.5 transition-all" />
        </Link>

        <div className="flex items-center gap-2.5">
          <span className="text-xs text-[var(--text-muted)]">
            <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">{total}</span>{" "}
            leads
          </span>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-[11px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {conversionRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Stage flow */}
      <div className="flex items-stretch gap-0">
        {stages.map((stage, idx) => {
          const intensity = total > 0 ? Math.max(0.08, stage.count / maxCount * 0.18) : 0.06
          const isFirst = idx === 0
          const isLast = idx === stages.length - 1
          const isEnrolled = stage.key === 'enrolled'

          return (
            <motion.button
              key={stage.key}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: delay + 0.05 + idx * 0.035 }}
              onClick={() => onStageClick(stage.key)}
              className={cn(
                "group/stage relative flex-1 flex flex-col items-center justify-center gap-1 py-3 px-1 transition-all duration-200 cursor-pointer min-w-0",
                "hover:scale-[1.04] hover:z-10 hover:shadow-lg",
                isFirst && "rounded-l-xl",
                isLast && "rounded-r-xl",
                !isFirst && !isLast && "",
              )}
              style={{
                backgroundColor: `color-mix(in srgb, ${stage.color} ${Math.round(intensity * 100)}%, var(--bg-raised))`,
                borderTop: `2px solid ${stage.color}`,
                borderLeft: idx === 0 ? `1px solid color-mix(in srgb, ${stage.color} 20%, transparent)` : undefined,
                borderRight: `1px solid color-mix(in srgb, ${stage.color} 15%, var(--border-subtle))`,
                borderBottom: `1px solid color-mix(in srgb, ${stage.color} 10%, var(--border-subtle))`,
              }}
            >
              {/* Count */}
              <span
                className="text-lg font-extrabold tabular-nums leading-none"
                style={{ color: stage.color }}
              >
                {stage.count}
              </span>

              {/* Label */}
              <span className="text-[9px] font-semibold uppercase tracking-widest text-[var(--text-muted)] group-hover/stage:text-[var(--text-secondary)] transition-colors truncate max-w-full px-0.5">
                {stage.label}
              </span>

              {/* Percentage */}
              <span className="text-[9px] tabular-nums text-[var(--text-muted)]/60 font-medium">
                {stage.percentage}%
              </span>

              {/* Flow arrow between stages */}
              {!isLast && (
                <div className="absolute -right-[5px] top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                  <ArrowRight className="w-2.5 h-2.5 text-[var(--text-muted)]/30" />
                </div>
              )}

              {/* Enrolled glow */}
              {isEnrolled && stage.count > 0 && (
                <div
                  className="absolute inset-0 rounded-r-xl opacity-0 group-hover/stage:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    boxShadow: `inset 0 0 20px ${stage.color}15, 0 0 15px ${stage.color}10`,
                  }}
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}

export function PipelineSection({ sfLeads, pucLeads, loading }: PipelineSectionProps) {
  const router = useRouter()

  const sfPipeline = useMemo(() => {
    const stages = [
      { key: 'new', label: 'New', color: '#3B82F6' },
      { key: 'contacted', label: 'Contacted', color: '#6366F1' },
      { key: 'test', label: 'Test', color: '#F59E0B' },
      { key: 'application', label: 'File', color: '#EF4444' },
      { key: 'applicant', label: 'Applicant', color: '#06B6D4' },
      { key: 'enrolled', label: 'Enrolled', color: '#22C55E' },
    ]
    const activeLeads = sfLeads.filter(l => l.pipeline_stage !== 'lost' && l.pipeline_stage !== 'withdraw')
    const total = activeLeads.length
    const stageData = stages.map(s => {
      const count = activeLeads.filter(l => l.pipeline_stage === s.key).length
      return {
        ...s,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }
    })
    const enrolled = stageData.find(s => s.key === 'enrolled')?.count || 0
    const conversionRate = total > 0 ? Math.round((enrolled / total) * 100) : 0
    return { stages: stageData, total, conversionRate }
  }, [sfLeads])

  const pucPipeline = useMemo(() => {
    const stages = [
      { key: 'new', label: 'New', color: '#3B82F6' },
      { key: 'contacted', label: 'Contacted', color: '#6366F1' },
      { key: 'visit', label: 'Visit', color: '#8B5CF6' },
      { key: 'test', label: 'Test', color: '#F59E0B' },
      { key: 'application', label: 'File', color: '#EF4444' },
      { key: 'puc_document_submission', label: 'Documents', color: '#EC4899' },
      { key: 'puc_application_submission', label: 'Submission', color: '#06B6D4' },
      { key: 'applicant', label: 'Applicant', color: '#14B8A6' },
      { key: 'enrolled', label: 'Enrolled', color: '#22C55E' },
    ]
    const activeLeads = pucLeads.filter(l => l.pipeline_stage !== 'lost' && l.pipeline_stage !== 'withdraw')
    const total = activeLeads.length
    const stageData = stages.map(s => {
      const count = activeLeads.filter(l => l.pipeline_stage === s.key).length
      return {
        ...s,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }
    })
    const enrolled = stageData.find(s => s.key === 'enrolled')?.count || 0
    const conversionRate = total > 0 ? Math.round((enrolled / total) * 100) : 0
    return { stages: stageData, total, conversionRate }
  }, [pucLeads])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="px-5 py-4 space-y-5">
        <PipelineRow
          label="Self Funded"
          icon={<Layers className="w-4 h-4 text-[var(--accent)]" />}
          href="/leads?fundingType=self_funded"
          stages={sfPipeline.stages}
          total={sfPipeline.total}
          conversionRate={sfPipeline.conversionRate}
          loading={loading}
          onStageClick={(stage) => router.push(`/leads?fundingType=self_funded&stage=${stage}`)}
          delay={0.12}
        />

        <div className="border-t border-[var(--border-subtle)]" />

        <PipelineRow
          label="PUC"
          icon={<GraduationCap className="w-4 h-4 text-[var(--accent)]" />}
          href="/puc-srj?tab=puc"
          stages={pucPipeline.stages}
          total={pucPipeline.total}
          conversionRate={pucPipeline.conversionRate}
          loading={loading}
          onStageClick={(stage) => router.push(`/puc-srj?tab=puc&stage=${stage}`)}
          delay={0.18}
        />
      </div>
    </motion.div>
  )
}
