"use client"

import { useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

interface Lead {
  id: string
  phone: string
  first_name: string
  last_name: string
}

interface UseLeadShortcutsOptions {
  lead: Lead | null | undefined
  onToggleMessage?: () => void
  onEdit?: () => void
  onFocusNotes?: () => void
}

/**
 * Keyboard shortcuts for the lead detail page
 * - C: Call the lead
 * - M: Toggle message menu
 * - B: Book appointment
 * - E: Edit lead
 * - N: Focus notes input
 */
export function useLeadShortcuts({
  lead,
  onToggleMessage,
  onEdit,
  onFocusNotes,
}: UseLeadShortcutsOptions) {
  const router = useRouter()

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip if no lead data
      if (!lead) return

      // Ignore if typing in input, textarea, or contenteditable
      const target = e.target as HTMLElement
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable ||
        target.closest('[role="dialog"]') // Ignore when modal is open
      ) {
        return
      }

      // Ignore if modifier keys are pressed (except for some combinations)
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return
      }

      switch (e.key.toLowerCase()) {
        case "c":
          // Navigate to call
          e.preventDefault()
          router.push(
            `/voice?call=${lead.phone}&leadId=${lead.id}&name=${encodeURIComponent(
              `${lead.first_name} ${lead.last_name}`
            )}`
          )
          break

        case "m":
          // Toggle message menu
          e.preventDefault()
          onToggleMessage?.()
          break

        case "b":
          // Book appointment
          e.preventDefault()
          router.push(`/calendar?book=${lead.id}`)
          break

        case "e":
          // Edit lead
          e.preventDefault()
          onEdit?.()
          break

        case "n":
          // Focus notes input
          e.preventDefault()
          onFocusNotes?.()
          break
      }
    },
    [lead, router, onToggleMessage, onEdit, onFocusNotes]
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])
}
