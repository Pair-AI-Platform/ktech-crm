import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSMS, formatKuwaitPhone, replaceTemplateVariables } from '@/lib/sms/provider'

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
    // Verify cron secret (optional security)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
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
      // Appointments 23-25 hours from now
      startTime = new Date(now.getTime() + 23 * 60 * 60 * 1000)
      endTime = new Date(now.getTime() + 25 * 60 * 60 * 1000)
    } else {
      // Appointments 1.5-2.5 hours from now
      startTime = new Date(now.getTime() + 1.5 * 60 * 60 * 1000)
      endTime = new Date(now.getTime() + 2.5 * 60 * 60 * 1000)
    }

    const startDate = startTime.toISOString().split('T')[0]
    const endDate = endTime.toISOString().split('T')[0]

    // Fetch appointments in the time range that haven't been reminded yet
    const { data: appointments, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        *,
        lead:leads!appointments_lead_id_fkey(
          id,
          first_name,
          phone,
          preferred_language
        )
      `)
      .in('status', ['scheduled', 'confirmed'])
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .is(reminderType === '24h' ? 'reminder_24h_sent' : 'reminder_2h_sent', null)

    if (fetchError) {
      console.error('Error fetching appointments:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Filter appointments by exact time range
    const eligibleAppointments = (appointments || []).filter(apt => {
      const aptDateTime = new Date(`${apt.scheduled_date}T${apt.scheduled_time}`)
      return aptDateTime >= startTime && aptDateTime <= endTime && apt.lead?.phone
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

    for (const apt of eligibleAppointments) {
      const lead = apt.lead
      if (!lead?.phone) {
        results.skipped++
        results.details.push({
          appointmentId: apt.id,
          leadName: 'Unknown',
          phone: '',
          status: 'skipped',
          error: 'No phone number'
        })
        continue
      }

      // Choose language
      const lang = lead.preferred_language === 'ar' ? 'ar' : 'en'
      const template = REMINDER_TEMPLATES[reminderType as keyof typeof REMINDER_TEMPLATES][lang]
      const firstName = lead.first_name

      // Format date and time
      const aptDate = new Date(apt.scheduled_date)
      const dateStr = aptDate.toLocaleDateString(lang === 'ar' ? 'ar-KW' : 'en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      })
      const timeStr = apt.scheduled_time.slice(0, 5)

      // Build message
      const message = replaceTemplateVariables(template, {
        first_name: firstName || 'Student',
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
        continue
      }

      // Send SMS
      const smsResult = await sendSMS(lead.phone, message)

      // Store SMS record
      await supabase.from('sms_messages').insert({
        lead_id: lead.id,
        phone_number: lead.phone,
        content: message,
        status: smsResult.success ? 'sent' : 'failed',
        provider_id: smsResult.messageId || null,
        error_message: smsResult.error || null,
        sent_at: smsResult.success ? new Date().toISOString() : null,
      })

      // Mark appointment as reminded
      const updateField = reminderType === '24h' ? 'reminder_24h_sent' : 'reminder_2h_sent'
      await supabase
        .from('appointments')
        .update({ [updateField]: new Date().toISOString() })
        .eq('id', apt.id)

      if (smsResult.success) {
        results.sent++
        results.details.push({
          appointmentId: apt.id,
          leadName: `${lead.first_name}`,
          phone: lead.phone,
          status: 'sent'
        })
      } else {
        results.failed++
        results.details.push({
          appointmentId: apt.id,
          leadName: `${lead.first_name}`,
          phone: lead.phone,
          status: 'failed',
          error: smsResult.error
        })
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
