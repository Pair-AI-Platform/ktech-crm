"use client"

import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface AIChatMessageProps {
  role: "user" | "assistant"
  content: string
}

export function AIChatMessage({ role, content }: AIChatMessageProps) {
  const isUser = role === "user"

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="flex justify-end px-4 py-2"
      >
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[var(--bg-sunken)] border border-[var(--border)] px-3.5 py-2 text-sm text-[var(--text-primary)] leading-relaxed">
          <p className="whitespace-pre-wrap">{content}</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="flex gap-2.5 px-4 py-2"
    >
      <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mt-0.5 shadow-sm">
        <Sparkles className="w-3 h-3 text-white" />
      </div>
      <div
        className={cn(
          "flex-1 min-w-0 text-sm leading-relaxed text-[var(--text-primary)]",
          "prose prose-sm dark:prose-invert max-w-none",
          "[&_p]:my-1.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
          "[&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5",
          "[&_table]:text-xs [&_th]:px-2 [&_td]:px-2",
        )}
        dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
      />
    </motion.div>
  )
}

/** Simple markdown formatting — handles bold, italic, code, lists, and tables */
function formatMarkdown(text: string): string {
  if (!text) return ""

  let html = text
    // Escape HTML first
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

  // Code blocks
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre class="bg-[var(--bg-elevated)] rounded-lg p-2 my-2 overflow-x-auto text-xs"><code>$2</code></pre>')

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-[var(--bg-elevated)] px-1 py-0.5 rounded text-xs">$1</code>')

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")

  // Italic
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>")

  // Tables
  html = html.replace(/^(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)*)/gm, (_match, header: string, _sep: string, body: string) => {
    const headers = header.split("|").filter((c: string) => c.trim()).map((c: string) => `<th class="border border-[var(--border)] px-2 py-1 font-medium">${c.trim()}</th>`).join("")
    const rows = body.trim().split("\n").map((row: string) => {
      const cells = row.split("|").filter((c: string) => c.trim()).map((c: string) => `<td class="border border-[var(--border)] px-2 py-1">${c.trim()}</td>`).join("")
      return `<tr>${cells}</tr>`
    }).join("")
    return `<table class="border-collapse w-full my-2"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`
  })

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="font-semibold text-sm mt-3 mb-1">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="font-semibold mt-3 mb-1">$1</h2>')

  // Unordered lists
  html = html.replace(/^[*-] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')

  // Paragraphs (double newlines)
  html = html.replace(/\n\n/g, "</p><p>")

  // Single newlines to <br>
  html = html.replace(/\n/g, "<br>")

  return html
}
