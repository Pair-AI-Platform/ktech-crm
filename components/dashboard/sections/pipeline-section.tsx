"use client"

import { useMemo } from "react"
import { Layers, GraduationCap } from "lucide-react"
import { useRouter } from "next/navigation"
import { PipelineFunnelVisual } from "@/components/reports/sections/pipeline-funnel-visual"
import type { DashboardLead } from "@/lib/hooks/use-dashboard-stats"

interface PipelineSectionProps {
  sfLeads: DashboardLead[]
  pucLeads: DashboardLead[]
  loading: boolean
}

const SF_STAGES = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'test', label: 'Test' },
  { key: 'application', label: 'File' },
  { key: 'applicant', label: 'Applicant' },
  { key: 'enrolled', label: 'Enrolled' },
]

const PUC_STAGES = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'visit', label: 'Visit' },
  { key: 'test', label: 'Test' },
  { key: 'application', label: 'File' },
  { key: 'puc_document_submission', label: 'Documents' },
  { key: 'puc_application_submission', label: 'Submission' },
  { key: 'applicant', label: 'Applicant' },
  { key: 'enrolled', label: 'Enrolled' },
]

function buildFunnelData(leads: DashboardLead[], stages: { key: string; label: string }[]) {
  const activeLeads = leads.filter(l => l.pipeline_stage !== 'lost' && l.pipeline_stage !== 'withdraw')
  const total = activeLeads.length

  return stages.map(s => {
    const count = activeLeads.filter(l => l.pipeline_stage === s.key).length
    return {
      stage: s.key,
      label: s.label,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
      movesIn: 0,
      movesOut: 0,
    }
  })
}

export function PipelineSection({ sfLeads, pucLeads, loading }: PipelineSectionProps) {
  const router = useRouter()

  const sfFunnelData = useMemo(() => buildFunnelData(sfLeads, SF_STAGES), [sfLeads])
  const pucFunnelData = useMemo(() => buildFunnelData(pucLeads, PUC_STAGES), [pucLeads])

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1].map(i => (
          <div key={i} className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] shadow-sm p-6">
            <div className="animate-pulse space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-[var(--bg-sunken)] rounded-xl" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-[var(--bg-sunken)] rounded" />
                  <div className="h-3 w-24 bg-[var(--bg-sunken)] rounded" />
                </div>
              </div>
              <div className="h-[300px] bg-[var(--bg-sunken)] rounded-xl" />
              <div className="grid grid-cols-4 gap-3">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-20 bg-[var(--bg-sunken)] rounded-2xl" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Self Funded Pipeline */}
      <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] shadow-sm hover:shadow-md transition-shadow p-6 overflow-hidden">
        <PipelineFunnelVisual
          data={sfFunnelData}
          title="Self Funded"
          subtitle="SF lead progression funnel"
          icon={<Layers className="w-5 h-5 text-white" />}
          onStageClick={(stage) => router.push(`/leads?fundingType=self_funded&stage=${stage}`)}
        />
      </div>

      {/* PUC Pipeline */}
      <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] shadow-sm hover:shadow-md transition-shadow p-6 overflow-hidden">
        <PipelineFunnelVisual
          data={pucFunnelData}
          title="PUC"
          subtitle="PUC lead progression funnel"
          icon={<GraduationCap className="w-5 h-5 text-white" />}
          onStageClick={(stage) => router.push(`/puc-srj?tab=puc&stage=${stage}`)}
        />
      </div>
    </div>
  )
}
