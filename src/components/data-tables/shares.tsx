"use client"

import { useState } from "react"
import { IconTrash } from "@tabler/icons-react"
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

interface SharesTableProps {
  shares: SharesResponse[] | null
  onDeleteShare: (shareId: number) => Promise<void>
}

export function SharesTable({ shares, onDeleteShare }: SharesTableProps) {
  const rows = shares ?? []
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingId, setPendingId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

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

  return (
    <>
     <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-muted sticky top-0 z-10">
          <TableRow>
            <TableHead>Share Path</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Crawled</TableHead>
            <TableHead>Files</TableHead>
            <TableHead className="w-[80px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? (
            rows.map((share) => (
              <TableRow key={share.id}>
                <TableCell>{share.share_path}</TableCell>
                <TableCell>{share.username}</TableCell>
                <TableCell>{share.status}</TableCell>
                <TableCell>{share.last_crawled ? new Date(share.last_crawled).toLocaleString() : "—"}</TableCell>
                <TableCell>{share.last_crawl_file_count}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openConfirm(share.id)}
                    aria-label="Delete share"
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