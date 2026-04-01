"use client"

import { useMarketingLeads } from "@/lib/hooks/use-marketing-leads"
import { Badge } from "@/components/ui/badge"
import { Loader2, Inbox } from "lucide-react"
import type { PipelineStage } from "@/types"

const STAGE_COLORS: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  contacted: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  visit: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  test: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  application: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  applicant: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  enrolled: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  lost: "bg-red-500/10 text-red-600 dark:text-red-400",
  withdraw: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
}

const STAGE_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  visit: "Visit",
  test: "Test",
  application: "Application",
  applicant: "Applicant",
  enrolled: "Enrolled",
  lost: "Lost",
  withdraw: "Withdraw",
  puc_document_submission: "PUC Docs",
  puc_application_submission: "PUC Enrolled",
}

export function MarketingLeadsTable() {
  const { leads, isLoading, error } = useMarketingLeads()

  // Stage summary
  const stageCounts = leads.reduce<Record<string, number>>((acc, lead) => {
    acc[lead.pipeline_stage] = (acc[lead.pipeline_stage] || 0) + 1
    return acc
  }, {})

  if (isLoading) {
    return (
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-12 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-6 text-[var(--error)] text-sm">
        Failed to load leads: {error.message}
      </div>
    )
  }

  return (
    <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)]">
      <div className="p-6 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">My Submitted Leads</h2>
          <span className="text-sm text-[var(--text-muted)]">{leads.length} total</span>
        </div>

        {/* Stage summary badges */}
        {leads.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(stageCounts).map(([stage, count]) => (
              <span
                key={stage}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${STAGE_COLORS[stage] || "bg-gray-500/10 text-gray-500"}`}
              >
                {STAGE_LABELS[stage] || stage}: {count}
              </span>
            ))}
          </div>
        )}
      </div>

      {leads.length === 0 ? (
        <div className="p-12 text-center">
          <Inbox className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-[var(--text-secondary)]">No leads submitted yet</p>
          <p className="text-sm text-[var(--text-muted)]">Use the form above to submit your first lead</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="px-6 py-3 font-medium text-[var(--text-secondary)]">Lead Name</th>
                <th className="px-6 py-3 font-medium text-[var(--text-secondary)]">Phone</th>
                <th className="px-6 py-3 font-medium text-[var(--text-secondary)]">Stage</th>
                <th className="px-6 py-3 font-medium text-[var(--text-secondary)]">Status</th>
                <th className="px-6 py-3 font-medium text-[var(--text-secondary)]">Assigned Agent</th>
                <th className="px-6 py-3 font-medium text-[var(--text-secondary)]">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-hover)]">
                  <td className="px-6 py-3 text-[var(--text-primary)] font-medium">
                    {lead.first_name} {lead.last_name}
                  </td>
                  <td className="px-6 py-3 text-[var(--text-secondary)] font-mono text-xs">
                    {lead.phone}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[lead.pipeline_stage] || "bg-gray-500/10 text-gray-500"}`}>
                      {STAGE_LABELS[lead.pipeline_stage] || lead.pipeline_stage}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-[var(--text-secondary)] text-xs capitalize">
                    {lead.contact_status?.replace(/_/g, " ") || "-"}
                  </td>
                  <td className="px-6 py-3 text-[var(--text-secondary)] text-xs">
                    {lead.assigned_agent?.full_name || (
                      <span className="text-[var(--text-muted)]">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-[var(--text-muted)] text-xs">
                    {new Date(lead.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
