export interface RetryOptions {
  maxRetries: number
  baseDelayMs?: number
  maxDelayMs?: number
  onRetry?: (attempt: number, error: unknown) => void
}

/**
 * Executes an async function with exponential backoff retry logic.
 *
 * Delay formula: min(baseDelay * 2^attempt, maxDelay) + random jitter
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const {
    maxRetries,
    baseDelayMs = 1000,
    maxDelayMs = 10000,
    onRetry,
  } = options

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (attempt >= maxRetries) {
        break
      }

      const exponentialDelay = baseDelayMs * Math.pow(2, attempt)
      const clampedDelay = Math.min(exponentialDelay, maxDelayMs)
      const jitter = Math.random() * clampedDelay * 0.1
      const delay = clampedDelay + jitter

      onRetry?.(attempt + 1, error)

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}
