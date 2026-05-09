import { withApiHandler } from '@/lib/api-handler'
import { NextResponse } from 'next/server'

export const GET = withApiHandler(
  { context: 'get-preferences' },
  async ({ supabase, user }) => {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code === 'PGRST116') {
      // No preferences yet - return defaults
      return NextResponse.json({
        email_notifications: true,
        push_notifications: true,
        appointment_reminders: true,
        lead_updates: true,
        system_alerts: true,
        language: 'en',
        timezone: 'Asia/Kuwait',
      })
    }

    if (error) throw error
    return NextResponse.json(data)
  }
)

export const PUT = withApiHandler(
  { context: 'update-preferences' },
  async ({ req, supabase, user }) => {
    const body = await req.json()

    const allowedFields = [
      'email_notifications', 'push_notifications',
      'appointment_reminders', 'lead_updates', 'system_alerts',
      'language', 'timezone'
    ]

    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in body) updates[field] = body[field]
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({ user_id: user.id, ...updates }, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  }
)
