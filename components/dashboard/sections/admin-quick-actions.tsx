"use client"

import { motion } from "framer-motion"
import { Shuffle, UserX, Megaphone } from "lucide-react"
import { useRouter } from "next/navigation"
import { QuickActionsBlock } from "@/components/dashboard/notion"
import { StaticBlock } from "@/components/dashboard/notion"

interface AdminQuickActionsProps {}

export function AdminQuickActions({}: AdminQuickActionsProps) {
  const router = useRouter()

  const actions = [
    {
      id: "bulk-reassign",
      label: "Bulk Reassign",
      icon: <Shuffle className="w-5 h-5" />,
      onClick: () => router.push("/leads?bulk=true"),
      variant: "default" as const,
    },
    {
      id: "view-unassigned",
      label: "View Unassigned",
      icon: <UserX className="w-5 h-5" />,
      onClick: () => router.push("/leads?assigned=unassigned"),
      variant: "accent" as const,
    },
    {
      id: "send-announcement",
      label: "Send Announcement",
      icon: <Megaphone className="w-5 h-5" />,
      onClick: () => alert("Announcement feature coming soon"),
      variant: "default" as const,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <StaticBlock
        title="Quick Actions"
        icon={<Megaphone className="w-4 h-4 text-[var(--accent)]" />}
        collapsible={false}
      >
        <QuickActionsBlock actions={actions} columns={3} size="md" />
      </StaticBlock>
    </motion.div>
  )
}

export type { AdminQuickActionsProps }
