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

export function useAppLogs(level?: LogLevel, perPage: number = 50) {
  const [logs, setLogs] = useState<AppLogEntry[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const updateLogs = useCallback(() => {
    const result = appLogger.getPaginatedLogs(currentPage, perPage, level)
    setLogs(result.logs)
    setTotalPages(result.total_pages)
    setTotalCount(result.total_count)
  }, [currentPage, perPage, level])

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

  return {
    logs,
    currentPage,
    totalPages,
    totalCount,
    onPageChange: handlePageChange,
    onClearLogs: handleClearLogs,
  }
}