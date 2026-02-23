"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode } from "@/lib/demo-data"

export interface DuplicateMatch {
  id: string
  first_name: string
  last_name: string
  phone: string
  civil_id?: string
  pipeline_stage: string
  assigned_to?: string
  match_type: "phone" | "civil_id" | "name"
  created_at: string
}

export function useDuplicateCheck() {
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([])
  const [checking, setChecking] = useState(false)

  const checkDuplicates = useCallback(
    async (params: {
      phone?: string
      civil_id?: string
      first_name?: string
      last_name?: string
      excludeId?: string
    }): Promise<DuplicateMatch[]> => {
      if (isDemoMode()) return []

      // Don't check if no useful data provided
      if (!params.phone && !params.civil_id && !(params.first_name && params.last_name)) {
        return []
      }

      setChecking(true)
      const supabase = createClient()

      try {
        const { data, error } = await supabase.rpc("check_lead_duplicates", {
          p_phone: params.phone || null,
          p_civil_id: params.civil_id || null,
          p_first_name: params.first_name || null,
          p_last_name: params.last_name || null,
          p_exclude_id: params.excludeId || null,
        })

        if (error) throw error

        // Deduplicate by lead ID (a lead might match on multiple criteria)
        const uniqueMap = new Map<string, DuplicateMatch>()
        for (const match of (data || []) as DuplicateMatch[]) {
          const existing = uniqueMap.get(match.id)
          // Prefer stronger match types: phone > civil_id > name
          if (!existing || matchPriority(match.match_type) > matchPriority(existing.match_type)) {
            uniqueMap.set(match.id, match)
          }
        }

        const matches = Array.from(uniqueMap.values())
        setDuplicates(matches)
        return matches
      } catch (err) {
        console.error("[duplicate-check] Failed:", err)
        return []
      } finally {
        setChecking(false)
      }
    },
    []
  )

  const clearDuplicates = useCallback(() => setDuplicates([]), [])

  return { duplicates, checking, checkDuplicates, clearDuplicates }
}

function matchPriority(type: string): number {
  switch (type) {
    case "phone":
      return 3
    case "civil_id":
      return 2
    case "name":
      return 1
    default:
      return 0
  }
}
