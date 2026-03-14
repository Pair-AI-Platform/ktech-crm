"use client"

import { useState } from "react"
import { Megaphone, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"

interface AnnouncementButtonProps {
  isAdmin: boolean
}

export function AnnouncementButton({ isAdmin }: AnnouncementButtonProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  if (!isAdmin) return null

  const handleSend = async () => {
    if (!title.trim()) {
      alert("Please enter a title")
      return
    }

    setSending(true)
    try {
      const supabase = createClient()

      // Get all active agent profiles
      const { data: agents, error: agentsError } = await supabase
        .from("profiles")
        .select("id")
        .eq("is_active", true)

      if (agentsError) throw agentsError
      if (!agents || agents.length === 0) {
        alert("No active agents found")
        setSending(false)
        return
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      // Insert a notification for each agent
      const notifications = agents.map((agent) => ({
        user_id: agent.id,
        type: "system_alert" as const,
        title: `📢 ${title.trim()}`,
        body: message.trim() || null,
        is_read: false,
        created_by: user?.id || null,
        metadata: { announcement: true },
      }))

      const { error: insertError } = await supabase
        .from("notifications")
        .insert(notifications)

      if (insertError) throw insertError

      alert(`Announcement sent to ${agents.length} team members`)
      setTitle("")
      setMessage("")
      setOpen(false)
    } catch (err) {
      console.error("Failed to send announcement:", err)
      alert("Failed to send announcement")
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        onClick={() => setOpen(true)}
        title="Send Announcement"
      >
        <Megaphone className="w-5 h-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Announcement</DialogTitle>
            <DialogDescription>
              This will send a notification to all active team members.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Title <span className="text-[var(--error)]">*</span>
              </label>
              <Input
                placeholder="e.g. Team meeting at 2 PM"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Message <span className="text-[var(--text-muted)]">(optional)</span>
              </label>
              <Textarea
                placeholder="Add more details..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                maxLength={1000}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sending ? "Sending..." : "Send to All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
