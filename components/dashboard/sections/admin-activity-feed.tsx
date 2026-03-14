"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Activity as ActivityIcon } from "lucide-react"
import { StaticBlock } from "@/components/dashboard/notion"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Activity } from "@/types"

interface AdminActivityFeedProps {
  activities: Activity[]
  loading: boolean
}

function formatRelativeTime(dateString: string): string {
  const now = Date.now()
  const then = new Date(dateString).getTime()
  const diffMs = now - then
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return "just now"
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return `${Math.floor(diffDays / 7)}w ago`
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function getActivityColor(type: string): string {
  if (type.includes("call") || type.includes("phone")) return "bg-[var(--primary)]/10 text-[var(--primary)]"
  if (type.includes("sms") || type.includes("message")) return "bg-[var(--info)]/10 text-[var(--info)]"
  if (type.includes("stage") || type.includes("pipeline")) return "bg-[var(--accent)]/10 text-[var(--accent)]"
  if (type.includes("assign")) return "bg-[var(--warning)]/10 text-[var(--warning)]"
  if (type.includes("create") || type.includes("new")) return "bg-[var(--success)]/10 text-[var(--success)]"
  return "bg-[var(--bg-hover)] text-[var(--text-secondary)]"
}

export function AdminActivityFeed({ activities, loading }: AdminActivityFeedProps) {
  const displayActivities = useMemo(
    () => activities.slice(0, 15),
    [activities]
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <StaticBlock
        title="Activity Feed"
        icon={<ActivityIcon className="w-4 h-4 text-[var(--accent)]" />}
      >
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--bg-sunken)]" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 bg-[var(--bg-sunken)] rounded w-3/4" />
                  <div className="h-3 bg-[var(--bg-sunken)] rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : displayActivities.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)] text-center py-6">
            No recent activity
          </p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-4 bottom-4 w-px bg-[var(--border-subtle)]" />

            <div className="space-y-1">
              {displayActivities.map((activity, index) => {
                const agentName =
                  activity.created_by_profile
                    ? activity.created_by_profile.full_name || "Unknown"
                    : "System"
                const initials = agentName !== "System" ? getInitials(agentName) : "S"
                const description = activity.description || activity.title || activity.activity_type.replace(/_/g, " ")

                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      "relative flex items-start gap-3 py-2 px-2 rounded-lg",
                      "hover:bg-[var(--bg-hover)] transition-colors"
                    )}
                  >
                    <Avatar className="w-8 h-8 z-10 shrink-0">
                      <AvatarFallback
                        className={cn("text-[10px] font-medium", getActivityColor(activity.activity_type))}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text-primary)] leading-snug">
                        <span className="font-medium">{agentName}</span>{" "}
                        <span className="text-[var(--text-secondary)]">{description}</span>
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                        {formatRelativeTime(activity.created_at)}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}
      </StaticBlock>
    </motion.div>
  )
}

export type { AdminActivityFeedProps }
