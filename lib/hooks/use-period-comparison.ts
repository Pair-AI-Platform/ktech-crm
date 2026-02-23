"use client"

import { useMemo } from "react"

export interface PeriodComparison<T> {
  current: T
  previous: T
  deltaPercent: number
  direction: "up" | "down" | "flat"
}

/**
 * Given a date range, computes a same-length previous period.
 * Returns { previousStart, previousEnd } for querying.
 */
export function getPreviousPeriod(start: Date, end: Date): { previousStart: Date; previousEnd: Date } {
  const durationMs = end.getTime() - start.getTime()
  const previousEnd = new Date(start.getTime() - 1) // 1ms before current period start
  const previousStart = new Date(previousEnd.getTime() - durationMs)
  return { previousStart, previousEnd }
}

/**
 * Computes delta percentage between current and previous numeric values.
 */
export function computeDelta(current: number, previous: number): { deltaPercent: number; direction: "up" | "down" | "flat" } {
  if (previous === 0 && current === 0) return { deltaPercent: 0, direction: "flat" }
  if (previous === 0) return { deltaPercent: 100, direction: "up" }
  const deltaPercent = Math.round(((current - previous) / previous) * 100)
  const direction = deltaPercent > 0 ? "up" : deltaPercent < 0 ? "down" : "flat"
  return { deltaPercent, direction }
}

/**
 * Hook that takes current + previous counts and returns a PeriodComparison.
 */
export function usePeriodComparison(current: number, previous: number): PeriodComparison<number> {
  return useMemo(() => {
    const { deltaPercent, direction } = computeDelta(current, previous)
    return { current, previous, deltaPercent, direction }
  }, [current, previous])
}
