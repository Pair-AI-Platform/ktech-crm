"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Check,
  CheckCheck,
  Clock,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface WhatsAppMessage {
  id: string
  phone_number: string
  content: string
  status: "pending" | "sent" | "delivered" | "read" | "opened"
  direction: "outgoing" | "incoming"
  sent_at?: string
  created_at: string
  template_id?: string
}

interface WhatsAppHistoryProps {
  leadId?: string
  studentId?: string
  limit?: number
  contactName?: string
}

// Demo conversation messages
const DEMO_MESSAGES: WhatsAppMessage[] = [
  {
    id: "wa-1",
    phone_number: "99123456",
    content: "Hello Sara! Welcome to ktech. Thank you for your interest in our programs. I'm Ahmed and I'll be your advisor. How can I help you today?",
    status: "read",
    direction: "outgoing",
    sent_at: new Date(Date.now() - 172800000).toISOString(),
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "wa-2",
    phone_number: "99123456",
    content: "Hi Ahmed! Thank you for reaching out. I'm interested in the Web Development program. Can you tell me more about it?",
    status: "read",
    direction: "incoming",
    sent_at: new Date(Date.now() - 169200000).toISOString(),
    created_at: new Date(Date.now() - 169200000).toISOString(),
  },
  {
    id: "wa-3",
    phone_number: "99123456",
    content: "Of course! Our Web Development program is a 6-month intensive course covering HTML, CSS, JavaScript, React, and Node.js. Would you like to schedule a campus visit to learn more?",
    status: "read",
    direction: "outgoing",
    sent_at: new Date(Date.now() - 165600000).toISOString(),
    created_at: new Date(Date.now() - 165600000).toISOString(),
  },
  {
    id: "wa-4",
    phone_number: "99123456",
    content: "Yes, that would be great! When are you available?",
    status: "read",
    direction: "incoming",
    sent_at: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "wa-5",
    phone_number: "99123456",
    content: "Hi Sara, just a friendly reminder about your appointment at ktech tomorrow at 10 AM. Looking forward to meeting you!",
    status: "delivered",
    direction: "outgoing",
    sent_at: new Date(Date.now() - 43200000).toISOString(),
    created_at: new Date(Date.now() - 43200000).toISOString(),
  },
]

// WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
)

export function WhatsAppHistory({ leadId, studentId, limit = 20 }: WhatsAppHistoryProps) {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchMessages = async () => {
    setLoading(true)

    // Check demo mode
    if (typeof window !== "undefined" && localStorage.getItem("ktech-demo-mode") === "true") {
      setIsDemoMode(true)
      setMessages(DEMO_MESSAGES)
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      let query = supabase
        .from("whatsapp_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(limit)

      if (leadId) {
        query = query.eq("lead_id", leadId)
      } else if (studentId) {
        query = query.eq("student_id", studentId)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching WhatsApp history:", error)
        setIsDemoMode(true)
        setMessages(DEMO_MESSAGES)
      } else {
        const processedMessages = (data || []).map(msg => ({
          ...msg,
          direction: msg.direction || "outgoing"
        }))
        setMessages(processedMessages)
        if (processedMessages.length === 0) {
          setIsDemoMode(true)
          setMessages(DEMO_MESSAGES)
        }
      }
    } catch {
      setIsDemoMode(true)
      setMessages(DEMO_MESSAGES)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId, studentId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
  }

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = date.toDateString() === yesterday.toDateString()

    if (isToday) return "Today"
    if (isYesterday) return "Yesterday"
    return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-3 h-3 text-gray-400" />
      case "sent":
        return <Check className="w-3 h-3 text-gray-400" />
      case "delivered":
        return <CheckCheck className="w-3 h-3 text-gray-400" />
      case "read":
      case "opened":
        return <CheckCheck className="w-3 h-3 text-[#53bdeb]" />
      default:
        return null
    }
  }

  const groupedMessages = messages.reduce((groups, msg) => {
    const date = new Date(msg.sent_at || msg.created_at).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(msg)
    return groups
  }, {} as Record<string, WhatsAppMessage[]>)

  return (
    <Card className="border-[#25D366]/30 flex flex-col">
      <CardHeader className="pb-2 border-b border-[var(--border-secondary)]">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
            Conversation
          </CardTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={fetchMessages}
            disabled={loading}
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)]">
            <WhatsAppIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1 opacity-70">Start a conversation</p>
          </div>
        ) : (
          <div
            className="h-[320px] overflow-y-auto px-3 py-2"
            style={{ backgroundColor: "var(--bg-secondary)" }}
          >
            {Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
                <div className="flex justify-center my-3">
                  <span className="text-[10px] px-3 py-1 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-muted)] shadow-sm">
                    {formatDateHeader(msgs[0].sent_at || msgs[0].created_at)}
                  </span>
                </div>

                {msgs.map((msg, index) => {
                  const isOutgoing = msg.direction === "outgoing"

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className={cn(
                        "flex mb-1.5",
                        isOutgoing ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "relative max-w-[85%] px-3 py-2 rounded-lg shadow-sm",
                          isOutgoing
                            ? "bg-[var(--success-bg)] dark:bg-[var(--success-bg)] rounded-br-sm"
                            : "bg-[var(--bg-surface)] dark:bg-[var(--bg-elevated)] rounded-bl-sm"
                        )}
                      >
                        <p className="text-[13px] leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap">
                          {msg.content}
                        </p>

                        <div className={cn(
                          "flex items-center gap-1 mt-1",
                          isOutgoing ? "justify-end" : "justify-start"
                        )}>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {formatTime(msg.sent_at || msg.created_at)}
                          </span>
                          {isOutgoing && getStatusIcon(msg.status)}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {isDemoMode && messages.length > 0 && (
          <p className="text-[10px] text-[var(--text-muted)] text-center py-2 bg-[var(--bg-tertiary)]/50">
            Demo conversation
          </p>
        )}
      </CardContent>
    </Card>
  )
}
