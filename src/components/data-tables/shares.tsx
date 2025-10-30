"use client"

import { useState } from "react"
import { IconTrash, IconDatabaseExport } from "@tabler/icons-react"
import type { SharesResponse } from "../services/neo-api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Button } from "../ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"
import { Spinner } from "../ui/spinner"

interface SharesTableProps {
  shares: SharesResponse[] | null
  onDeleteShare: (shareId: number) => Promise<void>
  onStartCrawl: (shareId: number) => Promise<boolean>
}

export function SharesTable({ shares, onDeleteShare, onStartCrawl }: SharesTableProps) {
  const rows = shares ?? []
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingId, setPendingId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [crawlingId, setCrawlingId] = useState<number | null>(null)

  const openConfirm = (shareId: number) => {
    setPendingId(shareId)
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    if (pendingId == null) return
    setSubmitting(true)
    try {
      await onDeleteShare(pendingId)
      setConfirmOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleStartCrawlClick = async (shareId: number) => {
    setCrawlingId(shareId)
    try {
      await onStartCrawl(shareId)
    } finally {
      setCrawlingId(null)
    }
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow>
              <TableHead>Share Path</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Crawled</TableHead>
              <TableHead>Files</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((share) => (
                <TableRow key={share.id}>
                  <TableCell>{share.share_path}</TableCell>
                  <TableCell>{share.username}</TableCell>
                  <TableCell>{share.status}</TableCell>
                  <TableCell>
                    {share.last_crawled ? new Date(share.last_crawled).toLocaleString() : "—"}
                  </TableCell>
                  <TableCell>{share.last_crawl_file_count}</TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleStartCrawlClick(share.id)}
                      disabled={crawlingId === share.id}
                      aria-label="Start crawl"
                      aria-busy={crawlingId === share.id}
                    >
                      {crawlingId === share.id ? (
                        <Spinner className="size-4" />
                      ) : (
                        <IconDatabaseExport className="size-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openConfirm(share.id)}
                      aria-label="Delete share"
                      disabled={submitting && pendingId === share.id}
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  </TableCell>
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

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete share?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The selected share will be removed from NetApp Neo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm} disabled={submitting}>
              {submitting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}