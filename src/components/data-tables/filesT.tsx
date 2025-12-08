"use client"

import { useEffect, useState, useMemo, useRef, useCallback } from "react"
import {
  IconInfoCircle,
  IconChevronUp,
  IconChevronDown,
  IconSelector
} from "@tabler/icons-react"
import type {
  FileEntry,
  FileMetadataResponse,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Separator } from "@/components/ui/separator"

interface FilesTableProps {
  files?: FilesResponse | null
  loading?: boolean
  emptyMessage?: string
  onFetchFileMetadata?: (shareId: string, fileId: string) => Promise<FileMetadataResponse>
  shareId?: string
  onPageChange?: (page: number) => Promise<void>
  onFileClick?: (file: FileEntry) => void
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
  onFetchFileMetadata,
  shareId,
  onPageChange,
  onFileClick
}: FilesTableProps) {
  const rows = files?.files ?? []
  const message = emptyMessage ?? (loading ? "Loading files…" : "No files available.")
  const showShareColumn = rows.some((file) => file.share_name || file.share_path)
  const columnCount = 6 + (showShareColumn ? 1 : 0)

  const [metadataOpen, setMetadataOpen] = useState(false)
  const [metadataLoading, setMetadataLoading] = useState(false)
  const [metadataError, setMetadataError] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<FileMetadataResponse | null>(null)
  const [pageChanging, setPageChanging] = useState(false)
  const [sortConfig, setSortConfig] = useState<{
    key: "filename" | null
    direction: "asc" | "desc"
  }>({ key: null, direction: "asc" })

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    filename: 300,
    unc_path: 300,
    indexed_at: 180,
    size: 100,
    file_type: 100,
    share: 150,
    actions: 80
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

  const handleShowMetadata = async (file: FileEntry) => {
    // Use the provided shareId first, then fall back to the file's share_id
    const effectiveShareId = shareId ?? file.share_id

    if (!onFetchFileMetadata) {
      setMetadataOpen(true)
      setMetadataError("Cannot fetch metadata: handler not available.")
      setMetadata(null)
      return
    }

    if (!effectiveShareId) {
      setMetadataOpen(true)
      setMetadataError("Cannot fetch metadata: share information not available.")
      setMetadata(null)
      return
    }

    setMetadataOpen(true)
    setMetadataLoading(true)
    setMetadataError(null)
    setMetadata(null)

    try {
      const data = await onFetchFileMetadata(effectiveShareId, file.id)
      setMetadata(data)
    } catch (error) {
      setMetadataError(error instanceof Error ? error.message : "Failed to load file metadata.")
    } finally {
      setMetadataLoading(false)
    }
  }

  // Helper function to determine if a file can have its metadata fetched
  const canFetchMetadata = (file: FileEntry) => {
    // Must have the metadata handler
    if (!onFetchFileMetadata) {
      return false
    }

    // Must have either a shareId from props OR a share_id from the file
    const effectiveShareId = shareId ?? file.share_id
    return !!effectiveShareId
  }

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

  // Debug logging to help troubleshoot
  useEffect(() => {
    if (rows.length > 0) {
      console.log("FilesTable Debug:", {
        shareId,
        sampleFile: rows[0],
        canFetchFirst: canFetchMetadata(rows[0]),
        effectiveShareId: shareId ?? rows[0]?.share_id
      })
    }
  }, [shareId, rows, canFetchMetadata])

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
              <TableHead style={{ width: columnWidths.unc_path, position: 'relative' }}>
                UNC Path
                <div
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
                  onMouseDown={(e) => handleResizeStart(e, 'unc_path')}
                />
              </TableHead>
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
              {showShareColumn ? (
                <TableHead style={{ width: columnWidths.share, position: 'relative' }}>
                  Share
                  <div
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
                    onMouseDown={(e) => handleResizeStart(e, 'share')}
                  />
                </TableHead>
              ) : null}
              <TableHead className="text-right" style={{ width: columnWidths.actions }}>Actions</TableHead>
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
                  onClick={() => {
                    if (onFileClick) {
                      onFileClick(file)
                    } else {
                      handleShowMetadata(file)
                    }
                  }}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell className="truncate" title={file.filename}>{file.filename}</TableCell>
                  <TableCell className="truncate" title={file.unc_path}>{file.unc_path}</TableCell>
                  <TableCell className="truncate">
                    {formatDate(file.indexed_at)}
                  </TableCell>
                  <TableCell className="truncate">{file.size}</TableCell>
                  <TableCell className="truncate">{file.file_type}</TableCell>
                  {showShareColumn ? (
                    <TableCell className="truncate" title={file.share_name ?? file.share_path ?? ""}>
                      {file.share_name ?? file.share_path ?? "—"}
                    </TableCell>
                  ) : null}
                  <TableCell className="text-right">
                    {canFetchMetadata(file) ? (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleShowMetadata(file)
                        }}
                        aria-label={`File details for ${file.filename}`}
                        title={`View details for ${file.filename} (Share: ${shareId ?? file.share_id})`}
                      >
                        <IconInfoCircle className="size-4" />
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground" title="No share information available">
                        —
                      </span>
                    )}
                  </TableCell>
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

      <Dialog
        open={metadataOpen}
        onOpenChange={(open) => {
          setMetadataOpen(open)
          if (!open) {
            setMetadata(null)
            setMetadataError(null)
            setMetadataLoading(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-[90vw] lg:max-w-[vw] overflow-x-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">File details</DialogTitle>
            <DialogDescription className="text-center mb-4">
              Detailed information about the selected file
            </DialogDescription>
          </DialogHeader>
          <Separator className="" />

          <div className="space-y-4">
            {metadataLoading ? (
              <div className="flex items-center justify-center py-6">
                <Spinner className="size-6" />
              </div>
            ) : metadataError ? (
              <p className="py-6 text-center text-sm text-destructive">{metadataError}</p>
            ) : metadata ? (
              <dl className="grid grid-cols-1 gap-y-3 text-sm sm:grid-cols-3 sm:gap-x-6">
                <div>
                  <dt className="font-medium text-foreground">Filename</dt>
                  <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{metadata.filename}</pre></dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">File type</dt>
                  <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{metadata.file_type || "—"}</pre></dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="font-medium text-foreground">File path</dt>
                  <dd className="break-words p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{metadata.file_path}</pre></dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="font-medium text-foreground">UNC path</dt>
                  <dd className="break-words p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{metadata.unc_path}</pre></dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Size</dt>
                  <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{metadata.size.toLocaleString()} bytes</pre></dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Directory</dt>
                  <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{metadata.is_directory ? "Yes" : "No"}</pre></dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Created</dt>
                  <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{new Date(metadata.created_at).toLocaleString()}</pre></dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Modified</dt>
                  <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{new Date(metadata.modified_time).toLocaleString()}</pre></dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Accessed</dt>
                  <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{new Date(metadata.accessed_at).toLocaleString()}</pre></dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Indexed</dt>
                  <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{metadata.indexed_at ? new Date(metadata.indexed_at).toLocaleString() : "—"}</pre></dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Conversion (ms)</dt>
                  <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{metadata.conversion_duration_ms}</pre></dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Extractor</dt>
                  <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{metadata.extractor_used || "—"}</pre></dd>
                </div>
                <div className="sm:col-span-3">
                  <dt className="font-medium text-foreground">ACL principals</dt>
                  <dd className="p-1">
                    <pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">
                      {metadata.acl_principals?.length ? metadata.acl_principals.join(", ") : "N/A"}
                    </pre>
                  </dd>
                </div>
                <div className="sm:col-span-3">
                  <dt className="font-medium text-foreground">Resolved principals</dt>
                  <dd className="p-1">
                    {metadata.resolved_principals?.length ? (
                      <pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">
                        {JSON.stringify(metadata.resolved_principals, null, 2)}
                      </pre>
                    ) : (
                      <pre className="mt-1 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">"N/A"</pre>
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-3">
                  <dt className="font-medium text-foreground">Content</dt>
                  <dd className="p-1">
                    {metadata.content ? (
                      <pre className="mt-1 max-h-200 overflow-auto rounded bg-muted p-2 text-xs">
                        {metadata.content}
                      </pre>
                    ) : (
                      <pre className="mt-1 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">"—"</pre>
                    )}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">No metadata available.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMetadataOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}