"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  UserPlus,
  Trash2,
  Calendar,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Users,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { Profile } from "@/types"

interface BulkAssignModalProps {
  isOpen: boolean
  onClose: () => void
  selectedCount: number
  onConfirm: (agentId: string) => Promise<void>
  loading?: boolean
}

export function BulkAssignModal({
  isOpen,
  onClose,
  selectedCount,
  onConfirm,
  loading = false,
}: BulkAssignModalProps) {
  const [agents, setAgents] = useState<Profile[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>("")
  const [loadingAgents, setLoadingAgents] = useState(true)

  useEffect(() => {
    async function fetchAgents() {
      const supabase = createClient()
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_active", true)
        .order("full_name")

      setAgents(data || [])
      setLoadingAgents(false)
    }

    if (isOpen) {
      fetchAgents()
    }
  }, [isOpen])

  const handleConfirm = async () => {
    if (selectedAgent) {
      await onConfirm(selectedAgent)
      setSelectedAgent("")
    }
  }

  const selectedAgentInfo = agents.find((a) => a.id === selectedAgent)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center mb-2">
            <UserPlus className="w-6 h-6 text-[var(--primary)]" />
          </div>
          <DialogTitle>Assign Leads</DialogTitle>
          <DialogDescription>
            Select an agent to assign {selectedCount} lead{selectedCount !== 1 ? "s" : ""} to.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loadingAgents ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
            </div>
          ) : (
            <>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an agent..." />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          <AvatarImage src={agent.avatar_url} />
                          <AvatarFallback>
                            {agent.full_name?.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span>{agent.full_name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedAgentInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-[var(--bg-depth-3)] rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={selectedAgentInfo.avatar_url} />
                      <AvatarFallback>
                        {selectedAgentInfo.full_name?.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        {selectedAgentInfo.full_name}
                      </p>
                      <p className="text-sm text-[var(--text-muted)]">
                        {selectedAgentInfo.email}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedAgent || loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Users className="w-4 h-4 mr-2" />
            )}
            Assign {selectedCount} Lead{selectedCount !== 1 ? "s" : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface BulkDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  selectedCount: number
  onConfirm: () => Promise<void>
  loading?: boolean
}

export function BulkDeleteModal({
  isOpen,
  onClose,
  selectedCount,
  onConfirm,
  loading = false,
}: BulkDeleteModalProps) {
  const [confirmed, setConfirmed] = useState(false)

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setConfirmed(false)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-[var(--error-bg)] flex items-center justify-center mb-2">
            <AlertTriangle className="w-6 h-6 text-[var(--error)]" />
          </div>
          <DialogTitle>Delete Leads</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {selectedCount} lead{selectedCount !== 1 ? "s" : ""}?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="p-4 bg-[var(--error-bg)] rounded-xl border border-[var(--error)]/20">
            <div className="flex items-start gap-3">
              <Trash2 className="w-5 h-5 text-[var(--error)] mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-[var(--error)]">Warning</p>
                <p className="text-[var(--text-secondary)] mt-1">
                  All associated data including notes, activities, and appointments will be permanently deleted.
                </p>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-3 mt-4 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--border)] text-[var(--error)] focus:ring-[var(--error)]"
            />
            <span className="text-sm text-[var(--text-secondary)]">
              I understand this action is irreversible
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!confirmed || loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Delete {selectedCount} Lead{selectedCount !== 1 ? "s" : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface SuccessToastProps {
  show: boolean
  message: string
  onHide: () => void
}

export function SuccessToast({ show, message, onHide }: SuccessToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onHide, 3000)
      return () => clearTimeout(timer)
    }
  }, [show, onHide])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 50, x: "-50%" }}
          className="fixed bottom-24 left-1/2 z-50"
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--success)] text-white shadow-lg">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
