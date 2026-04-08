import { NextResponse } from 'next/server'
import * as nodemailer from 'nodemailer'
import { withApiHandler } from '@/lib/api-handler'

export const POST = withApiHandler(
  { context: 'send-registration' },
  async ({ req, supabase, user, logger }) => {
    const { leadId } = await req.json()

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
    }

    // Fetch lead data
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, first_name, last_name, first_name_ar, last_name_ar, civil_id, email, phone, education_type, nationality, gender')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      logger.error('Lead not found', { leadId })
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    if (!lead.civil_id) {
      return NextResponse.json({ error: 'Lead does not have a Civil ID on file' }, { status: 400 })
    }

    // Fetch sender profile name
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const senderName = senderProfile?.full_name || 'CRM System'
    const studentName = `${lead.first_name} ${lead.last_name}`
    const studentNameAr = lead.first_name_ar && lead.last_name_ar
      ? `${lead.first_name_ar} ${lead.last_name_ar}`
      : null

    // Build email
    const registrationEmail = process.env.REGISTRATION_EMAIL
    if (!registrationEmail) {
      logger.error('REGISTRATION_EMAIL env variable not set')
      return NextResponse.json(
        { error: 'Registration email not configured. Please set REGISTRATION_EMAIL in environment variables.' },
        { status: 500 }
      )
    }

    const smtpHost = process.env.SMTP_HOST
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10)
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    const smtpFrom = process.env.SMTP_FROM || smtpUser

    if (!smtpHost || !smtpUser || !smtpPass) {
      logger.error('SMTP configuration incomplete')
      return NextResponse.json(
        { error: 'Email service not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS.' },
        { status: 500 }
      )
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    const educationTypeLabel = lead.education_type
      ? lead.education_type === 'other' ? 'Other' : lead.education_type.toUpperCase()
      : 'Not specified'

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #059669; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h2 style="margin: 0;">New Student Registration</h2>
          <p style="margin: 5px 0 0; opacity: 0.9;">KTECH Enrollment System</p>
        </div>

        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
          <p style="margin: 0 0 16px; color: #374151;">A new student has been sent to registration by <strong>${senderName}</strong>.</p>

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #6b7280; width: 140px;">Student Name</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: 600;">${studentName}</td>
            </tr>
            ${studentNameAr ? `
            <tr>
              <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Name (Arabic)</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: 600; direction: rtl;">${studentNameAr}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Civil ID</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: 600;">${lead.civil_id}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Phone</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #111827;">${lead.phone || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Email</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #111827;">${lead.email || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Nationality</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #111827;">${lead.nationality || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; color: #6b7280;">Graduate Type</td>
              <td style="padding: 10px 12px; color: #111827;">${educationTypeLabel}</td>
            </tr>
          </table>

          <div style="margin-top: 20px; padding: 12px 16px; background: #f0fdf4; border-radius: 6px; border-left: 4px solid #059669;">
            <p style="margin: 0; color: #065f46; font-size: 13px;">
              This student's documents have been reviewed and are ready for registration processing.
            </p>
          </div>
        </div>

        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
          Sent from KTECH CRM &mdash; ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
    `

    try {
      await transporter.sendMail({
        from: `"KTECH CRM" <${smtpFrom}>`,
        to: registrationEmail,
        subject: `New Registration: ${studentName} — Civil ID: ${lead.civil_id}`,
        html: emailHtml,
      })

      logger.info('Registration email sent', { leadId, to: registrationEmail, civilId: lead.civil_id })

      // Log activity
      await supabase.from('activities').insert({
        lead_id: leadId,
        activity_type: 'registration_sent',
        title: 'Sent to Registration',
        description: `Registration email sent to ${registrationEmail} for ${studentName} (Civil ID: ${lead.civil_id})`,
        created_by: user.id,
        metadata: { recipient: registrationEmail, civil_id: lead.civil_id },
      })

      return NextResponse.json({ success: true })
    } catch (err: any) {
      logger.error('Failed to send registration email', { error: err.message })
      return NextResponse.json(
        { error: 'Failed to send email. Please check SMTP configuration.' },
        { status: 500 }
      )
    }
  }
)
