"use client"

import { useEffect, useState, useCallback, startTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode } from "@/lib/demo-data"
import type { NotificationType } from "@/lib/notifications/create"

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body?: string
  is_read: boolean
  read_at?: string
  lead_id?: string
  student_id?: string
  action_url?: string
  metadata?: Record<string, unknown>
  created_by?: string
  created_at: string
}

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "demo-1",
    user_id: "demo",
    type: "new_assignment",
    title: "New Lead Assigned",
    body: "Ahmed Al-Rashidi has been assigned to you",
    is_read: false,
    action_url: "/leads",
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min ago
  },
  {
    id: "demo-2",
    user_id: "demo",
    type: "appointment_reminder",
    title: "Appointment in 15 minutes",
    body: "Campus visit with Sara Al-Mutairi at 2:00 PM",
    is_read: false,
    action_url: "/calendar",
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 min ago
  },
  {
    id: "demo-3",
    user_id: "demo",
    type: "payment_received",
    title: "Payment Received",
    body: "Cash payment of 150 KWD from Fahad Al-Enezi",
    is_read: true,
    action_url: "/leads",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
]

export function useNotifications(userId?: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    if (isDemoMode() || !userId) {
      startTransition(() => {
        setNotifications(DEMO_NOTIFICATIONS)
        setUnreadCount(DEMO_NOTIFICATIONS.filter((n) => !n.is_read).length)
        setLoading(false)
      })
      return
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (!error && data) {
      setNotifications(data as Notification[])
      setUnreadCount(data.filter((n: { is_read: boolean }) => !n.is_read).length)
    }
    setLoading(false)
  }, [userId])

  // Initial fetch
  useEffect(() => {
    startTransition(() => { fetchNotifications() })
  }, [fetchNotifications])

  // Real-time subscription for new notifications
  useEffect(() => {
    if (isDemoMode() || !userId) return

    const supabase = createClient()
    const channel = supabase
      .channel("notifications-" + userId)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchNotifications, userId])

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (isDemoMode()) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
          )
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
        return
      }

      const supabase = createClient()
      await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId)

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    },
    []
  )

  const markAllAsRead = useCallback(async () => {
    if (isDemoMode()) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
      return
    }

    if (!userId) return
    const supabase = createClient()
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("is_read", false)

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }, [userId])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  }
}
