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
import { Check, Loader2, MessageSquare } from "lucide-react"
import type { Lead } from "@/types"

interface Props {
  isOpen: boolean
  onClose: () => void
  lead: Lead
}

export function SendPspSelfServiceDialog({ isOpen, onClose, lead }: Props) {
  const [whatsappStatus, setWhatsappStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const reset = () => {
    setWhatsappStatus("idle")
    setErrorMsg("")
  }

  const handleClose = () => {
    onClose()
    setTimeout(reset, 300)
  }

  async function sendWhatsApp() {
    setWhatsappStatus("sending")
    setErrorMsg("")
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

            {!lead.phone && (
              <p className="text-xs text-amber-600">Lead has no phone number — WhatsApp is unavailable.</p>
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
