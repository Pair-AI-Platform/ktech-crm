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
import { Send, Copy, Check, Loader2, MessageSquare, Link as LinkIcon } from "lucide-react"
import type { Lead } from "@/types"

interface Props {
  isOpen: boolean
  onClose: () => void
  lead: Lead
}

interface GeneratedLink {
  url: string
  expires_at: string
}

export function SendPspSelfServiceDialog({ isOpen, onClose, lead }: Props) {
  const [whatsappStatus, setWhatsappStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [linkStatus, setLinkStatus] = useState<"idle" | "generating" | "ready" | "error">("idle")
  const [link, setLink] = useState<GeneratedLink | null>(null)
  const [copied, setCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const reset = () => {
    setWhatsappStatus("idle")
    setLinkStatus("idle")
    setLink(null)
    setCopied(false)
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
      const json = (await res.json()) as { url: string; expires_at: string }
      setLink({ url: json.url, expires_at: json.expires_at })
      setWhatsappStatus("sent")
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to send")
      setWhatsappStatus("error")
    }
  }

  async function generateLink() {
    setLinkStatus("generating")
    setErrorMsg("")
    try {
      const res = await fetch("/api/psp/self-service/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setErrorMsg(err.error || "Failed to generate link")
        setLinkStatus("error")
        return
      }
      const json = (await res.json()) as { url: string; expires_at: string }
      setLink({ url: json.url, expires_at: json.expires_at })
      setLinkStatus("ready")
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to generate link")
      setLinkStatus("error")
    }
  }

  async function copyLink() {
    if (!link) return
    await navigator.clipboard.writeText(link.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
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
              disabled={whatsappStatus === "sending" || !lead.phone}
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

            <Button
              type="button"
              variant="outline"
              onClick={generateLink}
              disabled={linkStatus === "generating"}
              className="w-full justify-start gap-2"
            >
              {linkStatus === "generating" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LinkIcon className="w-4 h-4" />
              )}
              Generate link to copy
            </Button>

            {link && (
              <div className="mt-3 p-3 rounded-md border border-slate-200 bg-slate-50 space-y-2">
                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Link</div>
                <div className="flex items-stretch gap-2">
                  <input
                    readOnly
                    value={link.url}
                    className="flex-1 px-2 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded truncate"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyLink}
                    className="shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Expires {new Date(link.expires_at).toLocaleString()}
                </p>
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
