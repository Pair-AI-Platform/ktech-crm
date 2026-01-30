"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Phone,
  MessageCircle,
  MessageSquare,
  Mail,
  FileText,
  Paperclip,
  ChevronDown,
  RotateCcw,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PIPELINE_STAGES, type PipelineStage } from "@/types"
import { useStageSettings } from "@/lib/hooks/use-stage-settings"

interface QuickActionsBarProps {
  lead: {
    id: string
    phone: string
    email?: string | null
    first_name: string
    last_name: string
    pipeline_stage: PipelineStage
  }
  isLost: boolean
  onCall?: () => void
  onSMS: () => void
  onWhatsApp: () => void
  onEmail?: () => void
  onAddNote: () => void
  onAttachDocument: () => void
  onChangeStatus: (stage: PipelineStage) => Promise<void>
  onReactivate: () => void
  className?: string
}

export function QuickActionsBar({
  lead,
  isLost,
  onSMS,
  onWhatsApp,
  onEmail,
  onAddNote,
  onAttachDocument,
  onChangeStatus,
  onReactivate,
  className
}: QuickActionsBarProps) {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { activeStages } = useStageSettings()

  // For lost leads, only show submission, application, contacted
  // For active leads, show all active stages except 'lost'
  const LOST_LEAD_ALLOWED_STAGES = ['application', 'contacted']

  const availableStages = isLost
    ? PIPELINE_STAGES.filter(s => LOST_LEAD_ALLOWED_STAGES.includes(s.value))
    : PIPELINE_STAGES.filter(s =>
        s.value !== 'lost' && (activeStages.length === 0 || activeStages.includes(s.value))
      )

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleStatusChange = async (stage: PipelineStage) => {
    setUpdatingStatus(true)
    await onChangeStatus(stage)
    setUpdatingStatus(false)
    setShowStatusDropdown(false)
  }

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {/* Primary CTA */}
      {isLost ? (
        <Button
          onClick={onReactivate}
          variant="outline"
          className="gap-2 border-slate-300 hover:bg-slate-50"
        >
          <RotateCcw className="w-4 h-4" />
          Reactivate
        </Button>
      ) : (
        <Link
          href={`/voice?call=${lead.phone}&leadId=${lead.id}&name=${encodeURIComponent(`${lead.first_name} ${lead.last_name}`)}`}
        >
          <Button className="gap-2 bg-emerald-500 hover:bg-emerald-600">
            <Phone className="w-4 h-4" />
            Call
          </Button>
        </Link>
      )}

      {/* WhatsApp - More Prominent */}
      <Button
        onClick={onWhatsApp}
        variant="outline"
        className="gap-2 border-green-300 text-green-600 hover:bg-green-50"
      >
        <MessageCircle className="w-4 h-4" />
        WhatsApp
      </Button>

      {/* SMS */}
      <Button onClick={onSMS} variant="ghost" size="icon" title="Send SMS">
        <MessageSquare className="w-4 h-4" />
      </Button>

      {/* Email */}
      {lead.email && (
        <Button
          onClick={onEmail}
          variant="ghost"
          size="icon"
          title="Send Email"
          asChild
        >
          <a href={`mailto:${lead.email}`}>
            <Mail className="w-4 h-4" />
          </a>
        </Button>
      )}

      {/* Book Appointment */}
      <Link href={`/calendar?book=${lead.id}`}>
        <Button variant="ghost" size="icon" title="Book Appointment">
          <Calendar className="w-4 h-4" />
        </Button>
      </Link>

      {/* Add Note */}
      <Button onClick={onAddNote} variant="ghost" size="icon" title="Add Note">
        <FileText className="w-4 h-4" />
      </Button>

      {/* Attach Document */}
      <Button onClick={onAttachDocument} variant="ghost" size="icon" title="Attach Document">
        <Paperclip className="w-4 h-4" />
      </Button>

      {/* Change Status Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <Button
          variant="outline"
          onClick={() => setShowStatusDropdown(!showStatusDropdown)}
          className="gap-2"
          disabled={updatingStatus}
        >
          {isLost ? "Reactivate To" : "Status"}
          <ChevronDown className={cn(
            "w-3.5 h-3.5 transition-transform",
            showStatusDropdown && "rotate-180"
          )} />
        </Button>

        <AnimatePresence>
          {showStatusDropdown && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-1 right-0 w-48 bg-[var(--bg-surface)] rounded-xl shadow-lg border border-[var(--border)] z-50 overflow-hidden py-1"
            >
              {availableStages.map((stage) => (
                <button
                  key={stage.value}
                  onClick={() => handleStatusChange(stage.value)}
                  disabled={updatingStatus}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm hover:bg-[var(--bg-elevated)] transition-colors",
                    lead.pipeline_stage === stage.value && "bg-[var(--primary-muted)] text-[var(--primary)] font-medium"
                  )}
                >
                  {stage.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
