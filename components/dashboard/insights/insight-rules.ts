import type { InsightInput, Insight } from "./insights-engine"

export type InsightSeverity = "critical" | "warning" | "info" | "success"
export type InsightAudience = "admin" | "agent" | "both"

interface RuleDefinition {
  id: string
  label: string
  audience: InsightAudience
  evaluate: (input: InsightInput) => Insight | null
}

export const INSIGHT_RULES: RuleDefinition[] = [
  // 1. Idle leads 3+ days
  {
    id: "idle-leads",
    label: "Idle Leads",
    audience: "both",
    evaluate: ({ leads, isAdmin, userId }) => {
      const now = new Date()
      const relevantLeads = isAdmin ? leads : leads.filter((l) => l.assigned_to === userId)
      const idle = relevantLeads.filter((l) => {
        if (l.pipeline_stage === "lost" || l.pipeline_stage === "enrolled") return false
        const lastContact = l.last_contacted_at ? new Date(l.last_contacted_at) : new Date(l.created_at)
        const daysSince = Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
        return daysSince >= 3
      })
      if (idle.length === 0) return null
      const severity: InsightSeverity = idle.length > 10 ? "critical" : idle.length > 5 ? "warning" : "info"
      return {
        id: "idle-leads",
        severity,
        title: `${idle.length} leads idle 3+ days`,
        description: "These leads haven't been contacted recently and may need follow-up.",
        cta: { label: "View Leads", href: "/leads" },
      }
    },
  },

  // 2. Target progress warning (agent)
  {
    id: "target-warning",
    label: "Target Progress",
    audience: "agent",
    evaluate: ({ myTargetProgress }) => {
      if (!myTargetProgress || myTargetProgress.target === 0) return null
      const dayOfMonth = new Date().getDate()
      if (dayOfMonth < 15) return null // Only warn after mid-month
      if (myTargetProgress.progress >= 50) return null
      return {
        id: "target-warning",
        severity: "warning",
        title: `Target at ${myTargetProgress.progress}% past mid-month`,
        description: `You've reached ${myTargetProgress.applications}/${myTargetProgress.target} applications. Pick up the pace to hit your monthly goal.`,
        cta: { label: "View Leads", href: "/leads" },
      }
    },
  },

  // 3. Target achieved (agent)
  {
    id: "target-achieved",
    label: "Target Achieved",
    audience: "agent",
    evaluate: ({ myTargetProgress }) => {
      if (!myTargetProgress || myTargetProgress.target === 0) return null
      if (myTargetProgress.progress < 100) return null
      return {
        id: "target-achieved",
        severity: "success",
        title: "Monthly target achieved!",
        description: `You've reached ${myTargetProgress.applications}/${myTargetProgress.target} applications. Great work!`,
      }
    },
  },

  // 4. Conversion rate drop >15% (admin)
  {
    id: "conversion-drop",
    label: "Conversion Drop",
    audience: "admin",
    evaluate: ({ conversionDelta }) => {
      if (conversionDelta === undefined || conversionDelta >= -15) return null
      return {
        id: "conversion-drop",
        severity: "warning",
        title: `Conversion rate dropped ${Math.abs(conversionDelta)}%`,
        description: "The team's lead-to-application conversion rate has decreased compared to last period.",
        cta: { label: "View Reports", href: "/reports" },
      }
    },
  },

  // 5. Conversion rate improvement >15% (admin)
  {
    id: "conversion-up",
    label: "Conversion Improvement",
    audience: "admin",
    evaluate: ({ conversionDelta }) => {
      if (conversionDelta === undefined || conversionDelta <= 15) return null
      return {
        id: "conversion-up",
        severity: "success",
        title: `Conversion rate up ${conversionDelta}%`,
        description: "The team is converting leads to applications more effectively than the previous period.",
      }
    },
  },

  // 6. Overdue appointment status (agent)
  {
    id: "overdue-appointments",
    label: "Overdue Appointments",
    audience: "both",
    evaluate: ({ overdueAppointments, isAdmin }) => {
      if (overdueAppointments === 0) return null
      return {
        id: "overdue-appointments",
        severity: "critical",
        title: `${overdueAppointments} appointment${overdueAppointments > 1 ? "s" : ""} past due`,
        description: isAdmin
          ? "Some team appointments have passed without a status update."
          : "You have past appointments that still need their status updated.",
        cta: { label: "Update Status", href: "/calendar" },
      }
    },
  },

  // 7. Missed calls spike >5 (both)
  {
    id: "missed-calls-spike",
    label: "Missed Calls Spike",
    audience: "both",
    evaluate: ({ missedCallsCount }) => {
      if (missedCallsCount <= 5) return null
      return {
        id: "missed-calls-spike",
        severity: "warning",
        title: `${missedCallsCount} missed calls today`,
        description: "Higher than usual missed call volume. Consider returning these calls promptly.",
      }
    },
  },

  // 8. Unassigned new leads (admin)
  {
    id: "unassigned-leads",
    label: "Unassigned Leads",
    audience: "admin",
    evaluate: ({ leads }) => {
      const unassigned = leads.filter(
        (l) => l.pipeline_stage === "new" && !l.assigned_to
      )
      if (unassigned.length === 0) return null
      return {
        id: "unassigned-leads",
        severity: "warning",
        title: `${unassigned.length} unassigned new lead${unassigned.length > 1 ? "s" : ""}`,
        description: "New leads are waiting to be assigned to an agent.",
        cta: { label: "Assign Leads", href: "/leads" },
      }
    },
  },

  // 9. Agent below 30% target past day 20 (admin)
  {
    id: "agent-behind-target",
    label: "Agent Behind Target",
    audience: "admin",
    evaluate: ({ allAgentsProgress }) => {
      const dayOfMonth = new Date().getDate()
      if (dayOfMonth < 20) return null
      const behind = (allAgentsProgress || []).filter(
        (a) => a.target > 0 && a.progress < 30
      )
      if (behind.length === 0) return null
      const names = behind.map((a) => a.agentName.split(" ")[0]).join(", ")
      return {
        id: "agent-behind-target",
        severity: "warning",
        title: `${behind.length} agent${behind.length > 1 ? "s" : ""} below 30% target`,
        description: `${names} ${behind.length > 1 ? "are" : "is"} significantly behind their monthly targets with limited time remaining.`,
        cta: { label: "View Team", href: "/reports" },
      }
    },
  },

  // 10. High funnel drop-off >40% (admin)
  {
    id: "funnel-dropoff",
    label: "Funnel Drop-off",
    audience: "admin",
    evaluate: ({ funnelDropOff }) => {
      if (!funnelDropOff) return null
      const highDropOff = funnelDropOff.find((s) => s.dropOff > 40 && s.stage !== "new")
      if (!highDropOff) return null
      return {
        id: "funnel-dropoff",
        severity: "info",
        title: `${highDropOff.dropOff}% drop-off at ${highDropOff.label}`,
        description: `A significant number of leads are being lost at the ${highDropOff.label} stage. Consider reviewing the process.`,
        cta: { label: "View Reports", href: "/reports" },
      }
    },
  },
]
