import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api-handler'

export const GET = withApiHandler(
  { context: 'ai-chat-conversations' },
  async ({ supabase, user }) => {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  }
)
