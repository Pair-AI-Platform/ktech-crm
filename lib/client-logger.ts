/**
 * Lightweight client-side logger for React hooks and components.
 * Provides consistent prefixed logging without server-side dependencies.
 */
export function createClientLogger(context: string) {
  const prefix = `[${context}]`

  return {
    debug: (message: string, data?: Record<string, unknown>) => {
      if (process.env.NODE_ENV !== 'production') {
        console.debug(prefix, message, data ?? '')
      }
    },
    info: (message: string, data?: Record<string, unknown>) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log(prefix, message, data ?? '')
      }
    },
    warn: (message: string, data?: Record<string, unknown>) => {
      console.warn(prefix, message, data ?? '')
    },
    error: (message: string, data?: Record<string, unknown>) => {
      console.error(prefix, message, data ?? '')
    },
  }
}
