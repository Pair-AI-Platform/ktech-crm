"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Info } from "lucide-react"

interface TooltipProps {
  content: React.ReactNode
  title?: string
  children: React.ReactNode
  side?: "top" | "bottom" | "left" | "right"
  className?: string
  wrapperClassName?: string
  showIcon?: boolean
  accentColor?: string
  icon?: React.ReactNode
}

export function Tooltip({
  content,
  children,
  className,
  wrapperClassName,
  showIcon = false,
}: TooltipProps) {
  const [visible, setVisible] = React.useState(false)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleMouseMove = React.useCallback((e: React.MouseEvent) => {
    const tooltipWidth = 260
    const tooltipHeight = 80
    const gap = 16

    let top = e.clientY + gap
    let left = e.clientX - tooltipWidth / 2

    // Keep tooltip within viewport
    left = Math.max(12, Math.min(left, window.innerWidth - tooltipWidth - 12))

    // If tooltip would go below viewport, show above cursor
    if (top + tooltipHeight > window.innerHeight - 12) {
      top = e.clientY - tooltipHeight - gap
    }

    setPosition({ top, left })
  }, [])

  const handleMouseEnter = (e: React.MouseEvent) => {
    handleMouseMove(e)
    timeoutRef.current = setTimeout(() => {
      setVisible(true)
    }, 200)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setVisible(false)
  }

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const tooltipContent = (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
          style={{
            position: "fixed",
            top: position.top,
            left: position.left,
            zIndex: 9999,
            pointerEvents: "none",
          }}
          className={cn("w-[260px]", className)}
        >
          <div
            className={cn(
              "relative rounded-xl overflow-hidden",
              "bg-[var(--bg-surface)]",
              "border border-[var(--border)]",
              "shadow-[0_4px_20px_rgba(31,29,26,0.08)]",
            )}
          >
            {/* Content */}
            <div className="p-3">
              <p className="text-[13px] leading-[1.5] text-[var(--text-primary)]">
                {content}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div
      ref={triggerRef}
      className={cn("relative inline-flex items-center gap-1", wrapperClassName)}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {showIcon && (
        <Info className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-60 cursor-help" />
      )}
      {mounted && createPortal(tooltipContent, document.body)}
    </div>
  )
}

// Simpler inline tooltip for compact use cases
export function SimpleTooltip({
  content,
  children,
  side = "top",
  className,
  wrapperClassName
}: Omit<TooltipProps, 'title' | 'showIcon'>) {
  const [visible, setVisible] = React.useState(false)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const updatePosition = React.useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const gap = 8

      let top = 0
      let left = 0

      switch (side) {
        case "top":
          top = rect.top - gap
          left = rect.left + rect.width / 2
          break
        case "bottom":
          top = rect.bottom + gap
          left = rect.left + rect.width / 2
          break
        case "left":
          top = rect.top + rect.height / 2
          left = rect.left - gap
          break
        case "right":
          top = rect.top + rect.height / 2
          left = rect.right + gap
          break
      }

      setPosition({ top, left })
    }
  }, [side])

  const handleMouseEnter = () => {
    updatePosition()
    setVisible(true)
  }

  const transformStyles = {
    top: { transform: "translateX(-50%) translateY(-100%)" },
    bottom: { transform: "translateX(-50%)" },
    left: { transform: "translateX(-100%) translateY(-50%)" },
    right: { transform: "translateY(-50%)" },
  }

  const tooltipContent = (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          style={{
            position: "fixed",
            top: position.top,
            left: position.left,
            zIndex: 9999,
            pointerEvents: "none",
            ...transformStyles[side],
          }}
          className={cn(
            "px-3 py-1.5 rounded-lg",
            "bg-[var(--bg-surface)]",
            "text-[var(--text-primary)] text-xs font-medium whitespace-nowrap",
            "shadow-lg border border-[var(--border)]",
            className
          )}
        >
          {content}
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div
      ref={triggerRef}
      className={wrapperClassName || "relative inline-block"}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {mounted && createPortal(tooltipContent, document.body)}
    </div>
  )
}
