"use client"

import { useState } from "react"
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
import { Check, ExternalLink, Loader2, MessageSquare } from "lucide-react"
import { isDemoMode } from "@/lib/demo-data"
import type { Lead } from "@/types"

interface Props {
  isOpen: boolean
  onClose: () => void
  lead: Lead
}

export function SendPspSelfServiceDialog({ isOpen, onClose, lead }: Props) {
  const [whatsappStatus, setWhatsappStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const demoMode = isDemoMode()

  const reset = () => {
    setWhatsappStatus("idle")
    setErrorMsg("")
    setPreviewUrl(null)
  }

  const handleClose = () => {
    onClose()
    setTimeout(reset, 300)
  }

  function openStudentPreview() {
    window.open(`/psp/demo-preview?leadId=${lead.id}`, "_blank", "noopener,noreferrer")
  }

  async function sendWhatsApp() {
    setWhatsappStatus("sending")
    setErrorMsg("")
    setPreviewUrl(null)

    if (demoMode) {
      await new Promise(resolve => setTimeout(resolve, 500))
      setPreviewUrl(`${window.location.origin}/psp/demo-preview?leadId=${lead.id}`)
      setWhatsappStatus("sent")
      return
    }

    try {
      const res = await fetch("/api/psp/self-service/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setErrorMsg(err.error || "Failed to send")
        setWhatsappStatus("error")
        return
      }
      const data = await res.json().catch(() => ({})) as { url?: string }
      if (data.url) setPreviewUrl(data.url)
      setWhatsappStatus("sent")
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to send")
      setWhatsappStatus("error")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send PSP self-service link</DialogTitle>
          <DialogDescription>
            Let the student fill out their PSP info and upload documents themselves. Link is valid for 7 days.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-3">
            <Button
              type="button"
              onClick={sendWhatsApp}
              disabled={whatsappStatus === "sending" || whatsappStatus === "sent" || !lead.phone}
              className="w-full justify-start gap-2"
            >
              {whatsappStatus === "sending" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : whatsappStatus === "sent" ? (
                <Check className="w-4 h-4" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
              {whatsappStatus === "sent" ? "Sent via WhatsApp" : "Send via WhatsApp"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={openStudentPreview}
              className="w-full justify-start gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Preview as student
            </Button>

            {!lead.phone && (
              <p className="text-xs text-amber-600">Lead has no phone number — WhatsApp is unavailable.</p>
            )}

            {previewUrl && whatsappStatus === "sent" && (
              <div className="text-xs text-[var(--text-secondary)] break-all bg-[var(--bg-sunken)] rounded-md p-2 border border-[var(--border)]">
                <span className="font-medium text-[var(--text-primary)]">Link:</span> {previewUrl}
              </div>
            )}

            {errorMsg && (
              <p className="text-xs text-rose-600 mt-2">{errorMsg}</p>
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
