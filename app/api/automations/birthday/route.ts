import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSMS, replaceTemplateVariables } from '@/lib/sms/provider'
import { BUSINESS_CONFIG } from '@/lib/config/constants'

// Lazy-initialize service role client (no user context - runs as cron job)
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role not configured')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

// Fallback templates if no template exists in DB
const BIRTHDAY_TEMPLATES = {
  en: 'Happy Birthday {{first_name}}! 🎂🎉 Wishing you a wonderful year ahead. From your friends at KTECH.',
  ar: 'عيد ميلاد سعيد {{first_name}}! 🎂🎉 نتمنى لك سنة سعيدة. من أصدقائك في KTECH.',
}

interface BirthdayLead {
  id: string
  first_name: string
  last_name: string | null
  phone: string | null
  date_of_birth: string
}

export async function POST(request: Request) {
  try {
    // Verify cron secret
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      console.error('[Birthday Greetings] CRON_SECRET is not configured')
      return NextResponse.json(
        { error: 'Server misconfiguration: CRON_SECRET is not set' },
        { status: 500 }
      )
    }

    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()

    const body = await request.json().catch(() => ({}))
    const dryRun = body.dryRun === true

    // Get today's date in Kuwait timezone (UTC+3)
    const now = new Date()
    const kuwaitOffset = 3 * 60 // UTC+3 in minutes
    const kuwaitTime = new Date(now.getTime() + (kuwaitOffset + now.getTimezoneOffset()) * 60000)
    const todayMonth = kuwaitTime.getMonth() + 1
    const todayDay = kuwaitTime.getDate()
    const currentYear = kuwaitTime.getFullYear()

    // Find leads whose birthday is today (match month + day)
    const { data: birthdayLeads, error: fetchError } = await supabase
      .from('leads')
      .select('id, first_name, last_name, phone, date_of_birth')
      .not('date_of_birth', 'is', null)
      .not('phone', 'is', null)

    if (fetchError) {
      console.error('[Birthday Greetings] Error fetching leads:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Filter leads whose birthday matches today (month + day)
    const todaysBirthdays = ((birthdayLeads || []) as BirthdayLead[]).filter((lead) => {
      if (!lead.date_of_birth || !lead.phone) return false
      const dob = new Date(lead.date_of_birth)
      return dob.getMonth() + 1 === todayMonth && dob.getDate() === todayDay
    })

    // Get leads who already received greetings this year
    const leadIds = todaysBirthdays.map((l) => l.id)
    let alreadySentIds = new Set<string>()

    if (leadIds.length > 0) {
      const { data: sentRecords } = await supabase
        .from('birthday_greetings_sent')
        .select('lead_id')
        .in('lead_id', leadIds)
        .eq('year', currentYear)

      alreadySentIds = new Set((sentRecords || []).map((r) => r.lead_id))
    }

    // Filter out already-greeted leads
    const eligibleLeads = todaysBirthdays.filter((l) => !alreadySentIds.has(l.id))

    // Fetch birthday SMS template from DB
    const { data: templates } = await supabase
      .from('sms_templates')
      .select('content_en, content_ar')
      .eq('category', 'birthday')
      .eq('is_active', true)
      .limit(1)

    const dbTemplate = templates?.[0]

    const results = {
      total_birthdays: todaysBirthdays.length,
      already_sent: alreadySentIds.size,
      eligible: eligibleLeads.length,
      sent: 0,
      failed: 0,
      details: [] as Array<{
        leadId: string
        leadName: string
        phone: string
        status: string
        error?: string
      }>,
    }

    if (dryRun) {
      for (const lead of eligibleLeads) {
        results.sent++
        results.details.push({
          leadId: lead.id,
          leadName: `${lead.first_name} ${lead.last_name || ''}`.trim(),
          phone: lead.phone!,
          status: 'dry_run',
        })
      }

      return NextResponse.json({ success: true, dryRun: true, date: `${todayMonth}/${todayDay}`, results })
    }

    // Send in batches
    const BATCH_SIZE = BUSINESS_CONFIG.SMS_BATCH_SIZE

    for (let i = 0; i < eligibleLeads.length; i += BATCH_SIZE) {
      const batch = eligibleLeads.slice(i, i + BATCH_SIZE)

      const batchResults = await Promise.allSettled(
        batch.map(async (lead) => {
          // Default to Arabic for Kuwait-based CRM
          const templateText = dbTemplate?.content_ar || BIRTHDAY_TEMPLATES.ar

          const message = replaceTemplateVariables(templateText, {
            first_name: lead.first_name || 'Student',
          })

          const smsResult = await sendSMS(lead.phone!, message)

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

          // Track birthday greeting to prevent duplicates
          if (smsResult.success) {
            await supabase.from('birthday_greetings_sent').insert({
              lead_id: lead.id,
              year: currentYear,
              message_type: 'sms',
              message_id: smsResult.messageId || null,
            })
          }

          return { lead, smsResult }
        })
      )

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          const { lead, smsResult } = result.value
          if (smsResult.success) {
            results.sent++
            results.details.push({
              leadId: lead.id,
              leadName: `${lead.first_name} ${lead.last_name || ''}`.trim(),
              phone: lead.phone!,
              status: 'sent',
            })
          } else {
            results.failed++
            results.details.push({
              leadId: lead.id,
              leadName: `${lead.first_name} ${lead.last_name || ''}`.trim(),
              phone: lead.phone!,
              status: 'failed',
              error: smsResult.error,
            })
          }
        } else {
          results.failed++
        }
      }
    }

    // Log summary
    console.log(
      `[Birthday Greetings] ${results.sent} sent, ${results.failed} failed out of ${results.eligible} eligible (${results.total_birthdays} total birthdays today)`
    )

    return NextResponse.json({
      success: true,
      dryRun: false,
      date: `${todayMonth}/${todayDay}`,
      results,
    })
  } catch (error) {
    console.error('[Birthday Greetings] Job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET handler - used by Vercel Cron (sends GET with Authorization header)
export async function GET(request: Request) {
  // If called with CRON_SECRET, run the birthday job
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    // Delegate to POST logic by creating a mock request
    const mockRequest = new Request(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({}),
    })
    return POST(mockRequest)
  }

  // Otherwise return health check
  return NextResponse.json({
    status: 'ok',
    service: 'birthday-greetings',
    description: 'Sends birthday SMS greetings to leads whose birthday is today',
    usage: {
      cron: 'GET with Authorization: Bearer <CRON_SECRET> (Vercel Cron)',
      manual: 'POST with Authorization: Bearer <CRON_SECRET>',
      dryRun: 'POST with { "dryRun": true } to preview without sending',
    },
  })
}
