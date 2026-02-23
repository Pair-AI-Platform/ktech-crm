"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Badge, PipelineBadge } from "@/components/ui/badge"
import { AlertTriangle, Phone, CreditCard, User, ExternalLink } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { DuplicateMatch } from "@/lib/hooks/use-duplicate-check"
import type { PipelineBadgeProps } from "@/components/ui/badge"

interface DuplicateWarningDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  duplicates: DuplicateMatch[]
  onCreateAnyway: () => void
  onCancel: () => void
  loading?: boolean
}

const matchTypeConfig = {
  phone: { label: "Phone Match", variant: "destructive" as const, icon: Phone },
  civil_id: { label: "Civil ID Match", variant: "warning" as const, icon: CreditCard },
  name: { label: "Name Match", variant: "info" as const, icon: User },
}

export function DuplicateWarningDialog({
  open,
  onOpenChange,
  duplicates,
  onCreateAnyway,
  onCancel,
  loading,
}: DuplicateWarningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" showClose={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--warning)]">
            <AlertTriangle className="w-5 h-5" />
            Potential Duplicate Leads Found
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            We found {duplicates.length} existing lead{duplicates.length > 1 ? "s" : ""} that
            may be duplicates. Please review before proceeding.
          </p>

          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {duplicates.map((dup) => {
              const config = matchTypeConfig[dup.match_type]
              const MatchIcon = config.icon

              return (
                <div
                  key={dup.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[var(--bg-sunken)] flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-[var(--text-muted)]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-[var(--text-primary)]">
                          {dup.first_name} {dup.last_name}
                        </span>
                        <Badge variant={config.variant} size="xs">
                          <MatchIcon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--text-muted)]">
                        {dup.phone && <span>{dup.phone}</span>}
                        {dup.civil_id && <span>ID: {dup.civil_id}</span>}
                        <span>
                          {formatDistanceToNow(new Date(dup.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <PipelineBadge
                      stage={dup.pipeline_stage as PipelineBadgeProps["stage"]}
                      size="xs"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/leads/${dup.id}`, "_blank")}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <Button variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={onCreateAnyway}
              disabled={loading}
              className="bg-[var(--warning)] hover:bg-[var(--warning)]/90 text-white"
            >
              {loading ? "Creating..." : "Create Anyway"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
