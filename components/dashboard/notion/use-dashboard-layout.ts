"use client"

import { useState, useEffect, useCallback, startTransition } from "react"

export interface BlockConfig {
  id: string
  type: "stat" | "list" | "pipeline" | "chart" | "quickActions" | "custom"
  title: string
  column: number // 0 = left/main, 1 = right/sidebar
  order: number
  collapsed?: boolean
  settings?: Record<string, unknown>
}

const DEFAULT_LAYOUT: BlockConfig[] = [
  // Main column blocks
  { id: "stats-today", type: "stat", title: "Today's Appointments", column: 0, order: 0 },
  { id: "stats-attention", type: "stat", title: "Needs Attention", column: 0, order: 1 },
  { id: "stats-active", type: "stat", title: "Active Leads", column: 0, order: 2 },
  { id: "stats-applications", type: "stat", title: "Applications", column: 0, order: 3 },
  { id: "pipeline-progress", type: "pipeline", title: "Pipeline Progress", column: 0, order: 4 },
  { id: "appointments-list", type: "list", title: "Today's Appointments", column: 0, order: 5 },
  { id: "target-progress", type: "chart", title: "Monthly Target", column: 0, order: 6 },
  // Sidebar column blocks
  { id: "quick-actions", type: "quickActions", title: "Quick Actions", column: 1, order: 0 },
  { id: "priority-leads", type: "list", title: "Leads Needing Attention", column: 1, order: 1 },
  { id: "missed-calls", type: "list", title: "Missed Calls", column: 1, order: 2 },
  { id: "my-pipeline", type: "chart", title: "My Pipeline", column: 1, order: 3 },
]

const STORAGE_KEY = "ktech-dashboard-layout"

export function useDashboardLayout() {
  const [blocks, setBlocks] = useState<BlockConfig[]>(DEFAULT_LAYOUT)
  const [isLoading, setIsLoading] = useState(true)

  // Load from localStorage on mount
  useEffect(() => {
    startTransition(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          // Merge with defaults to handle new blocks
          const merged = DEFAULT_LAYOUT.map((defaultBlock) => {
            const savedBlock = parsed.find((b: BlockConfig) => b.id === defaultBlock.id)
            return savedBlock ? { ...defaultBlock, ...savedBlock } : defaultBlock
          })
          setBlocks(merged)
        }
      } catch (error) {
        console.error("Failed to load dashboard layout:", error)
      }
      setIsLoading(false)
    })
  }, [])

  // Save to localStorage when blocks change
  const saveLayout = useCallback((newBlocks: BlockConfig[]) => {
    setBlocks(newBlocks)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newBlocks))
    } catch (error) {
      console.error("Failed to save dashboard layout:", error)
    }
  }, [])

  // Move block within or between columns
  const moveBlock = useCallback(
    (activeId: string, overId: string) => {
      setBlocks((prev) => {
        const activeIndex = prev.findIndex((b) => b.id === activeId)
        const overIndex = prev.findIndex((b) => b.id === overId)

        if (activeIndex === -1 || overIndex === -1) return prev

        const newBlocks = [...prev]
        const [removed] = newBlocks.splice(activeIndex, 1)

        // Update column if moving to different column
        const overBlock = prev[overIndex]
        removed.column = overBlock.column

        newBlocks.splice(overIndex, 0, removed)

        // Recalculate order within each column
        const col0 = newBlocks.filter((b) => b.column === 0)
        const col1 = newBlocks.filter((b) => b.column === 1)
        col0.forEach((b, i) => (b.order = i))
        col1.forEach((b, i) => (b.order = i))

        saveLayout(newBlocks)
        return newBlocks
      })
    },
    [saveLayout]
  )

  // Toggle block collapsed state
  const toggleCollapsed = useCallback(
    (blockId: string) => {
      setBlocks((prev) => {
        const newBlocks = prev.map((b) =>
          b.id === blockId ? { ...b, collapsed: !b.collapsed } : b
        )
        saveLayout(newBlocks)
        return newBlocks
      })
    },
    [saveLayout]
  )

  // Update block title
  const updateBlockTitle = useCallback(
    (blockId: string, title: string) => {
      setBlocks((prev) => {
        const newBlocks = prev.map((b) =>
          b.id === blockId ? { ...b, title } : b
        )
        saveLayout(newBlocks)
        return newBlocks
      })
    },
    [saveLayout]
  )

  // Update block settings
  const updateBlockSettings = useCallback(
    (blockId: string, settings: Record<string, unknown>) => {
      setBlocks((prev) => {
        const newBlocks = prev.map((b) =>
          b.id === blockId ? { ...b, settings: { ...b.settings, ...settings } } : b
        )
        saveLayout(newBlocks)
        return newBlocks
      })
    },
    [saveLayout]
  )

  // Delete block
  const deleteBlock = useCallback(
    (blockId: string) => {
      setBlocks((prev) => {
        const newBlocks = prev.filter((b) => b.id !== blockId)
        saveLayout(newBlocks)
        return newBlocks
      })
    },
    [saveLayout]
  )

  // Add block
  const addBlock = useCallback(
    (block: Omit<BlockConfig, "order">) => {
      setBlocks((prev) => {
        const columnBlocks = prev.filter((b) => b.column === block.column)
        const newBlock: BlockConfig = {
          ...block,
          order: columnBlocks.length,
        }
        const newBlocks = [...prev, newBlock]
        saveLayout(newBlocks)
        return newBlocks
      })
    },
    [saveLayout]
  )

  // Reset to default layout
  const resetLayout = useCallback(() => {
    setBlocks(DEFAULT_LAYOUT)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // Get blocks by column
  const getColumnBlocks = useCallback(
    (column: number) => {
      return blocks
        .filter((b) => b.column === column)
        .sort((a, b) => a.order - b.order)
    },
    [blocks]
  )

  return {
    blocks,
    isLoading,
    moveBlock,
    toggleCollapsed,
    updateBlockTitle,
    updateBlockSettings,
    deleteBlock,
    addBlock,
    resetLayout,
    getColumnBlocks,
  }
}
