import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api-handler'
import { syncFromMoodle, checkMoodleConnection } from '@/lib/lms/moodle'
import { createLogger } from '@/lib/logger'

/**
 * POST /api/lms/sync
 * Sync grades and test scores from Moodle LMS for a lead
 */
export const POST = withApiHandler({ context: 'lms-sync' }, async ({ req, supabase, user, logger }) => {
  const body = await req.json()
  const { leadId } = body

  if (!leadId) {
    return NextResponse.json({ error: 'leadId is required' }, { status: 400 })
  }

  // Get lead data
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('id, first_name, last_name, civil_id, pipeline_stage')
    .eq('id', leadId)
    .single()

  if (leadError || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  if (!lead.civil_id) {
    return NextResponse.json(
      { error: 'Lead does not have a National ID (Civil ID) set. Cannot sync with LMS.' },
      { status: 400 }
    )
  }

  // Sync from Moodle
  logger.info('Syncing from Moodle', { leadId, civilId: lead.civil_id })
  const syncResult = await syncFromMoodle(lead.civil_id)

  if (!syncResult.success) {
    await supabase.from('activities').insert({
      lead_id: leadId,
      activity_type: 'lms_sync_failed',
      title: 'LMS Sync Failed',
      description: `Failed to sync with Moodle: ${syncResult.error}`,
      metadata: { civil_id: lead.civil_id, error: syncResult.error },
      created_by: user.id,
    })

    logger.error('Moodle sync failed', { leadId, error: syncResult.error })
    return NextResponse.json({ error: syncResult.error, success: false }, { status: 500 })
  }

  if (!syncResult.user_found) {
    await supabase.from('activities').insert({
      lead_id: leadId,
      activity_type: 'lms_sync',
      title: 'LMS Sync - User Not Found',
      description: `No user found in Moodle LMS with National ID: ${lead.civil_id}`,
      metadata: { civil_id: lead.civil_id, user_found: false },
      created_by: user.id,
    })

    return NextResponse.json({
      success: true,
      user_found: false,
      message: 'User not found in Moodle LMS',
    })
  }

  // Build update payload with placement scores
  const updateData: Record<string, unknown> = {
    placement_lms_synced: true,
  }

  if (syncResult.placement_scores) {
    const scores = syncResult.placement_scores

    if (scores.english_score !== null) {
      updateData.placement_english_score = scores.english_score
      updateData.placement_english_passed = scores.english_passed
    }

    if (scores.math_score !== null) {
      updateData.placement_math_score = scores.math_score
      updateData.placement_math_passed = scores.math_passed
    }

    if (scores.computer_score !== null) {
      updateData.placement_computer_score = scores.computer_score
      updateData.placement_computer_passed = scores.computer_passed
    }
  }

  if (syncResult.gpa !== null) {
    updateData.gpa_grade_12_expected = syncResult.gpa
  }

  // Update the lead record
  const { error: updateError } = await supabase
    .from('leads')
    .update(updateData)
    .eq('id', leadId)

  if (updateError) {
    logger.error('Failed to update lead with LMS data', { leadId, error: updateError.message })
    return NextResponse.json({ error: 'Failed to update lead with LMS data' }, { status: 500 })
  }

  // Log successful sync
  await supabase.from('activities').insert({
    lead_id: leadId,
    activity_type: 'lms_sync',
    title: 'LMS Sync Completed',
    description: 'Synced grades and test scores from Moodle LMS',
    metadata: {
      civil_id: lead.civil_id,
      placement_scores: syncResult.placement_scores,
      gpa: syncResult.gpa,
      courses_count: syncResult.grades.length,
    },
    created_by: user.id,
  })

  logger.info('LMS sync completed', { leadId, coursesCount: syncResult.grades.length })
  return NextResponse.json({
    success: true,
    user_found: true,
    placement_scores: syncResult.placement_scores,
    gpa: syncResult.gpa,
    courses_synced: syncResult.grades.length,
  })
})

/**
 * GET /api/lms/sync
 * Check Moodle connection status
 */
export async function GET() {
  const logger = createLogger('lms-connection')
  try {
    const status = await checkMoodleConnection()
    return NextResponse.json(status)
  } catch (error) {
    logger.error('Connection check failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ connected: false, error: 'Failed to check connection' }, { status: 500 })
  }
}
