"use client"

import { SectionBoundary } from "@/components/dashboard/section-boundary"
import { NoUpdatedSection } from "@/components/dashboard/sections/no-updated-section"
import { PipelineSection } from "@/components/dashboard/sections/pipeline-section"
import { BirthdaySection } from "@/components/dashboard/sections/birthday-section"
import { AdminAgentHeatmap } from "@/components/dashboard/sections/admin-agent-heatmap"
import { AdminAppointmentsSection } from "@/components/dashboard/sections/admin-appointments-section"
import type { AdminDashboardBootstrap } from "@/lib/hooks/use-admin-dashboard-bootstrap"

interface AdminDashboardContentProps {
  bootstrap: AdminDashboardBootstrap
  loading: boolean
  refetchNoUpdated: () => void
}

export function AdminDashboardContent({
  bootstrap,
  loading,
  refetchNoUpdated,
}: AdminDashboardContentProps) {
  const {
    overview,
    todayAppointments,
    noUpdatedAppointments,
    agentHeatmapData,
  } = bootstrap

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 xl:gap-4 items-stretch">
        <SectionBoundary name="AdminAppointmentsSection">
          <AdminAppointmentsSection
            todayAppointments={todayAppointments}
            loading={loading}
            className="min-h-[172px]"
          />
        </SectionBoundary>
        <SectionBoundary name="BirthdaySection(admin)">
          <BirthdaySection
            birthdayLeads={overview.birthdayLeads}
            loading={loading}
            compact
            maxItems={4}
            className="min-h-[172px]"
          />
        </SectionBoundary>
      </div>

      <SectionBoundary name="AdminAgentHeatmap">
        <AdminAgentHeatmap agents={agentHeatmapData} loading={loading} />
      </SectionBoundary>

      <SectionBoundary name="NoUpdatedSection">
        <NoUpdatedSection
          noUpdatedAppointments={noUpdatedAppointments}
          noUpdatedLoading={loading}
          refetchNoUpdated={refetchNoUpdated}
        />
      </SectionBoundary>

      <SectionBoundary name="PipelineSection">
        <PipelineSection
          sfFunnelData={overview.sfFunnelData}
          pucFunnelData={overview.pucFunnelData}
          loading={loading}
        />
      </SectionBoundary>
    </>
  )
}
