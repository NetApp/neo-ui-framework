"use client"

import type { SharesResponse } from "@/components/services/neo-api"
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

interface SharesTableProps {
  shares?: SharesResponse[] | null
}

export function SharesTable({ shares }: SharesTableProps) {
  const rows = shares ?? []

  return (
    <Tabs defaultValue="all-shares" className="w-full flex-col justify-start gap-6">
      <TabsContent value="all-shares">
        <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            <TableRow>
              <TableHead>Share Path</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Crawled</TableHead>
              <TableHead>File Count</TableHead>
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
                  No shares available.
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