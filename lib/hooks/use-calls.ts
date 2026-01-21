"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode } from "@/lib/demo-data"

// Types for call data
export interface CallTranscript {
  id: string
  call_id: string
  full_text: string
  segments: {
    speaker: string
    text: string
    start_time: number
    end_time: number
  }[] | null
  language: string
  confidence_score: number | null
  status: string
  created_at: string
}

export interface CallSummary {
  id: string
  call_id: string
  summary: string
  summary_ar: string | null
  key_points: string[] | null
  caller_sentiment: string | null
  call_intent: string | null
  interest_level: string | null
  urgency_level: string | null
  recommended_actions: string[] | null
  recommended_pipeline_stage: string | null
  created_at: string
}

export interface CallActionItem {
  id: string
  call_id: string
  title: string
  description: string | null
  action_type: string | null
  status: string
  priority: string
  due_date: string | null
  is_ai_generated: boolean
  created_at: string
}

export interface Call {
  id: string
  twilio_call_sid: string | null
  // Avaya PBX fields
  avaya_call_id?: string | null
  avaya_ucid?: string | null
  // Source of the call
  source?: "twilio" | "avaya" | "manual"
  direction: "inbound" | "outbound"
  from_number: string
  to_number: string
  status: string
  handler: "human" | "ai" | "voicemail"
  lead_id: string | null
  agent_id: string | null
  started_at: string
  answered_at: string | null
  ended_at: string | null
  duration_seconds: number
  recording_url: string | null
  recording_duration_seconds: number | null
  disposition: string | null
  disposition_notes: string | null
  caller_name: string | null
  created_at: string
  // Avaya-specific metadata
  metadata?: {
    avaya?: {
      extension?: string
      queueName?: string
      ringDuration?: number
      waitTime?: number
      deviceId?: string
      disconnectReason?: string
    }
  } | null
  // Relations
  agent?: {
    id: string
    full_name: string
  } | null
  transcript?: CallTranscript | null
  summary?: CallSummary | null
  action_items?: CallActionItem[]
}

