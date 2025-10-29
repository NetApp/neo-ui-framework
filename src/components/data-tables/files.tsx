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
import {
  Tabs,
  TabsContent,
} from "@/components/ui/tabs"

interface FilesTableProps {
  files?: FilesResponse[] | null
}

export function FilesTable({ files }: FilesTableProps) {
  const rows = files ?? []

  return (
    <Tabs defaultValue="all-files" className="w-full flex-col justify-start gap-6">
      <TabsContent value="all-files">
        <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            <TableRow>
              <TableHead>Filename</TableHead>
              <TableHead>UNC Path</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Modified</TableHead>
              <TableHead>Indexed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((share) => (
                <TableRow key={share.id}>
                  <TableCell>{share.share_path}</TableCell>
                  <TableCell>{share.username}</TableCell>
                  <TableCell>{share.status}</TableCell>
                  <TableCell>{share.last_crawled ?? "Never"}</TableCell>
                  <TableCell>{share.last_crawl_file_count ?? "N/A"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                  No files available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </TabsContent>
    </Tabs>
  )
}