"use client"

import * as React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { X, Check, Search, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export interface TagOption {
  value: string
  label: string
  color?: string
}

// Enhanced Notion-style color palette with richer, more vibrant colors
const TAG_COLORS: Record<string, { bg: string; text: string; border: string; hover: string }> = {
  // Default colors (used when no specific color is set)
  gray: { bg: "rgba(140, 140, 140, 0.08)", text: "#6b7280", border: "rgba(140, 140, 140, 0.15)", hover: "rgba(140, 140, 140, 0.15)" },
  brown: { bg: "rgba(180, 130, 100, 0.1)", text: "#92400e", border: "rgba(180, 130, 100, 0.2)", hover: "rgba(180, 130, 100, 0.18)" },
  orange: { bg: "rgba(251, 146, 60, 0.12)", text: "#c2410c", border: "rgba(251, 146, 60, 0.2)", hover: "rgba(251, 146, 60, 0.2)" },
  yellow: { bg: "rgba(250, 204, 21, 0.15)", text: "#a16207", border: "rgba(250, 204, 21, 0.25)", hover: "rgba(250, 204, 21, 0.25)" },
  green: { bg: "rgba(34, 197, 94, 0.1)", text: "#15803d", border: "rgba(34, 197, 94, 0.2)", hover: "rgba(34, 197, 94, 0.18)" },
  blue: { bg: "rgba(59, 130, 246, 0.1)", text: "#1d4ed8", border: "rgba(59, 130, 246, 0.2)", hover: "rgba(59, 130, 246, 0.18)" },
  purple: { bg: "rgba(147, 51, 234, 0.1)", text: "#7c3aed", border: "rgba(147, 51, 234, 0.2)", hover: "rgba(147, 51, 234, 0.18)" },
  pink: { bg: "rgba(236, 72, 153, 0.1)", text: "#be185d", border: "rgba(236, 72, 153, 0.2)", hover: "rgba(236, 72, 153, 0.18)" },
  red: { bg: "rgba(239, 68, 68, 0.1)", text: "#b91c1c", border: "rgba(239, 68, 68, 0.2)", hover: "rgba(239, 68, 68, 0.18)" },
  // Status colors (used by LEAD_STATUSES)
  warning: { bg: "rgba(251, 146, 60, 0.12)", text: "#c2410c", border: "rgba(251, 146, 60, 0.2)", hover: "rgba(251, 146, 60, 0.2)" },
  accent: { bg: "rgba(99, 102, 241, 0.1)", text: "#4f46e5", border: "rgba(99, 102, 241, 0.2)", hover: "rgba(99, 102, 241, 0.18)" },
  destructive: { bg: "rgba(239, 68, 68, 0.1)", text: "#b91c1c", border: "rgba(239, 68, 68, 0.2)", hover: "rgba(239, 68, 68, 0.18)" },
  secondary: { bg: "rgba(140, 140, 140, 0.08)", text: "#6b7280", border: "rgba(140, 140, 140, 0.15)", hover: "rgba(140, 140, 140, 0.15)" },
  success: { bg: "rgba(34, 197, 94, 0.1)", text: "#15803d", border: "rgba(34, 197, 94, 0.2)", hover: "rgba(34, 197, 94, 0.18)" },
  // Pipeline stage specific colors
  new: { bg: "rgba(59, 130, 246, 0.1)", text: "#2563eb", border: "rgba(59, 130, 246, 0.2)", hover: "rgba(59, 130, 246, 0.18)" },
  contacted: { bg: "rgba(14, 165, 233, 0.1)", text: "#0284c7", border: "rgba(14, 165, 233, 0.2)", hover: "rgba(14, 165, 233, 0.18)" },
  appointment: { bg: "rgba(99, 102, 241, 0.1)", text: "#4f46e5", border: "rgba(99, 102, 241, 0.2)", hover: "rgba(99, 102, 241, 0.18)" },
  visit: { bg: "rgba(8, 145, 178, 0.1)", text: "#0e7490", border: "rgba(8, 145, 178, 0.2)", hover: "rgba(8, 145, 178, 0.18)" },
  test: { bg: "rgba(139, 92, 246, 0.1)", text: "#7c3aed", border: "rgba(139, 92, 246, 0.2)", hover: "rgba(139, 92, 246, 0.18)" },
  application: { bg: "rgba(168, 85, 247, 0.1)", text: "#9333ea", border: "rgba(168, 85, 247, 0.2)", hover: "rgba(168, 85, 247, 0.18)" },
  submission: { bg: "rgba(147, 197, 253, 0.3)", text: "#1d4ed8", border: "rgba(59, 130, 246, 0.4)", hover: "rgba(147, 197, 253, 0.4)" },
  payment: { bg: "rgba(34, 197, 94, 0.1)", text: "#16a34a", border: "rgba(34, 197, 94, 0.2)", hover: "rgba(34, 197, 94, 0.18)" },
  enrolled: { bg: "rgba(16, 185, 129, 0.1)", text: "#059669", border: "rgba(16, 185, 129, 0.2)", hover: "rgba(16, 185, 129, 0.18)" },
  lost: { bg: "rgba(113, 113, 122, 0.1)", text: "#52525b", border: "rgba(113, 113, 122, 0.2)", hover: "rgba(113, 113, 122, 0.18)" },
}

// Color rotation for options without explicit colors
const COLOR_ROTATION = ["blue", "green", "purple", "orange", "pink", "yellow", "brown", "red", "gray"]

function getTagColor(value: string, color?: string, index: number = 0) {
  if (color && TAG_COLORS[color]) {
    return TAG_COLORS[color]
  }
  if (TAG_COLORS[value]) {
    return TAG_COLORS[value]
  }
  // Rotate through colors for consistent assignment
  const colorKey = COLOR_ROTATION[index % COLOR_ROTATION.length]
  return TAG_COLORS[colorKey]
}

interface NotionTagSelectProps {
  value: string | string[]
  options: TagOption[]
  onChange: (value: string | string[]) => void
  placeholder?: string
  multiple?: boolean
  disabled?: boolean
  loading?: boolean
  className?: string
  triggerClassName?: string
}

export function NotionTagSelect({
  value,
  options,
  onChange,
  placeholder = "Select an option",
  multiple = false,
  disabled = false,
  loading = false,
  className,
  triggerClassName,
}: NotionTagSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedValues = Array.isArray(value) ? value : value ? [value] : []
  const selectedOptions = options.filter((opt) => selectedValues.includes(opt.value))

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearch("")
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue]
      onChange(newValues)
    } else {
      onChange(optionValue)
      setIsOpen(false)
      setSearch("")
    }
  }

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (multiple) {
      onChange(selectedValues.filter((v) => v !== optionValue))
    } else {
      onChange("")
    }
  }

  const handleTriggerClick = () => {
    if (!disabled && !loading) {
      setIsOpen(!isOpen)
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={handleTriggerClick}
        disabled={disabled || loading}
        className={cn(
          "group flex items-center gap-1 min-h-[32px] px-1.5 py-1 rounded-md transition-colors",
          "hover:bg-[var(--bg-depth-3)] focus:outline-none",
          disabled && "opacity-50 cursor-not-allowed",
          triggerClassName
        )}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        ) : selectedOptions.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {selectedOptions.map((opt, idx) => {
              const colorStyle = getTagColor(opt.value, opt.color, options.indexOf(opt))
              return (
                <span
                  key={opt.value}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-all"
                  style={{
                    backgroundColor: colorStyle.bg,
                    color: colorStyle.text,
                  }}
                >
                  {opt.label}
                  {!disabled && (
                    <X
                      className="w-3 h-3 cursor-pointer opacity-60 hover:opacity-100"
                      onClick={(e) => handleRemove(opt.value, e)}
                    />
                  )}
                </span>
              )
            })}
          </div>
        ) : (
          <span className="text-sm text-[var(--text-muted)]">{placeholder}</span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 mt-1 w-64 rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-xl",
              "overflow-hidden"
            )}
          >
            {/* Search input with selected tags */}
            <div className="p-2 border-b border-[var(--border)]">
              <div className="flex flex-wrap items-center gap-1 min-h-[28px] px-2 py-1 rounded-md bg-[var(--bg-sunken)] border border-transparent">
                {selectedOptions.map((opt, idx) => {
                  const colorStyle = getTagColor(opt.value, opt.color, options.indexOf(opt))
                  return (
                    <span
                      key={opt.value}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium"
                      style={{
                        backgroundColor: colorStyle.bg,
                        color: colorStyle.text,
                      }}
                    >
                      {opt.label}
                      <X
                        className="w-3 h-3 cursor-pointer opacity-60 hover:opacity-100"
                        onClick={(e) => handleRemove(opt.value, e)}
                      />
                    </span>
                  )
                })}
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={selectedOptions.length === 0 ? placeholder : ""}
                  className="flex-1 min-w-[60px] bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:outline-none"
                />
              </div>
            </div>

            {/* Prompt text */}
            <div className="px-3 py-2 text-[11px] text-[var(--text-muted)]">
              Select an option or create one
            </div>

            {/* Options list */}
            <div className="max-h-64 overflow-y-auto pb-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-[var(--text-muted)]">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = selectedValues.includes(option.value)
                  const colorStyle = getTagColor(option.value, option.color, index)

                  return (
                    <div
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 mx-1 rounded-md cursor-pointer transition-colors",
                        isSelected
                          ? "bg-[var(--bg-depth-3)]"
                          : "hover:bg-[var(--bg-depth-3)]"
                      )}
                    >
                      {/* Tag */}
                      <span
                        className="flex-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: colorStyle.bg,
                          color: colorStyle.text,
                        }}
                      >
                        {option.label}
                      </span>

                      {/* Check mark for selected */}
                      {isSelected && (
                        <Check className="w-4 h-4 text-[var(--primary)]" />
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Simplified single-select variant for inline table cells
interface InlineTagSelectProps {
  value: string
  options: TagOption[]
  onChange: (value: string) => void
  disabled?: boolean
  loading?: boolean
  className?: string
}

export function InlineTagSelect({
  value,
  options,
  onChange,
  disabled = false,
  loading = false,
  className,
}: InlineTagSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)
  const colorStyle = selectedOption
    ? getTagColor(selectedOption.value, selectedOption.color, options.indexOf(selectedOption))
    : null

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  )

  // Calculate dropdown position when opening - with viewport boundary check
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const dropdownHeight = 400 // Approximate max height of dropdown
      const viewportHeight = window.innerHeight
      const spaceBelow = viewportHeight - rect.bottom
      const spaceAbove = rect.top

      // If not enough space below and more space above, position above
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setDropdownPosition({
          top: Math.max(8, rect.top - Math.min(dropdownHeight, spaceAbove - 8)),
          left: rect.left,
        })
      } else {
        setDropdownPosition({
          top: rect.bottom + 8,
          left: rect.left,
        })
      }
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const isOutsideContainer = containerRef.current && !containerRef.current.contains(target)
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target)

      if (isOutsideContainer && isOutsideDropdown) {
        setIsOpen(false)
        setSearch("")
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    // Close dropdown on scroll (only on document/body scroll, not internal container scrolls)
    // Add a small delay to prevent scroll events during open from closing immediately
    let scrollListenerActive = false
    const scrollTimeout = setTimeout(() => {
      scrollListenerActive = true
    }, 150)

    const handleScroll = (e: Event) => {
      if (isOpen && scrollListenerActive) {
        // Only close on document/body scroll, not internal container scrolls
        const target = e.target
        if (target === document || target === document.body || target === document.documentElement) {
          setIsOpen(false)
          setSearch("")
          setHighlightedIndex(-1)
        }
      }
    }

    window.addEventListener("scroll", handleScroll, true)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      window.removeEventListener("scroll", handleScroll, true)
      clearTimeout(scrollTimeout)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50)
      // Set initial highlighted index to selected option
      const selectedIdx = filteredOptions.findIndex(opt => opt.value === value)
      setHighlightedIndex(selectedIdx >= 0 ? selectedIdx : 0)
    }
  }, [isOpen])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        )
        break
      case "Enter":
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[highlightedIndex].value)
        }
        break
      case "Escape":
        e.preventDefault()
        setIsOpen(false)
        setSearch("")
        setHighlightedIndex(-1)
        break
    }
  }, [isOpen, highlightedIndex, filteredOptions])

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-option]')
      items[highlightedIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearch("")
    setHighlightedIndex(-1)
  }

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      {/* Trigger - the tag itself */}
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          !disabled && !loading && setIsOpen(!isOpen)
        }}
        disabled={disabled || loading}
        className={cn(
          "group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
          "border shadow-sm",
          "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
          "focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:ring-offset-2",
          disabled && "opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-sm",
          !colorStyle && "bg-[var(--bg-depth-2)] text-[var(--text-muted)] border-[var(--border)]"
        )}
        style={
          colorStyle
            ? {
                backgroundColor: colorStyle.bg,
                color: colorStyle.text,
                borderColor: colorStyle.border,
              }
            : undefined
        }
      >
        {loading ? (
          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <span className="truncate max-w-[180px]">{selectedOption?.label || "Select"}</span>
            <ChevronDown className={cn(
              "w-3.5 h-3.5 opacity-60 transition-transform duration-200",
              isOpen && "rotate-180"
            )} />
          </>
        )}
      </button>

      {/* Dropdown - rendered via portal to escape overflow:hidden containers */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          <motion.div
            key="inline-tag-dropdown"
            ref={dropdownRef}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              "fixed z-[9999] w-72 rounded-xl",
              "border border-[var(--border)] bg-[var(--card)]",
              "shadow-2xl shadow-black/10",
              "overflow-hidden backdrop-blur-sm"
            )}
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
            }}
          >
            {/* Search input with icon */}
            <div className="p-3 border-b border-[var(--border)] bg-[var(--bg-depth-1)]/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setHighlightedIndex(0)
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search..."
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 rounded-lg",
                    "bg-[var(--bg-sunken)] border-2 border-transparent",
                    "text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                    "focus:outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--card)]",
                    "transition-all duration-200"
                  )}
                />
              </div>
            </div>

            {/* Prompt text */}
            <div className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-depth-1)]/30">
              Select an option
            </div>

            {/* Options list */}
            <div ref={listRef} className="max-h-72 min-h-[100px] overflow-y-auto py-2 px-2 scroll-smooth">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--bg-depth-2)] flex items-center justify-center">
                    <Search className="w-5 h-5 text-[var(--text-muted)]" />
                  </div>
                  <p className="text-sm font-medium text-[var(--text-muted)]">No options found</p>
                  <p className="text-xs text-[var(--text-muted)]/70 mt-1">Try a different search term</p>
                </div>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = option.value === value
                  const isHighlighted = index === highlightedIndex
                  const optColorStyle = getTagColor(option.value, option.color, index)

                  return (
                    <div
                      key={option.value}
                      data-option
                      onClick={() => handleSelect(option.value)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150",
                        "group/option",
                        isSelected && "bg-[var(--primary-muted)] ring-1 ring-[var(--primary)]/20",
                        !isSelected && isHighlighted && "bg-[var(--bg-depth-2)]",
                        !isSelected && !isHighlighted && "hover:bg-[var(--bg-depth-2)]"
                      )}
                    >
                      {/* Tag with enhanced styling */}
                      <span
                        className={cn(
                          "inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold",
                          "border transition-all duration-200",
                          "group-hover/option:shadow-sm group-hover/option:scale-[1.02]"
                        )}
                        style={{
                          backgroundColor: optColorStyle.bg,
                          color: optColorStyle.text,
                          borderColor: optColorStyle.border,
                        }}
                      >
                        {option.label}
                      </span>

                      {/* Spacer */}
                      <span className="flex-1" />

                      {/* Check mark for selected */}
                      {isSelected && (
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--primary)]/10">
                          <Check className="w-4 h-4 text-[var(--primary)]" />
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[var(--bg-depth-1)]/30">
              <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-depth-2)] font-mono">↑↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-depth-2)] font-mono">↵</kbd>
                  select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-depth-2)] font-mono">esc</kbd>
                  close
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