// Demo data for calls
const DEMO_CALLS: Call[] = [
  {
    id: "call-1",
    twilio_call_sid: "CA123456789",
    direction: "outbound",
    from_number: "+96512345678",
    to_number: "+96598765432",
    status: "completed",
    handler: "human",
    lead_id: "lead-1",
    agent_id: "agent-1",
    started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    answered_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5000).toISOString(),
    ended_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 185000).toISOString(),
    duration_seconds: 180,
    recording_url: "https://api.twilio.com/2010-04-01/Accounts/AC123/Recordings/RE123.mp3",
    recording_duration_seconds: 180,
    disposition: "interested",
    disposition_notes: "Student interested in Cyber Security program",
    caller_name: null,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    agent: { id: "agent-1", full_name: "Ahmed Ali" },
    transcript: {
      id: "transcript-1",
      call_id: "call-1",
      full_text: "Agent: Hello, this is Ahmed from Kuwait Technical College. Am I speaking with Mohammad?\n\nLead: Yes, this is Mohammad.\n\nAgent: Great! I'm calling to follow up on your inquiry about our programs. Are you still interested in studying Cyber Security?\n\nLead: Yes, definitely. I wanted to know more about the program duration and fees.\n\nAgent: The Cyber Security program is a 4-year bachelor's degree. The tuition is competitive and we have various payment options. Would you like to schedule a campus visit?\n\nLead: That sounds good. When can I visit?\n\nAgent: We have openings this week. How about Thursday at 2 PM?\n\nLead: Thursday works for me.\n\nAgent: Perfect! I'll send you a confirmation with all the details. Thank you for your time, Mohammad.\n\nLead: Thank you, goodbye.",
      segments: [
        { speaker: "Agent", text: "Hello, this is Ahmed from Kuwait Technical College. Am I speaking with Mohammad?", start_time: 0, end_time: 5 },
        { speaker: "Lead", text: "Yes, this is Mohammad.", start_time: 6, end_time: 8 },
        { speaker: "Agent", text: "Great! I'm calling to follow up on your inquiry about our programs. Are you still interested in studying Cyber Security?", start_time: 9, end_time: 15 },
        { speaker: "Lead", text: "Yes, definitely. I wanted to know more about the program duration and fees.", start_time: 16, end_time: 22 },
      ],
      language: "en",
      confidence_score: 0.95,
      status: "completed",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    summary: {
      id: "summary-1",
      call_id: "call-1",
      summary: "Follow-up call with Mohammad regarding Cyber Security program. Lead confirmed interest and asked about program duration and fees. Campus visit scheduled for Thursday at 2 PM.",
      summary_ar: "مكالمة متابعة مع محمد بخصوص برنامج الأمن السيبراني. أكد الطالب اهتمامه وسأل عن مدة البرنامج والرسوم. تم جدولة زيارة للحرم الجامعي يوم الخميس الساعة 2 مساءً.",
      key_points: [
        "Lead interested in Cyber Security program",
        "Asked about duration and fees",
        "Campus visit scheduled for Thursday 2 PM"
      ],
      caller_sentiment: "positive",
      call_intent: "enrollment_inquiry",
      interest_level: "high",
      urgency_level: "medium",
      recommended_actions: [
        "Send campus visit confirmation",
        "Prepare program materials",
        "Follow up after visit"
      ],
      recommended_pipeline_stage: "visit",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    action_items: [
      {
        id: "action-1",
        call_id: "call-1",
        title: "Send campus visit confirmation",
        description: "Send email/SMS with visit details for Thursday 2 PM",
        action_type: "follow_up",
        status: "pending",
        priority: "high",
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        is_ai_generated: true,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      }
    ]
  },
  {
    id: "call-2",
    twilio_call_sid: "CA987654321",
    direction: "inbound",
    from_number: "+96598765432",
    to_number: "+96512345678",
    status: "completed",
    handler: "ai",
    lead_id: "lead-1",
    agent_id: null,
    started_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    answered_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 2000).toISOString(),
    ended_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 92000).toISOString(),
    duration_seconds: 90,
    recording_url: "https://api.twilio.com/2010-04-01/Accounts/AC123/Recordings/RE456.mp3",
    recording_duration_seconds: 90,
    disposition: "inquiry",
    disposition_notes: "Initial inquiry handled by AI assistant",
    caller_name: "Mohammad",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    agent: null,
    transcript: {
      id: "transcript-2",
      call_id: "call-2",
      full_text: "AI: Hello! Thank you for calling Kuwait Technical College. This is Sarah, your admissions assistant. How can I help you today?\n\nCaller: Hi, I want to know about your computer programs.\n\nAI: We offer several technology programs including Cyber Security, Computer Information Systems, and Network Security. Which one interests you?\n\nCaller: Cyber Security sounds interesting. What are the requirements?\n\nAI: For Cyber Security, you need a high school diploma with a minimum GPA of 2.5. Would you like me to have an admissions counselor call you with more details?\n\nCaller: Yes please.\n\nAI: I'd be happy to arrange that. Can I confirm your name and the best time to reach you?\n\nCaller: Mohammad, and anytime in the afternoon is fine.\n\nAI: Thank you, Mohammad. An admissions counselor will reach out to you soon. Is there anything else I can help you with?\n\nCaller: No, that's all. Thank you.\n\nAI: You're welcome! Have a great day.",
      segments: null,
      language: "en",
      confidence_score: 0.92,
      status: "completed",
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    summary: {
      id: "summary-2",
      call_id: "call-2",
      summary: "Inbound inquiry handled by AI assistant. Caller (Mohammad) interested in Cyber Security program. Requested callback from admissions counselor. Available afternoons.",
      summary_ar: "استفسار وارد تمت معالجته بواسطة المساعد الذكي. المتصل (محمد) مهتم ببرنامج الأمن السيبراني. طلب معاودة الاتصال من مستشار القبول. متاح في فترة ما بعد الظهر.",
      key_points: [
        "Initial inquiry about computer programs",
        "Interested in Cyber Security",
        "Requested callback - available afternoons"
      ],
      caller_sentiment: "positive",
      call_intent: "program_inquiry",
      interest_level: "medium",
      urgency_level: "low",
      recommended_actions: [
        "Call back in afternoon",
        "Provide Cyber Security program details"
      ],
      recommended_pipeline_stage: "new",
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    action_items: []
  }
]

