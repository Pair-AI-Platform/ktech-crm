"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Cake } from "lucide-react"
import { useRouter } from "next/navigation"
import { StaticBlock, ListBlock } from "@/components/dashboard/notion"

interface BirthdaySectionProps {
  birthdayLeads: Array<{
    lead: {
      id: string
      first_name: string
      last_name: string
      date_of_birth: string | null
      phone?: string
      pipeline_stage: string
    }
    daysUntil: number
    isToday: boolean
  }>
  loading: boolean
}

export function BirthdaySection({ birthdayLeads, loading }: BirthdaySectionProps) {
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

      return {
        id: item.lead.id,
        title: `${item.lead.first_name} ${item.lead.last_name}`,
        subtitle: item.isToday
          ? `Turns ${age} today!`
          : `Turns ${age} in ${item.daysUntil} day${item.daysUntil > 1 ? 's' : ''}`,
        metadata: item.lead.phone || '',
        badge: item.isToday ? (
          <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-[#E879F9]/10 text-[#C026D3]">
            Today
          </span>
        ) : (
          <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-[var(--info)]/10 text-[var(--info)]">
            {item.daysUntil}d
          </span>
        ),
        onClick: () => router.push(`/leads/${item.lead.id}`),
      }
    })
  }, [birthdayLeads, router])

  if (birthdayLeads.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
    >
      <StaticBlock
        title={`Birthdays${birthdayLeads.some(b => b.isToday) ? ' - Today!' : ''}`}
        icon={<Cake className="w-4 h-4 text-[#C026D3]" />}
      >
        <ListBlock
          items={birthdayItems}
          loading={loading}
          emptyMessage="No upcoming birthdays"
          emptyIcon={<Cake className="w-8 h-8 text-[var(--text-muted)]" />}
        />
      </StaticBlock>
    </motion.div>
  )
}
