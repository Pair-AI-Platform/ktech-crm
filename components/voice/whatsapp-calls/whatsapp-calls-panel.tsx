"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import {
  Phone,
  PhoneCall,
  PhoneOff,
  PhoneMissed,
  Mic,
  Square,
  Send,
  Search,
  User,
  Users,
  History,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
} from "lucide-react"
import { cn, formatKuwaitPhone } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import {
  WhatsAppCallInteraction,
  WhatsAppCallOutcome,
  WHATSAPP_CALL_OUTCOMES,
} from "@/types"

// ============================================================================
// Types
// ============================================================================

interface RecentWhatsAppCall {
  id: string
  leadId?: string
  leadName?: string
  phone: string
  direction: "outbound"
  interactionType: WhatsAppCallInteraction["interaction_type"]
  outcome?: WhatsAppCallOutcome
  duration?: number
  notes?: string
  time: string
  createdAt: string
}

interface LeadQuickInfo {
  id: string
  name: string
  phone: string
  status?: string
  lastContact?: string
}

// ============================================================================
// WhatsApp Call Button Component
// ============================================================================

function WhatsAppCallButton({
  phone,
  onCallInitiated,
  size = "default",
  variant = "default",
}: {
  phone: string
  leadName?: string
  onCallInitiated?: (phone: string) => void
  size?: "sm" | "default" | "lg"
  variant?: "default" | "outline" | "ghost"
}) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)

    // Format phone for WhatsApp
    const formattedPhone = phone.replace(/\D/g, "")
    const whatsappNumber = formattedPhone.startsWith("965")
      ? formattedPhone
      : `965${formattedPhone}`

    // Log the interaction
    try {
      await fetch("/api/whatsapp/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: phone,
          interaction_type: "link_clicked",
        }),
      })
    } catch (error) {
      console.error("Failed to log WhatsApp call interaction:", error)
    }

    // Open WhatsApp with call intent
    // Note: WhatsApp doesn't have a direct call URL scheme, so we open chat
    // and instruct user to initiate call from there
    const whatsappUrl = `https://wa.me/${whatsappNumber}`
    window.open(whatsappUrl, "_blank")

    onCallInitiated?.(phone)
    setIsLoading(false)
  }

  const sizeClasses = {
    sm: "h-8 px-3 text-sm",
    default: "h-10 px-4",
    lg: "h-12 px-6 text-lg",
  }

  return (
    <Button
      variant={variant}
      className={cn(
        sizeClasses[size],
        "gap-2",
        variant === "default" && "bg-[#25D366] hover:bg-[#20BD5C] text-white"
      )}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      )}
      Call via WhatsApp
    </Button>
  )
}

// ============================================================================
// Voice Message Recorder
// ============================================================================

