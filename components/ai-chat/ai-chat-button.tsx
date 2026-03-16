"use client"

import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface AIChatButtonProps {
  onClick: () => void
}

export function AIChatButton({ onClick }: AIChatButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "fixed z-40 flex items-center justify-center",
        "w-12 h-12 rounded-xl shadow-lg",
        "bg-gradient-to-br from-emerald-500 to-teal-600 text-white",
        "hover:shadow-xl hover:shadow-emerald-500/20 transition-shadow",
        // Desktop: bottom-right
        "bottom-6 right-6",
        // Mobile: offset up to avoid bottom nav
        "max-lg:bottom-24 max-lg:right-4"
      )}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      title="Ask Kadi"
    >
      <Sparkles className="w-5 h-5" />
    </motion.button>
  )
}
