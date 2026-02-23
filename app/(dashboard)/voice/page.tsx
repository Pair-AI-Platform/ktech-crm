"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion"
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Hand,
  Settings,
  ChevronRight,
  User,
  Calendar,
  MessageSquare,
  CheckCircle2,
  Clock,
  Sparkles,
  History,
  BarChart3,
  PhoneIncoming,
  Play,
  ArrowRight,
  X,
  GitBranch,
  Headphones,
} from "lucide-react"
import { cn, formatKuwaitPhone } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { VoiceWorkflow, VoiceWorkflowIntegration } from "@/types"
import { WorkflowBuilder, WorkflowList } from "@/components/voice/workflow-builder"
import { PhonePanel } from "@/components/voice/pbx"
import { WhatsAppCallsPanel } from "@/components/voice/whatsapp-calls"

// ============================================================================
// Types
// ============================================================================

type KadiState = "resting" | "listening" | "speaking" | "thinking" | "celebrating"
type CallState = "idle" | "incoming" | "active" | "ended"

interface ActiveCall {
  id: string
  leadName: string
  phone: string
  language: "ar" | "en"
  duration: number
  sentiment: "positive" | "neutral" | "concerned"
}

interface ConversationMessage {
  id: string
  speaker: "kadi" | "caller"
  text: string
  language: "ar" | "en"
}

interface RecentActivity {
  id: string
  type: "enrolled" | "booked" | "callback" | "handled"
  leadName: string
  time: string
}

// ============================================================================
// Kadi - The Living Presence
// ============================================================================

