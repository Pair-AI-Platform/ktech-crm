import { NextRequest, NextResponse } from "next/server"
import { withApiHandler } from "@/lib/api-handler"

export const runtime = 'edge'

type RouteParams = { params: Promise<{ contactId: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { contactId } = await params
  const handler = withApiHandler(
    { context: 'campaign-contact-messages', roles: ['admin'] },
    async ({ supabase }) => {
      const { data: messages, error } = await supabase
        .from('campaign_contact_messages')
        .select('*')
        .eq('campaign_contact_id', contactId)
        .order('sent_at', { ascending: true })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ messages: messages || [] })
    }
  )
  return handler(request)
}
