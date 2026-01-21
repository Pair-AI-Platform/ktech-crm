"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Phone,
  PhoneOff,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneForwarded,
  Mic,
  MicOff,
  Pause,
  Play,
  Hash,
  User,
  Users,
  Clock,
  History,
  Settings,
  Volume2,
  VolumeX,
  ChevronDown,
  X,
  Search,
  MoreVertical,
  ArrowRightLeft,
  UserPlus,
  Headphones,
  Circle,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { cn, formatKuwaitPhone } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AgentPBXStatus,
  PBXExtension,
  CallQueue,
  Call,
  AGENT_PBX_STATUSES,
} from "@/types"

// ============================================================================
// Types
// ============================================================================

type PBXCallState = "idle" | "dialing" | "ringing" | "connected" | "on_hold" | "transferring"

interface ActivePBXCall {
  id: string
  callSid?: string
  direction: "inbound" | "outbound"
  callerName?: string
  callerNumber: string
  startTime: Date
  duration: number
  isOnHold: boolean
  isMuted: boolean
}

interface ExtensionStatus {
  extension: PBXExtension
  status: AgentPBXStatus
  currentCall?: boolean
}

interface QueueStats {
  queue: CallQueue
  waitingCalls: number
  avgWaitTime: number
  longestWait: number
}

interface RecentPBXCall {
  id: string
  name: string
  number: string
  direction: "inbound" | "outbound"
  duration: string
  time: string
  outcome: "answered" | "missed" | "voicemail"
}

// ============================================================================
// Dial Pad Component
// ============================================================================

