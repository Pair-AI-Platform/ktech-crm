'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UserPreferences } from '@/types'

const defaultPreferences: UserPreferences = {
  email_notifications: true,
  sms_notifications: true,
  push_notifications: true,
  appointment_reminders: true,
  lead_updates: true,
  system_alerts: true,
  language: 'en',
  timezone: 'Asia/Kuwait',
}

export function usePreferences() {
  const queryClient = useQueryClient()

  const { data: preferences = defaultPreferences, isLoading } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: async () => {
      const res = await fetch('/api/settings/preferences')
      if (!res.ok) throw new Error('Failed to fetch preferences')
      return res.json() as Promise<UserPreferences>
    },
    staleTime: 300_000, // 5 minutes
  })

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<UserPreferences>) => {
      const res = await fetch('/api/settings/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Failed to update preferences')
      return res.json() as Promise<UserPreferences>
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user-preferences'], data)
    },
  })

  return {
    preferences,
    loading: isLoading,
    updatePreferences: updateMutation.mutateAsync,
    saving: updateMutation.isPending,
  }
}
