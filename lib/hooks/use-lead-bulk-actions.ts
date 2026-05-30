"use client"

import { useMutation, useQueryClient, useIsMutating } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode } from "@/lib/demo-data"
import { getMissingPspSelfServiceFields } from "@/lib/psp/self-service-requirements"
import { queryKeys } from "./query-keys"
import type { PipelineStage } from "@/types"

type BulkStageLeadSnapshot = {
  pipeline_stage: PipelineStage
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  civil_id?: string | null
  education_type?: string | null
}

export function useLeadBulkActions() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const mutatingCount = useIsMutating({ mutationKey: ["lead-bulk-mutation"] })
  const loading = mutatingCount > 0

  const bulkAssignMutation = useMutation({
    mutationKey: ["lead-bulk-mutation"],
    mutationFn: async ({ leadIds, agentId }: { leadIds: string[]; agentId: string }) => {
      if (isDemoMode()) {
        await new Promise(resolve => setTimeout(resolve, 150))
        return { error: null, count: leadIds.length }
      }

      const { data: { user: currentUser } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from("leads")
        .update({
          assigned_to: agentId,
          assigned_at: new Date().toISOString(),
        })
        .in("id", leadIds)

      if (error) throw new Error(error.message)

      supabase.from("notifications").insert({
        user_id: agentId,
        type: "new_assignment",
        title: `${leadIds.length} lead${leadIds.length > 1 ? "s" : ""} assigned to you`,
        body: `You have been assigned ${leadIds.length} new lead${leadIds.length > 1 ? "s" : ""}`,
        action_url: "/leads",
        created_by: currentUser?.id,
      }).then(() => {})

      return { error: null, count: leadIds.length }
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationKey: ["lead-bulk-mutation"],
    mutationFn: async ({ leadIds, reason }: { leadIds: string[]; reason?: string }) => {
      if (isDemoMode()) {
        await new Promise(resolve => setTimeout(resolve, 150))
        return { error: null, count: leadIds.length }
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      let successCount = 0
      const errors: string[] = []
      for (const leadId of leadIds) {
        const { error } = await supabase.rpc("soft_delete_lead", {
          lead_id: leadId,
          deleting_user_id: user.id,
          reason: reason || null,
        })
        if (error) errors.push(`Failed to delete lead ${leadId}: ${error.message}`)
        else successCount++
      }

      if (errors.length > 0 && successCount === 0) throw new Error(errors.join("; "))
      return { error: errors.length > 0 ? errors.join("; ") : null, count: successCount }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
    },
  })

  const bulkUpdateStageMutation = useMutation({
    mutationKey: ["lead-bulk-mutation"],
    mutationFn: async ({
      leadIds,
      stage,
      lostReasonId,
      lostReasonNotes,
    }: {
      leadIds: string[]
      stage: PipelineStage
      lostReasonId?: string
      lostReasonNotes?: string
    }) => {
      if (isDemoMode()) {
        await new Promise(resolve => setTimeout(resolve, 150))
        return { error: null, count: leadIds.length }
      }

      const { data: topRow } = await supabase
        .from("leads")
        .select("position_in_stage")
        .eq("pipeline_stage", stage)
        .order("position_in_stage", { ascending: true, nullsFirst: false })
        .limit(1)
        .maybeSingle()

      const currentTop = typeof topRow?.position_in_stage === "number" ? topRow.position_in_stage : 0
      let nextPos = currentTop - leadIds.length
      const errors: string[] = []

      for (const id of leadIds) {
        let oldLead: BulkStageLeadSnapshot | null = null

        if (stage === "lost" || stage === "application") {
          const { data } = await supabase
            .from("leads")
            .select("pipeline_stage, first_name, last_name, phone, civil_id, education_type")
            .eq("id", id)
            .single()
          oldLead = data as BulkStageLeadSnapshot | null
        }

        if (stage === "application" && oldLead?.pipeline_stage !== "application") {
          const missingFields = getMissingPspSelfServiceFields(oldLead ?? {})
          if (missingFields.length > 0) {
            const leadName = `${oldLead?.first_name ?? ""} ${oldLead?.last_name ?? ""}`.trim() || id
            errors.push(`${leadName}: missing ${missingFields.join(", ")}`)
            continue
          }
        }

        const updateData: Record<string, unknown> = {
          pipeline_stage: stage,
          position_in_stage: nextPos,
          last_contacted_at: new Date().toISOString(),
          contact_status: null,
        }

        if (stage === "lost") {
          if (lostReasonId) updateData.lost_reason_id = lostReasonId
          if (lostReasonNotes) updateData.lost_reason_notes = lostReasonNotes
          if (oldLead?.pipeline_stage && oldLead.pipeline_stage !== "lost") {
            updateData.lost_at_stage = oldLead.pipeline_stage
          }
        }

        const { error } = await supabase.from("leads").update(updateData).eq("id", id)
        if (error) errors.push(error.message)
        else nextPos++
      }

      if (errors.length > 0) throw new Error(errors.join("; "))
      return { error: null, count: leadIds.length }
    },
  })

  return {
    loading,
    bulkAssignLeads: async (leadIds: string[], agentId: string) => {
      try {
        return await bulkAssignMutation.mutateAsync({ leadIds, agentId })
      } catch (err) {
        return { error: err instanceof Error ? err.message : "Failed to assign leads", count: 0 }
      }
    },
    bulkDeleteLeads: async (leadIds: string[], reason?: string) => {
      try {
        return await bulkDeleteMutation.mutateAsync({ leadIds, reason })
      } catch (err) {
        return { error: err instanceof Error ? err.message : "Failed to delete leads", count: 0 }
      }
    },
    bulkUpdateStage: async (leadIds: string[], stage: PipelineStage, lostReasonId?: string, lostReasonNotes?: string) => {
      try {
        return await bulkUpdateStageMutation.mutateAsync({ leadIds, stage, lostReasonId, lostReasonNotes })
      } catch (err) {
        return { error: err instanceof Error ? err.message : "Failed to update leads", count: 0 }
      }
    },
  }
}
