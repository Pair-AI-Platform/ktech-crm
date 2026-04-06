import { withApiHandler, type AuthenticatedContext } from '@/lib/api-handler'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const GET = withApiHandler(
  { context: 'dashboard-dropoff', roles: ['admin'] },
  async (_ctx: AuthenticatedContext) => {
    const supabase = createServiceRoleClient()

    // Primary: leads with lost_at_stage populated
    const { data: leadsWithStage, error: e1 } = await supabase
      .from('leads')
      .select('id, lost_at_stage')
      .eq('pipeline_stage', 'lost')

    if (e1) {
      console.error('Failed to fetch drop-off data:', e1.message)
      return NextResponse.json({ error: 'Failed to fetch drop-off data' }, { status: 500 })
    }

    const hasStage = (leadsWithStage ?? []).filter((l) => l.lost_at_stage)
    const missingIds = (leadsWithStage ?? [])
      .filter((l) => !l.lost_at_stage)
      .map((l) => l.id)

    // Fallback: query activity logs for leads missing lost_at_stage
    let activityRows: Array<{ lead_id: string; metadata: Record<string, string> }> = []
    if (missingIds.length > 0) {
      const { data: activities, error: e2 } = await supabase
        .from('activities')
        .select('lead_id, metadata')
        .eq('activity_type', 'stage_change')
        .in('lead_id', missingIds)
        .order('created_at', { ascending: false })

      if (!e2 && activities) {
        activityRows = activities as typeof activityRows
      }
    }

    return NextResponse.json({ hasStage, activityRows })
  }
)