"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Calendar,
  Plus,
  Settings
} from "lucide-react"

const navigation = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Add", href: "#add", icon: Plus, isAction: true },
  { name: "Calendar", href: "/calendar", icon: Calendar },
]

interface MobileNavProps {
  onAddClick?: () => void
}

export function MobileNav({ onAddClick }: MobileNavProps) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
      {/* Blur background */}
      <div className="absolute inset-0 bg-[var(--bg-depth-2)]/80 backdrop-blur-xl border-t border-[var(--border)]" />

      {/* Safe area for notched phones */}
      <div className="relative flex items-center justify-around px-2 py-2 pb-safe">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon

          if (item.isAction) {
            return (
              <button
                key={item.name}
                onClick={onAddClick}
                className="relative -mt-6"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center shadow-lg shadow-[var(--primary)]/30"
                >
                  <Icon className="w-6 h-6 text-white" />
                </motion.div>
              </button>
            )
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center gap-1 py-2 px-3 min-w-[60px]"
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "w-6 h-6 transition-colors",
                    isActive
                      ? "text-[var(--primary)]"
                      : "text-[var(--text-muted)]"
                  )}
                />
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--primary)]"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  isActive
                    ? "text-[var(--primary)]"
                    : "text-[var(--text-muted)]"
                )}
              >
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// Quick action menu for the center button
interface QuickActionsProps {
  isOpen: boolean
  onClose: () => void
  onAction: (action: string) => void
}

export function QuickActions({ isOpen, onClose, onAction }: QuickActionsProps) {
  if (!isOpen) return null

  const actions = [
    { id: "lead", label: "Add Lead", icon: Users, color: "from-[#445eb7] to-[#212e7f]" },
    { id: "appointment", label: "Book Appointment", icon: Calendar, color: "from-[#8992c8] to-[#5a71c4]" },
  ]

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-[var(--bg-depth-0)]/80 backdrop-blur-sm z-50 lg:hidden"
        onClick={onClose}
      />

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-24 left-0 right-0 z-50 lg:hidden flex justify-center gap-4 px-6"
      >
        {actions.map((action, index) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => {
              onAction(action.id)
              onClose()
            }}
            className="flex flex-col items-center gap-2"
          >
            <div
              className={cn(
                "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg",
                action.color
              )}
            >
              <action.icon className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-[var(--text-primary)]">
              {action.label}
            </span>
          </motion.button>
        ))}
      </motion.div>
    </>
  )
}
