'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from './query-keys'

/**
 * Fetches today's appointments for all agents (team-wide view).
 * Useful for admin dashboards that need to see the full team schedule.
 */
export function useTeamAppointments() {
  const supabase = createClient()

  const today = new Date().toISOString().slice(0, 10)

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.teamAppointments.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, profiles:assigned_agent(id, full_name)')
        .gte('scheduled_date', today)
        .lte('scheduled_date', today)
        .order('scheduled_time', { ascending: true })

      if (error) throw new Error(error.message)
      return data
    },
  })

  return { teamAppointments: data ?? [], loading: isLoading }
}
