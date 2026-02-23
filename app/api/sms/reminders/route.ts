import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSMS, replaceTemplateVariables } from '@/lib/sms/provider'
import { BUSINESS_CONFIG } from '@/lib/config/constants'

// Use service role for scheduled job (no user context)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Reminder templates
const REMINDER_TEMPLATES = {
  '24h': {
    en: "Hi {{first_name}}, reminder: Your appointment at ktech is tomorrow ({{date}}) at {{time}}. Reply YES to confirm or call 1828888.",
    ar: "مرحبا {{first_name}}، تذكير: موعدك في ktech غداً ({{date}}) الساعة {{time}}. رد بـ نعم للتأكيد أو اتصل 1828888"
  },
  '2h': {
    en: "Hi {{first_name}}, your appointment at ktech is in 2 hours at {{time}}. We look forward to seeing you! Address: ktech.edu.kw/directions",
    ar: "مرحبا {{first_name}}، موعدك في ktech بعد ساعتين الساعة {{time}}. نتطلع لرؤيتك! العنوان: ktech.edu.kw/directions"
  }
}

export async function POST(request: Request) {
  try {
    // Verify cron secret (mandatory)
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      console.error('[SMS Reminders] CRON_SECRET is not configured')
      return NextResponse.json(
        { error: 'Server misconfiguration: CRON_SECRET is not set' },
        { status: 500 }
      )
    }

    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const reminderType = body.type || '24h' // '24h' or '2h'
    const dryRun = body.dryRun === true

    // Calculate time range based on reminder type
    const now = new Date()
    let startTime: Date
    let endTime: Date

    if (reminderType === '24h') {
      startTime = new Date(now.getTime() + BUSINESS_CONFIG.REMINDER_24H.START_HOURS * 60 * 60 * 1000)
      endTime = new Date(now.getTime() + BUSINESS_CONFIG.REMINDER_24H.END_HOURS * 60 * 60 * 1000)
    } else {
      startTime = new Date(now.getTime() + BUSINESS_CONFIG.REMINDER_2H.START_HOURS * 60 * 60 * 1000)
      endTime = new Date(now.getTime() + BUSINESS_CONFIG.REMINDER_2H.END_HOURS * 60 * 60 * 1000)
    }

    const startDate = startTime.toISOString().split('T')[0]
    const endDate = endTime.toISOString().split('T')[0]

    // Fetch appointments in the time range that haven't been reminded yet
    // Join through junction table for multi-lead support
    const { data: appointments, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        *,
        appointment_leads(
          lead_id,
          lead:leads(
            id,
            first_name,
            phone,
            preferred_language
          )
        )
      `)
      .in('status', ['scheduled', 'confirmed', 'will_see'])
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .is(reminderType === '24h' ? 'reminder_24h_sent' : 'reminder_2h_sent', null)

    if (fetchError) {
      console.error('Error fetching appointments:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Filter appointments by exact time range
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eligibleAppointments = (appointments || []).filter((apt: Record<string, any>) => {
      const aptDateTime = new Date(`${apt.scheduled_date}T${apt.scheduled_time}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hasLeadWithPhone = apt.appointment_leads?.some((al: Record<string, any>) => al.lead?.phone)
      return aptDateTime >= startTime && aptDateTime <= endTime && hasLeadWithPhone
    })

    const results = {
      total: eligibleAppointments.length,
      sent: 0,
      failed: 0,
      skipped: 0,
      details: [] as Array<{
        appointmentId: string
        leadName: string
        phone: string
        status: string
        error?: string
      }>
    }

    // Collect all SMS tasks to send in batches
    interface SMSTask {
      appointmentId: string
      lead: { id: string; first_name: string; phone: string; preferred_language?: string }
      message: string
    }

    const smsTasks: SMSTask[] = []

    for (const apt of eligibleAppointments) {
      // Get all leads from junction table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const leads = (apt as any).appointment_leads
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ?.map((al: any) => al.lead)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((l: any) => l?.phone) || []

      if (leads.length === 0) {
        results.skipped++
        results.details.push({
          appointmentId: apt.id,
          leadName: 'Unknown',
          phone: '',
          status: 'skipped',
          error: 'No leads with phone number'
        })
        continue
      }

      for (const lead of leads) {
        // Choose language
        const lang = lead.preferred_language === 'ar' ? 'ar' : 'en'
        const template = REMINDER_TEMPLATES[reminderType as keyof typeof REMINDER_TEMPLATES][lang]

        // Format date and time
        const aptDate = new Date(apt.scheduled_date)
        const dateStr = aptDate.toLocaleDateString(lang === 'ar' ? 'ar-KW' : 'en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric'
        })
        const timeStr = apt.scheduled_time.slice(0, 5)

        const message = replaceTemplateVariables(template, {
          first_name: lead.first_name || 'Student',
          date: dateStr,
          time: timeStr
        })

        if (dryRun) {
          results.sent++
          results.details.push({
            appointmentId: apt.id,
            leadName: `${lead.first_name}`,
            phone: lead.phone,
            status: 'dry_run'
          })
        } else {
          smsTasks.push({ appointmentId: apt.id, lead, message })
        }
      }
    }

    // Send SMS in batches using Promise.allSettled
    const BATCH_SIZE = BUSINESS_CONFIG.SMS_BATCH_SIZE
    for (let i = 0; i < smsTasks.length; i += BATCH_SIZE) {
      const batch = smsTasks.slice(i, i + BATCH_SIZE)

      const batchResults = await Promise.allSettled(
        batch.map(async (task) => {
          const smsResult = await sendSMS(task.lead.phone, task.message)

          // Store SMS record
          await supabase.from('sms_messages').insert({
            lead_id: task.lead.id,
            phone_number: task.lead.phone,
            content: task.message,
            status: smsResult.success ? 'sent' : 'failed',
            provider_id: smsResult.messageId || null,
            error_message: smsResult.error || null,
            sent_at: smsResult.success ? new Date().toISOString() : null,
          })

          return { task, smsResult }
        })
      )

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          const { task, smsResult } = result.value
          if (smsResult.success) {
            results.sent++
            results.details.push({
              appointmentId: task.appointmentId,
              leadName: `${task.lead.first_name}`,
              phone: task.lead.phone,
              status: 'sent'
            })
          } else {
            results.failed++
            results.details.push({
              appointmentId: task.appointmentId,
              leadName: `${task.lead.first_name}`,
              phone: task.lead.phone,
              status: 'failed',
              error: smsResult.error
            })
          }
        } else {
          // Promise rejected (network error, etc.)
          results.failed++
        }
      }
    }

    // Mark appointments as reminded (once per appointment, not per lead)
    if (!dryRun) {
      const remindedAptIds = new Set(smsTasks.map(t => t.appointmentId))
      const updateField = reminderType === '24h' ? 'reminder_24h_sent' : 'reminder_2h_sent'

      for (const aptId of remindedAptIds) {
        await supabase
          .from('appointments')
          .update({ [updateField]: new Date().toISOString() })
          .eq('id', aptId)
      }
    }

    return NextResponse.json({
      success: true,
      reminderType,
      dryRun,
      results
    })
  } catch (error) {
    console.error('Reminder job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for health checks
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'sms-reminders',
    endpoints: {
      '24h': 'POST with { type: "24h" } - Send 24-hour reminders',
      '2h': 'POST with { type: "2h" } - Send 2-hour reminders',
      dryRun: 'Add { dryRun: true } to preview without sending'
    }
  })
}
