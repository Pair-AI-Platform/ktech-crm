import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api-handler'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { syncFromMoodle, checkMoodleConnection } from '@/lib/lms/moodle'

/**
 * POST /api/lms/sync
 * Sync grades and test scores from Moodle LMS for a lead
 */
export const POST = withApiHandler({ context: 'lms-sync' }, async ({ req, supabase, user, logger }) => {
  // Each sync fans out into many outbound Moodle calls — throttle per user.
  const rl = await rateLimit(`lms-sync:${user.id}`, RATE_LIMITS['lms-sync'])
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfterMs: rl.resetIn },
      { status: 429 }
    )
  }

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
    placement_lms_synced_at: new Date().toISOString(),
  }

  if (syncResult.placement_scores) {
    const scores = syncResult.placement_scores

    if (scores.english_score !== null) {
      updateData.placement_english_score = scores.english_score
      updateData.placement_english_passed = scores.english_passed
    }
    // English attempt data
    updateData.placement_english_attempts = scores.english.attempts
    if (scores.english.score_1 !== null) updateData.placement_english_score_1 = scores.english.score_1
    if (scores.english.score_2 !== null) updateData.placement_english_score_2 = scores.english.score_2

    if (scores.math_score !== null) {
      updateData.placement_math_score = scores.math_score
      updateData.placement_math_passed = scores.math_passed
    }
    // Math attempt data
    updateData.placement_math_attempts = scores.math.attempts
    if (scores.math.score_1 !== null) updateData.placement_math_score_1 = scores.math.score_1
    if (scores.math.score_2 !== null) updateData.placement_math_score_2 = scores.math.score_2

    if (scores.computer_score !== null) {
      updateData.placement_computer_score = scores.computer_score
      updateData.placement_computer_passed = scores.computer_passed
    }
    // Computer attempt data
    updateData.placement_computer_attempts = scores.computer.attempts
    if (scores.computer.score_1 !== null) updateData.placement_computer_score_1 = scores.computer.score_1
    if (scores.computer.score_2 !== null) updateData.placement_computer_score_2 = scores.computer.score_2
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
export const GET = withApiHandler(
  { context: 'lms-connection' },
  async ({ logger }) => {
    const status = await checkMoodleConnection()
    return NextResponse.json(status)
  }
)
