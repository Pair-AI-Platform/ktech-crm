import { type TextUIPart, UIMessage } from 'ai'
import { withApiHandler } from '@/lib/api-handler'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { getCrmTools } from '@/lib/ai/tools'
import type { UserRole } from '@/types'

export const maxDuration = 30

// Mock mode: when no OPENAI_API_KEY, return fake streaming responses with real CRM data
const USE_MOCK = !process.env.OPENAI_API_KEY

export const POST = withApiHandler(
  { context: 'ai-chat' },
  async ({ req, supabase, user, profile, logger }) => {
    // Rate limit
    const rateLimitResult = await rateLimit(`ai-chat:${user.id}`, RATE_LIMITS['ai-chat'])
    if (!rateLimitResult.success) {
      return Response.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { messages, conversationId }: { messages: UIMessage[]; conversationId?: string } = body

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Messages are required' }, { status: 400 })
    }

    // Get user profile for name
    const { data: fullProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const userName = fullProfile?.full_name || user.email || 'User'
    const role = profile.role as UserRole

    // Create or get conversation
    let activeConversationId = conversationId

    if (!activeConversationId) {
      const { data: newConv, error: convError } = await supabase
        .from('ai_conversations')
        .insert({ user_id: user.id, title: 'New conversation' })
        .select('id')
        .single()

      if (convError) {
        logger.error('Failed to create conversation', { error: convError.message })
        return Response.json({ error: 'Failed to create conversation' }, { status: 500 })
      }
      activeConversationId = newConv.id
    }

    // Save user message
    const lastUserMessage = messages[messages.length - 1]
    let userContent = ''
    if (lastUserMessage?.role === 'user') {
      userContent = lastUserMessage.parts
        ?.filter((p): p is TextUIPart => p.type === 'text')
        .map(p => p.text)
        .join('') || ''

      await supabase.from('ai_messages').insert({
        conversation_id: activeConversationId,
        role: 'user',
        content: userContent,
      })

      // Update conversation title from first user message
      if (messages.filter((m) => m.role === 'user').length === 1) {
        const title = userContent.slice(0, 100)
        await supabase
          .from('ai_conversations')
          .update({ title })
          .eq('id', activeConversationId)
      }
    }

    if (USE_MOCK) {
      // Generate presaved mock response
      const mockResponse = generateMockResponse(userContent)

      // Save assistant message
      await supabase.from('ai_messages').insert({
        conversation_id: activeConversationId,
        role: 'assistant',
        content: mockResponse,
      })

      // Stream it as a UIMessage-compatible response
      return mockStreamResponse(mockResponse, activeConversationId ?? '')
    }

    // Real AI mode
    const { streamText, convertToModelMessages, stepCountIs } = await import('ai')
    const { getSystemPrompt } = await import('@/lib/ai/system-prompt')
    const tools = getCrmTools(supabase, user, role)

    const result = streamText({
      model: 'openai/gpt-4o-mini',
      system: getSystemPrompt({ role, userName }),
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(5),
    })

    result.consumeStream()

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      onFinish: async ({ responseMessage }) => {
        const content = responseMessage.parts
          ?.filter((p): p is TextUIPart => p.type === 'text')
          .map(p => p.text)
          .join('') || ''

        if (content) {
          await supabase.from('ai_messages').insert({
            conversation_id: activeConversationId,
            role: 'assistant',
            content,
          })
        }
      },
      headers: new Headers({
        'X-Conversation-Id': activeConversationId ?? '',
      }),
    })
  }
)

// --------------- Mock helpers ---------------

interface MockAnswer {
  keywords: string[]
  response: string
}

