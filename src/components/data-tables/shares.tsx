"use client"

import { useState } from "react"
import { IconTrash, IconDatabaseExport, IconInfoCircle } from "@tabler/icons-react"
import type { ShareDetailsResponse, SharesResponse } from "../services/neo-api"
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
import { Separator } from "@radix-ui/react-separator"

interface SharesTableProps {
  shares: SharesResponse[] | null
  onDeleteShare: (shareId: number) => Promise<void>
  onStartCrawl: (shareId: number) => Promise<boolean>
  onFetchShareDetails: (shareId: number) => Promise<ShareDetailsResponse>
}

export function SharesTable({ shares, onDeleteShare, onStartCrawl, onFetchShareDetails }: SharesTableProps) {
  const rows = shares ?? []
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingId, setPendingId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [crawlingId, setCrawlingId] = useState<number | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [detailsData, setDetailsData] = useState<ShareDetailsResponse | null>(null)

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

  const handleShowDetails = async (shareId: number) => {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setDetailsError(null)
    setDetailsData(null)
    try {
      const data = await onFetchShareDetails(shareId)
      setDetailsData(data)
    } catch (error) {
      setDetailsError(error instanceof Error ? error.message : "Unable to load share details.")
    } finally {
      setDetailsLoading(false)
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
              <TableHead className="w-[160px] text-right">Actions</TableHead>
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
                      onClick={() => handleShowDetails(share.id)}
                      aria-label="Share details"
                    >
                      <IconInfoCircle className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-red-700"
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

      <Dialog
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open)
          if (!open) {
            setDetailsData(null)
            setDetailsError(null)
            setDetailsLoading(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-[90vw] lg:max-w-[vw] overflow-x-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">Share details</DialogTitle>
          </DialogHeader>
          <Separator className="" />

          <div className="space-y-4">
            {detailsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Spinner className="size-6" />
              </div>
            ) : detailsError ? (
              <p className="text-sm text-destructive">{detailsError}</p>
            ) : detailsData ? (
              <dl className="grid grid-cols-1 gap-y-3 text-sm text-muted-foreground sm:grid-cols-4 sm:gap-x-6">
                <div>
                  <dt className="font-medium text-foreground">Share path</dt>
                  <dd className="p-1">{detailsData.share_path}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Username</dt>
                  <dd className="p-1">{detailsData.username}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Status</dt>
                  <dd className="p-1 font-bold">{detailsData.status}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Created</dt>
                  <dd className="p-1">{new Date(detailsData.created_at).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Last crawled</dt>
                  <dd className="p-1">
                    {detailsData.last_crawled
                      ? new Date(detailsData.last_crawled).toLocaleString()
                      : "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Last crawl duration (ms)</dt>
                  <dd className="p-1">{detailsData.last_crawl_duration_ms || "N/A"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Last crawl file count</dt>
                  <dd className="p-1">{detailsData.last_crawl_file_count || "N/A"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Crawl schedule</dt>
                  <dd className="p-1">{detailsData.crawl_schedule || "N/A"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Last connection attempt</dt>
                  <dd className="p-1">
                    {detailsData.last_connection_attempt
                      ? new Date(detailsData.last_connection_attempt).toLocaleString()
                      : "N/A"}
                  </dd>                  
                </div>
                <div>
                  <dt className="font-medium text-foreground">Kerberos</dt>
                  <dd className="p-1">{detailsData.use_kerberos || "N/A"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Workgroup</dt>
                  <dd className="p-1">{detailsData.workgroup || "N/A"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Realm</dt>
                  <dd className="p-1">{detailsData.realm || "N/A"}</dd>
                </div>
                <div className="sm:col-span-4">
                  <dt className="font-medium text-foreground">Resolve order</dt>
                  <dd className="p-1">{detailsData.resolve_order || "N/A"}</dd>
                </div>
                <div className="sm:col-span-4">
                  <dt className="font-medium text-foreground">Rules</dt>
                  <dd><pre className="mt-1 max-h-40 overflow-auto p-2">{JSON.stringify(detailsData.rules || "N/A", null, 2)}</pre></dd>
                </div>
                <div className="sm:col-span-4">
                  <dt className="font-medium text-foreground">Error message</dt>
                  <dd><pre className="mt-1 max-h-80 overflow-auto p-2">{detailsData.error_message || "N/A"}</pre></dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">No details available.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}