function KadiPresence({
  state,
  sentiment,
  size = 200
}: {
  state: KadiState
  sentiment?: "positive" | "neutral" | "concerned"
  size?: number
}) {
  const breatheScale = useMotionValue(1)
  const glowOpacity = useMotionValue(0.4)

  // Breathing animation for resting state
  useEffect(() => {
    if (state === "resting") {
      const breathe = animate(breatheScale, [1, 1.05, 1], {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      })
      const glow = animate(glowOpacity, [0.3, 0.5, 0.3], {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      })
      return () => { breathe.stop(); glow.stop() }
    }
  }, [state, breatheScale, glowOpacity])

  // Color based on state and sentiment
  const getColors = () => {
    if (state === "celebrating") {
      return {
        primary: "bg-[var(--warning)]",
        glow: "rgba(251, 191, 36, 0.4)",
        particles: "var(--warning)"
      }
    }
    if (sentiment === "concerned") {
      return {
        primary: "bg-[var(--warning)]",
        glow: "rgba(251, 146, 60, 0.3)",
        particles: "var(--warning)"
      }
    }
    return {
      primary: "bg-[var(--primary)]",
      glow: "rgba(45, 58, 109, 0.35)",
      particles: "var(--primary)"
    }
  }

  const colors = getColors()
  const isActive = state === "speaking" || state === "listening"

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Ambient glow */}
      <motion.div
        className="absolute inset-0 rounded-full blur-3xl"
        style={{
          background: colors.glow,
          scale: breatheScale,
          opacity: glowOpacity,
        }}
      />

      {/* Outer ring - pulses when active */}
      <motion.div
        className={cn(
          "absolute inset-0 rounded-full",
          colors.primary
        )}
        style={{ opacity: 0.1 }}
        animate={isActive ? {
          scale: [1, 1.15, 1],
          opacity: [0.1, 0.05, 0.1],
        } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Middle ring */}
      <motion.div
        className={cn(
          "absolute rounded-full",
          colors.primary
        )}
        style={{
          inset: size * 0.12,
          opacity: 0.15,
          scale: breatheScale,
        }}
      />

      {/* Core orb */}
      <motion.div
        className={cn(
          "absolute rounded-full shadow-md",
          colors.primary
        )}
        style={{
          inset: size * 0.22,
          scale: breatheScale,
        }}
        animate={state === "speaking" ? {
          scale: [1, 1.08, 0.95, 1.05, 1],
        } : state === "listening" ? {
          scale: [1, 1.03, 1],
        } : {}}
        transition={{
          duration: state === "speaking" ? 0.5 : 2,
          repeat: isActive ? Infinity : 0,
          ease: "easeInOut"
        }}
      >
        {/* Inner shine */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%)",
          }}
        />

        {/* Center light */}
        <motion.div
          className="absolute rounded-full bg-white/80"
          style={{
            width: size * 0.15,
            height: size * 0.15,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            filter: "blur(8px)",
          }}
          animate={isActive ? { opacity: [0.6, 1, 0.6] } : { opacity: 0.6 }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </motion.div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: colors.particles,
            left: "50%",
            top: "50%",
            opacity: 0.6,
          }}
          animate={{
            x: [0, Math.cos(i * 60 * Math.PI / 180) * (size * 0.55)],
            y: [0, Math.sin(i * 60 * Math.PI / 180) * (size * 0.55)],
            scale: [0.5, 1, 0.5],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Celebration burst */}
      <AnimatePresence>
        {state === "celebrating" && (
          <>
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={`burst-${i}`}
                className="absolute w-3 h-3 rounded-full bg-amber-400"
                style={{ left: "50%", top: "50%", marginLeft: -6, marginTop: -6 }}
                initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                animate={{
                  scale: [0, 1.5, 0],
                  x: Math.cos(i * 30 * Math.PI / 180) * 120,
                  y: Math.sin(i * 30 * Math.PI / 180) * 120,
                  opacity: [1, 1, 0],
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// Flowing Conversation
// ============================================================================

function ConversationFlow({
  messages,
  isActive
}: {
  messages: ConversationMessage[]
  isActive: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [messages])

  if (messages.length === 0) return null

  return (
    <div
      ref={containerRef}
      className="w-full max-w-xl mx-auto space-y-6 overflow-y-auto max-h-[300px] px-4 hide-scrollbar"
    >
      <AnimatePresence mode="popLayout">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className={cn(
              "relative",
              message.speaker === "kadi" ? "text-center" : "text-center"
            )}
          >
            {message.speaker === "kadi" ? (
              <div className="relative inline-block">
                <motion.p
                  className={cn(
                    "text-lg leading-relaxed text-[var(--primary)] font-medium",
                    message.language === "ar" && "font-arabic text-xl"
                  )}
                  style={{ direction: message.language === "ar" ? "rtl" : "ltr" }}
                >
                  &quot;{message.text}&quot;
                </motion.p>
                <motion.div
                  className="absolute -left-8 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Sparkles className="w-3 h-3 text-white" />
                </motion.div>
              </div>
            ) : (
              <motion.p
                className={cn(
                  "text-base text-slate-500 italic",
                  message.language === "ar" && "font-arabic text-lg"
                )}
                style={{ direction: message.language === "ar" ? "rtl" : "ltr" }}
              >
                {message.text}
              </motion.p>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Typing indicator */}
      {isActive && (
        <motion.div
          className="flex justify-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-[var(--primary)]"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}

// ============================================================================
// Activity Whisper - Bottom bar
// ============================================================================

function ActivityWhisper({ activities }: { activities: RecentActivity[] }) {
  if (activities.length === 0) return null

  const getIcon = (type: RecentActivity["type"]) => {
    switch (type) {
      case "enrolled": return <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
      case "booked": return <Calendar className="w-3.5 h-3.5 text-blue-500" />
      case "callback": return <Phone className="w-3.5 h-3.5 text-[var(--primary)]" />
      default: return <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
    }
  }

  const getMessage = (activity: RecentActivity) => {
    switch (activity.type) {
      case "enrolled": return `${activity.leadName} enrolled`
      case "booked": return `${activity.leadName} booked`
      case "callback": return `Callback: ${activity.leadName}`
      default: return `${activity.leadName} handled`
    }
  }

  return (
    <motion.div
      className="flex items-center justify-center gap-6 text-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {activities.slice(0, 4).map((activity, i) => (
        <motion.div
          key={activity.id}
          className="flex items-center gap-2 text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          {getIcon(activity.type)}
          <span>{getMessage(activity)}</span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-400">{activity.time}</span>
        </motion.div>
      ))}
    </motion.div>
  )
}

// ============================================================================
// Lead Context Drawer
// ============================================================================

function LeadContext({
  call,
  isVisible,
  onClose
}: {
  call: ActiveCall | null
  isVisible: boolean
  onClose: () => void
}) {
  if (!call) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed right-0 top-0 bottom-0 w-80 bg-[var(--bg-surface)] border-l border-slate-200 shadow-md z-40 p-6"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          >
            ×
          </button>

          <div className="space-y-6 mt-8">
            {/* Lead info */}
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-[var(--primary)]/10 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-semibold text-[var(--primary)]">
                  {call.leadName.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-slate-800">{call.leadName}</h3>
              <p className="text-slate-500 font-mono">+965 {formatKuwaitPhone(call.phone)}</p>
            </div>

            {/* Quick info */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Status</span>
                <span className="text-[var(--primary)] font-medium">Ready to enroll</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Interest</span>
                <span className="text-slate-700">Web Development</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">This is call</span>
                <span className="text-slate-700">#2</span>
              </div>
            </div>

            {/* Previous topics */}
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Asked about</p>
              <div className="flex flex-wrap gap-2">
                {["Pricing", "Schedule", "Payment plans"].map(topic => (
                  <span key={topic} className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm">
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-4">
              <Button variant="outline" className="w-full justify-start gap-3">
                <Calendar className="w-4 h-4" />
                Book appointment
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3">
                <MessageSquare className="w-4 h-4" />
                Send SMS
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// Call Controls
// ============================================================================

function CallControls({
  onTakeOver,
  onEndCall,
  onToggleMute,
  isMuted
}: {
  onTakeOver: () => void
  onEndCall: () => void
  onToggleMute: () => void
  isMuted: boolean
}) {
  return (
    <motion.div
      className="flex items-center justify-center gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggleMute}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center transition-colors",
          isMuted
            ? "bg-red-50 text-red-500 hover:bg-red-100"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        )}
      >
        {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onEndCall}
        className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30"
      >
        <PhoneOff className="w-7 h-7" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onTakeOver}
        className="h-14 px-6 rounded-full bg-[var(--primary)] hover:bg-[var(--primary)] text-white flex items-center gap-2 shadow-lg shadow-sm"
      >
        <Hand className="w-5 h-5" />
        <span className="font-medium">Take over</span>
      </motion.button>
    </motion.div>
  )
}

// ============================================================================
// Expanded View Panels
// ============================================================================

// Call History Panel
function CallHistoryPanel({
  isVisible,
  onClose,
  calls
}: {
  isVisible: boolean
  onClose: () => void
  calls: RecentCall[]
}) {
  const [filter, setFilter] = useState<"all" | "enrolled" | "booked" | "callback" | "no_answer">("all")

  const filteredCalls = filter === "all" ? calls : calls.filter(c => c.outcome === filter)

  const getOutcomeStyle = (outcome: RecentCall["outcome"]) => {
    switch (outcome) {
      case "enrolled": return "text-amber-600 bg-amber-50"
      case "booked": return "text-blue-600 bg-blue-50"
      case "callback": return "text-[var(--primary)] bg-[var(--primary)]/10"
      default: return "text-slate-500 bg-slate-50"
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/20 z-40"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[480px] bg-[var(--bg-surface)] shadow-md z-50 flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <History className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Call History</h2>
                  <p className="text-sm text-slate-400">{calls.length} calls today</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filters */}
            <div className="px-6 py-3 border-b border-slate-100 flex gap-2">
              {(["all", "enrolled", "booked", "callback", "no_answer"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                    filter === f
                      ? "bg-slate-800 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {f === "all" ? "All" : f === "no_answer" ? "No Answer" : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Call List */}
            <div className="flex-1 overflow-y-auto">
              {filteredCalls.map((call, i) => (
                <motion.div
                  key={call.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="px-6 py-4 border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                        {call.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{call.name}</p>
                        <p className="text-xs text-slate-400">{call.time} · {call.duration}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "text-xs font-medium px-2.5 py-1 rounded-full",
                      getOutcomeStyle(call.outcome)
                    )}>
                      {call.outcome === "no_answer" ? "No Answer" : call.outcome.charAt(0).toUpperCase() + call.outcome.slice(1)}
                    </span>
                  </div>
                  <div className="ml-13 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-xs text-[var(--primary)] hover:text-[var(--primary)] font-medium flex items-center gap-1">
                      <Play className="w-3 h-3" /> Play recording
                    </button>
                    <button className="text-xs text-slate-500 hover:text-slate-700 font-medium">
                      View transcript
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Queue Management Panel
function QueuePanel({
  isVisible,
  onClose,
  queueItems
}: {
  isVisible: boolean
  onClose: () => void
  queueItems: { id: string; name: string; phone: string; waitTime: string; priority: "vip" | "high" | "normal"; type: "inbound" | "callback" }[]
}) {
  const getPriorityStyle = (priority: "vip" | "high" | "normal") => {
    switch (priority) {
      case "vip": return "text-amber-600 bg-amber-50 border-amber-200"
      case "high": return "text-red-600 bg-red-50 border-red-200"
      default: return "text-slate-600 bg-slate-50 border-slate-200"
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/20 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[480px] bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                  <PhoneIncoming className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Call Queue</h2>
                  <p className="text-sm text-slate-400">{queueItems.length} waiting · ~2 min avg</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Queue List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {queueItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto mb-4 flex items-center justify-center">
                    <Phone className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">Queue is empty</p>
                  <p className="text-sm text-slate-400 mt-1">No calls waiting</p>
                </div>
              ) : (
                queueItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all hover:shadow-md",
                      getPriorityStyle(item.priority)
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-sm font-medium">
                          {item.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-800">{item.name}</p>
                            {item.priority === "vip" && (
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">VIP</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{item.phone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{item.waitTime}</p>
                        <p className="text-xs text-slate-400">{item.type === "callback" ? "Callback" : "Inbound"}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 rounded-lg bg-[var(--primary)]/100 hover:bg-[var(--primary)] text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
                        <Hand className="w-4 h-4" />
                        Take Call
                      </button>
                      <button className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-600 text-sm font-medium border border-slate-200 transition-colors">
                        Assign
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Scheduled Callbacks */}
            <div className="border-t border-slate-100 p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                Scheduled Callbacks
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">10:00 AM</span>
                    <span className="text-sm text-slate-500">Fatima Hassan</span>
                  </div>
                  <button className="text-xs text-[var(--primary)] hover:text-[var(--primary)] font-medium">Call now</button>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">11:30 AM</span>
                    <span className="text-sm text-slate-500">Khalid Al-Rashid</span>
                  </div>
                  <button className="text-xs text-[var(--primary)] hover:text-[var(--primary)] font-medium">Call now</button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Analytics Panel
function AnalyticsPanel({
  isVisible,
  onClose
}: {
  isVisible: boolean
  onClose: () => void
}) {
  const weeklyData = [
    { day: "Sun", calls: 45, enrolled: 5 },
    { day: "Mon", calls: 62, enrolled: 8 },
    { day: "Tue", calls: 58, enrolled: 6 },
    { day: "Wed", calls: 71, enrolled: 9 },
    { day: "Thu", calls: 47, enrolled: 4 },
    { day: "Fri", calls: 0, enrolled: 0 },
    { day: "Sat", calls: 0, enrolled: 0 },
  ]
  const maxCalls = Math.max(...weeklyData.map(d => d.calls))

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/20 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[520px] bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Analytics</h2>
                  <p className="text-sm text-slate-400">This week&apos;s performance</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[var(--primary)]/10 border border-[#2d3a6d]/20">
                  <p className="text-xs text-[var(--primary)] font-medium mb-1">AI Resolution Rate</p>
                  <p className="text-3xl font-bold text-[var(--primary)]">78%</p>
                  <p className="text-xs text-[var(--primary)] mt-1">↑ 5% from last week</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--warning)]/10 border border-[var(--warning)]/20">
                  <p className="text-xs text-amber-600 font-medium mb-1">Enrollment Rate</p>
                  <p className="text-3xl font-bold text-amber-700">23%</p>
                  <p className="text-xs text-amber-600 mt-1">↑ 3% from last week</p>
                </div>
              </div>

              {/* Weekly Chart */}
              <div className="p-4 rounded-xl border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Call Volume</h3>
                <div className="flex items-end justify-between h-32 gap-2">
                  {weeklyData.map((day, i) => (
                    <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                      <motion.div
                        className="w-full bg-[var(--primary)] rounded-t-lg"
                        initial={{ height: 0 }}
                        animate={{ height: `${(day.calls / maxCalls) * 100}%` }}
                        transition={{ delay: 0.1 + i * 0.05, duration: 0.5 }}
                      />
                      <span className="text-xs text-slate-500">{day.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 text-center">
                  <p className="text-2xl font-bold text-slate-800">283</p>
                  <p className="text-xs text-slate-500">Total Calls</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 text-center">
                  <p className="text-2xl font-bold text-slate-800">32</p>
                  <p className="text-xs text-slate-500">Enrolled</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 text-center">
                  <p className="text-2xl font-bold text-slate-800">4:12</p>
                  <p className="text-xs text-slate-500">Avg Duration</p>
                </div>
              </div>

              {/* Top Objections */}
              <div className="p-4 rounded-xl border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Top Objections</h3>
                <div className="space-y-3">
                  {[
                    { objection: "Too expensive", count: 34, percentage: 40 },
                    { objection: "Need to think about it", count: 28, percentage: 33 },
                    { objection: "Call back later", count: 19, percentage: 22 },
                  ].map((item, i) => (
                    <div key={item.objection}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-600">{item.objection}</span>
                        <span className="text-xs text-slate-400">{item.count} calls</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-slate-400 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${item.percentage}%` }}
                          transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kadi vs Human */}
              <div className="p-4 rounded-xl border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Kadi vs Human Agents</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-[var(--primary)]" />
                      <span className="text-sm text-slate-600">Kadi AI</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Resolution</span>
                        <span className="font-medium text-slate-700">78%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Avg time</span>
                        <span className="font-medium text-slate-700">4:12</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">CSAT</span>
                        <span className="font-medium text-slate-700">4.6/5</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-slate-400" />
                      <span className="text-sm text-slate-600">Human Agents</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Resolution</span>
                        <span className="font-medium text-slate-700">82%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Avg time</span>
                        <span className="font-medium text-slate-700">7:34</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">CSAT</span>
                        <span className="font-medium text-slate-700">4.4/5</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// Quick Access Cards - Below Kadi in idle state
// ============================================================================

interface QuickStat {
  label: string
  value: string | number
  sublabel?: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
}

interface RecentCall {
  id: string
  name: string
  outcome: "enrolled" | "booked" | "callback" | "no_answer"
  duration: string
  time: string
}

function QuickAccessCards({
  onViewHistory,
  onViewQueue,
  onViewAnalytics,
  stats,
  recentCalls,
  queueCount
}: {
  onViewHistory: () => void
  onViewQueue: () => void
  onViewAnalytics: () => void
  stats: QuickStat[]
  recentCalls: RecentCall[]
  queueCount: number
}) {
  const getOutcomeStyle = (outcome: RecentCall["outcome"]) => {
    switch (outcome) {
      case "enrolled": return "text-amber-600 bg-amber-50"
      case "booked": return "text-blue-600 bg-blue-50"
      case "callback": return "text-[var(--primary)] bg-[var(--primary)]/10"
      default: return "text-slate-500 bg-slate-50"
    }
  }

  const getOutcomeLabel = (outcome: RecentCall["outcome"]) => {
    switch (outcome) {
      case "enrolled": return "Enrolled"
      case "booked": return "Booked"
      case "callback": return "Callback"
      default: return "No answer"
    }
  }

  return (
    <motion.div
      className="w-full max-w-4xl mt-12"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6 }}
    >
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="bg-[var(--bg-surface)] rounded-xl p-4 border border-slate-100 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-100 transition-all cursor-default"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.1 }}
          >
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-semibold text-slate-800">{stat.value}</span>
              {stat.trend && stat.trendValue && (
                <span className={cn(
                  "text-xs font-medium mb-1",
                  stat.trend === "up" ? "text-emerald-500" : stat.trend === "down" ? "text-red-500" : "text-slate-400"
                )}>
                  {stat.trend === "up" ? "↑" : stat.trend === "down" ? "↓" : ""} {stat.trendValue}
                </span>
              )}
            </div>
            {stat.sublabel && (
              <p className="text-xs text-slate-400 mt-1">{stat.sublabel}</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Two Column Layout: Recent Calls + Quick Actions */}
      <div className="grid grid-cols-5 gap-4">
        {/* Recent Calls - Takes 3 columns */}
        <motion.div
          className="col-span-3 bg-[var(--bg-surface)] rounded-xl border border-slate-100 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-slate-700">Recent Calls</span>
            </div>
            <button
              onClick={onViewHistory}
              className="text-xs text-[var(--primary)] hover:text-[var(--primary)] font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {recentCalls.map((call, i) => (
              <motion.div
                key={call.id}
                className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + i * 0.05 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                    {call.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{call.name}</p>
                    <p className="text-xs text-slate-400">{call.duration} · {call.time}</p>
                  </div>
                </div>
                <span className={cn(
                  "text-xs font-medium px-2.5 py-1 rounded-full",
                  getOutcomeStyle(call.outcome)
                )}>
                  {getOutcomeLabel(call.outcome)}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions - Takes 2 columns */}
        <motion.div
          className="col-span-2 space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
        >
          {/* Queue Card */}
          <button
            onClick={onViewQueue}
            className="w-full bg-[var(--bg-surface)] rounded-xl border border-slate-100 p-4 text-left hover:border-[var(--primary)]/30 hover:shadow-lg hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                  <PhoneIncoming className="w-4 h-4 text-[var(--primary)]" />
                </div>
                <span className="font-medium text-slate-700">Queue</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[var(--primary)] transition-colors" />
            </div>
            {queueCount > 0 ? (
              <p className="text-sm text-slate-500">
                <span className="text-[var(--primary)] font-semibold">{queueCount}</span> waiting ·
                <span className="text-slate-400"> ~2 min avg</span>
              </p>
            ) : (
              <p className="text-sm text-slate-400">No calls waiting</p>
            )}
          </button>

          {/* Analytics Card */}
          <button
            onClick={onViewAnalytics}
            className="w-full bg-[var(--bg-surface)] rounded-xl border border-slate-100 p-4 text-left hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-medium text-slate-700">This Week</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
            </div>
            <p className="text-sm text-slate-500">
              <span className="text-emerald-600 font-semibold">78%</span> AI resolved ·
              <span className="text-slate-400"> ↑5% from last week</span>
            </p>
          </button>

          {/* Callbacks Card */}
          <div className="bg-[var(--warning)]/10 rounded-xl border border-[var(--warning)]/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="font-medium text-amber-800">Upcoming Callbacks</span>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm text-amber-700">
                <span className="font-medium">10:00 AM</span> - Fatima Hassan
              </p>
              <p className="text-sm text-amber-700">
                <span className="font-medium">11:30 AM</span> - Khalid Al-Rashid
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_CALL: ActiveCall = {
  id: "call-1",
  leadName: "Sarah Abdullah",
  phone: "55123456",
  language: "ar",
  duration: 127,
  sentiment: "positive",
}

const MOCK_CONVERSATION: ConversationMessage[] = [
  { id: "1", speaker: "caller", text: "مرحبا، أبي أسجل ولدي في الكورس", language: "ar" },
  { id: "2", speaker: "kadi", text: "أهلاً وسهلاً! أنا كادي من كي تك. خليني أساعدك في التسجيل.", language: "ar" },
  { id: "3", speaker: "caller", text: "اسمه أحمد عبدالله", language: "ar" },
  { id: "4", speaker: "kadi", text: "تمام أحمد. أي كورس تبين تسجلينه فيه؟", language: "ar" },
]

const MOCK_ACTIVITIES: RecentActivity[] = [
  { id: "a1", type: "enrolled", leadName: "Ahmad", time: "10:34 AM" },
  { id: "a2", type: "booked", leadName: "Fatima", time: "10:52 AM" },
  { id: "a3", type: "callback", leadName: "Khalid", time: "11:15 AM" },
]

const MOCK_STATS: QuickStat[] = [
  { label: "Today's Calls", value: 47, trend: "up", trendValue: "12%" },
  { label: "Enrolled", value: 8, sublabel: "SAR 24,400" },
  { label: "Booked", value: 12, sublabel: "appointments" },
  { label: "Avg Duration", value: "4:23", trend: "down", trendValue: "18s" },
]

const MOCK_RECENT_CALLS: RecentCall[] = [
  { id: "c1", name: "Sarah Abdullah", outcome: "enrolled", duration: "5:23", time: "10:34 AM" },
  { id: "c2", name: "Ahmad Al-Sabah", outcome: "booked", duration: "3:45", time: "10:12 AM" },
  { id: "c3", name: "Fatima Hassan", outcome: "callback", duration: "2:12", time: "9:58 AM" },
  { id: "c4", name: "Omar Al-Rashid", outcome: "no_answer", duration: "0:34", time: "9:45 AM" },
  { id: "c5", name: "Nora Al-Mutairi", outcome: "enrolled", duration: "6:12", time: "9:30 AM" },
  { id: "c6", name: "Khalid Hassan", outcome: "booked", duration: "4:05", time: "9:15 AM" },
  { id: "c7", name: "Maryam Al-Fadhli", outcome: "callback", duration: "3:22", time: "9:02 AM" },
  { id: "c8", name: "Yousef Abdullah", outcome: "no_answer", duration: "0:28", time: "8:50 AM" },
  { id: "c9", name: "Hessa Al-Qattan", outcome: "enrolled", duration: "7:45", time: "8:35 AM" },
  { id: "c10", name: "Mohammed Al-Essa", outcome: "booked", duration: "3:18", time: "8:20 AM" },
]

const MOCK_QUEUE_ITEMS = [
  { id: "q1", name: "Ahmad Al-Mansour", phone: "+965 5512 7890", waitTime: "0:45", priority: "vip" as const, type: "inbound" as const },
  { id: "q2", name: "Sara Al-Humoud", phone: "+965 6623 4567", waitTime: "1:23", priority: "normal" as const, type: "inbound" as const },
]

// ============================================================================
// Kadi Call Center Component (extracted for tabs)
// ============================================================================

function KadiCallCenter() {
  const [callState, setCallState] = useState<CallState>("idle")
  const [kadiState, setKadiState] = useState<KadiState>("resting")
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null)
  const [conversation, setConversation] = useState<ConversationMessage[]>([])
  const [showContext, setShowContext] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [callDuration, setCallDuration] = useState(0)

  // Panel states
  const [showHistory, setShowHistory] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  // Simulate incoming call (for demo)
  const simulateCall = () => {
    setCallState("active")
    setKadiState("listening")
    setActiveCall(MOCK_CALL)
    setConversation([])

    // Simulate conversation flow
    MOCK_CONVERSATION.forEach((msg, i) => {
      setTimeout(() => {
        setConversation(prev => [...prev, msg])
        setKadiState(msg.speaker === "kadi" ? "speaking" : "listening")
      }, (i + 1) * 2000)
    })
  }

  // End call
  const endCall = () => {
    setKadiState("celebrating")
    setTimeout(() => {
      setCallState("idle")
      setKadiState("resting")
      setActiveCall(null)
      setConversation([])
      setCallDuration(0)
    }, 1500)
  }

  // Call timer
  useEffect(() => {
    if (callState === "active") {
      const interval = setInterval(() => setCallDuration(d => d + 1), 1000)
      return () => clearInterval(interval)
    }
  }, [callState])

  // Format duration
  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="h-full bg-[var(--bg-base)] relative overflow-y-auto">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Header - Only show during active call */}
      {callState === "active" && activeCall && (
        <header className="relative z-10 px-8 py-4 flex items-center justify-end">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowContext(!showContext)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-[var(--primary)]/40 hover:text-[var(--primary)] transition-colors"
            >
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">{activeCall.leadName}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center px-8 pt-8 pb-8">
        <AnimatePresence mode="wait">
          {/* IDLE STATE */}
          {callState === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center text-center"
            >
              {/* Kadi - Smaller in idle state */}
              <KadiPresence state={kadiState} size={160} />

              {/* Status message - simplified */}
              <motion.div
                className="mt-6 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-xl font-medium text-slate-700">
                  {getGreeting()}. Kadi is ready.
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Listening for incoming calls
                </p>
              </motion.div>

              {/* Quick Access Cards */}
              <QuickAccessCards
                stats={MOCK_STATS}
                recentCalls={MOCK_RECENT_CALLS.slice(0, 4)}
                queueCount={MOCK_QUEUE_ITEMS.length}
                onViewHistory={() => setShowHistory(true)}
                onViewQueue={() => setShowQueue(true)}
                onViewAnalytics={() => setShowAnalytics(true)}
              />

              {/* Demo button - smaller now */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                onClick={simulateCall}
                className="mt-8 px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Simulate incoming call
              </motion.button>
            </motion.div>
          )}

          {/* ACTIVE CALL STATE */}
          {callState === "active" && activeCall && (
            <motion.div
              key="active"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center w-full max-w-3xl"
            >
              {/* Kadi with call info */}
              <div className="relative mb-6">
                <KadiPresence
                  state={kadiState}
                  sentiment={activeCall.sentiment}
                  size={180}
                />

                {/* Duration badge */}
                <motion.div
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--primary)]/100 animate-pulse" />
                    <span className="font-mono text-sm text-slate-600">{formatDuration(callDuration)}</span>
                  </div>
                </motion.div>
              </div>

              {/* Caller info */}
              <motion.div
                className="text-center mb-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-xl font-semibold text-slate-800 mb-1">{activeCall.leadName}</h2>
                <p className="text-slate-400 font-mono">+965 {formatKuwaitPhone(activeCall.phone)}</p>
              </motion.div>

              {/* Conversation */}
              <div className="w-full mb-10">
                <ConversationFlow
                  messages={conversation}
                  isActive={kadiState === "speaking" || kadiState === "thinking"}
                />
              </div>

              {/* Controls */}
              <CallControls
                onTakeOver={() => {}}
                onEndCall={endCall}
                onToggleMute={() => setIsMuted(!isMuted)}
                isMuted={isMuted}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Activity Whisper - Only show during active call */}
      {callState === "active" && (
        <footer className="relative z-10 px-8 py-6">
          <ActivityWhisper activities={MOCK_ACTIVITIES} />
        </footer>
      )}

      {/* Lead Context Drawer */}
      <LeadContext
        call={activeCall}
        isVisible={showContext}
        onClose={() => setShowContext(false)}
      />

      {/* Click outside to close context */}
      {showContext && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowContext(false)}
        />
      )}

      {/* Expanded View Panels */}
      <CallHistoryPanel
        isVisible={showHistory}
        onClose={() => setShowHistory(false)}
        calls={MOCK_RECENT_CALLS}
      />

      <QueuePanel
        isVisible={showQueue}
        onClose={() => setShowQueue(false)}
        queueItems={MOCK_QUEUE_ITEMS}
      />

      <AnalyticsPanel
        isVisible={showAnalytics}
        onClose={() => setShowAnalytics(false)}
      />
    </div>
  )
}

// ============================================================================
// Agent Builder Component
// ============================================================================

function AgentBuilder() {
  const [workflows, setWorkflows] = useState<VoiceWorkflow[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<VoiceWorkflow | null>(null)
  const [integrations, setIntegrations] = useState<VoiceWorkflowIntegration[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch workflows
  useEffect(() => {
    fetchWorkflows()
    fetchIntegrations()
  }, [])

  const fetchWorkflows = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/voice/workflows")
      const data = await res.json()
      setWorkflows(data.workflows || [])
    } catch (error) {
      console.error("Failed to fetch workflows:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchIntegrations = async () => {
    try {
      const res = await fetch("/api/voice/integrations")
      const data = await res.json()
      setIntegrations(data.integrations || [])
    } catch (error) {
      console.error("Failed to fetch integrations:", error)
    }
  }

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/voice/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "New Workflow",
          description: "A new conversation workflow",
          modality: "voice",
        }),
      })
      const workflow = await res.json()
      setWorkflows([workflow, ...workflows])
      setSelectedWorkflow(workflow)
    } catch (error) {
      console.error("Failed to create workflow:", error)
    }
  }

  const handleSave = async (workflow: VoiceWorkflow) => {
    try {
      await fetch(`/api/voice/workflows/${workflow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workflow),
      })
      setWorkflows(workflows.map((w) => (w.id === workflow.id ? workflow : w)))
    } catch (error) {
      console.error("Failed to save workflow:", error)
      throw error
    }
  }

  const handlePublish = async (workflow: VoiceWorkflow) => {
    try {
      const res = await fetch(`/api/voice/workflows/${workflow.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const updated = await res.json()
      setWorkflows(workflows.map((w) => (w.id === workflow.id ? updated : w)))
      setSelectedWorkflow(updated)
    } catch (error) {
      console.error("Failed to publish workflow:", error)
      throw error
    }
  }

  const handleDelete = async (workflow: VoiceWorkflow) => {
    if (!confirm("Are you sure you want to delete this workflow?")) return
    try {
      await fetch(`/api/voice/workflows/${workflow.id}`, {
        method: "DELETE",
      })
      setWorkflows(workflows.filter((w) => w.id !== workflow.id))
      if (selectedWorkflow?.id === workflow.id) {
        setSelectedWorkflow(null)
      }
    } catch (error) {
      console.error("Failed to delete workflow:", error)
    }
  }

  if (selectedWorkflow) {
    return (
      <WorkflowBuilder
        workflow={selectedWorkflow}
        integrations={integrations}
        onSave={handleSave}
        onPublish={handlePublish}
        onDelete={() => {
          handleDelete(selectedWorkflow)
          setSelectedWorkflow(null)
        }}
        onDuplicate={() => {
          // TODO: Implement duplicate
        }}
      />
    )
  }

  return (
    <WorkflowList
      workflows={workflows}
      isLoading={isLoading}
      onSelect={setSelectedWorkflow}
      onCreate={handleCreate}
      onDelete={handleDelete}
    />
  )
}

// ============================================================================
// Main Component with Tabs
// ============================================================================

export default function VoicePage() {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") || "kadi"

  return (
    <Tabs defaultValue={defaultTab} className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 px-6 pt-4 pb-3">
        <TabsList className="bg-slate-100/80 p-1 h-auto">
          <TabsTrigger
            value="kadi"
            className="gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Headphones className="w-4 h-4" />
            Kadi AI
          </TabsTrigger>
          <TabsTrigger
            value="pbx"
            className="gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Phone className="w-4 h-4" />
            PBX
          </TabsTrigger>
          <TabsTrigger
            value="whatsapp"
            className="gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            WhatsApp Calls
          </TabsTrigger>
          <TabsTrigger
            value="builder"
            className="gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <GitBranch className="w-4 h-4" />
            Agent Builder
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Tab Content */}
      <TabsContent value="kadi" className="flex-1 mt-0 overflow-auto">
        <KadiCallCenter />
      </TabsContent>

      <TabsContent value="pbx" className="flex-1 mt-0 overflow-auto">
        <PhonePanel />
      </TabsContent>

      <TabsContent value="whatsapp" className="flex-1 mt-0 overflow-auto">
        <WhatsAppCallsPanel />
      </TabsContent>

      <TabsContent value="builder" className="flex-1 mt-0 overflow-auto">
        <AgentBuilder />
      </TabsContent>
    </Tabs>
  )
}
