// Copyright 2025 NetApp, Inc. All Rights Reserved.
import {
  useEffect,
  useState,
  useCallback
} from "react"

import {
  appLogger,
  type AppLogEntry,
  type LogLevel
} from "@/services/app-logger"
import type { OperationResponse } from "@/services/neo-api"

export function useAppLogs(
  level?: LogLevel,
  perPage: number = 50,
  operations: OperationResponse[] | null = null
) {
  const [logs, setLogs] = useState<AppLogEntry[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const updateLogs = useCallback(() => {
    // Get all relevant logs from appLogger (not paginated yet)
    let allLogs = appLogger.getLogs(level === "OPERATION" ? undefined : level)

    // Filter out operations if level is specified and NOT "OPERATION"
    // If level is "OPERATION", we only want operations (and maybe we shouldn't fetch app logs? 
    // But app logs don't have OPERATION level usually. 
    // If level is "OPERATION", appLogger.getLogs("OPERATION") returns empty usually.

    // If level is "OPERATION", we only want operations.
    if (level === "OPERATION") {
      allLogs = []
    }

    // Convert operations to log entries
    if (operations && (!level || level === "OPERATION")) {
      const opLogs: AppLogEntry[] = operations.map(op => ({
        id: `op-${op.id}`,
        timestamp: new Date(op.timestamp),
        level: "OPERATION",
        message: `${op.operation_type} - ${op.status}`,
        details: op.details,
        context: { username: op.username, operation_id: op.id }
      }))
      allLogs = [...allLogs, ...opLogs]
    }

    // Sort by timestamp descending
    allLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    // Apply pagination
    const total = allLogs.length
    const start = currentPage * perPage
    const end = start + perPage

    setLogs(allLogs.slice(start, end))
    setTotalPages(Math.ceil(total / perPage))
    setTotalCount(total)
  }, [currentPage, perPage, level, operations])

  useEffect(() => {
    updateLogs()
    const unsubscribe = appLogger.subscribe(() => {
      updateLogs()
    })
    return unsubscribe
  }, [updateLogs])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleClearLogs = useCallback(() => {
    appLogger.clear()
    setCurrentPage(0)
    updateLogs()
  }, [updateLogs])

  const handleDownloadLogs = useCallback(() => {
    // Get all logs (system + operations)
    let allLogs = appLogger.getLogs()

    if (operations) {
      const opLogs: AppLogEntry[] = operations.map(op => ({
        id: `op-${op.id}`,
        timestamp: new Date(op.timestamp),
        level: "OPERATION",
        message: `${op.operation_type} - ${op.status}`,
        details: op.details,
        context: { username: op.username, operation_id: op.id }
      }))
      allLogs = [...allLogs, ...opLogs]
    }

    // Sort by timestamp descending
    allLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    // Create JSON blob
    const jsonString = JSON.stringify(allLogs, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    // Trigger download
    const link = document.createElement("a")
    link.href = url
    link.download = `neo-logs-${new Date().toISOString()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [operations])

  return {
    logs,
    currentPage,
    totalPages,
    totalCount,
    onPageChange: handlePageChange,
    onClearLogs: handleClearLogs,
    onDownloadLogs: handleDownloadLogs,
  }
}