function DialPad({
  value,
  onChange,
  onCall,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  onCall: () => void
  disabled?: boolean
}) {
  const buttons = [
    { digit: "1", letters: "" },
    { digit: "2", letters: "ABC" },
    { digit: "3", letters: "DEF" },
    { digit: "4", letters: "GHI" },
    { digit: "5", letters: "JKL" },
    { digit: "6", letters: "MNO" },
    { digit: "7", letters: "PQRS" },
    { digit: "8", letters: "TUV" },
    { digit: "9", letters: "WXYZ" },
    { digit: "*", letters: "" },
    { digit: "0", letters: "+" },
    { digit: "#", letters: "" },
  ]

  const handlePress = (digit: string) => {
    onChange(value + digit)
  }

  const handleBackspace = () => {
    onChange(value.slice(0, -1))
  }

  return (
    <div className="space-y-4">
      {/* Number Display */}
      <div className="relative">
        <Input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter number or extension"
          className="text-center text-2xl font-mono h-14 pr-10"
        />
        {value && (
          <button
            onClick={handleBackspace}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Dial Pad Grid */}
      <div className="grid grid-cols-3 gap-2">
        {buttons.map((btn) => (
          <motion.button
            key={btn.digit}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handlePress(btn.digit)}
            className="h-16 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors flex flex-col items-center justify-center"
          >
            <span className="text-2xl font-semibold text-slate-800">{btn.digit}</span>
            {btn.letters && (
              <span className="text-[10px] text-slate-400 tracking-wider">{btn.letters}</span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Call Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onCall}
        disabled={disabled || !value}
        className={cn(
          "w-full h-14 rounded-xl flex items-center justify-center gap-3 text-lg font-semibold transition-colors",
          disabled || !value
            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
            : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
        )}
      >
        <Phone className="w-6 h-6" />
        Call
      </motion.button>
    </div>
  )
}

// ============================================================================
// Active Call Display
// ============================================================================

function ActiveCallDisplay({
  call,
  onHangup,
  onHold,
  onMute,
  onTransfer,
  onSendDigit,
}: {
  call: ActivePBXCall
  onHangup: () => void
  onHold: () => void
  onMute: () => void
  onTransfer: () => void
  onSendDigit: (digit: string) => void
}) {
  const [showDTMF, setShowDTMF] = useState(false)

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6">
      {/* Caller Info */}
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-emerald-500/30">
          {call.callerName ? (
            <span className="text-2xl font-bold text-white">
              {call.callerName.split(" ").map((n) => n[0]).join("")}
            </span>
          ) : (
            <Phone className="w-8 h-8 text-white" />
          )}
        </div>
        <h3 className="text-xl font-semibold text-slate-800">
          {call.callerName || "Unknown Caller"}
        </h3>
        <p className="text-slate-500 font-mono">{formatKuwaitPhone(call.callerNumber)}</p>

        {/* Call Status */}
        <div className="flex items-center justify-center gap-2 mt-3">
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              call.isOnHold ? "bg-amber-500" : "bg-emerald-500 animate-pulse"
            )}
          />
          <span className="text-sm text-slate-600">
            {call.isOnHold ? "On Hold" : "Connected"} - {formatDuration(call.duration)}
          </span>
        </div>
      </div>

      {/* Call Controls */}
      <div className="grid grid-cols-4 gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onMute}
          className={cn(
            "h-16 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors",
            call.isMuted
              ? "bg-red-50 text-red-600"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          {call.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          <span className="text-xs">{call.isMuted ? "Unmute" : "Mute"}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onHold}
          className={cn(
            "h-16 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors",
            call.isOnHold
              ? "bg-amber-50 text-amber-600"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          {call.isOnHold ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          <span className="text-xs">{call.isOnHold ? "Resume" : "Hold"}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowDTMF(!showDTMF)}
          className={cn(
            "h-16 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors",
            showDTMF
              ? "bg-blue-50 text-blue-600"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          <Hash className="w-5 h-5" />
          <span className="text-xs">Keypad</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onTransfer}
          className="h-16 rounded-xl flex flex-col items-center justify-center gap-1 bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <PhoneForwarded className="w-5 h-5" />
          <span className="text-xs">Transfer</span>
        </motion.button>
      </div>

      {/* DTMF Pad */}
      <AnimatePresence>
        {showDTMF && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-3 gap-2"
          >
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((digit) => (
              <motion.button
                key={digit}
                whileTap={{ scale: 0.9 }}
                onClick={() => onSendDigit(digit)}
                className="h-12 rounded-lg bg-slate-100 hover:bg-slate-200 text-lg font-semibold text-slate-700 transition-colors"
              >
                {digit}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hangup Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onHangup}
        className="w-full h-14 rounded-xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-3 text-lg font-semibold shadow-lg shadow-red-500/30 transition-colors"
      >
        <PhoneOff className="w-6 h-6" />
        End Call
      </motion.button>
    </div>
  )
}

// ============================================================================
// Extension Directory
// ============================================================================

function ExtensionDirectory({
  extensions,
  onDial,
  onTransfer,
  isTransferMode,
}: {
  extensions: ExtensionStatus[]
  onDial: (extension: string) => void
  onTransfer?: (extension: string) => void
  isTransferMode?: boolean
}) {
  const [search, setSearch] = useState("")

  const filteredExtensions = extensions.filter(
    (ext) =>
      ext.extension.extension_number.includes(search) ||
      ext.extension.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      ext.extension.agent?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusColor = (status: AgentPBXStatus) => {
    switch (status) {
      case "available":
        return "bg-emerald-500"
      case "busy":
        return "bg-amber-500"
      case "away":
        return "bg-slate-400"
      case "offline":
        return "bg-slate-300"
      case "wrap_up":
        return "bg-blue-500"
      case "on_break":
        return "bg-purple-500"
      default:
        return "bg-slate-300"
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search extensions..."
          className="pl-9"
        />
      </div>

      {/* Extensions List */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {filteredExtensions.map((ext) => (
            <motion.div
              key={ext.extension.id}
              whileHover={{ scale: 1.01 }}
              className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all cursor-pointer group"
              onClick={() =>
                isTransferMode
                  ? onTransfer?.(ext.extension.extension_number)
                  : onDial(ext.extension.extension_number)
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                      {ext.extension.agent?.full_name
                        ? ext.extension.agent.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                        : ext.extension.extension_number}
                    </div>
                    <span
                      className={cn(
                        "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white",
                        getStatusColor(ext.status)
                      )}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">
                      {ext.extension.display_name ||
                        ext.extension.agent?.full_name ||
                        `Ext ${ext.extension.extension_number}`}
                    </p>
                    <p className="text-xs text-slate-400">
                      Ext {ext.extension.extension_number}
                      {ext.extension.department && ` - ${ext.extension.department}`}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {isTransferMode ? (
                    <>
                      <PhoneForwarded className="w-4 h-4 mr-1" />
                      Transfer
                    </>
                  ) : (
                    <>
                      <Phone className="w-4 h-4 mr-1" />
                      Call
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          ))}

          {filteredExtensions.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No extensions found</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// ============================================================================
// Queue Status Panel
// ============================================================================

function QueueStatusPanel({ queues }: { queues: QueueStats[] }) {
  return (
    <div className="space-y-4">
      {queues.map((q) => (
        <div
          key={q.queue.id}
          className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                <Users className="w-4 h-4 text-teal-600" />
              </div>
              <span className="font-medium text-slate-800">{q.queue.name}</span>
            </div>
            <Badge
              variant={q.waitingCalls > 5 ? "destructive" : q.waitingCalls > 0 ? "default" : "secondary"}
            >
              {q.waitingCalls} waiting
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-slate-50">
              <p className="text-lg font-semibold text-slate-800">{q.waitingCalls}</p>
              <p className="text-xs text-slate-400">In Queue</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-50">
              <p className="text-lg font-semibold text-slate-800">
                {Math.floor(q.avgWaitTime / 60)}:{(q.avgWaitTime % 60).toString().padStart(2, "0")}
              </p>
              <p className="text-xs text-slate-400">Avg Wait</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-50">
              <p className="text-lg font-semibold text-slate-800">
                {Math.floor(q.longestWait / 60)}:{(q.longestWait % 60).toString().padStart(2, "0")}
              </p>
              <p className="text-xs text-slate-400">Longest</p>
            </div>
          </div>
        </div>
      ))}

      {queues.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <Headphones className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No queues configured</p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Call History
// ============================================================================

function CallHistoryList({ calls }: { calls: RecentPBXCall[] }) {
  const getOutcomeIcon = (outcome: RecentPBXCall["outcome"]) => {
    switch (outcome) {
      case "answered":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      case "missed":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "voicemail":
        return <AlertCircle className="w-4 h-4 text-amber-500" />
    }
  }

  const getDirectionIcon = (direction: "inbound" | "outbound") => {
    return direction === "inbound" ? (
      <PhoneIncoming className="w-3 h-3 text-blue-500" />
    ) : (
      <PhoneOutgoing className="w-3 h-3 text-emerald-500" />
    )
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-1">
        {calls.map((call) => (
          <div
            key={call.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                  {call.name
                    ? call.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                    : <User className="w-4 h-4" />}
                </div>
                <span className="absolute -bottom-1 -right-1">
                  {getDirectionIcon(call.direction)}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-800">{call.name || call.number}</p>
                  {getOutcomeIcon(call.outcome)}
                </div>
                <p className="text-xs text-slate-400">
                  {call.time} - {call.duration}
                </p>
              </div>
            </div>
            <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100">
              <Phone className="w-4 h-4" />
            </Button>
          </div>
        ))}

        {calls.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No recent calls</p>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}

// ============================================================================
// Agent Status Selector
// ============================================================================

function AgentStatusSelector({
  currentStatus,
  onStatusChange,
}: {
  currentStatus: AgentPBXStatus
  onStatusChange: (status: AgentPBXStatus) => void
}) {
  const currentStatusConfig = AGENT_PBX_STATUSES.find((s) => s.value === currentStatus)

  const getStatusColor = (status: AgentPBXStatus) => {
    switch (status) {
      case "available":
        return "bg-emerald-500"
      case "busy":
        return "bg-amber-500"
      case "away":
        return "bg-slate-400"
      case "offline":
        return "bg-slate-300"
      case "wrap_up":
        return "bg-blue-500"
      case "on_break":
        return "bg-purple-500"
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <span className={cn("w-2 h-2 rounded-full", getStatusColor(currentStatus))} />
          {currentStatusConfig?.label}
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {AGENT_PBX_STATUSES.map((status) => (
          <DropdownMenuItem
            key={status.value}
            onClick={() => onStatusChange(status.value)}
            className="gap-2"
          >
            <span className={cn("w-2 h-2 rounded-full", getStatusColor(status.value))} />
            {status.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ============================================================================
// Transfer Dialog
// ============================================================================

function TransferDialog({
  isOpen,
  onClose,
  extensions,
  queues,
  onTransferToExtension,
  onTransferToQueue,
  onTransferToNumber,
}: {
  isOpen: boolean
  onClose: () => void
  extensions: ExtensionStatus[]
  queues: QueueStats[]
  onTransferToExtension: (extension: string, warm: boolean) => void
  onTransferToQueue: (queueId: string) => void
  onTransferToNumber: (number: string, warm: boolean) => void
}) {
  const [transferType, setTransferType] = useState<"extension" | "queue" | "external">("extension")
  const [externalNumber, setExternalNumber] = useState("")
  const [isWarmTransfer, setIsWarmTransfer] = useState(true)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Call</DialogTitle>
        </DialogHeader>

        <Tabs value={transferType} onValueChange={(v) => setTransferType(v as typeof transferType)}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="extension">Extension</TabsTrigger>
            <TabsTrigger value="queue">Queue</TabsTrigger>
            <TabsTrigger value="external">External</TabsTrigger>
          </TabsList>

          <TabsContent value="extension" className="mt-4">
            <ExtensionDirectory
              extensions={extensions}
              onDial={() => {}}
              onTransfer={(ext) => onTransferToExtension(ext, isWarmTransfer)}
              isTransferMode
            />
          </TabsContent>

          <TabsContent value="queue" className="mt-4">
            <div className="space-y-2">
              {queues.map((q) => (
                <Button
                  key={q.queue.id}
                  variant="outline"
                  className="w-full justify-between h-auto py-3"
                  onClick={() => onTransferToQueue(q.queue.id)}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-teal-600" />
                    <span>{q.queue.name}</span>
                  </div>
                  <Badge variant="secondary">{q.waitingCalls} waiting</Badge>
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="external" className="mt-4 space-y-4">
            <Input
              value={externalNumber}
              onChange={(e) => setExternalNumber(e.target.value)}
              placeholder="Enter phone number"
              className="text-center text-lg font-mono"
            />
            <Button
              className="w-full"
              disabled={!externalNumber}
              onClick={() => onTransferToNumber(externalNumber, isWarmTransfer)}
            >
              <PhoneForwarded className="w-4 h-4 mr-2" />
              Transfer to {externalNumber || "..."}
            </Button>
          </TabsContent>
        </Tabs>

        {/* Transfer Type Toggle */}
        {transferType !== "queue" && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 mt-4">
            <div>
              <p className="font-medium text-slate-800">
                {isWarmTransfer ? "Warm Transfer" : "Cold Transfer"}
              </p>
              <p className="text-xs text-slate-500">
                {isWarmTransfer
                  ? "Speak to recipient before transferring"
                  : "Transfer immediately without introduction"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsWarmTransfer(!isWarmTransfer)}
            >
              <ArrowRightLeft className="w-4 h-4 mr-1" />
              Switch
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Main Phone Panel Component
// ============================================================================

export function PhonePanel() {
  const [callState, setCallState] = useState<PBXCallState>("idle")
  const [activeCall, setActiveCall] = useState<ActivePBXCall | null>(null)
  const [dialNumber, setDialNumber] = useState("")
  const [agentStatus, setAgentStatus] = useState<AgentPBXStatus>("available")
  const [showTransfer, setShowTransfer] = useState(false)
  const [activeTab, setActiveTab] = useState("dialpad")

  // Mock data
  const mockExtensions: ExtensionStatus[] = [
    {
      extension: {
        id: "1",
        extension_number: "101",
        display_name: "Ahmed Sales",
        department: "Sales",
        agent_id: "a1",
        agent: { id: "a1", email: "", full_name: "Ahmed Al-Salem", role: "agent", is_active: true, monthly_target: 0, created_at: "", updated_at: "" },
        ring_timeout_seconds: 30,
        voicemail_enabled: true,
        simultaneous_calls: 1,
        is_active: true,
        created_at: "",
        updated_at: "",
      },
      status: "available",
    },
    {
      extension: {
        id: "2",
        extension_number: "102",
        display_name: "Sara Support",
        department: "Support",
        agent_id: "a2",
        agent: { id: "a2", email: "", full_name: "Sara Al-Mutairi", role: "agent", is_active: true, monthly_target: 0, created_at: "", updated_at: "" },
        ring_timeout_seconds: 30,
        voicemail_enabled: true,
        simultaneous_calls: 1,
        is_active: true,
        created_at: "",
        updated_at: "",
      },
      status: "busy",
    },
    {
      extension: {
        id: "3",
        extension_number: "103",
        display_name: "Omar Admin",
        department: "Admin",
        agent_id: "a3",
        agent: { id: "a3", email: "", full_name: "Omar Hassan", role: "admin", is_active: true, monthly_target: 0, created_at: "", updated_at: "" },
        ring_timeout_seconds: 30,
        voicemail_enabled: true,
        simultaneous_calls: 1,
        is_active: true,
        created_at: "",
        updated_at: "",
      },
      status: "away",
    },
  ]

  const mockQueues: QueueStats[] = [
    {
      queue: {
        id: "q1",
        name: "Sales Queue",
        strategy: "ring_all",
        max_wait_time_seconds: 600,
        max_queue_size: 50,
        position_announcement_enabled: true,
        position_announcement_interval_seconds: 60,
        overflow_action: "voicemail",
        service_level_seconds: 60,
        is_active: true,
        created_at: "",
        updated_at: "",
      },
      waitingCalls: 3,
      avgWaitTime: 45,
      longestWait: 120,
    },
    {
      queue: {
        id: "q2",
        name: "Support Queue",
        strategy: "round_robin",
        max_wait_time_seconds: 600,
        max_queue_size: 50,
        position_announcement_enabled: true,
        position_announcement_interval_seconds: 60,
        overflow_action: "voicemail",
        service_level_seconds: 60,
        is_active: true,
        created_at: "",
        updated_at: "",
      },
      waitingCalls: 1,
      avgWaitTime: 30,
      longestWait: 30,
    },
  ]

  const mockRecentCalls: RecentPBXCall[] = [
    { id: "1", name: "Sarah Abdullah", number: "+96555123456", direction: "inbound", duration: "5:23", time: "10:34 AM", outcome: "answered" },
    { id: "2", name: "Ahmad Al-Sabah", number: "+96566234567", direction: "outbound", duration: "3:45", time: "10:12 AM", outcome: "answered" },
    { id: "3", name: "", number: "+96577345678", direction: "inbound", duration: "0:00", time: "9:58 AM", outcome: "missed" },
    { id: "4", name: "Fatima Hassan", number: "+96588456789", direction: "inbound", duration: "1:12", time: "9:45 AM", outcome: "voicemail" },
  ]

  // Handle call actions
  const handleMakeCall = () => {
    if (!dialNumber) return
    setCallState("dialing")
    // Simulate dialing
    setTimeout(() => {
      setCallState("connected")
      setActiveCall({
        id: "call-1",
        direction: "outbound",
        callerNumber: dialNumber,
        startTime: new Date(),
        duration: 0,
        isOnHold: false,
        isMuted: false,
      })
      setDialNumber("")
    }, 2000)
  }

  const handleHangup = () => {
    setCallState("idle")
    setActiveCall(null)
  }

  const handleHold = () => {
    if (activeCall) {
      setActiveCall({ ...activeCall, isOnHold: !activeCall.isOnHold })
    }
  }

  const handleMute = () => {
    if (activeCall) {
      setActiveCall({ ...activeCall, isMuted: !activeCall.isMuted })
    }
  }

  const handleTransfer = () => {
    setShowTransfer(true)
  }

  const handleSendDigit = (digit: string) => {
    console.log("Sending DTMF:", digit)
  }

  const handleDialExtension = (extension: string) => {
    setDialNumber(extension)
    handleMakeCall()
  }

  // Call duration timer
  useEffect(() => {
    if (activeCall && callState === "connected") {
      const interval = setInterval(() => {
        setActiveCall((prev) =>
          prev ? { ...prev, duration: prev.duration + 1 } : null
        )
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [activeCall, callState])

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">PBX Phone</h2>
            <p className="text-sm text-slate-400">Extension 101</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AgentStatusSelector
            currentStatus={agentStatus}
            onStatusChange={setAgentStatus}
          />
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Phone Panel */}
        <div className="w-80 border-r border-slate-100 p-6">
          <AnimatePresence mode="wait">
            {callState === "idle" || callState === "dialing" ? (
              <motion.div
                key="dialpad"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <DialPad
                  value={dialNumber}
                  onChange={setDialNumber}
                  onCall={handleMakeCall}
                  disabled={callState === "dialing"}
                />

                {callState === "dialing" && (
                  <div className="mt-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-slate-600">Calling {dialNumber}...</span>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="active-call"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {activeCall && (
                  <ActiveCallDisplay
                    call={activeCall}
                    onHangup={handleHangup}
                    onHold={handleHold}
                    onMute={handleMute}
                    onTransfer={handleTransfer}
                    onSendDigit={handleSendDigit}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Side Panel */}
        <div className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="dialpad" className="gap-2">
                <Users className="w-4 h-4" />
                Extensions
              </TabsTrigger>
              <TabsTrigger value="queues" className="gap-2">
                <Headphones className="w-4 h-4" />
                Queues
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="w-4 h-4" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dialpad" className="mt-4">
              <ExtensionDirectory
                extensions={mockExtensions}
                onDial={handleDialExtension}
              />
            </TabsContent>

            <TabsContent value="queues" className="mt-4">
              <QueueStatusPanel queues={mockQueues} />
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <CallHistoryList calls={mockRecentCalls} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Transfer Dialog */}
      <TransferDialog
        isOpen={showTransfer}
        onClose={() => setShowTransfer(false)}
        extensions={mockExtensions}
        queues={mockQueues}
        onTransferToExtension={(ext, warm) => {
          console.log("Transfer to extension:", ext, warm ? "warm" : "cold")
          setShowTransfer(false)
        }}
        onTransferToQueue={(queueId) => {
          console.log("Transfer to queue:", queueId)
          setShowTransfer(false)
        }}
        onTransferToNumber={(number, warm) => {
          console.log("Transfer to number:", number, warm ? "warm" : "cold")
          setShowTransfer(false)
        }}
      />
    </div>
  )
}

export default PhonePanel
