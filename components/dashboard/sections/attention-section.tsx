"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { AlertTriangle, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { StaticBlock, ListBlock } from "@/components/dashboard/notion"
import type { ListItem } from "@/components/dashboard/notion"
import type { DashboardLead } from "@/lib/hooks/use-dashboard-stats"
import { cn } from "@/lib/utils"
import { getLeadDisplayName } from "@/lib/lead-utils"
import Link from "next/link"

interface AttentionSectionProps {
  priorityLeads: Array<{
    lead: DashboardLead
    reason: string
    urgency: "high" | "medium" | "low"
  }>
  loading: boolean
}

export function AttentionSection({ priorityLeads, loading }: AttentionSectionProps) {
  const router = useRouter()

  const items: ListItem[] = useMemo(() => {
    return priorityLeads.map(({ lead, reason, urgency }) => ({
      id: lead.id,
      title: getLeadDisplayName(lead),
      subtitle: lead.pipeline_stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      metadata: reason,
      badge: (
        <span
          className={cn(
            "w-2 h-2 rounded-full shrink-0",
            urgency === "high"
              ? "bg-[var(--error)]"
              : urgency === "medium"
              ? "bg-[var(--warning)]"
              : "bg-[var(--info)]"
          )}
        />
      ),
      onClick: () => router.push(`/leads/${lead.id}`),
    }))
  }, [priorityLeads, router])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <StaticBlock
        title="Needs Attention"
        icon={<AlertTriangle className="w-4 h-4 text-[var(--warning)]" />}
        headerActions={
          <Link href="/leads">
            <Button variant="ghost" size="sm" className="text-[var(--text-muted)]">
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        }
      >
        <ListBlock
          items={items}
          loading={loading}
          emptyMessage="All caught up! No leads need attention"
          emptyIcon={<AlertTriangle className="w-8 h-8 text-[var(--text-muted)]" />}
          maxItems={5}
          showMoreHref="/leads"
          onShowMore={() => router.push("/leads")}
        />
      </StaticBlock>
    </motion.div>
  )
}
