export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR"

export interface AppLogEntry {
  id: string
  timestamp: Date
  level: LogLevel
  message: string
  details?: string
  context?: Record<string, unknown>
}

class AppLogger {
  private logs: AppLogEntry[] = []
  private maxLogs = 1000
  private listeners: Set<(log: AppLogEntry) => void> = new Set()

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  }

  private addLog(level: LogLevel, message: string, details?: string, context?: Record<string, unknown>): AppLogEntry {
    const log: AppLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      message,
      details,
      context,
    }

    this.logs.unshift(log)

    // Keep only the latest maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // Notify listeners
    this.listeners.forEach((listener) => listener(log))

    // Also log to browser console
    const consoleMethod = level.toLowerCase() as "debug" | "info" | "warn" | "error"
    const consoleLog = console[consoleMethod]

    if (consoleLog) {
      consoleLog(`[${level}] ${message}`, details || context || "")
    }

    return log
  }

  debug(message: string, details?: string, context?: Record<string, unknown>): AppLogEntry {
    return this.addLog("DEBUG", message, details, context)
  }

  info(message: string, details?: string, context?: Record<string, unknown>): AppLogEntry {
    return this.addLog("INFO", message, details, context)
  }

  warn(message: string, details?: string, context?: Record<string, unknown>): AppLogEntry {
    return this.addLog("WARN", message, details, context)
  }

  error(message: string, details?: string, context?: Record<string, unknown>): AppLogEntry {
    return this.addLog("ERROR", message, details, context)
  }

  getLogs(level?: LogLevel): AppLogEntry[] {
    if (level) {
      return this.logs.filter((log) => log.level === level)
    }
    return this.logs
  }

  getPaginatedLogs(page: number = 0, perPage: number = 50, level?: LogLevel) {
    const filtered = level ? this.logs.filter((log) => log.level === level) : this.logs
    const total = filtered.length
    const start = page * perPage
    const end = start + perPage

    return {
      logs: filtered.slice(start, end),
      total_count: total,
      page,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage),
    }
  }

  subscribe(listener: (log: AppLogEntry) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  clear(): void {
    this.logs = []
    this.listeners.forEach((listener) => listener({
      id: "",
      timestamp: new Date(),
      level: "INFO",
      message: "Logs cleared",
    }))
  }
}

export const appLogger = new AppLogger()