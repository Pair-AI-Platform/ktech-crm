"use client"

import { useState, useRef, useEffect } from "react"
import { Bell, CheckCheck, CreditCard, UserPlus, Calendar, AlertCircle, ArrowRight, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CounterBadge } from "@/components/ui/badge"
import { useNotifications, type Notification } from "@/lib/hooks/use-notifications"
import { useNoUpdatedAppointments } from "@/lib/hooks/use-appointments"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface NotificationDropdownProps {
  userId?: string | null
}

const typeConfig: Record<string, { icon: typeof Bell; color: string }> = {
  new_assignment: { icon: UserPlus, color: "text-[var(--primary)]" },
  appointment_reminder: { icon: Calendar, color: "text-[var(--warning)]" },
  payment_received: { icon: CreditCard, color: "text-[var(--success)]" },
  stage_change: { icon: ArrowRight, color: "text-[var(--info)]" },
  system_alert: { icon: AlertCircle, color: "text-[var(--error)]" },
}

export function NotificationDropdown({ userId }: NotificationDropdownProps) {
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(userId, { enabled: open })
  const { appointments: noUpdatedAppointments, loading: noUpdatedLoading } = useNoUpdatedAppointments({ enabled: open })
  const noUpdatedCount = open ? noUpdatedAppointments.length : 0
  const totalUnread = unreadCount + (noUpdatedCount > 0 ? 1 : 0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    setOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        onClick={() => setOpen(!open)}
      >
        <Bell className="w-5 h-5" />
        {totalUnread > 0 && (
          <div className="absolute -top-0.5 -right-0.5">
            <CounterBadge count={totalUnread} />
          </div>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[360px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <h3 className="font-semibold text-sm text-[var(--text-primary)]">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="flex items-center gap-1 text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto">
            {/* No Updated Appointments Alert */}
            {!noUpdatedLoading && noUpdatedCount > 0 && (
              <Link href="/" onClick={() => setOpen(false)}>
                <div className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-[var(--bg-hover)] bg-[var(--warning)]/5 border-b border-[var(--border)]">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-[var(--warning)]/10">
                    <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm leading-snug text-[var(--text-primary)] font-medium">
                        {noUpdatedCount} Appointments Not Updated
                      </p>
                      <span className="w-2 h-2 rounded-full bg-[var(--warning)] shrink-0 mt-1.5" />
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Past appointments still have no status update
                    </p>
                  </div>
                </div>
              </Link>
            )}

            {notifications.length === 0 && noUpdatedCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[var(--text-muted)]">
                <Bell className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const config = typeConfig[notification.type] || typeConfig.system_alert
                const Icon = config.icon

                const content = (
                  <div
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors",
                      "hover:bg-[var(--bg-hover)]",
                      !notification.is_read && "bg-[var(--primary-muted)]/30"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                        "bg-[var(--bg-sunken)]"
                      )}
                    >
                      <Icon className={cn("w-4 h-4", config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-sm leading-snug",
                            notification.is_read
                              ? "text-[var(--text-secondary)]"
                              : "text-[var(--text-primary)] font-medium"
                          )}
                        >
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <span className="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0 mt-1.5" />
                        )}
                      </div>
                      {notification.body && (
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">
                          {notification.body}
                        </p>
                      )}
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                )

                if (notification.action_url) {
                  return (
                    <Link key={notification.id} href={notification.action_url}>
                      {content}
                    </Link>
                  )
                }

                return <div key={notification.id}>{content}</div>
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
