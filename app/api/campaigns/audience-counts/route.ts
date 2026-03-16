import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api-handler'
import { getFilterCounts, getFilterLabels } from '@/lib/campaigns/audience-resolver'

export const GET = withApiHandler(
  { context: 'campaign-audience-counts', roles: ['admin'] },
  async ({ supabase }) => {
    const counts = await getFilterCounts(supabase)
    const labels = getFilterLabels()

    const filters = Object.entries(counts).map(([id, count]) => ({
      id,
      label: labels[id as keyof typeof labels] || id,
      count,
    }))

    return NextResponse.json({ filters })
  }
)
