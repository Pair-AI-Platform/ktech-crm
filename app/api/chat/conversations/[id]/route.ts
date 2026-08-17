import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api-handler'

export const runtime = 'edge'

export const GET = withApiHandler(
  { context: 'ai-chat-conversation-detail' },
  async ({ req, supabase, user }) => {
    const id = req.nextUrl.pathname.split('/').pop()

    // Verify ownership
    const { data: conv } = await supabase
      .from('ai_conversations')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const { data: messages, error } = await supabase
      .from('ai_messages')
      .select('id, role, content, tool_calls, created_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to fetch conversation messages:', error.message)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    return NextResponse.json(messages)
  }
)

export const DELETE = withApiHandler(
  { context: 'ai-chat-conversation-delete' },
  async ({ req, supabase, user }) => {
    const id = req.nextUrl.pathname.split('/').pop()

    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Failed to delete conversation:', error.message)
      return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }
)
