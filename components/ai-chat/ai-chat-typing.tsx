"use client"

import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

export function AIChatTyping() {
  return (
    <div className="flex items-start gap-2.5 px-4 py-1.5">
      {/* Kadi avatar */}
      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>
      {/* Typing dots */}
      <div className="flex items-center gap-1 bg-[var(--bg-sunken)] rounded-2xl rounded-tl-md px-4 py-3">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-emerald-500/60"
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  )
}
