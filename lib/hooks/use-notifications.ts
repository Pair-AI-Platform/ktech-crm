"use client"

import { useEffect, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode } from "@/lib/demo-data"
import { queryKeys } from "./query-keys"
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
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading: loading, refetch } = useQuery({
    queryKey: [...queryKeys.notifications.all, userId],
    queryFn: async () => {
      if (isDemoMode() || !userId) {
        return DEMO_NOTIFICATIONS
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error
      return (data as Notification[]) ?? []
    },
    staleTime: 30_000,
  })

  const unreadCount = notifications.filter((n) => !n.is_read).length

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
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient])

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (isDemoMode()) return

      const supabase = createClient()
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId)

      if (error) throw error
    },
    onMutate: async (notificationId: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all })

      const previousNotifications = queryClient.getQueryData<Notification[]>([...queryKeys.notifications.all, userId])

      queryClient.setQueryData<Notification[]>(
        [...queryKeys.notifications.all, userId],
        (old) =>
          old?.map((n) =>
            n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
          ) ?? []
      )

      return { previousNotifications }
    },
    onError: (_err, _notificationId, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData([...queryKeys.notifications.all, userId], context.previousNotifications)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (isDemoMode() || !userId) return

      const supabase = createClient()
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("is_read", false)

      if (error) throw error
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all })

      const previousNotifications = queryClient.getQueryData<Notification[]>([...queryKeys.notifications.all, userId])

      queryClient.setQueryData<Notification[]>(
        [...queryKeys.notifications.all, userId],
        (old) => old?.map((n) => ({ ...n, is_read: true })) ?? []
      )

      return { previousNotifications }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData([...queryKeys.notifications.all, userId], context.previousNotifications)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
    },
  })

  const markAsRead = useCallback(
    async (notificationId: string) => {
      markAsReadMutation.mutate(notificationId)
    },
    [markAsReadMutation]
  )

  const markAllAsRead = useCallback(async () => {
    markAllAsReadMutation.mutate()
  }, [markAllAsReadMutation])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch,
  }
}
