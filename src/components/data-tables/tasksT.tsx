import { useState, useRef, useCallback, useEffect } from "react"
import { CheckCircle2, XCircle, Clock, Loader2, Ban } from "lucide-react"
import type { TasksResponse } from "@/services/neo-api"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

interface TasksTableProps {
  tasks: TasksResponse[] | null
  onTaskClick: (task: TasksResponse) => void
}

export function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
      return <CheckCircle2 className="size-4 text-green-600" />
    case "failed":
      return <XCircle className="size-4 text-red-600" />
    case "running":
      return <Loader2 className="size-4 text-blue-600 animate-spin" />
    case "pending":
      return <Clock className="size-4 text-yellow-600" />
    case "cancelled":
      return <Ban className="size-4 text-gray-600" />
    default:
      return null
  }
}

export function getStatusBadge(status: string) {
  const statusLower = status.toLowerCase()

  const colors: Record<string, string> = {
    completed: "text-green-600 border-green-200 dark:text-green-400 dark:border-green-800",
    failed: "text-destructive border-destructive/50",
    running: "text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800",
    pending: "text-yellow-600 border-yellow-200 dark:text-yellow-400 dark:border-yellow-800",
    cancelled: "text-gray-600 border-gray-200 dark:text-gray-400 dark:border-gray-800",
  }

  return (
    <Badge
      variant="outline"
      className={`gap-1 ${colors[statusLower] || ""}`}
    >
      {getStatusIcon(status)}
      {status}
    </Badge>
  )
}

export function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt || !completedAt) return "N/A"

  const start = new Date(startedAt).getTime()
  const end = new Date(completedAt).getTime()
  const durationMs = end - start

  if (isNaN(durationMs) || durationMs < 0) return "N/A"

  if (durationMs < 1000) return `${durationMs}ms`
  if (durationMs < 60000) return `${(durationMs / 1000).toFixed(2)}s`
  if (durationMs < 3600000) return `${(durationMs / 60000).toFixed(2)}m`
  return `${(durationMs / 3600000).toFixed(2)}h`
}

export function TasksTable({ tasks, onTaskClick }: TasksTableProps) {
  const rows = tasks ?? []
  const rowsPerPage = 100
  const [currentPage, setCurrentPage] = useState(1)

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    name: 250,
    share_id: 150,
    status: 120,
    created_at: 180,
    duration: 100,
  })

  const resizingRef = useRef<{
    column: string
    startX: number
    startWidth: number
  } | null>(null)

  const handleResizeStart = (e: React.MouseEvent, column: string) => {
    e.preventDefault()
    e.stopPropagation()

    resizingRef.current = {
      column,
      startX: e.clientX,
      startWidth: columnWidths[column] || 100
    }

    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)
    document.body.style.cursor = 'col-resize'
  }

  const animationFrameRef = useRef<number | null>(null)

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizingRef.current) return

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      if (!resizingRef.current) return

      const { column, startX, startWidth } = resizingRef.current
      const diff = e.clientX - startX
      const newWidth = Math.max(50, startWidth + diff)

      setColumnWidths(prev => {
        if (prev[column] === newWidth) return prev
        return {
          ...prev,
          [column]: newWidth
        }
      })
    })
  }, [])

  const handleResizeEnd = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    resizingRef.current = null
    document.removeEventListener('mousemove', handleResizeMove)
    document.removeEventListener('mouseup', handleResizeEnd)
    document.body.style.cursor = ''
  }, [handleResizeMove])

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove)
      document.removeEventListener('mouseup', handleResizeEnd)
    }
  }, [handleResizeMove, handleResizeEnd])

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage))
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [rows.length])

  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage))
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedRows = rows.slice(startIndex, startIndex + rowsPerPage)

  return (
    <>
      <div className="overflow-hidden rounded-lg border">
        <Table style={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow>
              <TableHead style={{ width: columnWidths.name, position: 'relative' }}>
                Name
                <div
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
                  onMouseDown={(e) => handleResizeStart(e, 'name')}
                />
              </TableHead>
              <TableHead style={{ width: columnWidths.share_id, position: 'relative' }}>
                Share ID
                <div
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
                  onMouseDown={(e) => handleResizeStart(e, 'share_id')}
                />
              </TableHead>
              <TableHead style={{ width: columnWidths.created_at, position: 'relative' }}>
                Created
                <div
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
                  onMouseDown={(e) => handleResizeStart(e, 'created_at')}
                />
              </TableHead>
              <TableHead style={{ width: columnWidths.duration, position: 'relative' }}>
                Duration
                <div
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
                  onMouseDown={(e) => handleResizeStart(e, 'duration')}
                />
              </TableHead>
              <TableHead style={{ width: columnWidths.status, position: 'relative' }}>
                Status
                <div
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
                  onMouseDown={(e) => handleResizeStart(e, 'status')}
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.length ? (
              paginatedRows.map((task) => (
                <TableRow
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell className="font-medium truncate" title={task.name}>{task.name}</TableCell>
                  <TableCell className="truncate" title={task.share_id ?? ""}>
                    <div className="font-mono text-xs truncate">
                      {task.share_id ? task.share_id : "—"}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm truncate">
                    {new Date(task.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm truncate">
                    {formatDuration(task.started_at, task.completed_at)}
                  </TableCell>
                  <TableCell className="truncate">{getStatusBadge(task.status)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  No tasks available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {rows.length > 0 ? (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-muted-foreground flex-1 text-sm">
            Showing {startIndex + 1}-{Math.min(startIndex + paginatedRows.length, rows.length)} of {rows.length.toLocaleString()} tasks · Page {currentPage} of {totalPages}
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </>
  )
}