// Demo data for missed calls (includes both Twilio and Avaya sources)
const DEMO_MISSED_CALLS: Call[] = [
  {
    id: "missed-1",
    twilio_call_sid: "CA111222333",
    source: "twilio",
    direction: "inbound",
    from_number: "+96555512345",
    to_number: "+96512345678",
    status: "no_answer",
    handler: "human",
    lead_id: "lead-5",
    agent_id: null,
    started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    answered_at: null,
    ended_at: new Date(Date.now() - 29 * 60 * 1000).toISOString(),
    duration_seconds: 0,
    recording_url: null,
    recording_duration_seconds: null,
    disposition: null,
    disposition_notes: null,
    caller_name: "Ahmed Al-Rashid",
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    agent: null,
  },
  {
    id: "missed-2",
    avaya_call_id: "AVY-2024-001",
    avaya_ucid: "00001234567890",
    source: "avaya",
    direction: "inbound",
    from_number: "+96566612345",
    to_number: "+96512345678",
    status: "no_answer",
    handler: "human",
    lead_id: "lead-8",
    agent_id: null,
    started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    answered_at: null,
    ended_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30000).toISOString(),
    duration_seconds: 0,
    recording_url: null,
    recording_duration_seconds: null,
    disposition: null,
    disposition_notes: null,
    caller_name: "Fatima Al-Sabah",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    twilio_call_sid: null,
    metadata: {
      avaya: {
        extension: "101",
        queueName: "Sales Queue",
        ringDuration: 25,
        waitTime: 30,
      }
    },
    agent: null,
  },
  {
    id: "missed-3",
    avaya_call_id: "AVY-2024-002",
    source: "avaya",
    direction: "inbound",
    from_number: "+96577712345",
    to_number: "+96512345678",
    status: "no_answer",
    handler: "human",
    lead_id: null,
    agent_id: null,
    started_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    answered_at: null,
    ended_at: new Date(Date.now() - 4 * 60 * 60 * 1000 + 25000).toISOString(),
    duration_seconds: 0,
    recording_url: null,
    recording_duration_seconds: null,
    disposition: null,
    disposition_notes: null,
    caller_name: null,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    twilio_call_sid: null,
    metadata: {
      avaya: {
        extension: "102",
        queueName: "Support Queue",
        ringDuration: 20,
      }
    },
    agent: null,
  },
  {
    id: "missed-4",
    twilio_call_sid: "CA999888777",
    source: "twilio",
    direction: "inbound",
    from_number: "+96588899988",
    to_number: "+96512345678",
    status: "no_answer",
    handler: "human",
    lead_id: null,
    agent_id: null,
    started_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    answered_at: null,
    ended_at: new Date(Date.now() - 5 * 60 * 60 * 1000 + 15000).toISOString(),
    duration_seconds: 0,
    recording_url: null,
    recording_duration_seconds: null,
    disposition: null,
    disposition_notes: null,
    caller_name: "Khalid Mohammed",
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    agent: null,
  },
]

export function useMissedCalls() {
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMissedCalls = useCallback(async () => {
    setLoading(true)
    setError(null)

    // Demo mode
    if (isDemoMode()) {
      setCalls(DEMO_MISSED_CALLS)
      setLoading(false)
      return
    }

    const supabase = createClient()

    try {
      // Fetch missed calls from today
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: callsData, error: callsError } = await supabase
        .from("calls")
        .select(`
          *,
          agent:profiles!calls_agent_id_fkey(id, full_name)
        `)
        .eq("status", "no_answer")
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false })
        .limit(10)

      if (callsError) throw callsError

      setCalls(callsData || [])
    } catch (err) {
      console.error("Error fetching missed calls:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch missed calls")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMissedCalls()
  }, [fetchMissedCalls])

  return { calls, loading, error, refetch: fetchMissedCalls }
}

export function useCallHistory(leadId: string) {
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCalls = useCallback(async () => {
    if (!leadId) {
      setCalls([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Demo mode
    if (isDemoMode()) {
      // Return demo calls filtered by lead
      const filteredCalls = DEMO_CALLS.filter(c => c.lead_id === leadId || leadId.startsWith('lead-'))
      setCalls(filteredCalls)
      setLoading(false)
      return
    }

    const supabase = createClient()

    try {
      // Fetch calls with related data
      const { data: callsData, error: callsError } = await supabase
        .from("calls")
        .select(`
          *,
          agent:profiles!calls_agent_id_fkey(id, full_name)
        `)
        .eq("lead_id", leadId)
        .order("started_at", { ascending: false })

      if (callsError) throw callsError

      if (!callsData || callsData.length === 0) {
        setCalls([])
        setLoading(false)
        return
      }

      // Fetch transcripts, summaries, and action items for each call
      const callIds = callsData.map(c => c.id)

      const [transcriptsResult, summariesResult, actionItemsResult] = await Promise.all([
        supabase
          .from("call_transcripts")
          .select("*")
          .in("call_id", callIds),
        supabase
          .from("call_summaries")
          .select("*")
          .in("call_id", callIds),
        supabase
          .from("call_action_items")
          .select("*")
          .in("call_id", callIds)
          .order("created_at", { ascending: false })
      ])

      // Map transcripts, summaries, and action items to calls
      const transcriptsByCall = new Map(
        (transcriptsResult.data || []).map(t => [t.call_id, t])
      )
      const summariesByCall = new Map(
        (summariesResult.data || []).map(s => [s.call_id, s])
      )
      const actionItemsByCall = new Map<string, CallActionItem[]>()
      ;(actionItemsResult.data || []).forEach(item => {
        const existing = actionItemsByCall.get(item.call_id) || []
        actionItemsByCall.set(item.call_id, [...existing, item])
      })

      const enrichedCalls: Call[] = callsData.map(call => ({
        ...call,
        transcript: transcriptsByCall.get(call.id) || null,
        summary: summariesByCall.get(call.id) || null,
        action_items: actionItemsByCall.get(call.id) || []
      }))

      setCalls(enrichedCalls)
    } catch (err) {
      console.error("Error fetching call history:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch call history")
    } finally {
      setLoading(false)
    }
  }, [leadId])

  useEffect(() => {
    fetchCalls()
  }, [fetchCalls])

  return { calls, loading, error, refetch: fetchCalls }
}
