// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle
} from "lucide-react"

import type {
  SharesResponse
} from "@/services/neo-api"

import {
  Badge
} from "@/components/ui/badge"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

interface SharesTableProps {
  shares: SharesResponse[] | null
  onShareClick: (shareId: string) => void
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "active":
    case "ready":
      return <CheckCircle2 className="size-4 text-green-600" />
    case "error":
    case "failed":
      return <XCircle className="size-4 text-red-600" />
    case "crawling":
    case "processing":
      return <Loader2 className="size-4 text-blue-600 animate-spin" />
    case "pending":
    case "scheduled":
      return <Clock className="size-4 text-yellow-600" />
    case "warning":
    case "connection_failed":
      return <AlertCircle className="size-4 text-orange-600" />
    default:
      return null
  }
}

function getStatusBadge(status: string) {
  const statusLower = status.toLowerCase()


  const colors: Record<string, string> = {
    active: "text-green-600 border-green-200 dark:text-green-400 dark:border-green-800",
    ready: "text-green-600 border-green-200 dark:text-green-400 dark:border-green-800",
    error: "text-destructive border-destructive/50",
    failed: "text-destructive border-destructive/50",
    crawling: "text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800",
    processing: "text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800",
    pending: "text-yellow-600 border-yellow-200 dark:text-yellow-400 dark:border-yellow-800",
    scheduled: "text-yellow-600 border-yellow-200 dark:text-yellow-400 dark:border-yellow-800",
    warning: "text-orange-600 border-orange-200 dark:text-orange-400 dark:border-orange-800",
    connection_failed: "text-orange-600 border-orange-200 dark:text-orange-400 dark:border-orange-800",
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

export function SharesTable({ shares, onShareClick }: SharesTableProps) {
  const rows = shares ?? []
  const rowsPerPage = 100
  const [currentPage, setCurrentPage] = useState(1)

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    source_id: 110,
    share_path: 300,
    protocol: 110,
    files: 100,
    username: 150,
    last_crawled: 200,
    status: 120,
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
              <TableHead style={{ width: columnWidths.source_id, position: 'relative' }}>
                Id
                <div
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
                  onMouseDown={(e) => handleResizeStart(e, 'source_id')}
                />
              </TableHead>
              <TableHead style={{ width: columnWidths.protocol, position: 'relative' }}>
                Protocol
                <div
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
                  onMouseDown={(e) => handleResizeStart(e, 'protocol')}
                />
              </TableHead>
              <TableHead style={{ width: columnWidths.share_path, position: 'relative' }}>
                Path
                <div
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
                  onMouseDown={(e) => handleResizeStart(e, 'share_path')}
                />
              </TableHead>
              {/* <TableHead style={{ width: columnWidths.username, position: 'relative' }}>
                User
                <div
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
                  onMouseDown={(e) => handleResizeStart(e, 'username')}
                />
              </TableHead> */}
              <TableHead style={{ width: columnWidths.last_crawled, position: 'relative' }}>
                Last Crawled
                <div
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
                  onMouseDown={(e) => handleResizeStart(e, 'last_crawled')}
                />
              </TableHead>
              <TableHead style={{ width: columnWidths.files, position: 'relative' }}>
                Files
                <div
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
                  onMouseDown={(e) => handleResizeStart(e, 'files')}
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
              paginatedRows.map((share) => (
                <TableRow
                  key={share.id}
                  onClick={() => onShareClick(share.id)}
                  className="cursor-pointer hover:bg-muted/50"
                  data-id={share.id}
                >
                  <TableCell className="truncate" title={share.id}>{share.id.slice(0, 7)}</TableCell>
                  <TableCell className="truncate">{(share.protocol ?? "smb").toUpperCase()}</TableCell>
                  <TableCell className="truncate" title={share.share_path}>{share.share_path}</TableCell>
                  {/* <TableCell className="truncate" title={share.username}>{share.username}</TableCell> */}
                  <TableCell className="truncate">
                    {share.last_crawled ? new Date(share.last_crawled).toLocaleString() : "—"}
                  </TableCell>
                  <TableCell className="truncate">{share.last_crawl_file_count}</TableCell>
                  <TableCell className="truncate">{getStatusBadge(share.status)}</TableCell>
                </TableRow >
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                  No shares available.
                </TableCell>
              </TableRow>
            )
            }
          </TableBody >
        </Table >
      </div >
      {rows.length > 0 ? (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-muted-foreground flex-1 text-sm">
            Showing {startIndex + 1}-{Math.min(startIndex + paginatedRows.length, rows.length)} of {rows.length.toLocaleString()} shares · Page {currentPage} of {totalPages}
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