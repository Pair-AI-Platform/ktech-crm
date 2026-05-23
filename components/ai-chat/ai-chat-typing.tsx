"use client"

import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

export function AIChatTyping() {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2">
      <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-[var(--primary)] flex items-center justify-center shadow-sm">
        <Sparkles className="w-3 h-3 text-white" />
      </div>
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.18,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  )
}
