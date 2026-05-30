export const queryKeys = {
  leads: {
    all: ['leads'] as const,
    lists: () => [...queryKeys.leads.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.leads.lists(), filters] as const,
    details: () => [...queryKeys.leads.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.leads.details(), id] as const,
    stats: () => [...queryKeys.leads.all, 'stats'] as const,
    lostReasons: () => [...queryKeys.leads.all, 'lost-reasons'] as const,
  },
  appointments: {
    all: ['appointments'] as const,
    lists: () => [...queryKeys.appointments.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.appointments.lists(), filters] as const,
    stats: () => [...queryKeys.appointments.all, 'stats'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
  },
  reports: {
    all: ['reports'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.reports.all, filters] as const,
  },
  agents: {
    all: ['agents'] as const,
  },
  activities: {
    all: ['activities'] as const,
    feed: (filters?: Record<string, unknown>) => [...queryKeys.activities.all, 'feed', filters] as const,
  },
  automationRules: {
    all: ['automation-rules'] as const,
  },
  filterPresets: {
    all: ['filter-presets'] as const,
  },
  dashboardStats: {
    all: ['dashboard-stats'] as const,
  },
  adminDashboardOverview: {
    all: ['admin-dashboard-overview'] as const,
  },
  adminDashboardBootstrap: {
    all: ['admin-dashboard-bootstrap'] as const,
  },
  agentHistory: {
    all: ['agent-history'] as const,
    detail: (agentId: string) => [...queryKeys.agentHistory.all, agentId] as const,
  },
  agentStatusHistory: {
    all: ['agent-status-history'] as const,
    today: () => [...queryKeys.agentStatusHistory.all, 'today'] as const,
  },
  colleges: {
    all: ['colleges'] as const,
  },
  deletedLeads: {
    all: ['deleted-leads'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.deletedLeads.all, 'list', filters] as const,
    stats: () => [...queryKeys.deletedLeads.all, 'stats'] as const,
  },
  stageSettings: {
    all: ['stage-settings'] as const,
  },
  conversionFunnel: {
    all: ['conversion-funnel'] as const,
    detail: (filters: Record<string, unknown>) => [...queryKeys.conversionFunnel.all, filters] as const,
  },
  agentPresence: {
    all: ['agent-presence'] as const,
  },
  teamAppointments: {
    all: ['team-appointments'] as const,
  },
  todayChanges: {
    all: ['today-changes'] as const,
  },
  agentAppointmentsToday: {
    all: ['agent-appointments-today'] as const,
  },
  lastMonthLeadCounts: {
    all: ['last-month-lead-counts'] as const,
  },
  agentWorkloadStats: {
    all: ['agent-workload-stats'] as const,
  },
  agentTargets: {
    all: ['agent-targets'] as const,
    month: (month: string) => ['agent-targets', month] as const,
  },
  semesters: {
    all: ['semesters'] as const,
    active: () => ['semesters', 'active'] as const,
  },
  cycles: {
    all: ['cycles'] as const,
    active: () => ['cycles', 'active'] as const,
  },
  agentSeasonalTargets: {
    all: ['agent-seasonal-targets'] as const,
    season: (seasonId: string) => ['agent-seasonal-targets', seasonId] as const,
  },
  marketingLeads: {
    all: ['marketing-leads'] as const,
    list: (filters?: Record<string, unknown>) => ['marketing-leads', 'list', filters] as const,
  },
  aiChat: {
    all: ['ai-chat'] as const,
    conversations: () => [...queryKeys.aiChat.all, 'conversations'] as const,
    messages: (id: string) => [...queryKeys.aiChat.all, 'messages', id] as const,
  },
  leadSources: {
    all: ['lead-sources'] as const,
  },
  exhibitions: {
    all: ['exhibitions'] as const,
  },
  pucPeriods: {
    all: ['puc-periods'] as const,
    active: () => ['puc-periods', 'active'] as const,
  },
  pucPreferenceChanges: {
    all: ['puc-preference-changes'] as const,
    list: (filters: Record<string, unknown>) => ['puc-preference-changes', 'list', filters] as const,
  },
  campaigns: {
    all: ['campaigns'] as const,
    lists: () => [...queryKeys.campaigns.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.campaigns.lists(), filters] as const,
    details: () => [...queryKeys.campaigns.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.campaigns.details(), id] as const,
    audienceCounts: () => [...queryKeys.campaigns.all, 'audience-counts'] as const,
  },
}
