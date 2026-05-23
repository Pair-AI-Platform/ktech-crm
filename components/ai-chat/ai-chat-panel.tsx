"use client"

import { useRef, useEffect } from "react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Send, Trash2, Sparkles, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAiChat } from "@/lib/hooks/use-ai-chat"
import { AIChatMessage } from "./ai-chat-message"
import { AIChatTyping } from "./ai-chat-typing"

interface AIChatPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AIChatPanel({ open, onOpenChange }: AIChatPanelProps) {
  const {
    messages,
    input,
    setInput,
    sendMessage,
    isLoading,
    conversations,
    loadConversation,
    newConversation,
    deleteConversation,
    conversationId,
  } = useAiChat()

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  // Focus textarea when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [open])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isLoading) {
        sendMessage(input)
      }
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      sendMessage(input)
    }
  }

  const suggestions = [
    "How many leads this month?",
    "Show pipeline breakdown",
    "Compare agent performance",
    "What's our conversion rate?",
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        hideClose
        className="w-[420px] max-w-full p-0 flex flex-col gap-0 sm:max-w-[420px] border-l border-[var(--border)]"
      >
        <SheetTitle className="sr-only">Kadi - AI Assistant</SheetTitle>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--primary)] flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)] leading-tight">
                Kadi
              </h2>
              <p className="text-[11px] text-[var(--text-muted)] leading-tight">AI Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={newConversation}
              className="p-2 rounded-lg hover:bg-[var(--bg-sunken)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              title="New conversation"
              aria-label="New conversation"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-lg hover:bg-[var(--bg-sunken)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              title="Close"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Conversation history sidebar (mini) */}
        {conversations.length > 0 && !conversationId && messages.length === 0 && (
          <div className="border-b border-[var(--border)] max-h-40 overflow-y-auto bg-[var(--bg-elevated)]/50">
            <p className="px-4 pt-2.5 pb-1 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Recent
            </p>
            {conversations.slice(0, 5).map((conv) => (
              <div
                key={conv.id}
                className="flex items-center justify-between px-4 py-2 hover:bg-[var(--bg-sunken)] cursor-pointer group transition-colors"
              >
                <button
                  onClick={() => loadConversation(conv.id)}
                  className="text-xs text-[var(--text-secondary)] truncate flex-1 text-left"
                >
                  {conv.title}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteConversation(conv.id)
                  }}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 min-h-0">
          <div ref={scrollRef} className="py-4 space-y-1">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[var(--primary)] flex items-center justify-center mb-3 shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>

                <h3 className="text-[15px] font-semibold text-[var(--text-primary)] mb-1 tracking-tight">
                  How can I help?
                </h3>
                <p className="text-xs text-[var(--text-muted)] mb-6 max-w-[240px] leading-relaxed">
                  Ask about leads, performance, enrollments, or anything in your data.
                </p>

                <div className="flex flex-col gap-1.5 w-full max-w-[300px]">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setInput(s)
                        setTimeout(() => sendMessage(s), 50)
                      }}
                      className="text-xs text-left px-3 py-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const content = message.parts
                  ?.filter((p) => p.type === 'text')
                  .map((p) => 'text' in p ? p.text : '')
                  .join('') || ''
                return (
                  <AIChatMessage
                    key={message.id}
                    role={message.role as "user" | "assistant"}
                    content={content}
                  />
                )
              })
            )}
            {isLoading && <AIChatTyping />}
          </div>
        </ScrollArea>

        {/* Input */}
        <form
          onSubmit={handleFormSubmit}
          className="border-t border-[var(--border)] p-3 bg-[var(--bg-elevated)]"
        >
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask Kadi anything..."
              className="flex-1 min-h-[40px] max-h-[120px] resize-none text-sm bg-[var(--bg-sunken)] border border-[var(--border)] rounded-xl focus-visible:ring-1 focus-visible:ring-[var(--primary)] px-3 py-2.5"
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                "flex-shrink-0 p-2.5 rounded-xl transition-all",
                input.trim() && !isLoading
                  ? "bg-[var(--primary)] text-white shadow-sm hover:bg-[var(--primary-hover)] hover:shadow-md"
                  : "bg-[var(--bg-sunken)] text-[var(--text-muted)] border border-[var(--border)]"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-[var(--text-muted)]/70 text-center mt-2 leading-tight">
            Kadi can make mistakes. Verify important data.
          </p>
        </form>
      </SheetContent>
    </Sheet>
  )
}
