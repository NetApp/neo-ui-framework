"use client"

import type { FilesResponse } from "@/components/services/neo-api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface FilesTableProps {
  files?: FilesResponse | null
  loading?: boolean
  emptyMessage?: string
}

export function FilesTable({ files, loading = false, emptyMessage }: FilesTableProps) {
  const rows = files?.files ?? []
  const message =
    emptyMessage ?? (loading ? "Loading files…" : "No files available.")

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
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
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
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
    </>
  )
}