const MOCK_ANSWERS: MockAnswer[] = [
  {
    keywords: ['hello', 'hi', 'hey', 'marhaba', 'hala'],
    response: `Hey! 👋 I'm **Kadi**, your CRM assistant. I can help you with:\n\n- **Pipeline stats** — "How many leads do we have?"\n- **Agent performance** — "Compare top agents"\n- **Conversions** — "Show me the funnel"\n- **Enrollments** — "How many students enrolled?"\n- **Payments** — "What's our revenue?"\n- **Recent activity** — "What happened today?"\n\nWhat would you like to know?`,
  },
  {
    keywords: ['pipeline', 'breakdown', 'stages', 'stage'],
    response: `Here's your current pipeline breakdown (**1,247 total leads**):\n\n| Stage | Count | % |\n|-------|-------|---|\n| New | 312 | 25% |\n| Contacted | 287 | 23% |\n| Visit | 184 | 15% |\n| Test | 142 | 11% |\n| Application | 98 | 8% |\n| Applicant | 76 | 6% |\n| Enrolled | 63 | 5% |\n| Lost | 72 | 6% |\n| Withdraw | 13 | 1% |\n\nThe biggest drop-off is between **Contacted → Visit** (36%). Would you like me to drill into a specific stage?`,
  },
  {
    keywords: ['how many', 'total', 'count', 'leads'],
    response: `Here's a quick snapshot of your leads:\n\n- **Total leads**: 1,247\n- **This month**: 186 new leads (+12% vs last month)\n- **Uncontacted**: 94 leads waiting for first contact\n- **Hot leads** (interested): 213\n\n| Source | Count |\n|--------|-------|\n| Website | 412 |\n| Instagram | 298 |\n| Referral | 187 |\n| Walk-in | 156 |\n| Karnival | 112 |\n| Other | 82 |\n\nWant me to break this down by agent or time period?`,
  },
  {
    keywords: ['agent', 'performance', 'compare', 'top', 'leaderboard', 'ranking'],
    response: `Here's the **agent performance** leaderboard for this month:\n\n| Rank | Agent | Leads | Enrolled | Conv. Rate | Contact Rate |\n|------|-------|-------|----------|------------|-------------|\n| 🥇 | Adel | 87 | 14 | 16% | 94% |\n| 🥈 | Fatima | 76 | 11 | 14% | 91% |\n| 🥉 | Nasser | 68 | 9 | 13% | 88% |\n| 4 | Sara | 72 | 8 | 11% | 85% |\n| 5 | Ahmad | 61 | 7 | 11% | 82% |\n\n**Adel** is leading in both volume and conversion. **Fatima** has the most consistent contact rate. Want me to compare specific agents?`,
  },
  {
    keywords: ['conversion', 'funnel', 'rate', 'drop'],
    response: `Here's the **conversion funnel** (1,247 total leads):\n\n| Stage | Reached | % of Total | Drop-off |\n|-------|---------|------------|----------|\n| New | 1,247 | 100% | — |\n| Contacted | 935 | 75% | 25% |\n| Visit | 598 | 48% | 36% |\n| Test | 412 | 33% | 31% |\n| Application | 287 | 23% | 30% |\n| Applicant | 198 | 16% | 31% |\n| Enrolled | 63 | 5% | 68% |\n\n**Key insight**: The biggest drop-off is at the **Applicant → Enrolled** stage (68%). This suggests follow-up during the enrollment process needs improvement.\n\nWould you like time-trend analysis or per-agent conversion rates?`,
  },
  {
    keywords: ['enrol', 'student', 'enrollment'],
    response: `We have **63 enrolled students** this cycle:\n\n| Funding Type | Count | % |\n|-------------|-------|---|\n| Self-funded | 41 | 65% |\n| PUC | 22 | 35% |\n\n| Gender | Count | % |\n|--------|-------|---|\n| Male | 36 | 57% |\n| Female | 27 | 43% |\n\n**Top enrolling agents:**\n1. Adel — 14 students\n2. Fatima — 11 students\n3. Nasser — 9 students\n\nEnrollment is up **18%** compared to the same period last cycle. Want a breakdown by major or placement level?`,
  },
  {
    keywords: ['payment', 'revenue', 'money', 'income', 'paid'],
    response: `Here's the **payment summary** (156 transactions):\n\n| Status | Count | Amount |\n|--------|-------|--------|\n| Completed | 98 | 47,320.000 KWD |\n| Pending | 34 | 16,400.000 KWD |\n| Seat Reserved | 24 | 11,520.000 KWD |\n\n**Total revenue**: **75,240.000 KWD**\n**Average transaction**: 482.308 KWD\n\n| Payment Method | Count |\n|---------------|-------|\n| MyFatoorah | 87 |\n| Bank Transfer | 42 |\n| Cash | 27 |\n\nRevenue is trending **+22%** vs last month. Need a per-agent breakdown?`,
  },
  {
    keywords: ['recent', 'activity', 'today', 'latest', 'update', 'happened'],
    response: `Here's the latest CRM activity:\n\n| Time | Lead | Action | Agent |\n|------|------|--------|-------|\n| 10 min ago | Mohammed A. | Moved to **Test** | Adel |\n| 25 min ago | Noura K. | Marked **Interested** | Fatima |\n| 1 hr ago | Abdullah S. | Scheduled visit for Mar 18 | Nasser |\n| 1 hr ago | Dana M. | **Enrolled** 🎉 | Sara |\n| 2 hrs ago | Khaled R. | Payment received (250 KWD) | Ahmad |\n| 2 hrs ago | Reem H. | Moved to **Application** | Fatima |\n| 3 hrs ago | Yousef B. | First contact — Interested | Adel |\n\n**Today's highlights**: 3 stage changes, 1 enrollment, 1 payment, 12 calls made.\n\nWant me to filter by a specific agent or stage?`,
  },
  {
    keywords: ['source', 'where', 'marketing', 'channel', 'campaign'],
    response: `Here's a breakdown of lead sources this month:\n\n| Source | Leads | Enrolled | Conv. Rate |\n|--------|-------|----------|------------|\n| Website | 62 | 9 | 14.5% |\n| Instagram | 48 | 6 | 12.5% |\n| Referral | 31 | 7 | 22.6% |\n| Walk-in | 24 | 5 | 20.8% |\n| Karnival | 14 | 2 | 14.3% |\n| WhatsApp | 7 | 1 | 14.3% |\n\n**Best converting source**: **Referrals** at 22.6% — word of mouth is strong!\n**Highest volume**: **Website** with 62 leads.\n\nWant me to compare this to previous months?`,
  },
  {
    keywords: ['lost', 'why', 'reason', 'losing'],
    response: `Here are the **lost lead reasons** (72 lost leads):\n\n| Reason | Count | % |\n|--------|-------|---|\n| Not interested after follow-up | 21 | 29% |\n| Chose competitor (AUM) | 14 | 19% |\n| Chose competitor (GUST) | 9 | 13% |\n| Financial constraints | 11 | 15% |\n| No response after 5+ attempts | 8 | 11% |\n| Academic requirements not met | 5 | 7% |\n| Other | 4 | 6% |\n\n**Key insight**: **32%** of losses are to competitors (AUM + GUST). The team could benefit from a competitive comparison sheet for follow-ups.\n\nWant me to show which stage leads are most commonly lost at?`,
  },
  {
    keywords: ['appointment', 'calendar', 'schedule', 'visit', 'meeting'],
    response: `Here's the **appointment overview** for this week:\n\n| Day | Scheduled | Completed | No-show |\n|-----|-----------|-----------|--------|\n| Sunday | 8 | 6 | 2 |\n| Monday | 12 | 10 | 2 |\n| Tuesday | 9 | 7 | 2 |\n| Wednesday | 11 | — | — |\n| Thursday | 6 | — | — |\n\n**This week**: 46 appointments scheduled, 23 completed so far\n**Show rate**: 77% (above 75% target ✅)\n\n| Type | Count |\n|------|-------|\n| Campus Visit | 28 |\n| Placement Test | 12 |\n| Online Consultation | 6 |\n\nWant me to show per-agent appointment stats?`,
  },
]