function VoiceMessageRecorder({
  onSend,
  onCancel,
}: {
  onSend: (audioBlob: Blob, duration: number) => void
  onCancel: () => void
}) {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setDuration(0)

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1)
      }, 1000)
    } catch (error) {
      console.error("Failed to start recording:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob, duration)
    }
  }

  const handleCancel = () => {
    if (isRecording) {
      stopRecording()
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    onCancel()
  }

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
      {/* Recording Visualization */}
      <div className="flex items-center justify-center gap-4">
        {isRecording && (
          <motion.div
            className="flex items-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-red-500 rounded-full"
                animate={{
                  height: [8, 24, 8],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </motion.div>
        )}

        {audioUrl && !isRecording && (
          <audio src={audioUrl} controls className="w-full max-w-xs" />
        )}
      </div>

      {/* Duration */}
      <div className="text-center">
        <span className="text-2xl font-mono text-slate-700">
          {formatDuration(duration)}
        </span>
        {isRecording && (
          <span className="ml-2 text-sm text-red-500 animate-pulse">Recording...</span>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {!isRecording && !audioUrl && (
          <Button onClick={startRecording} size="lg" className="gap-2">
            <Mic className="w-5 h-5" />
            Start Recording
          </Button>
        )}

        {isRecording && (
          <Button onClick={stopRecording} variant="destructive" size="lg" className="gap-2">
            <Square className="w-5 h-5" />
            Stop
          </Button>
        )}

        {audioUrl && !isRecording && (
          <>
            <Button onClick={handleCancel} variant="outline" size="lg">
              <Trash2 className="w-5 h-5 mr-2" />
              Discard
            </Button>
            <Button onClick={handleSend} size="lg" className="bg-[#25D366] hover:bg-[#20BD5C] gap-2">
              <Send className="w-5 h-5" />
              Send Voice Message
            </Button>
          </>
        )}
      </div>

      {!audioUrl && (
        <Button
          onClick={handleCancel}
          variant="ghost"
          size="sm"
          className="w-full text-slate-500"
        >
          Cancel
        </Button>
      )}
    </div>
  )
}

// ============================================================================
// Call Outcome Dialog
// ============================================================================

function CallOutcomeDialog({
  isOpen,
  onClose,
  callInteraction,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  callInteraction: RecentWhatsAppCall | null
  onSave: (outcome: WhatsAppCallOutcome, notes: string, duration?: number) => void
}) {
  const [outcome, setOutcome] = useState<WhatsAppCallOutcome>(null)
  const [notes, setNotes] = useState("")
  const [durationMinutes, setDurationMinutes] = useState("")

  const handleSave = () => {
    const durationSeconds = durationMinutes ? parseInt(durationMinutes) * 60 : undefined
    onSave(outcome, notes, durationSeconds)
    setOutcome(null)
    setNotes("")
    setDurationMinutes("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log Call Outcome</DialogTitle>
          <DialogDescription>
            Record the result of your WhatsApp call with{" "}
            {callInteraction?.leadName || callInteraction?.phone}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Outcome Selection */}
          <div className="space-y-2">
            <Label>Call Outcome</Label>
            <div className="grid grid-cols-2 gap-2">
              {WHATSAPP_CALL_OUTCOMES.filter((o) => o.value !== null).map((o) => (
                <Button
                  key={o.value}
                  variant={outcome === o.value ? "default" : "outline"}
                  className={cn(
                    "justify-start gap-2",
                    outcome === o.value && o.color === "success" && "bg-emerald-500 hover:bg-emerald-600",
                    outcome === o.value && o.color === "warning" && "bg-amber-500 hover:bg-amber-600",
                    outcome === o.value && o.color === "destructive" && "bg-red-500 hover:bg-red-600"
                  )}
                  onClick={() => setOutcome(o.value)}
                >
                  {o.value === "answered" && <CheckCircle2 className="w-4 h-4" />}
                  {o.value === "no_answer" && <PhoneMissed className="w-4 h-4" />}
                  {o.value === "busy" && <PhoneOff className="w-4 h-4" />}
                  {o.value === "cancelled" && <XCircle className="w-4 h-4" />}
                  {o.value === "completed" && <CheckCircle2 className="w-4 h-4" />}
                  {o.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Duration */}
          {(outcome === "answered" || outcome === "completed") && (
            <div className="space-y-2">
              <Label>Call Duration (minutes)</Label>
              <Input
                type="number"
                placeholder="e.g., 5"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Add notes about the call..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!outcome}>
            Save Outcome
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Call History List
// ============================================================================

function WhatsAppCallHistory({
  calls,
  onLogOutcome,
  onCallAgain,
}: {
  calls: RecentWhatsAppCall[]
  onLogOutcome: (call: RecentWhatsAppCall) => void
  onCallAgain: (phone: string) => void
}) {
  const [filter, setFilter] = useState<"all" | "answered" | "missed" | "pending">("all")

  const getOutcomeIcon = (outcome?: WhatsAppCallOutcome) => {
    switch (outcome) {
      case "answered":
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      case "no_answer":
        return <PhoneMissed className="w-4 h-4 text-amber-500" />
      case "busy":
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-slate-400" />
    }
  }

  const filteredCalls = calls.filter((call) => {
    if (filter === "all") return true
    if (filter === "answered") return call.outcome === "answered" || call.outcome === "completed"
    if (filter === "missed") return call.outcome === "no_answer" || call.outcome === "busy"
    if (filter === "pending") return !call.outcome
    return true
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "answered", "missed", "pending"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Call List */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-2">
          {filteredCalls.map((call) => (
            <div
              key={call.id}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                    {call.leadName ? (
                      call.leadName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>
                  <span className="absolute -bottom-1 -right-1">
                    {getOutcomeIcon(call.outcome)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-800">
                      {call.leadName || formatKuwaitPhone(call.phone)}
                    </p>
                    {!call.outcome && (
                      <Badge variant="outline" className="text-xs">
                        Pending
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    {call.time}
                    {call.duration && ` - ${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, "0")}`}
                  </p>
                  {call.notes && (
                    <p className="text-xs text-slate-400 mt-1 truncate max-w-xs">{call.notes}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {!call.outcome && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onLogOutcome(call)}
                  >
                    Log Outcome
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#25D366] hover:text-[#20BD5C] hover:bg-[#25D366]/10"
                  onClick={() => onCallAgain(call.phone)}
                >
                  <Phone className="w-4 h-4 mr-1" />
                  Call
                </Button>
              </div>
            </div>
          ))}

          {filteredCalls.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <PhoneCall className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No calls found</p>
              <p className="text-sm">Start a WhatsApp call to see your history here</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// ============================================================================
// Quick Call Panel
// ============================================================================

function QuickCallPanel({
  recentLeads,
  onCall,
}: {
  recentLeads: LeadQuickInfo[]
  onCall: (phone: string, leadId?: string) => void
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [customNumber, setCustomNumber] = useState("")

  const filteredLeads = recentLeads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery)
  )

  return (
    <div className="space-y-6">
      {/* Custom Number */}
      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-3">
        <Label>Call a number</Label>
        <div className="flex gap-2">
          <Input
            value={customNumber}
            onChange={(e) => setCustomNumber(e.target.value)}
            placeholder="Enter phone number"
            className="font-mono"
          />
          <WhatsAppCallButton
            phone={customNumber}
            onCallInitiated={() => setCustomNumber("")}
          />
        </div>
      </div>

      {/* Recent Leads */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Recent Leads</Label>
          <div className="relative w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="pl-9 h-8"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {filteredLeads.slice(0, 8).map((lead) => (
            <motion.div
              key={lead.id}
              whileHover={{ scale: 1.02 }}
              className="p-4 rounded-xl border border-slate-100 hover:border-[#25D366] hover:shadow-md transition-all cursor-pointer group"
              onClick={() => onCall(lead.phone, lead.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                  {lead.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{lead.name}</p>
                  <p className="text-xs text-slate-400">{formatKuwaitPhone(lead.phone)}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredLeads.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No leads found</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Main WhatsApp Calls Panel
// ============================================================================

export function WhatsAppCallsPanel() {
  const [activeTab, setActiveTab] = useState("call")
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [selectedCall, setSelectedCall] = useState<RecentWhatsAppCall | null>(null)
  const [showOutcomeDialog, setShowOutcomeDialog] = useState(false)

  // Mock data
  const mockRecentLeads: LeadQuickInfo[] = [
    { id: "1", name: "Sarah Abdullah", phone: "55123456", status: "interested", lastContact: "2 hours ago" },
    { id: "2", name: "Ahmad Al-Sabah", phone: "66234567", status: "new", lastContact: "1 day ago" },
    { id: "3", name: "Fatima Hassan", phone: "77345678", status: "callback", lastContact: "3 hours ago" },
    { id: "4", name: "Omar Al-Rashid", phone: "88456789", status: "interested", lastContact: "5 hours ago" },
    { id: "5", name: "Nora Al-Mutairi", phone: "99567890", status: "new", lastContact: "Yesterday" },
    { id: "6", name: "Khalid Hassan", phone: "55678901", status: "appointment", lastContact: "2 days ago" },
  ]

  const mockCallHistory: RecentWhatsAppCall[] = [
    {
      id: "1",
      leadId: "1",
      leadName: "Sarah Abdullah",
      phone: "55123456",
      direction: "outbound",
      interactionType: "link_clicked",
      outcome: "answered",
      duration: 320,
      notes: "Discussed enrollment options, very interested",
      time: "10:34 AM",
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      leadId: "2",
      leadName: "Ahmad Al-Sabah",
      phone: "66234567",
      direction: "outbound",
      interactionType: "link_clicked",
      outcome: "no_answer",
      time: "9:45 AM",
      createdAt: new Date().toISOString(),
    },
    {
      id: "3",
      leadId: "3",
      leadName: "Fatima Hassan",
      phone: "77345678",
      direction: "outbound",
      interactionType: "link_clicked",
      outcome: null,
      time: "9:15 AM",
      createdAt: new Date().toISOString(),
    },
    {
      id: "4",
      leadName: "Omar Al-Rashid",
      phone: "88456789",
      direction: "outbound",
      interactionType: "voice_message_sent",
      outcome: "completed",
      duration: 45,
      time: "Yesterday",
      createdAt: new Date().toISOString(),
    },
  ]

  const handleCall = (phone: string) => {
    const formattedPhone = phone.replace(/\D/g, "")
    const whatsappNumber = formattedPhone.startsWith("965")
      ? formattedPhone
      : `965${formattedPhone}`
    window.open(`https://wa.me/${whatsappNumber}`, "_blank")
  }

  const handleSendVoiceMessage = async (audioBlob: Blob, duration: number) => {
    console.log("Sending voice message:", { audioBlob, duration })
    setShowVoiceRecorder(false)
    // TODO: Upload audio and send via WhatsApp API
  }

  const handleSaveOutcome = async (
    outcome: WhatsAppCallOutcome,
    notes: string,
    duration?: number
  ) => {
    console.log("Saving outcome:", { outcome, notes, duration, call: selectedCall })
    // TODO: Save to database
    setShowOutcomeDialog(false)
    setSelectedCall(null)
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg-surface)]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--success)] flex items-center justify-center shadow-sm">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">WhatsApp Calls</h2>
            <p className="text-sm text-slate-400">Voice calls via WhatsApp</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowVoiceRecorder(true)}
          >
            <Mic className="w-4 h-4" />
            Voice Message
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="call" className="gap-2">
              <Phone className="w-4 h-4" />
              Make a Call
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              Call History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="call">
            <QuickCallPanel recentLeads={mockRecentLeads} onCall={handleCall} />
          </TabsContent>

          <TabsContent value="history">
            <WhatsAppCallHistory
              calls={mockCallHistory}
              onLogOutcome={(call) => {
                setSelectedCall(call)
                setShowOutcomeDialog(true)
              }}
              onCallAgain={handleCall}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Voice Recorder Dialog */}
      <Dialog open={showVoiceRecorder} onOpenChange={setShowVoiceRecorder}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Voice Message</DialogTitle>
            <DialogDescription>
              Record a voice message to send via WhatsApp
            </DialogDescription>
          </DialogHeader>
          <VoiceMessageRecorder
            onSend={handleSendVoiceMessage}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Call Outcome Dialog */}
      <CallOutcomeDialog
        isOpen={showOutcomeDialog}
        onClose={() => {
          setShowOutcomeDialog(false)
          setSelectedCall(null)
        }}
        callInteraction={selectedCall}
        onSave={handleSaveOutcome}
      />

      {/* Info Banner */}
      <div className="px-6 py-4 bg-[#25D366]/5 border-t border-[#25D366]/20">
        <div className="flex items-center gap-3 text-sm text-[#128C7E]">
          <AlertCircle className="w-5 h-5" />
          <p>
            <strong>Note:</strong> WhatsApp calls are initiated from your WhatsApp app.
            Click &quot;Call via WhatsApp&quot; to open WhatsApp with the contact, then tap the call button.
          </p>
        </div>
      </div>
    </div>
  )
}

export default WhatsAppCallsPanel
