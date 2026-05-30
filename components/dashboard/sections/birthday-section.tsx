"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Cake } from "lucide-react"
import { useRouter } from "next/navigation"
import { StaticBlock, ListBlock } from "@/components/dashboard/notion"
import { cn } from "@/lib/utils"
import { getLeadDisplayName } from "@/lib/lead-utils"

interface BirthdaySectionProps {
  birthdayLeads: Array<{
    lead: {
      id: string
      first_name: string
      last_name: string
      first_name_ar?: string | null
      last_name_ar?: string | null
      date_of_birth: string | null
      phone?: string
      pipeline_stage: string
    }
    daysUntil: number
    isToday: boolean
  }>
  loading: boolean
  className?: string
  compact?: boolean
  maxItems?: number
}

export function BirthdaySection({
  birthdayLeads,
  loading,
  className,
  compact = false,
  maxItems,
}: BirthdaySectionProps) {
  const router = useRouter()

  const birthdayItems = useMemo(() => {
    return birthdayLeads.map((item) => {
      const age = (() => {
        const dob = new Date(item.lead.date_of_birth!)
        const today = new Date()
        let a = today.getFullYear() - dob.getFullYear()
        const m = today.getMonth() - dob.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) a--
        return a + (item.isToday ? 1 : 1) // next age on birthday
      })()

      const daysLabel = item.daysUntil === 1 ? 'Tomorrow' : `${item.daysUntil}d`

      return {
        id: item.lead.id,
        title: getLeadDisplayName(item.lead),
        subtitle: item.isToday
          ? `Turns ${age} today!`
          : item.daysUntil === 1
            ? `Turns ${age} tomorrow`
            : `Turns ${age} in ${item.daysUntil} days`,
        metadata: item.lead.phone || '',
        badge: item.isToday ? (
          <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-[#E879F9]/10 text-[#C026D3]">
            Today
          </span>
        ) : item.daysUntil <= 3 ? (
          <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-[#F59E0B]/10 text-[#D97706]">
            {daysLabel}
          </span>
        ) : (
          <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-[var(--info)]/10 text-[var(--info)]">
            {daysLabel}
          </span>
        ),
        onClick: () => router.push(`/leads/${item.lead.id}`),
      }
    })
  }, [birthdayLeads, router])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
      className="h-full"
    >
      <StaticBlock
        title={`Upcoming Birthdays${birthdayLeads.some(b => b.isToday) ? ' - Today!' : ''}`}
        icon={<Cake className="w-4 h-4 text-[#C026D3]" />}
        className={cn("h-full flex flex-col overflow-hidden", className)}
        contentClassName={compact ? "p-3" : undefined}
      >
        <ListBlock
          items={birthdayItems}
          loading={loading}
          emptyMessage="No upcoming birthdays"
          emptyIcon={<Cake className="w-6 h-6 text-[var(--text-muted)]" />}
          maxItems={maxItems}
          compact={compact}
          className={compact ? "space-y-0.5" : undefined}
          emptyClassName={compact ? "min-h-[96px] py-0" : undefined}
        />
      </StaticBlock>
    </motion.div>
  )
}
