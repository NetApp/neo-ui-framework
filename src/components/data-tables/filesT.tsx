"use client"

import { useEffect, useState } from "react"
import { IconInfoCircle } from "@tabler/icons-react"
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
}

export function FilesTable({ 
  files, 
  loading = false, 
  emptyMessage, 
  onFetchFileMetadata, 
  shareId,
  onPageChange 
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
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow>
              <TableHead>Filename</TableHead>
              <TableHead>UNC Path</TableHead>
              <TableHead>Indexed</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Type</TableHead>
              {showShareColumn ? <TableHead>Share</TableHead> : null}
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="py-6 text-center text-sm text-muted-foreground">
                  {message}
                </TableCell>
              </TableRow>
            ) : rows.length ? (
              rows.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>{file.filename}</TableCell>
                  <TableCell>{file.unc_path}</TableCell>
                  <TableCell>
                    {file.indexed_at ? new Date(file.indexed_at).toLocaleString() : "—"}
                  </TableCell>
                  <TableCell>{file.size}</TableCell>
                  <TableCell>{file.file_type}</TableCell>
                  {showShareColumn ? (
                    <TableCell>{file.share_name ?? file.share_path ?? "—"}</TableCell>
                  ) : null}
                  <TableCell className="text-right">
                    {canFetchMetadata(file) ? (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleShowMetadata(file)}
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