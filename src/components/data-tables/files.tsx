"use client"

import { useState } from "react"
import { IconInfoCircle } from "@tabler/icons-react"
import type {
  FileEntry,
  FileMetadataResponse,
  FilesResponse,
} from "@/components/services/neo-api"
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
import { Separator } from "@radix-ui/react-separator"

interface FilesTableProps {
  files?: FilesResponse | null
  loading?: boolean
  emptyMessage?: string
  onFetchFileMetadata?: (shareId: string, fileId: string) => Promise<FileMetadataResponse>
  shareId?: string
}

export function FilesTable({ files, loading = false, emptyMessage, onFetchFileMetadata, shareId }: FilesTableProps) {
  const rows = files?.files ?? []
  const message = emptyMessage ?? (loading ? "Loading files…" : "No files available.")
  const showShareColumn = rows.some((file) => file.share_name || file.share_path)
  const columnCount = 6 + (showShareColumn ? 1 : 0)

  const [metadataOpen, setMetadataOpen] = useState(false)
  const [metadataLoading, setMetadataLoading] = useState(false)
  const [metadataError, setMetadataError] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<FileMetadataResponse | null>(null)

  const handleShowMetadata = async (file: FileEntry) => {
    const effectiveShareId = shareId ?? file.share_id

    if (!onFetchFileMetadata || !effectiveShareId) {
      setMetadataOpen(true)
      setMetadataError("Cannot fetch metadata: share not available.")
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
                    {onFetchFileMetadata ? (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleShowMetadata(file)}
                        aria-label="File details"
                      >
                        <IconInfoCircle className="size-4" />
                      </Button>
                    ) : null}
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
      {files && !loading ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Showing page {files.page + 1} of {files.total_pages} · {files.total_count} files · Total size{" "}
          {files.total_size.toLocaleString()} bytes
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
              Detailed metadata retrieved from the selected share.
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
                <dd>{metadata.filename}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">File type</dt>
                <dd>{metadata.file_type || "—"}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="font-medium text-foreground">File path</dt>
                <dd className="break-words">{metadata.file_path}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="font-medium text-foreground">UNC path</dt>
                <dd className="break-words">{metadata.unc_path}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Size</dt>
                <dd>{metadata.size.toLocaleString()} bytes</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Directory</dt>
                <dd>{metadata.is_directory ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Created</dt>
                <dd>{new Date(metadata.created_at).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Modified</dt>
                <dd>{new Date(metadata.modified_time).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Accessed</dt>
                <dd>{new Date(metadata.accessed_at).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Indexed</dt>
                <dd>{metadata.indexed_at ? new Date(metadata.indexed_at).toLocaleString() : "—"}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Conversion (ms)</dt>
                <dd>{metadata.conversion_duration_ms}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Extractor</dt>
                <dd>{metadata.extractor_used || "—"}</dd>
              </div>
              <div className="sm:col-span-3">
                <dt className="font-medium text-foreground">ACL principals</dt>
                <dd>
                  {metadata.acl_principals?.length ? metadata.acl_principals.join(", ") : "N/A"}</dd>
              </div>
              <div className="sm:col-span-3">
                <dt className="font-medium text-foreground">Resolved principals</dt>
                <dd>
                  {metadata.resolved_principals?.length ? (
                    <pre className="mt-1 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
                      {JSON.stringify(metadata.resolved_principals, null, 2)}
                    </pre>
                  ) : (
                    <pre className="mt-1 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">"N/A"</pre>
                  )}
                </dd>
              </div>
              <div className="sm:col-span-3">
                <dt className="font-medium text-foreground">Content</dt>
                <dd>
                  {metadata.content ? (
                    <pre className="mt-1 max-h-240 overflow-auto rounded bg-muted p-2 text-xs">
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