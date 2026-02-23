"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Lead, Student, Profile } from "@/types"

interface WhatsAppComposerProps {
  lead?: Lead
  student?: Student
  agent?: Profile
  onSent?: () => void
}

export function WhatsAppComposer({ lead, student, onSent }: WhatsAppComposerProps) {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const phone = lead?.phone || student?.phone || ""
  const firstName = lead?.first_name || student?.first_name || ""

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px"
    }
  }, [message])

  // Reset sent state after animation
  useEffect(() => {
    if (sent) {
      const timer = setTimeout(() => setSent(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [sent])

  const handleSend = async () => {
    if (!phone || !message.trim() || sending) return

    setSending(true)

    // Simulate brief delay for feel
    await new Promise(resolve => setTimeout(resolve, 300))

    // Format and open WhatsApp
    const formattedPhone = phone.startsWith("+") ? phone.replace(/\D/g, "") : `965${phone.replace(/\D/g, "")}`
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")

    setSending(false)
    setSent(true)
    setMessage("")
    onSent?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="relative">
      <div
        className={cn(
          "flex items-end gap-2 p-3 rounded-xl border transition-all duration-200",
          "bg-[var(--bg-surface)] border-[var(--border)]",
          message && "border-[var(--border-emphasis)] shadow-sm"
        )}
      >
        {/* Input */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={firstName ? `Message ${firstName}...` : "Type a message..."}
          rows={1}
          className={cn(
            "flex-1 resize-none bg-transparent text-sm text-[var(--text-primary)]",
            "placeholder:text-[var(--text-muted)] focus:outline-none",
            "min-h-[24px] max-h-[120px] py-1"
          )}
        />

        {/* Send Button */}
        <motion.button
          onClick={handleSend}
          disabled={!phone || !message.trim() || sending}
          whileTap={{ scale: 0.92 }}
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200",
            "disabled:opacity-30 disabled:cursor-not-allowed",
            message.trim()
              ? "bg-[#25D366] text-white shadow-md shadow-[#25D366]/30"
              : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
          )}
        >
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Check className="w-4 h-4" />
              </motion.div>
            ) : (
              <motion.div
                key="send"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className={sending ? "animate-pulse" : ""}
              >
                <Send className="w-4 h-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Subtle hint - only shows when empty */}
      <AnimatePresence>
        {!message && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-[10px] text-[var(--text-muted)]/60 text-center mt-2"
          >
            Press Enter to send
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
