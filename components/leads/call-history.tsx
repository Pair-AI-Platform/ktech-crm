"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Play,
  Pause,
  Clock,
  User,
  Bot,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Target,
  Lightbulb,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Languages
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCallHistory, type Call } from "@/lib/hooks/use-calls"

interface CallHistoryProps {
  leadId: string
}

export function CallHistory({ leadId }: CallHistoryProps) {
  const { calls, loading, error } = useCallHistory(leadId)
  const [expandedCall, setExpandedCall] = useState<string | null>(null)
  const [showArabic, setShowArabic] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-[var(--error)] mx-auto mb-4" />
        <p className="text-[var(--text-muted)]">Failed to load call history</p>
      </div>
    )
  }

  if (calls.length === 0) {
    return (
      <div className="text-center py-12">
        <Phone className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
        <p className="text-[var(--text-muted)]">No calls recorded yet</p>
        <p className="text-sm text-[var(--text-disabled)] mt-1">
          Call history will appear here once calls are made
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-[var(--primary)]" />
          <h3 className="font-semibold text-[var(--text-primary)]">Call History</h3>
          <Badge variant="secondary" size="sm">{calls.length}</Badge>
        </div>
        {calls.some(c => c.summary?.summary_ar) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowArabic(!showArabic)}
            className="gap-2"
          >
            <Languages className="w-4 h-4" />
            {showArabic ? "English" : "العربية"}
          </Button>
        )}
      </div>

      {/* Call List */}
      <div className="space-y-3">
        {calls.map((call, index) => (
          <CallCard
            key={call.id}
            call={call}
            index={index}
            isExpanded={expandedCall === call.id}
            onToggle={() => setExpandedCall(expandedCall === call.id ? null : call.id)}
            showArabic={showArabic}
          />
        ))}
      </div>
    </div>
  )
}

interface CallCardProps {
  call: Call
  index: number
  isExpanded: boolean
  onToggle: () => void
  showArabic: boolean
}

