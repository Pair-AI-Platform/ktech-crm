"use client"

export const runtime = 'edge'

import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { Calendar, Clock, FileText, FolderOpen, Users } from "lucide-react"
import { SectionBoundary } from "@/components/dashboard/section-boundary"
import { useAfterInitialPaint } from "@/lib/hooks/use-after-initial-paint"
import { useAdminDashboardBootstrap } from "@/lib/hooks/use-admin-dashboard-bootstrap"
import { useDashboardCriticalStats, type DashboardCriticalStats } from "@/lib/hooks/use-dashboard-critical-stats"
import { useProfile } from "@/lib/hooks/use-profile"
import { cn } from "@/lib/utils"

const GreetingHeader = dynamic(
  () => import("@/components/dashboard/sections/greeting-header").then(m => m.GreetingHeader),
  { ssr: false }
)

const AdminDashboardContent = dynamic(
  () => import("@/components/dashboard/admin-dashboard-content").then(m => m.AdminDashboardContent),
  { ssr: false, loading: () => <DashboardRowsSkeleton /> }
)

const AgentDashboardContent = dynamic(
  () => import("@/components/dashboard/agent-dashboard-content").then(m => m.AgentDashboardContent),
  { ssr: false, loading: () => <DashboardRowsSkeleton /> }
)

type DashboardRole = "admin" | "agent"

export default function DashboardPage() {
  const { profile, isAdmin } = useProfile()
  const dashboardReady = useAfterInitialPaint()
  const isAdminView = !!profile && isAdmin
  const isAgentView = !!profile && !isAdmin
  const role: DashboardRole | null = isAdminView ? "admin" : isAgentView ? "agent" : null
  const adminBootstrap = useAdminDashboardBootstrap({ enabled: isAdminView })
  const { stats: agentCriticalStats, loading: agentCriticalStatsLoading } = useDashboardCriticalStats({
    enabled: !!profile && !isAdminView,
    isAdmin: isAdminView,
    profileId: profile?.id,
  })
  const criticalStats = isAdminView ? adminBootstrap.criticalStats : agentCriticalStats
  const criticalStatsLoading = isAdminView ? adminBootstrap.loading : agentCriticalStatsLoading

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <SectionBoundary name="GreetingHeader">
        <GreetingHeader profile={profile} />
      </SectionBoundary>

      <div className="px-3 py-4 sm:p-6 space-y-4 sm:space-y-6 page-enter">
        {role && (
          <SectionBoundary name="DashboardFastStats">
            <DashboardFastStats
              role={role}
              stats={criticalStats}
              loading={criticalStatsLoading}
            />
          </SectionBoundary>
        )}

        {dashboardReady && isAdminView && (
          <AdminDashboardContent
            bootstrap={adminBootstrap}
            loading={adminBootstrap.loading}
            refetchNoUpdated={() => {
              void adminBootstrap.refetch()
            }}
          />
        )}
        {dashboardReady && isAgentView && <AgentDashboardContent profileId={profile?.id} />}
      </div>
    </div>
  )
}

function DashboardFastStats({
  role,
  stats,
  loading,
}: {
  role: DashboardRole
  stats: DashboardCriticalStats
  loading: boolean
}) {
  const router = useRouter()
  const items = role === "admin"
    ? [
        {
          id: "total-leads",
          value: stats.activeLeads,
          label: "All Leads",
          icon: <Users className="w-5 h-5 text-[var(--primary)]" />,
          iconBg: "bg-[var(--primary)]/10",
        },
        {
          id: "total-files",
          value: stats.totalFiles,
          label: "Total Files",
          icon: <FileText className="w-5 h-5 text-[var(--warning)]" />,
          iconBg: "bg-[var(--warning)]/10",
        },
        {
          id: "puc-files",
          value: stats.pucFiles,
          label: "Files from PUC",
          icon: <FolderOpen className="w-5 h-5 text-[var(--success)]" />,
          iconBg: "bg-[var(--success)]/10",
        },
        {
          id: "sf-files",
          value: stats.sfFiles,
          label: "Files from SF",
          icon: <FolderOpen className="w-5 h-5 text-[var(--info)]" />,
          iconBg: "bg-[var(--info)]/10",
        },
        {
          id: "today-appts",
          value: stats.todayAppointments,
          label: "Today's Appts",
          icon: <Calendar className="w-5 h-5 text-[var(--primary)]" />,
          iconBg: "bg-[var(--primary)]/10",
          onClick: () => router.push("/calendar"),
        },
        {
          id: "callbacks",
          value: stats.todayCallbacks,
          label: "Today's Callbacks",
          icon: <Clock className="w-5 h-5 text-[var(--warning)]" />,
          iconBg: "bg-[var(--warning)]/10",
          onClick: () => router.push("/leads?status=callback"),
        },
      ]
    : [
        {
          id: "today-appts",
          value: stats.todayAppointments,
          label: "Today's Appts",
          icon: <Calendar className="w-5 h-5 text-[var(--primary)]" />,
          iconBg: "bg-[var(--primary)]/10",
          onClick: () => router.push("/calendar"),
        },
        {
          id: "callbacks",
          value: stats.todayCallbacks,
          label: "Today's Callbacks",
          icon: <Clock className="w-5 h-5 text-[var(--warning)]" />,
          iconBg: "bg-[var(--warning)]/10",
          onClick: () => router.push("/leads?status=callback"),
        },
      ]

  return (
    <div className={cn("grid gap-4", role === "admin" ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-2")}>
      {items.map(item => (
        <FastStatCard
          key={item.id}
          value={loading ? "..." : item.value}
          label={item.label}
          icon={item.icon}
          iconBg={item.iconBg}
          onClick={item.onClick}
        />
      ))}
    </div>
  )
}

function FastStatCard({
  value,
  label,
  icon,
  iconBg,
  onClick,
}: {
  value: number | string
  label: string
  icon: ReactNode
  iconBg: string
  onClick?: () => void
}) {
  const content = (
    <>
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        <p className="text-xs text-[var(--text-tertiary)] truncate">{label}</p>
      </div>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="p-4 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-default)] transition-all flex items-center gap-3 min-h-[4.5rem] text-left"
      >
        {content}
      </button>
    )
  }

  return (
    <div className="p-4 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border-subtle)] transition-all flex items-center gap-3 min-h-[4.5rem]">
      {content}
    </div>
  )
}

function DashboardRowsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-40 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-sunken)] animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-sunken)] animate-pulse" />
        <div className="h-64 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-sunken)] animate-pulse" />
      </div>
    </div>
  )
}
