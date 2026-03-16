"use client"

import { MarketingLeadForm } from "@/components/marketing/marketing-lead-form"
import { MarketingLeadsTable } from "@/components/marketing/marketing-leads-table"

export default function MarketingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Lead Submission</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Submit leads from events and campaigns, and track their progress through the pipeline.
        </p>
      </div>

      <MarketingLeadForm />
      <MarketingLeadsTable />
    </div>
  )
}
