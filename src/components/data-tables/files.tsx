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
}

export function FilesTable({ files }: FilesTableProps) {
  const rows = files?.files ?? []

  return (
    <>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            <TableRow>
              <TableHead>Filename</TableHead>
              <TableHead>UNC Path</TableHead>
              <TableHead>Indexed</TableHead>              
              <TableHead>Size</TableHead>
              <TableHead>Type</TableHead>
              {/* <TableHead>Created</TableHead>
              <TableHead>Modified</TableHead>
              <TableHead>Accessed</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>{file.filename}</TableCell>
                  <TableCell>{file.unc_path}</TableCell>
                  <TableCell>{file.indexed_at ? new Date(file.indexed_at).toLocaleString() : "—"}</TableCell>
                  <TableCell>{file.size}</TableCell>
                  <TableCell>{file.file_type}</TableCell>
                  {/* <TableCell>{new Date(file.created_at).toLocaleString()}</TableCell>
                  <TableCell>{new Date(file.modified_time).toLocaleString()}</TableCell>
                  <TableCell>{new Date(file.accessed_at).toLocaleString()}</TableCell> */}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                  No files available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {files ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Showing page {files.page + 1} of {files.total_pages} · {files.total_count} files · Total size {files.total_size.toLocaleString()} bytes
        </p>
      ) : null}
    </>
  )
}