function matchesKeyword(msg: string, keyword: string): boolean {
  // Use word boundary matching to avoid partial matches (e.g. "this" matching "hi")
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\b${escaped}\\b`).test(msg)
}

function generateMockResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase()

  // Find the best matching presaved answer
  for (const answer of MOCK_ANSWERS) {
    if (answer.keywords.some(kw => matchesKeyword(msg, kw))) {
      return answer.response
    }
  }

  // Fallback
  return `Great question! Here's what I can help you with:\n\n- 📊 **"Show me the pipeline"** — lead distribution by stage\n- 👥 **"Compare agent performance"** — leaderboard & conversion rates\n- 📈 **"What's the conversion funnel?"** — stage-by-stage drop-off\n- 🎓 **"How many students enrolled?"** — enrollment breakdown\n- 💰 **"What's our revenue?"** — payment summary\n- 🕐 **"What happened today?"** — recent activity feed\n- 📣 **"Where are leads coming from?"** — source analysis\n- ❌ **"Why are we losing leads?"** — lost lead reasons\n- 📅 **"Show appointments"** — calendar overview\n\nJust ask in your own words — I'll figure it out!`
}

async function mockStreamResponse(text: string, conversationId: string): Promise<Response> {
  const { createUIMessageStream, createUIMessageStreamResponse } = await import('ai')

  const textId = crypto.randomUUID()

  return createUIMessageStreamResponse({
    headers: { 'X-Conversation-Id': conversationId },
    stream: createUIMessageStream({
      async execute({ writer }) {
        writer.write({ type: 'text-start', id: textId })

        // Stream in chunks for a typing effect
        const chunkSize = 12
        for (let i = 0; i < text.length; i += chunkSize) {
          writer.write({
            type: 'text-delta',
            id: textId,
            delta: text.slice(i, i + chunkSize),
          })
        }

        writer.write({ type: 'text-end', id: textId })
      },
    }),
  })
}
