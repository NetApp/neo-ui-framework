// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import { useEffect, useState, useMemo, useRef, useCallback } from "react"
import {
  IconChevronUp,
  IconChevronDown,
  IconSelector
} from "@tabler/icons-react"
import type {
  FileEntry,
  FilesResponse,
} from "@/services/neo-api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

interface FilesTableProps {
  files?: FilesResponse | null
  loading?: boolean
  emptyMessage?: string
  shareId?: string
  onPageChange?: (page: number) => Promise<void>
  onFileClick: (file: FileEntry) => void
}

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
})

const formatDate = (dateString?: string) => {
  if (!dateString) return "—"
  try {
    return dateTimeFormatter.format(new Date(dateString))
  } catch {
    return "Invalid Date"
  }
}

export function FilesTable({
  files,
  loading = false,
  emptyMessage,
  onPageChange,
  onFileClick
}: FilesTableProps) {
  const rows = files?.files ?? []
  const message = emptyMessage ?? (loading ? "Loading files…" : "No files available.")
  const showShareColumn = rows.some((file) => file.share_name || file.share_path)
  const columnCount = 4 + (showShareColumn ? 1 : 0)

  const [pageChanging, setPageChanging] = useState(false)
  const [sortConfig, setSortConfig] = useState<{
    key: "filename" | null
    direction: "asc" | "desc"
  }>({ key: null, direction: "asc" })

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    filename: 300,
    share: 150,
    indexed_at: 180,
    size: 100,
    file_type: 100
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

    // Use requestAnimationFrame to throttle resize updates
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      if (!resizingRef.current) return // Check again inside frame

      const { column, startX, startWidth } = resizingRef.current
      const diff = e.clientX - startX
      const newWidth = Math.max(50, startWidth + diff)

      setColumnWidths(prev => {
        if (prev[column] === newWidth) return prev // Avoid update if unchanged
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove)
      document.removeEventListener('mouseup', handleResizeEnd)
    }
  }, [handleResizeMove, handleResizeEnd])

  const handleSort = (key: "filename") => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }))
  }

  const sortedRows = useMemo(() => {
    if (!sortConfig.key) return rows

    return [...rows].sort((a, b) => {
      const aValue = a[sortConfig.key!]
      const bValue = b[sortConfig.key!]

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1
      }
      return 0
    })
  }, [rows, sortConfig])

  const handlePageChange = async (newPage: number) => {
    if (onPageChange && !pageChanging && !loading) {
      setPageChanging(true)
      try {
        await onPageChange(newPage)
      } catch (error) {
        console.error("Page change failed:", error)
      } finally {
        setPageChanging(false)
      }
    }
  }

  // Calculate pagination info
  const currentPage = files?.page ?? 1  // Change from 0 to 1 as default
  const totalPages = files?.total_pages ?? 0
  const hasPrevious = files?.has_previous ?? false
  const hasNext = files?.has_next ?? false
  const totalCount = files?.total_count ?? 0
  const totalSize = files?.total_size ?? 0

  return (
    <>
      <div className="overflow-hidden rounded-lg border" aria-busy={loading}>
        <Table style={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow>
              <TableHead style={{ width: columnWidths.filename, position: 'relative' }}>
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("filename")}
                    className="-ml-4 h-8 data-[state=open]:bg-accent"
                  >
                    Filename
                    {sortConfig.key === "filename" ? (
                      sortConfig.direction === "asc" ? (
                        <IconChevronUp className="ml-2 size-4" />
                      ) : (
                        <IconChevronDown className="ml-2 size-4" />
                      )
                    ) : (
                      <IconSelector className="ml-2 size-4" />
                    )}
                  </Button>
                  <div
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
                    onMouseDown={(e) => handleResizeStart(e, 'filename')}
                  />
                </div>
              </TableHead>

              {showShareColumn ? (
                <TableHead style={{ width: columnWidths.share, position: 'relative' }}>
                  Share
                  <div
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
                    onMouseDown={(e) => handleResizeStart(e, 'share')}
                  />
                </TableHead>
              ) : null}

              <TableHead style={{ width: columnWidths.indexed_at, position: 'relative' }}>
                Indexed
                <div
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
                  onMouseDown={(e) => handleResizeStart(e, 'indexed_at')}
                />
              </TableHead>
              <TableHead style={{ width: columnWidths.size, position: 'relative' }}>
                Size
                <div
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
                  onMouseDown={(e) => handleResizeStart(e, 'size')}
                />
              </TableHead>
              <TableHead style={{ width: columnWidths.file_type, position: 'relative' }}>
                Type
                <div
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
                  onMouseDown={(e) => handleResizeStart(e, 'file_type')}
                />
              </TableHead>


            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="py-6 text-center text-sm text-muted-foreground">
                  {message}
                </TableCell>
              </TableRow>
            ) : sortedRows.length ? (
              sortedRows.map((file) => (
                <TableRow
                  key={file.id}
                  onClick={() => onFileClick(file)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell className="truncate" title={file.filename}>{file.filename}</TableCell>
                  {showShareColumn ? (
                    <TableCell className="truncate" title={file.share_name ?? file.share_path ?? ""}>
                      {file.share_name ?? file.share_path ?? "—"}
                    </TableCell>
                  ) : null}

                  <TableCell className="truncate">
                    {formatDate(file.indexed_at)}
                  </TableCell>
                  <TableCell className="truncate">{file.size}</TableCell>
                  <TableCell className="truncate">{file.file_type}</TableCell>


                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columnCount} className="py-6 text-center text-sm text-muted-foreground">
                  {message}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {files && !loading && totalPages > 1 ? (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-muted-foreground flex-1 text-sm">
            Showing page {currentPage} of {totalPages} · {totalCount.toLocaleString()} files · Total size {totalSize.toLocaleString()} bytes
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!hasPrevious || pageChanging || loading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasNext || pageChanging || loading}
            >
              Next
            </Button>
          </div>
        </div>
      ) : files && !loading && totalCount > 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Showing page {currentPage} of {totalPages} · {totalCount.toLocaleString()} files · Total size {totalSize.toLocaleString()} bytes
        </p>
      ) : null}
    </>
  )
}