function CallCard({ call, index, isExpanded, onToggle, showArabic }: CallCardProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "transcript" | "actions">("summary")

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    } else if (days === 1) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    } else if (days < 7) {
      return `${days} days ago`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "success"
      case "no_answer": case "busy": case "failed": return "error"
      case "voicemail": return "warning"
      default: return "secondary"
    }
  }

  const getInterestBadge = (level: string | null) => {
    switch (level) {
      case "high": return <Badge variant="success" size="sm">High Interest</Badge>
      case "medium": return <Badge variant="warning" size="sm">Medium Interest</Badge>
      case "low": return <Badge variant="secondary" size="sm">Low Interest</Badge>
      default: return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="overflow-hidden">
        {/* Call Header - Always Visible */}
        <div
          className="p-4 cursor-pointer hover:bg-[var(--bg-sunken)] transition-colors"
          onClick={onToggle}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Direction Icon */}
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                call.direction === "inbound"
                  ? "bg-[var(--info)]/10"
                  : "bg-[var(--success)]/10"
              )}>
                {call.direction === "inbound" ? (
                  <PhoneIncoming className={cn("w-5 h-5", "text-[var(--info)]")} />
                ) : (
                  <PhoneOutgoing className={cn("w-5 h-5", "text-[var(--success)]")} />
                )}
              </div>

              {/* Call Info */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--text-primary)]">
                    {call.direction === "inbound" ? "Inbound Call" : "Outbound Call"}
                  </span>
                  <Badge variant={getStatusColor(call.status)} size="sm">
                    {call.status.replace("_", " ")}
                  </Badge>
                  {call.handler === "ai" && (
                    <Badge variant="info" size="sm" className="gap-1">
                      <Bot className="w-3 h-3" />
                      AI
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--text-muted)] mt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(call.duration_seconds)}
                  </span>
                  <span>{formatDate(call.started_at)}</span>
                  {call.agent && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {call.agent.full_name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Quick indicators */}
              {call.summary && (
                <div className="hidden sm:flex items-center gap-2">
                  {getInterestBadge(call.summary.interest_level)}
                </div>
              )}
              {call.recording_url && (
                <Badge variant="secondary" size="sm" className="gap-1">
                  <Volume2 className="w-3 h-3" />
                  Recording
                </Badge>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8">
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-[var(--border)] p-4 space-y-4">
                {/* Audio Player */}
                {call.recording_url && (
                  <AudioPlayer
                    url={call.recording_url}
                    duration={call.recording_duration_seconds || call.duration_seconds}
                  />
                )}

                {/* Tabs */}
                <div className="flex gap-2 border-b border-[var(--border)]">
                  <TabButton
                    active={activeTab === "summary"}
                    onClick={() => setActiveTab("summary")}
                    icon={<Sparkles className="w-4 h-4" />}
                    label="Summary"
                    disabled={!call.summary}
                  />
                  <TabButton
                    active={activeTab === "transcript"}
                    onClick={() => setActiveTab("transcript")}
                    icon={<FileText className="w-4 h-4" />}
                    label="Transcript"
                    disabled={!call.transcript}
                  />
                  <TabButton
                    active={activeTab === "actions"}
                    onClick={() => setActiveTab("actions")}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    label="Actions"
                    count={call.action_items?.length}
                    disabled={!call.action_items?.length}
                  />
                </div>

                {/* Tab Content */}
                <div className="min-h-[200px]">
                  {activeTab === "summary" && call.summary && (
                    <SummaryTab summary={call.summary} showArabic={showArabic} />
                  )}
                  {activeTab === "transcript" && call.transcript && (
                    <TranscriptTab transcript={call.transcript} />
                  )}
                  {activeTab === "actions" && call.action_items && call.action_items.length > 0 && (
                    <ActionsTab actionItems={call.action_items} />
                  )}
                  {!call.summary && !call.transcript && !call.action_items?.length && (
                    <div className="text-center py-8 text-[var(--text-muted)]">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No additional details available</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}

interface AudioPlayerProps {
  url: string
  duration: number
}

function AudioPlayer({ url, duration }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isMuted, setIsMuted] = useState(false)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds))
    }
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="bg-[var(--bg-sunken)] rounded-xl p-4">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={() => {
          if (audioRef.current && audioRef.current.duration) {
            // Use actual duration from audio if available
          }
        }}
      />

      <div className="flex items-center gap-4">
        {/* Play Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => skip(-10)}
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
            variant="default"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={togglePlay}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => skip(10)}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="flex-1 space-y-1">
          <div className="relative h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-[var(--primary)] rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
            <input
              type="range"
              min={0}
              max={duration}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <div className="flex justify-between text-xs text-[var(--text-muted)]">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.muted = !isMuted
              setIsMuted(!isMuted)
            }
          }}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

interface TabButtonProps {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  count?: number
  disabled?: boolean
}

function TabButton({ active, onClick, icon, label, count, disabled }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
        active
          ? "border-[var(--primary)] text-[var(--primary)]"
          : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {icon}
      {label}
      {count !== undefined && count > 0 && (
        <Badge variant="secondary" size="sm">{count}</Badge>
      )}
    </button>
  )
}

interface SummaryTabProps {
  summary: NonNullable<Call["summary"]>
  showArabic: boolean
}

function SummaryTab({ summary, showArabic }: SummaryTabProps) {
  return (
    <div className="space-y-4">
      {/* Main Summary */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-[var(--primary)]/5 to-[var(--accent)]/5 border border-[var(--primary)]/10">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-[var(--primary)] mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[var(--text-muted)] mb-1">AI Summary</p>
            <p className="text-[var(--text-primary)]">
              {showArabic && summary.summary_ar ? summary.summary_ar : summary.summary}
            </p>
          </div>
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summary.caller_sentiment && (
          <div className="p-3 rounded-lg bg-[var(--bg-sunken)]">
            <p className="text-xs text-[var(--text-muted)] mb-1">Sentiment</p>
            <p className={cn("font-medium capitalize", getSentimentColor(summary.caller_sentiment))}>
              {summary.caller_sentiment}
            </p>
          </div>
        )}
        {summary.call_intent && (
          <div className="p-3 rounded-lg bg-[var(--bg-sunken)]">
            <p className="text-xs text-[var(--text-muted)] mb-1">Intent</p>
            <p className="font-medium text-[var(--text-primary)] capitalize">
              {summary.call_intent.replace(/_/g, " ")}
            </p>
          </div>
        )}
        {summary.interest_level && (
          <div className="p-3 rounded-lg bg-[var(--bg-sunken)]">
            <p className="text-xs text-[var(--text-muted)] mb-1">Interest</p>
            <p className={cn(
              "font-medium capitalize",
              summary.interest_level === "high" ? "text-[var(--success)]" :
              summary.interest_level === "medium" ? "text-[var(--warning)]" :
              "text-[var(--text-muted)]"
            )}>
              {summary.interest_level}
            </p>
          </div>
        )}
        {summary.urgency_level && (
          <div className="p-3 rounded-lg bg-[var(--bg-sunken)]">
            <p className="text-xs text-[var(--text-muted)] mb-1">Urgency</p>
            <p className={cn(
              "font-medium capitalize",
              summary.urgency_level === "high" ? "text-[var(--error)]" :
              summary.urgency_level === "medium" ? "text-[var(--warning)]" :
              "text-[var(--text-muted)]"
            )}>
              {summary.urgency_level}
            </p>
          </div>
        )}
      </div>

      {/* Key Points */}
      {summary.key_points && summary.key_points.length > 0 && (
        <div>
          <p className="text-sm font-medium text-[var(--text-muted)] mb-2 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Key Points
          </p>
          <ul className="space-y-2">
            {summary.key_points.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] mt-2 shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Actions */}
      {summary.recommended_actions && summary.recommended_actions.length > 0 && (
        <div>
          <p className="text-sm font-medium text-[var(--text-muted)] mb-2 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Recommended Actions
          </p>
          <ul className="space-y-2">
            {summary.recommended_actions.map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
                <CheckCircle2 className="w-4 h-4 text-[var(--success)] mt-0.5 shrink-0" />
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function getSentimentColor(sentiment: string | null): string {
  switch (sentiment) {
    case "positive": return "text-[var(--success)]"
    case "negative": return "text-[var(--error)]"
    case "neutral": return "text-[var(--text-muted)]"
    default: return "text-[var(--text-muted)]"
  }
}

interface TranscriptTabProps {
  transcript: NonNullable<Call["transcript"]>
}

function TranscriptTab({ transcript }: TranscriptTabProps) {
  // Parse the full_text into segments if segments aren't available
  const segments = transcript.segments || parseTranscript(transcript.full_text)

  return (
    <div className="space-y-4">
      {/* Transcript Stats */}
      <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
        {transcript.confidence_score && (
          <span>Confidence: {Math.round(transcript.confidence_score * 100)}%</span>
        )}
        <span>Language: {transcript.language === "ar" ? "Arabic" : "English"}</span>
      </div>

      {/* Conversation */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {segments.map((segment, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-3",
              segment.speaker.toLowerCase().includes("agent") || segment.speaker.toLowerCase().includes("ai")
                ? "flex-row"
                : "flex-row-reverse"
            )}
          >
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarFallback className={cn(
                "text-xs",
                segment.speaker.toLowerCase().includes("agent") || segment.speaker.toLowerCase().includes("ai")
                  ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "bg-[var(--accent)]/10 text-[var(--accent)]"
              )}>
                {segment.speaker.toLowerCase().includes("ai") ? (
                  <Bot className="w-4 h-4" />
                ) : (
                  segment.speaker.charAt(0).toUpperCase()
                )}
              </AvatarFallback>
            </Avatar>
            <div className={cn(
              "flex-1 p-3 rounded-xl max-w-[80%]",
              segment.speaker.toLowerCase().includes("agent") || segment.speaker.toLowerCase().includes("ai")
                ? "bg-[var(--primary)]/5 rounded-tl-none"
                : "bg-[var(--bg-sunken)] rounded-tr-none"
            )}>
              <p className="text-xs font-medium text-[var(--text-muted)] mb-1">
                {segment.speaker}
              </p>
              <p className="text-sm text-[var(--text-primary)]">{segment.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Full Transcript Toggle */}
      {!transcript.segments && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-[var(--primary)] hover:underline">
            View raw transcript
          </summary>
          <pre className="mt-2 p-4 bg-[var(--bg-sunken)] rounded-lg text-xs text-[var(--text-secondary)] whitespace-pre-wrap overflow-x-auto">
            {transcript.full_text}
          </pre>
        </details>
      )}
    </div>
  )
}

function parseTranscript(text: string): { speaker: string; text: string }[] {
  const lines = text.split('\n').filter(line => line.trim())
  const segments: { speaker: string; text: string }[] = []

  for (const line of lines) {
    const match = line.match(/^([^:]+):\s*(.*)$/)
    if (match) {
      segments.push({ speaker: match[1].trim(), text: match[2].trim() })
    } else if (segments.length > 0) {
      // Append to previous segment
      segments[segments.length - 1].text += ' ' + line.trim()
    }
  }

  return segments
}

interface ActionsTabProps {
  actionItems: NonNullable<Call["action_items"]>
}

function ActionsTab({ actionItems }: ActionsTabProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "error"
      case "medium": return "warning"
      case "low": return "secondary"
      default: return "secondary"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
      case "in_progress":
        return <Clock className="w-4 h-4 text-[var(--warning)]" />
      default:
        return <AlertCircle className="w-4 h-4 text-[var(--text-muted)]" />
    }
  }

  return (
    <div className="space-y-3">
      {actionItems.map((item) => (
        <div
          key={item.id}
          className="p-4 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {getStatusIcon(item.status)}
              <div>
                <p className="font-medium text-[var(--text-primary)]">{item.title}</p>
                {item.description && (
                  <p className="text-sm text-[var(--text-muted)] mt-1">{item.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={getPriorityColor(item.priority)} size="sm">
                    {item.priority} priority
                  </Badge>
                  {item.is_ai_generated && (
                    <Badge variant="info" size="sm" className="gap-1">
                      <Bot className="w-3 h-3" />
                      AI Generated
                    </Badge>
                  )}
                  {item.due_date && (
                    <span className="text-xs text-[var(--text-muted)]">
                      Due: {new Date(item.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
