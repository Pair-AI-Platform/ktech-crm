"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  UserPlus,
  Trash2,
  Calendar,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Users,
  Check,
  X,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { Profile } from "@/types"

interface BulkAssignModalProps {
  isOpen: boolean
  onClose: () => void
  selectedCount: number
  onConfirm: (agentIds: string[]) => Promise<void>
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
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
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
      setSelectedAgents([])
      fetchAgents()
    }
  }, [isOpen])

  const toggleAgent = (agentId: string) => {
    setSelectedAgents((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId]
    )
  }

  const handleConfirm = async () => {
    if (selectedAgents.length > 0) {
      await onConfirm(selectedAgents)
      setSelectedAgents([])
    }
  }

  const getDistribution = () => {
    if (selectedAgents.length === 0) return []
    const base = Math.floor(selectedCount / selectedAgents.length)
    const remainder = selectedCount % selectedAgents.length
    return selectedAgents.map((id, i) => ({
      id,
      count: base + (i < remainder ? 1 : 0),
    }))
  }

  const distribution = getDistribution()

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center mb-2">
            <UserPlus className="w-6 h-6 text-[var(--primary)]" />
          </div>
          <DialogTitle>Assign Leads</DialogTitle>
          <DialogDescription>
            Select {selectedAgents.length > 1 ? "agents" : "an agent"} to assign {selectedCount} lead{selectedCount !== 1 ? "s" : ""} to.
            {selectedAgents.length > 1 && " Leads will be split evenly."}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {loadingAgents ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
            </div>
          ) : (
            <>
              {/* Selected agents chips */}
              {selectedAgents.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedAgents.map((agentId) => {
                    const agent = agents.find((a) => a.id === agentId)
                    if (!agent) return null
                    return (
                      <motion.button
                        key={agentId}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={() => toggleAgent(agentId)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        <span>{agent.full_name?.split(" ")[0]}</span>
                        <X className="w-3.5 h-3.5" />
                      </motion.button>
                    )
                  })}
                </div>
              )}

              {/* Agent list */}
              <div className="max-h-[240px] overflow-y-auto rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
                {agents.map((agent) => {
                  const isSelected = selectedAgents.includes(agent.id)
                  return (
                    <button
                      key={agent.id}
                      onClick={() => toggleAgent(agent.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[var(--bg-depth-2)]",
                        isSelected && "bg-[var(--primary-muted)]"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                        isSelected
                          ? "bg-[var(--primary)] border-[var(--primary)]"
                          : "border-[var(--border)]"
                      )}>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <Avatar size="sm">
                        <AvatarImage src={agent.avatar_url} />
                        <AvatarFallback>
                          {agent.full_name?.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {agent.full_name}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] truncate">
                          {agent.email}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Distribution preview */}
              {distribution.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-[var(--bg-depth-3)] rounded-xl space-y-2"
                >
                  <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                    Distribution
                  </p>
                  {distribution.map(({ id, count }) => {
                    const agent = agents.find((a) => a.id === id)
                    if (!agent) return null
                    return (
                      <div key={id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Avatar size="sm">
                            <AvatarImage src={agent.avatar_url} />
                            <AvatarFallback>
                              {agent.full_name?.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[var(--text-primary)]">{agent.full_name}</span>
                        </div>
                        <span className="text-[var(--text-muted)] font-medium">
                          {count} lead{count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )
                  })}
                </motion.div>
              )}
            </>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedAgents.length === 0 || loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Users className="w-4 h-4 mr-2" />
            )}
            Assign {selectedCount} Lead{selectedCount !== 1 ? "s" : ""}
            {selectedAgents.length > 1 && ` to ${selectedAgents.length} Agents`}
          </Button>
        </DialogFooter>
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
