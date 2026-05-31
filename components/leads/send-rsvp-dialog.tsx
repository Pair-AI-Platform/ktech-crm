"use client"

import { useState, useEffect } from "react"
import { getLeadDisplayName } from "@/lib/lead-utils"
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
import { Input } from "@/components/ui/input"
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Users,
  Copy,
  Check,
  Send,
} from "lucide-react"
import type { Lead } from "@/types"

interface SendRSVPDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedLeads: Lead[]
  onSuccess: () => void
}

interface RSVPLink {
  lead_id: string
  token: string
  rsvp_url: string
}

type DialogStep = "configure" | "generating" | "complete"

export function SendRSVPDialog({
  isOpen,
  onClose,
  selectedLeads,
  onSuccess,
}: SendRSVPDialogProps) {
  const [step, setStep] = useState<DialogStep>("configure")
  const [eventTitle, setEventTitle] = useState("Orientation Day")
  const [eventDate, setEventDate] = useState("")
  const [eventLocation, setEventLocation] = useState("ktech Campus")
  const [expiresAt, setExpiresAt] = useState("")
  const [rsvpLinks, setRsvpLinks] = useState<RSVPLink[]>([])
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)

  // Filter to only applicant-stage leads
  const eligibleLeads = selectedLeads.filter(
    (lead) => lead.pipeline_stage === "applicant"
  )
  const ineligibleLeads = selectedLeads.filter(
    (lead) => lead.pipeline_stage !== "applicant"
  )

  useEffect(() => {
    if (isOpen) {
      setStep("configure")
      setRsvpLinks([])
      setError(null)
      setCopiedId(null)
      setCopiedAll(false)
    }
  }, [isOpen])

  const handleGenerate = async () => {
    if (eligibleLeads.length === 0) return

    setStep("generating")
    setError(null)

    try {
      const response = await fetch("/api/rsvp/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_ids: eligibleLeads.map((l) => l.id),
          event_title: eventTitle,
          event_date: eventDate || undefined,
          event_location: eventLocation || undefined,
          expires_at: expiresAt || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate RSVP links")
      }

      setRsvpLinks(data.rsvp_links || [])
      setStep("complete")
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate")
      setStep("configure")
    }
  }

  const handleCopyLink = async (link: RSVPLink) => {
    await navigator.clipboard.writeText(link.rsvp_url)
    setCopiedId(link.lead_id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleCopyAll = async () => {
    const allLinks = rsvpLinks
      .map((link) => {
        const lead = selectedLeads.find((l) => l.id === link.lead_id)
        return `${lead ? getLeadDisplayName(lead) : 'Unknown'}: ${link.rsvp_url}`
      })
      .join("\n")
    await navigator.clipboard.writeText(allLinks)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  const handleClose = () => {
    setStep("configure")
    setRsvpLinks([])
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent size="lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Send className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle>Send RSVP Links</DialogTitle>
              <DialogDescription>
                Generate RSVP confirmation links for orientation event
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          {/* Configure Step */}
          {step === "configure" && (
            <div className="space-y-4">
              {/* Event details form */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-[var(--text-primary)] mb-1 block">
                    Event Title
                  </label>
                  <Input
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Orientation Day"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-[var(--text-primary)] mb-1 block">
                      Event Date
                    </label>
                    <Input
                      type="datetime-local"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--text-primary)] mb-1 block">
                      Link Expires
                    </label>
                    <Input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-[var(--text-primary)] mb-1 block">
                    Location
                  </label>
                  <Input
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="ktech Campus"
                  />
                </div>
              </div>

              {/* Eligible leads summary */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-700">
                    {eligibleLeads.length} applicant{eligibleLeads.length !== 1 ? "s" : ""} will receive RSVP links
                  </span>
                </div>
                <p className="text-sm text-blue-600">
                  Only leads in the Applicant stage are eligible.
                </p>
              </div>

              {/* Eligible leads preview */}
              {eligibleLeads.length > 0 && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="max-h-36 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[var(--bg-sunken)] sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-[var(--text-secondary)]">Name</th>
                          <th className="px-3 py-2 text-left font-medium text-[var(--text-secondary)]">Phone</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {eligibleLeads.slice(0, 10).map((lead) => (
                          <tr key={lead.id}>
                            <td className="px-3 py-2">{lead.first_name_ar} {lead.last_name_ar}</td>
                            <td className="px-3 py-2 font-mono text-xs">{lead.phone || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {eligibleLeads.length > 10 && (
                    <div className="px-3 py-2 bg-[var(--bg-sunken)] text-sm text-[var(--text-secondary)]">
                      + {eligibleLeads.length - 10} more
                    </div>
                  )}
                </div>
              )}

              {/* Ineligible warning */}
              {ineligibleLeads.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-amber-700">
                      {ineligibleLeads.length} lead{ineligibleLeads.length !== 1 ? "s" : ""} not in Applicant stage (skipped)
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Generating Step */}
          {step === "generating" && (
            <div className="py-8 text-center">
              <Loader2 className="w-12 h-12 mx-auto text-blue-500 animate-spin mb-4" />
              <h3 className="font-medium text-[var(--text-primary)] mb-2">
                Generating RSVP Links...
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Creating links for {eligibleLeads.length} applicant{eligibleLeads.length !== 1 ? "s" : ""}.
              </p>
            </div>
          )}

          {/* Complete Step */}
          {step === "complete" && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
                <h3 className="font-medium text-[var(--text-primary)] mb-1">
                  RSVP Links Generated
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {rsvpLinks.length} link{rsvpLinks.length !== 1 ? "s" : ""} ready to share
                </p>
              </div>

              {/* Copy all button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleCopyAll}
              >
                {copiedAll ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-emerald-600" />
                    Copied All!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy All Links
                  </>
                )}
              </Button>

              {/* Links list */}
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="max-h-56 overflow-y-auto divide-y divide-[var(--border)]">
                  {rsvpLinks.map((link) => {
                    const lead = selectedLeads.find((l) => l.id === link.lead_id)
                    return (
                      <div
                        key={link.lead_id}
                        className="flex items-center justify-between px-3 py-2.5 hover:bg-[var(--bg-hover)] transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                            {lead?.first_name} {lead?.last_name}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] truncate font-mono">
                            {link.rsvp_url}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCopyLink(link)}
                          className="ml-2 p-1.5 rounded-md hover:bg-[var(--bg-sunken)] transition-colors shrink-0"
                          title="Copy link"
                        >
                          {copiedId === link.lead_id ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-[var(--text-muted)]" />
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          {step === "configure" && (
            <>
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={eligibleLeads.length === 0}
              >
                <Send className="w-4 h-4 mr-2" />
                Generate {eligibleLeads.length} Link{eligibleLeads.length !== 1 ? "s" : ""}
              </Button>
            </>
          )}

          {step === "generating" && (
            <Button variant="ghost" disabled>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </Button>
          )}

          {step === "complete" && (
            <Button onClick={handleClose}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
