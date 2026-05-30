import { createClientLogger } from "@/lib/client-logger"

interface MeasureOptions {
  slowMs?: number
  data?: Record<string, unknown>
}

const DEFAULT_SLOW_MS = 1_000

function nowMs() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now()
  }
  return Date.now()
}

function shouldLog(durationMs: number, slowMs: number) {
  return (
    durationMs >= slowMs ||
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_DEBUG_PERF === "true"
  )
}

export async function measureClientAsync<T>(
  name: string,
  fn: () => Promise<T>,
  options: MeasureOptions = {}
): Promise<T> {
  const slowMs = options.slowMs ?? DEFAULT_SLOW_MS
  const start = nowMs()
  const logger = createClientLogger("perf")

  try {
    const result = await fn()
    const durationMs = Math.round(nowMs() - start)

    if (shouldLog(durationMs, slowMs)) {
      const payload = { name, durationMs, slowMs, ...options.data }
      if (durationMs >= slowMs) {
        logger.warn("Slow client query", payload)
      } else {
        logger.info("Client query timing", payload)
      }
    }

    return result
  } catch (error) {
    const durationMs = Math.round(nowMs() - start)
    logger.warn("Client query failed", {
      name,
      durationMs,
      ...options.data,
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}
