"use client"

import { useState, ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, ChevronDown, ChevronRight, MoreHorizontal, Trash2, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DashboardBlockProps {
  id: string
  title: string
  icon?: ReactNode
  children: ReactNode
  className?: string
  collapsible?: boolean
  defaultCollapsed?: boolean
  onTitleChange?: (title: string) => void
  onDelete?: () => void
  onDuplicate?: () => void
  headerActions?: ReactNode
}

export function DashboardBlock({
  id,
  title,
  icon,
  children,
  className,
  collapsible = true,
  defaultCollapsed = false,
  onTitleChange,
  onDelete,
  onDuplicate,
  headerActions,
}: DashboardBlockProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [isEditing, setIsEditing] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "group relative bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] shadow-sm",
        "transition-all duration-200",
        isDragging && "opacity-50 shadow-lg z-50",
        isHovered && "shadow-md border-[var(--border-hover)]",
        className,
        isCollapsed && "!h-auto self-start"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setShowMenu(false)
      }}
    >
      {/* Block Header */}
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-3",
          !isCollapsed && "border-b border-[var(--border-subtle)]"
        )}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className={cn(
            "p-1 -ml-2 rounded cursor-grab active:cursor-grabbing",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            "hover:bg-[var(--bg-hover)]"
          )}
        >
          <GripVertical className="w-4 h-4 text-[var(--text-tertiary)]" />
        </div>

        {/* Collapse Toggle */}
        {collapsible && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-[var(--bg-hover)] transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
            )}
          </button>
        )}

        {/* Icon */}
        {icon && (
          <span className="text-[var(--text-secondary)]">{icon}</span>
        )}

        {/* Title - Editable */}
        {isEditing && onTitleChange ? (
          <input
            type="text"
            defaultValue={title}
            autoFocus
            className={cn(
              "flex-1 bg-transparent font-medium text-[var(--text-primary)]",
              "outline-none border-b border-[var(--accent)]"
            )}
            onBlur={(e) => {
              onTitleChange(e.target.value)
              setIsEditing(false)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onTitleChange(e.currentTarget.value)
                setIsEditing(false)
              }
              if (e.key === "Escape") {
                setIsEditing(false)
              }
            }}
          />
        ) : (
          <h3
            className={cn(
              "flex-1 font-medium text-[var(--text-primary)] text-sm",
              onTitleChange && "cursor-text hover:text-[var(--accent)]"
            )}
            onClick={() => onTitleChange && setIsEditing(true)}
          >
            {title}
          </h3>
        )}

        {/* Header Actions */}
        {headerActions}

        {/* Menu Button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={cn(
              "p-1 rounded hover:bg-[var(--bg-hover)] transition-all",
              "opacity-0 group-hover:opacity-100"
            )}
          >
            <MoreHorizontal className="w-4 h-4 text-[var(--text-tertiary)]" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg shadow-lg py-1 min-w-[160px]">
              {onDuplicate && (
                <button
                  onClick={() => {
                    onDuplicate()
                    setShowMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--bg-hover)] flex items-center gap-2 text-[var(--text-secondary)]"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => {
                    onDelete()
                    setShowMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--bg-hover)] flex items-center gap-2 text-[var(--error)]"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Block Content */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Non-draggable version for static blocks
export function StaticBlock({
  title,
  icon,
  children,
  className,
  collapsible = true,
  defaultCollapsed = false,
  headerActions,
}: Omit<DashboardBlockProps, "id" | "onTitleChange" | "onDelete" | "onDuplicate" | "title"> & { title: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  return (
    <div
      className={cn(
        "bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] shadow-sm",
        "hover:shadow-md hover:border-[var(--border-hover)] transition-all duration-200",
        className,
        isCollapsed && "!h-auto self-start"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-3",
          !isCollapsed && "border-b border-[var(--border-subtle)]"
        )}
      >
        {collapsible && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-[var(--bg-hover)] transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
            )}
          </button>
        )}
        {icon && <span className="text-[var(--text-secondary)]">{icon}</span>}
        <h3 className="flex-1 font-medium text-[var(--text-primary)] text-sm">{title}</h3>
        {headerActions}
      </div>

      {/* Content */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden flex-1"
          >
            <div className="p-4 h-full">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
