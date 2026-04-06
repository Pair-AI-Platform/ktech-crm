"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Send, Check, CheckCheck, Phone, MoreVertical } from "lucide-react"
import { cn, getInitials } from "@/lib/utils"
import type { Lead, Student } from "@/types"

interface Message {
  id: string
  content: string
  direction: "in" | "out"
  status: "sending" | "sent" | "delivered" | "read"
  timestamp: Date
}

interface WhatsAppChatProps {
  lead?: Lead
  student?: Student
  onCall?: () => void
}

// Demo messages
const DEMO_MESSAGES: Message[] = [
  {
    id: "1",
    content: "Hello! Welcome to ktech. Thank you for your interest in our programs. How can I help you today?",
    direction: "out",
    status: "read",
    timestamp: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: "2",
    content: "Hi! I'm interested in the Web Development program. Can you tell me more about it?",
    direction: "in",
    status: "read",
    timestamp: new Date(Date.now() - 86400000 * 2 + 3600000),
  },
  {
    id: "3",
    content: "Of course! Our Web Development program is a 6-month intensive course covering HTML, CSS, JavaScript, React, and Node.js. Would you like to schedule a campus visit?",
    direction: "out",
    status: "read",
    timestamp: new Date(Date.now() - 86400000),
  },
  {
    id: "4",
    content: "Yes, that would be great! When are you available?",
    direction: "in",
    status: "read",
    timestamp: new Date(Date.now() - 86400000 + 1800000),
  },
  {
    id: "5",
    content: "We have openings tomorrow at 10 AM or 2 PM. Which works better for you?",
    direction: "out",
    status: "delivered",
    timestamp: new Date(Date.now() - 3600000),
  },
]

export function WhatsAppChat({ lead, student, onCall }: WhatsAppChatProps) {
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const contact = lead || student
  const name = contact ? `${'first_name_ar' in contact && contact.first_name_ar || contact.first_name} ${'last_name_ar' in contact && contact.last_name_ar || contact.last_name}` : "Contact"
  const phone = contact?.phone || ""
  const initials = contact ? getInitials(contact.first_name || '', contact.last_name || '') || "?" : "?"

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-resize input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 100) + "px"
    }
  }, [input])

  const handleSend = async () => {
    if (!input.trim() || sending) return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      direction: "out",
      status: "sending",
      timestamp: new Date(),
    }

    setMessages([...messages, newMessage])
    setInput("")
    setSending(true)

    // Simulate send
    await new Promise(r => setTimeout(r, 500))

    setMessages(prev => prev.map(m =>
      m.id === newMessage.id ? { ...m, status: "sent" } : m
    ))

    await new Promise(r => setTimeout(r, 1000))

    setMessages(prev => prev.map(m =>
      m.id === newMessage.id ? { ...m, status: "delivered" } : m
    ))

    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
  }

  const formatDateHeader = (date: Date) => {
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = date.toDateString() === yesterday.toDateString()

    if (isToday) return "Today"
    if (isYesterday) return "Yesterday"
    return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
  }

  const getStatusIcon = (status: Message["status"]) => {
    switch (status) {
      case "sending":
        return <div className="w-3 h-3 rounded-full border border-gray-400 border-t-transparent animate-spin" />
      case "sent":
        return <Check className="w-3 h-3 text-gray-400" />
      case "delivered":
        return <CheckCheck className="w-3 h-3 text-gray-400" />
      case "read":
        return <CheckCheck className="w-3 h-3 text-[#53bdeb]" />
    }
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = msg.timestamp.toDateString()
    if (!groups[date]) groups[date] = []
    groups[date].push(msg)
    return groups
  }, {} as Record<string, Message[]>)

  return (
    <div className="flex flex-col h-[500px] rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-surface)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-primary)]">
        <div className="w-10 h-10 rounded-full bg-[var(--success)] flex items-center justify-center text-white text-sm font-medium">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">{name}</h3>
          <p className="text-xs text-[var(--text-muted)]">{phone}</p>
        </div>
        <div className="flex items-center gap-1">
          {onCall && (
            <button
              onClick={onCall}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <Phone className="w-4 h-4 text-[var(--text-muted)]" />
            </button>
          )}
          <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors">
            <MoreVertical className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3 space-y-1"
        style={{
          backgroundColor: "var(--bg-secondary)",
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
        }}
      >
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            {/* Date Header */}
            <div className="flex justify-center my-3">
              <span className="text-[10px] px-3 py-1 rounded-lg bg-[var(--bg-surface)] text-[var(--text-muted)] shadow-sm">
                {formatDateHeader(msgs[0].timestamp)}
              </span>
            </div>

            {/* Messages */}
            {msgs.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "flex mb-1",
                  msg.direction === "out" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "relative max-w-[80%] px-3 py-2 rounded-lg shadow-sm",
                    msg.direction === "out"
                      ? "bg-[var(--success-bg)] dark:bg-[var(--success-bg)] rounded-br-sm"
                      : "bg-[var(--bg-surface)] dark:bg-[var(--bg-elevated)] rounded-bl-sm"
                  )}
                >
                  <p className="text-[13px] leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap">
                    {msg.content}
                  </p>
                  <div className={cn(
                    "flex items-center gap-1 mt-1",
                    msg.direction === "out" ? "justify-end" : "justify-start"
                  )}>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {formatTime(msg.timestamp)}
                    </span>
                    {msg.direction === "out" && getStatusIcon(msg.status)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2 border-t border-[var(--border)] bg-[var(--bg-primary)]">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message"
            rows={1}
            className={cn(
              "flex-1 px-4 py-2 rounded-full resize-none",
              "bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)]",
              "placeholder:text-[var(--text-muted)]",
              "focus:outline-none focus:ring-1 focus:ring-[#25D366]",
              "min-h-[40px] max-h-[100px]"
            )}
          />
          <motion.button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all",
              input.trim()
                ? "bg-[#25D366] text-white"
                : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
            )}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
