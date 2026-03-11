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
  agentHistory: {
    all: ['agent-history'] as const,
    detail: (agentId: string) => [...queryKeys.agentHistory.all, agentId] as const,
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
}
