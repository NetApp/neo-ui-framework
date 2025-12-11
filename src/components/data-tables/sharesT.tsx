// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import {
  useState
} from "react"

import {
  IconTrash,
  IconDatabaseExport,
  IconInfoCircle,
  IconEdit,
  IconMenu2
} from "@tabler/icons-react"

import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle
} from "lucide-react"

import type {
  ShareDetailsResponse,
  SharesResponse
} from "@/services/neo-api"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  Button
} from "@/components/ui/button"

import {
  Badge
} from "@/components/ui/badge"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  Spinner
} from "@/components/ui/spinner"
import {
  Separator
} from "@/components/ui/separator"

interface SharesTableProps {
  shares: SharesResponse[] | null
  onDeleteShare: (shareId: string) => Promise<void>
  onStartCrawl: (shareId: string) => Promise<boolean>
  onFetchShareDetails: (shareId: string) => Promise<ShareDetailsResponse>
  onEditShare: (shareId: string) => void
  isAdmin: boolean
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "active":
    case "ready":
      return <CheckCircle2 className="size-4 text-green-600" />
    case "error":
    case "failed":
      return <XCircle className="size-4 text-red-600" />
    case "crawling":
    case "processing":
      return <Loader2 className="size-4 text-blue-600 animate-spin" />
    case "pending":
    case "scheduled":
      return <Clock className="size-4 text-yellow-600" />
    case "warning":
      return <AlertCircle className="size-4 text-orange-600" />
    default:
      return null
  }
}

function getStatusBadge(status: string) {
  const statusLower = status.toLowerCase()


  const colors: Record<string, string> = {
    active: "text-green-600 border-green-200 dark:text-green-400 dark:border-green-800",
    ready: "text-green-600 border-green-200 dark:text-green-400 dark:border-green-800",
    error: "text-destructive border-destructive/50",
    failed: "text-destructive border-destructive/50",
    crawling: "text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800",
    processing: "text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800",
    pending: "text-yellow-600 border-yellow-200 dark:text-yellow-400 dark:border-yellow-800",
    scheduled: "text-yellow-600 border-yellow-200 dark:text-yellow-400 dark:border-yellow-800",
    warning: "text-orange-600 border-orange-200 dark:text-orange-400 dark:border-orange-800",
  }

  return (
    <Badge
      variant="outline"
      className={`gap-1 ${colors[statusLower] || ""}`}
    >
      {getStatusIcon(status)}
      {status}
    </Badge>
  )
}

export function SharesTable({ shares, onDeleteShare, onStartCrawl, onFetchShareDetails, onEditShare, isAdmin }: SharesTableProps) {
  const rows = shares ?? []
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [crawlingId, setCrawlingId] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [detailsData, setDetailsData] = useState<ShareDetailsResponse | null>(null)

  const openConfirm = (shareId: string) => {
    setPendingId(shareId)
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    if (!pendingId) return
    setSubmitting(true)
    setDeletingId(pendingId)
    try {
      await onDeleteShare(pendingId)
      setConfirmOpen(false)
      setPendingId(null)
    } finally {
      setSubmitting(false)
      setDeletingId(null)
    }
  }

  const handleStartCrawlClick = async (shareId: string) => {
    setCrawlingId(shareId)
    try {
      await onStartCrawl(shareId)
    } finally {
      setCrawlingId(null)
    }
  }

  const handleShowDetails = async (shareId: string) => {
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

  const isShareBusy = (shareId: string) => {
    return deletingId === shareId || crawlingId === shareId
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
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((share) => (
                <TableRow
                  key={share.id}
                  onClick={() => handleShowDetails(share.id)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell>{share.share_path}</TableCell>
                  <TableCell>{share.username}</TableCell>
                  <TableCell>{getStatusBadge(share.status)}</TableCell>
                  <TableCell>
                    {share.last_crawled ? new Date(share.last_crawled).toLocaleString() : "—"}
                  </TableCell>
                  <TableCell>{share.last_crawl_file_count}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="Share actions"
                          disabled={isShareBusy(share.id)}
                        >
                          {isShareBusy(share.id) ? (
                            <Spinner className="size-4" />
                          ) : (
                            <IconMenu2 className="size-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            onSelect={() => handleStartCrawlClick(share.id)}
                            disabled={crawlingId === share.id || deletingId === share.id}
                          >
                            <IconDatabaseExport className="mr-2 size-4" />
                            {crawlingId === share.id ? "Crawling..." : "Crawl"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => handleShowDetails(share.id)}
                            disabled={deletingId === share.id}
                          >
                            <IconInfoCircle className="mr-2 size-4" />
                            Details
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onSelect={() => onEditShare(share.id)}
                            disabled={deletingId === share.id || !isAdmin}
                          >
                            <IconEdit className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => openConfirm(share.id)}
                            disabled={deletingId === share.id || crawlingId === share.id}
                            className="text-red-600 focus:text-red-600"
                          >
                            <IconTrash className="mr-2 size-4" />
                            {deletingId === share.id ? "Deleting..." : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuGroup >
                      </DropdownMenuContent >
                    </DropdownMenu >
                  </TableCell >
                </TableRow >
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                  No shares available.
                </TableCell>
              </TableRow>
            )
            }
          </TableBody >
        </Table >
      </div >

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!submitting) {
            setConfirmOpen(open)
            if (!open) {
              setPendingId(null)
            }
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete share?</DialogTitle>
            <DialogDescription className="text-destructive mb-4">
              <br />
              <p>This action cannot be undone. </p>
              <p>The selected share will be removed from NetApp Neo and the data from Microsoft GraphQL.</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
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
            <DialogDescription className="text-center mb-4">
              Detailed information about the selected share
            </DialogDescription>
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
                  <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{detailsData.share_path}</pre></dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Username</dt>
                  <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{detailsData.username}</pre></dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Status</dt>
                  <dd className="p-1 font-bold">{getStatusBadge(detailsData.status)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Created</dt>
                  <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{new Date(detailsData.created_at).toLocaleString()}</pre></dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Last crawled</dt>
                  <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">
                    {detailsData.last_crawled
                      ? new Date(detailsData.last_crawled).toLocaleString()
                      : "N/A"}
                  </pre></dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Last crawl duration (ms)</dt>
                  <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{detailsData.last_crawl_duration_ms || "N/A"}</pre></dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Last crawl file count</dt>
                  <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{detailsData.last_crawl_file_count || "N/A"}</pre></dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Crawl schedule</dt>
                  <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{detailsData.crawl_schedule || "N/A"}</pre></dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Last connection attempt</dt>
                  <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">
                    {detailsData.last_connection_attempt
                      ? new Date(detailsData.last_connection_attempt).toLocaleString()
                      : "N/A"}
                  </pre></dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Kerberos</dt>
                  <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{detailsData.use_kerberos || "N/A"}</pre></dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Workgroup</dt>
                  <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{detailsData.workgroup || "N/A"}</pre></dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Realm</dt>
                  <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{detailsData.realm || "N/A"}</pre></dd>
                </div>
                <div className="sm:col-span-4">
                  <dt className="font-medium text-foreground">Resolve order</dt>
                  <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{detailsData.resolve_order || "N/A"}</pre></dd>
                </div>
                <div className="sm:col-span-4">
                  <dt className="font-medium text-foreground">Rules</dt>
                  <dd><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{JSON.stringify(detailsData.rules || "N/A", null, 2)}</pre></dd>
                </div>
                <div className="sm:col-span-4">
                  <dt className="font-medium text-foreground">Error message</dt>
                  <dd><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{detailsData.error_message || "N/A"}</pre></dd>
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