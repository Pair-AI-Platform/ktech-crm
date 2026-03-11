"use client"

import { useState, useEffect, useMemo, useCallback, useRef, startTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, FileText, Calendar, Users, LayoutDashboard, BarChart3, Settings, Clock, Star, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface QuickFindItem {
  id: string
  title: string
  description?: string
  icon?: React.ReactNode
  type: "page" | "action" | "recent"
  href?: string
  action?: () => void
  parent?: string
  isFavorite?: boolean
  lastViewed?: number
}

interface QuickFindProps {
  isOpen: boolean
  onClose: () => void
  items?: QuickFindItem[]
  recentItems?: QuickFindItem[]
  favoriteItems?: QuickFindItem[]
}

// Default navigation pages for the CRM
const defaultPages: QuickFindItem[] = [
  { id: "dashboard", title: "Dashboard", description: "Overview & stats", icon: <LayoutDashboard className="w-4 h-4" />, type: "page", href: "/dashboard" },
  { id: "leads", title: "Leads", description: "Manage prospects", icon: <Users className="w-4 h-4" />, type: "page", href: "/leads" },
  { id: "calendar", title: "Calendar", description: "Schedule & appointments", icon: <Calendar className="w-4 h-4" />, type: "page", href: "/calendar" },
  { id: "reports", title: "Reports", description: "Analytics & insights", icon: <BarChart3 className="w-4 h-4" />, type: "page", href: "/reports" },
  { id: "settings", title: "Settings", description: "Preferences", icon: <Settings className="w-4 h-4" />, type: "page", href: "/settings" },
]

// Quick actions
const defaultActions: QuickFindItem[] = [
  { id: "new-lead", title: "New Lead", description: "Create a new lead", icon: <Users className="w-4 h-4" />, type: "action", href: "/leads?new=true" },
  { id: "new-appointment", title: "New Appointment", description: "Schedule an appointment", icon: <Calendar className="w-4 h-4" />, type: "action", href: "/calendar?new=true" },
]

export function QuickFind({
  isOpen,
  onClose,
  items = defaultPages,
  recentItems = [],
  favoriteItems = []
}: QuickFindProps) {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Combine all searchable items
  const allItems = useMemo(() => {
    return [...items, ...defaultActions]
  }, [items])

  // Filter results based on query
  const results = useMemo(() => {
    if (!query.trim()) {
      // Show recent items first, then favorites, then all pages
      const recent = recentItems.slice(0, 3)
      const favorites = favoriteItems.filter(f => !recent.some(r => r.id === f.id)).slice(0, 3)
      const pages = items.filter(p =>
        !recent.some(r => r.id === p.id) &&
        !favorites.some(f => f.id === p.id)
      ).slice(0, 5)

      return { recent, favorites, pages, actions: defaultActions }
    }

    const q = query.toLowerCase()
    const filtered = allItems.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q)
    )

    return {
      recent: [],
      favorites: [],
      pages: filtered.filter(i => i.type === "page"),
      actions: filtered.filter(i => i.type === "action")
    }
  }, [query, items, recentItems, favoriteItems, allItems])

  // Flatten results for keyboard navigation
  const flatResults = useMemo(() => {
    return [
      ...results.recent,
      ...results.favorites,
      ...results.pages,
      ...results.actions,
    ]
  }, [results])

  // Reset selection when results change
  useEffect(() => {
    startTransition(() => setSelectedIndex(0))
  }, [query])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      startTransition(() => {
        setQuery("")
        setSelectedIndex(0)
      })
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const handleSelect = useCallback((item: QuickFindItem) => {
    if (item.action) {
      item.action()
    } else if (item.href) {
      router.push(item.href)
    }
    onClose()
  }, [router, onClose])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          e.preventDefault()
          onClose()
          break
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex(i => Math.min(i + 1, flatResults.length - 1))
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex(i => Math.max(i - 1, 0))
          break
        case "Enter": {
          e.preventDefault()
          const selected = flatResults[selectedIndex]
          if (selected) {
            handleSelect(selected)
          }
          break
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, flatResults, selectedIndex, onClose, handleSelect])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="fixed left-1/2 top-[15%] -translate-x-1/2 z-50 w-full max-w-xl"
          >
            <div className="bg-[var(--bg-surface)] rounded-xl shadow-2xl border border-[var(--border)] overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
                <Search className="w-5 h-5 text-[var(--text-tertiary)]" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search or jump to..."
                  className="flex-1 bg-transparent outline-none text-[var(--text-primary)] text-base placeholder:text-[var(--text-tertiary)]"
                />
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-[var(--text-tertiary)] bg-[var(--bg-sunken)] rounded border border-[var(--border)]">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto">
                {flatResults.length === 0 ? (
                  <div className="px-4 py-8 text-center text-[var(--text-tertiary)]">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No results found</p>
                  </div>
                ) : (
                  <div className="py-2">
                    {/* Recent Section */}
                    {results.recent.length > 0 && (
                      <ResultSection
                        title="Recent"
                        icon={<Clock className="w-3.5 h-3.5" />}
                        items={results.recent}
                        selectedIndex={selectedIndex}
                        startIndex={0}
                        onSelect={handleSelect}
                        onHover={setSelectedIndex}
                      />
                    )}

                    {/* Favorites Section */}
                    {results.favorites.length > 0 && (
                      <ResultSection
                        title="Favorites"
                        icon={<Star className="w-3.5 h-3.5" />}
                        items={results.favorites}
                        selectedIndex={selectedIndex}
                        startIndex={results.recent.length}
                        onSelect={handleSelect}
                        onHover={setSelectedIndex}
                      />
                    )}

                    {/* Pages Section */}
                    {results.pages.length > 0 && (
                      <ResultSection
                        title={query ? "Pages" : "Jump to"}
                        icon={<FileText className="w-3.5 h-3.5" />}
                        items={results.pages}
                        selectedIndex={selectedIndex}
                        startIndex={results.recent.length + results.favorites.length}
                        onSelect={handleSelect}
                        onHover={setSelectedIndex}
                      />
                    )}

                    {/* Actions Section */}
                    {results.actions.length > 0 && (
                      <ResultSection
                        title="Quick Actions"
                        icon={<ArrowRight className="w-3.5 h-3.5" />}
                        items={results.actions}
                        selectedIndex={selectedIndex}
                        startIndex={results.recent.length + results.favorites.length + results.pages.length}
                        onSelect={handleSelect}
                        onHover={setSelectedIndex}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--bg-sunken)]">
                <div className="flex items-center gap-4 text-[11px] text-[var(--text-tertiary)]">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-[var(--bg-surface)] rounded border border-[var(--border)]">↑</kbd>
                    <kbd className="px-1.5 py-0.5 bg-[var(--bg-surface)] rounded border border-[var(--border)]">↓</kbd>
                    <span className="ml-1">Navigate</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-[var(--bg-surface)] rounded border border-[var(--border)]">↵</kbd>
                    <span className="ml-1">Open</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-[var(--bg-surface)] rounded border border-[var(--border)]">esc</kbd>
                    <span className="ml-1">Close</span>
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

interface ResultSectionProps {
  title: string
  icon: React.ReactNode
  items: QuickFindItem[]
  selectedIndex: number
  startIndex: number
  onSelect: (item: QuickFindItem) => void
  onHover: (index: number) => void
}

function ResultSection({
  title,
  icon,
  items,
  selectedIndex,
  startIndex,
  onSelect,
  onHover
}: ResultSectionProps) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
        {icon}
        {title}
      </div>
      {items.map((item, i) => {
        const globalIndex = startIndex + i
        const isSelected = selectedIndex === globalIndex

        return (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            onMouseEnter={() => onHover(globalIndex)}
            className={cn(
              "w-full px-4 py-2 flex items-center gap-3 text-left transition-colors",
              isSelected
                ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                : "text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            )}
          >
            <span className={cn(
              "flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
              isSelected
                ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                : "bg-[var(--bg-sunken)] text-[var(--text-secondary)]"
            )}>
              {item.icon || <FileText className="w-4 h-4" />}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{item.title}</div>
              {item.description && (
                <div className="text-xs text-[var(--text-tertiary)] truncate">{item.description}</div>
              )}
            </div>
            {item.parent && (
              <span className="text-xs text-[var(--text-tertiary)] truncate">
                in {item.parent}
              </span>
            )}
            {item.type === "action" && (
              <ArrowRight className={cn(
                "w-4 h-4 shrink-0",
                isSelected ? "text-[var(--primary)]" : "text-[var(--text-tertiary)]"
              )} />
            )}
          </button>
        )
      })}
    </div>
  )
}

// Hook to manage quick find state and keyboard shortcut
export function useQuickFind() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open with Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  }
}

// Export types for external use
export type { QuickFindItem, QuickFindProps }
