'use client'

import { useEffect, useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from './query-keys'

const HEARTBEAT_INTERVAL_MS = 60_000

export type ManualStatus = 'meeting' | 'break' | null
type ManualStatusRow = { manual_status: ManualStatus }

/**
 * Fire-and-forget heartbeat that keeps `profiles.last_activity_at` up to date
 * so other users can see agent presence/online status.
 * Also exposes `setManualStatus` to toggle meeting/break mode.
 */
export function useHeartbeat(userId: string | undefined) {
  const [manualStatus, setManualStatusState] = useState<ManualStatus>(null)
  const queryClient = useQueryClient()

  // Fetch initial manual_status on mount
  // useEffect(() => {
  //   if (!userId) return
  //   const supabase = createClient()
  //   supabase
  //     .from('profiles')
  //     .select('manual_status')
  //     .eq('id', userId)
  //     .single()
  //     .then(({ data }: { data: ManualStatusRow | null }) => {
  //       if (data?.manual_status) {
  //         setManualStatusState(data.manual_status as ManualStatus)
  //       }
  //     })
  // }, [userId])

  useEffect(() => {
    if (!userId) return
    // const supabase = createClient()

    async function ping() {
      console.log('ping')
      // await supabase
      //   .from('profiles')
      //   .update({ last_activity_at: new Date().toISOString() })
      //   .eq('id', userId!)
    }

    ping()
    const interval = setInterval(ping, HEARTBEAT_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [userId])

  const setManualStatus = useCallback(async (status: ManualStatus) => {
    if (!userId) return
    setManualStatusState(status)
    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({ manual_status: status })
      .eq('id', userId)
    // Invalidate presence so the dashboard updates
    queryClient.invalidateQueries({ queryKey: queryKeys.agentPresence.all })
  }, [userId, queryClient])

  return { manualStatus, setManualStatus }
}
