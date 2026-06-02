"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Lead } from "@/types"
import { useLeadMutations } from "@/lib/hooks/use-leads"

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error"

const DEBOUNCE_MS = 500
const SAVED_FADE_MS = 1500

export function useAutoSaveLead(leadId: string | undefined) {
  const { updateLead } = useLeadMutations()
  const [status, setStatus] = useState<AutoSaveStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const pendingRef = useRef<Partial<Lead>>({})
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlightRef = useRef(false)

  const flushNow = useCallback(async () => {
    if (!leadId) return
    if (inFlightRef.current) return
    // Drop `undefined` values: JSON.stringify strips them, so a payload that is
    // all-undefined (e.g. a user clearing a single field) would PATCH with an
    // empty body — which PostgREST rejects, surfacing a bogus "Failed — retry".
    const payload = Object.fromEntries(
      Object.entries(pendingRef.current).filter(([, v]) => v !== undefined),
    ) as Partial<Lead>
    if (Object.keys(payload).length === 0) {
      pendingRef.current = {}
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      return
    }

    pendingRef.current = {}
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    inFlightRef.current = true
    setStatus("saving")
    setError(null)
    try {
      const result = await updateLead(leadId, payload)
      if (result?.error) throw new Error(result.error)
      setStatus("saved")
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
      savedTimerRef.current = setTimeout(() => setStatus("idle"), SAVED_FADE_MS)
      // If more changes arrived while in-flight, schedule a follow-up
      if (Object.keys(pendingRef.current).length > 0) {
        scheduleFlush()
      }
    } catch (err) {
      // Surface the real reason so a failed auto-save is never a black box.
      console.error("[useAutoSaveLead] save failed", { leadId, payload, error: err })
      // Re-queue the failed payload so a manual retry can pick it up
      pendingRef.current = { ...payload, ...pendingRef.current }
      setStatus("error")
      setError(err instanceof Error ? err.message : "Save failed")
    } finally {
      inFlightRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId, updateLead])

  const scheduleFlush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      flushNow()
    }, DEBOUNCE_MS)
  }, [flushNow])

  const queueChange = useCallback(
    (field: keyof Lead, value: unknown) => {
      pendingRef.current = { ...pendingRef.current, [field]: value } as Partial<Lead>
      if (status === "error") setStatus("idle")
      scheduleFlush()
    },
    [scheduleFlush, status],
  )

  const retry = useCallback(() => {
    setStatus("idle")
    setError(null)
    flushNow()
  }, [flushNow])

  // Flush any pending changes on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
      // Fire-and-forget any pending save so changes aren't lost
      if (leadId && Object.keys(pendingRef.current).length > 0) {
        const payload = pendingRef.current
        pendingRef.current = {}
        updateLead(leadId, payload).catch(() => {})
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId])

  return { queueChange, flush: flushNow, retry, status, error }
}
