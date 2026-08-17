import { redactLogData } from '@/lib/redact'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  context: string
  message: string
  requestId?: string
  data?: Record<string, unknown>
  timestamp: string
}

export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void
  info(message: string, data?: Record<string, unknown>): void
  warn(message: string, data?: Record<string, unknown>): void
  error(message: string, data?: Record<string, unknown>): void
  requestId: string
}

function formatLog(entry: LogEntry): string {
  if (process.env.NODE_ENV === 'production') {
    // Structured JSON in production for log aggregation
    return JSON.stringify(entry)
  }
  // Human-readable in development
  const prefix = `[${entry.context}]${entry.requestId ? ` [${entry.requestId}]` : ''}`
  const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : ''
  return `${prefix} ${entry.message}${dataStr}`
}

export function createLogger(context: string, requestId?: string): Logger {
  const id = requestId || crypto.randomUUID().slice(0, 8)

  function log(level: LogLevel, message: string, data?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      context,
      message,
      requestId: id,
      data: redactLogData(data),
      timestamp: new Date().toISOString(),
    }

    const formatted = formatLog(entry)

    switch (level) {
      case 'debug':
        if (process.env.NODE_ENV !== 'production') console.debug(formatted)
        break
      case 'info':
        console.log(formatted)
        break
      case 'warn':
        console.warn(formatted)
        break
      case 'error':
        console.error(formatted)
        break
    }
  }

  return {
    debug: (message, data) => log('debug', message, data),
    info: (message, data) => log('info', message, data),
    warn: (message, data) => log('warn', message, data),
    error: (message, data) => log('error', message, data),
    requestId: id,
  }
}

/** Helper to return a JSON error response that includes the requestId for debugging */
export function errorResponse(
  message: string,
  status: number,
  logger: Logger
) {
  return Response.json(
    { error: message, requestId: logger.requestId },
    { status }
  )
}
