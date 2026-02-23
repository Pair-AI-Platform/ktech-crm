"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  MessageSquare,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { SMSMessage } from "@/types"

interface SMSHistoryProps {
  leadId?: string
  studentId?: string
  limit?: number
}

const STATUS_CONFIG = {
  pending: { icon: Clock, color: "text-[var(--warning)]", bg: "bg-[var(--warning-bg)]", label: "Pending" },
  sent: { icon: Send, color: "text-[var(--info)]", bg: "bg-[var(--info-bg)]", label: "Sent" },
  delivered: { icon: CheckCircle, color: "text-[var(--success)]", bg: "bg-[var(--success-bg)]", label: "Delivered" },
  failed: { icon: XCircle, color: "text-[var(--error)]", bg: "bg-[var(--error-bg)]", label: "Failed" },
}

// Demo messages for preview
const DEMO_MESSAGES: SMSMessage[] = [
  {
    id: "1",
    phone_number: "99123456",
    content: "Hi Ahmed, reminder: Your campus visit at ktech is tomorrow at 10:00 AM. Reply YES to confirm or call 1828888.",
    status: "delivered",
    sent_at: new Date(Date.now() - 86400000).toISOString(),
    delivered_at: new Date(Date.now() - 86000000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "2",
    phone_number: "99123456",
    content: "Welcome to ktech! Thank you for your interest in Cyber Security. An advisor will contact you soon.",
    status: "delivered",
    sent_at: new Date(Date.now() - 172800000).toISOString(),
    delivered_at: new Date(Date.now() - 172700000).toISOString(),
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
]

export function SMSHistory({ leadId, studentId, limit = 10 }: SMSHistoryProps) {
  const [messages, setMessages] = useState<SMSMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)

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
        .from("sms_messages")
        .select("*, sent_by_profile:profiles!sms_messages_sent_by_fkey(full_name)")
        .order("created_at", { ascending: false })
        .limit(limit)

      if (leadId) {
        query = query.eq("lead_id", leadId)
      } else if (studentId) {
        query = query.eq("student_id", studentId)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching SMS history:", error)
        setMessages(DEMO_MESSAGES)
      } else {
        setMessages(data || [])
      }
    } catch {
      setMessages(DEMO_MESSAGES)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId, studentId])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) return "Just now"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border)] bg-gradient-to-r from-[var(--accent)]/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
              <Clock className="w-4.5 h-4.5 text-[var(--accent)]" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                SMS History
                {messages.length > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-medium">
                    {messages.length}
                  </span>
                )}
              </h3>
              <p className="text-xs text-[var(--text-muted)]">Recent messages</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchMessages}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 overflow-y-auto max-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-[var(--primary)] mb-3" />
            <p className="text-sm text-[var(--text-muted)]">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--bg-sunken)] flex items-center justify-center mb-4">
              <MessageSquare className="w-7 h-7 text-[var(--text-muted)]" />
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)] mb-1">No messages yet</p>
            <p className="text-xs text-[var(--text-muted)]">Send an SMS to start the conversation</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, index) => {
              const statusConfig = STATUS_CONFIG[msg.status]
              const StatusIcon = statusConfig.icon

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium",
                      statusConfig.bg,
                      statusConfig.color
                    )}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusConfig.label}
                    </div>
                    <span className="text-xs text-[var(--text-muted)] font-medium">
                      {msg.sent_at ? formatDate(msg.sent_at) : formatDate(msg.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                    {msg.content}
                  </p>
                  {msg.error_message && (
                    <div className="mt-3 p-2 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20">
                      <p className="text-xs text-[var(--error)]">
                        Error: {msg.error_message}
                      </p>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}

        {isDemoMode && messages.length > 0 && (
          <p className="text-xs text-[var(--text-muted)] text-center mt-4 pt-4 border-t border-[var(--border)]">
            Demo mode - showing sample messages
          </p>
        )}
      </div>
    </div>
  )
}
