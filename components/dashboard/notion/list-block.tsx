"use client"

import { ReactNode, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ListItem {
  id: string
  title: string
  subtitle?: string
  icon?: ReactNode
  badge?: ReactNode
  metadata?: string
  onClick?: () => void
  actions?: Array<{
    label: string
    icon?: ReactNode
    onClick: () => void
    variant?: "default" | "danger"
  }>
}

interface ListBlockProps {
  items: ListItem[]
  emptyMessage?: string
  emptyIcon?: ReactNode
  maxItems?: number
  showMoreHref?: string
  onShowMore?: () => void
  loading?: boolean
  compact?: boolean
}

export function ListBlock({
  items,
  emptyMessage = "No items",
  emptyIcon,
  maxItems = 5,
  showMoreHref,
  onShowMore,
  loading = false,
  compact = false,
}: ListBlockProps) {
  const displayItems = items.slice(0, maxItems)
  const hasMore = items.length > maxItems

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-sunken)]">
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-hover)]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[var(--bg-hover)] rounded w-3/4" />
              <div className="h-3 bg-[var(--bg-hover)] rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        {emptyIcon && (
          <div className="mb-3 text-[var(--text-tertiary)]">{emptyIcon}</div>
        )}
        <p className="text-sm text-[var(--text-tertiary)]">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <AnimatePresence mode="popLayout">
        {displayItems.map((item, index) => (
          <ListItemRow key={item.id} item={item} index={index} compact={compact} />
        ))}
      </AnimatePresence>

      {/* Show More */}
      {hasMore && (onShowMore || showMoreHref) && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            "w-full py-2 text-sm text-[var(--accent)] hover:text-[var(--accent-hover)]",
            "flex items-center justify-center gap-1 rounded-lg",
            "hover:bg-[var(--bg-hover)] transition-colors"
          )}
          onClick={onShowMore}
        >
          View all {items.length} items
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      )}
    </div>
  )
}

function ListItemRow({
  item,
  index,
  compact,
}: {
  item: ListItem
  index: number
  compact: boolean
}) {
  const [showActions, setShowActions] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg",
        "hover:bg-[var(--bg-hover)] transition-colors",
        compact ? "p-2" : "p-3",
        item.onClick && "cursor-pointer"
      )}
      onClick={item.onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Icon */}
      {item.icon && item.icon}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-medium text-[var(--text-primary)] truncate",
              compact ? "text-sm" : "text-sm"
            )}
          >
            {item.title}
          </span>
          {item.badge}
        </div>
        {item.subtitle && (
          <p className="text-xs text-[var(--text-tertiary)] truncate">{item.subtitle}</p>
        )}
      </div>

      {/* Metadata */}
      {item.metadata && (
        <span className="text-xs text-[var(--text-tertiary)] whitespace-nowrap">
          {item.metadata}
        </span>
      )}

      {/* Actions Menu */}
      {item.actions && item.actions.length > 0 && (
        <div
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2",
            "opacity-0 group-hover:opacity-100 transition-opacity"
          )}
        >
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowActions(!showActions)
              }}
              className="p-1 rounded hover:bg-[var(--bg-sunken)]"
            >
              <MoreHorizontal className="w-4 h-4 text-[var(--text-tertiary)]" />
            </button>

            {showActions && (
              <div
                className={cn(
                  "absolute right-0 top-full mt-1 z-50",
                  "bg-[var(--bg-surface)] border border-[var(--border-default)]",
                  "rounded-lg shadow-lg py-1 min-w-[120px]"
                )}
              >
                {item.actions.map((action, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation()
                      action.onClick()
                      setShowActions(false)
                    }}
                    className={cn(
                      "w-full px-3 py-1.5 text-left text-sm",
                      "flex items-center gap-2 hover:bg-[var(--bg-hover)]",
                      action.variant === "danger"
                        ? "text-[var(--error)]"
                        : "text-[var(--text-secondary)]"
                    )}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click indicator */}
      {item.onClick && (
        <ChevronRight
          className={cn(
            "w-4 h-4 text-[var(--text-tertiary)]",
            "opacity-0 group-hover:opacity-100 transition-opacity"
          )}
        />
      )}
    </motion.div>
  )
}

// Specialized list for appointments
interface AppointmentItem {
  id: string
  time: string
  leadName: string
  type: string
  status?: "confirmed" | "pending" | "cancelled"
  onClick?: () => void
}

export function AppointmentList({
  appointments,
  loading,
}: {
  appointments: AppointmentItem[]
  loading?: boolean
}) {
  const statusColors = {
    confirmed: "bg-[var(--success)]/10 text-[var(--success)]",
    pending: "bg-[var(--warning)]/10 text-[var(--warning)]",
    cancelled: "bg-[var(--error)]/10 text-[var(--error)]",
  }

  const items: ListItem[] = appointments.map((apt) => ({
    id: apt.id,
    title: apt.leadName,
    subtitle: apt.type,
    metadata: apt.time,
    badge: apt.status ? (
      <span
        className={cn(
          "px-1.5 py-0.5 rounded text-xs font-medium capitalize",
          statusColors[apt.status]
        )}
      >
        {apt.status}
      </span>
    ) : undefined,
    onClick: apt.onClick,
  }))

  return <ListBlock items={items} loading={loading} emptyMessage="No appointments today" />
}

// Specialized list for leads needing attention
interface PriorityLeadItem {
  id: string
  name: string
  reason: string
  urgency: "high" | "medium" | "low"
  stage: string
  onClick?: () => void
}

export function PriorityLeadsList({
  leads,
  loading,
}: {
  leads: PriorityLeadItem[]
  loading?: boolean
}) {
  const items: ListItem[] = leads.map((lead) => ({
    id: lead.id,
    title: lead.name,
    subtitle: lead.stage,
    metadata: lead.reason,
    badge: (
      <span
        className={cn(
          "w-2 h-2 rounded-full",
          lead.urgency === "high"
            ? "bg-[var(--error)]"
            : lead.urgency === "medium"
            ? "bg-[var(--warning)]"
            : "bg-[var(--info)]"
        )}
      />
    ),
    onClick: lead.onClick,
  }))

  return (
    <ListBlock
      items={items}
      loading={loading}
      emptyMessage="All caught up! No leads need attention"
    />
  )
}
