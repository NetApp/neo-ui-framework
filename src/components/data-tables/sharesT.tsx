// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle
} from "lucide-react"

import type {
  SharesResponse
} from "@/services/neo-api"

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

interface SharesTableProps {
  shares: SharesResponse[] | null
  onShareClick: (shareId: string) => void
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

export function SharesTable({ shares, onShareClick }: SharesTableProps) {
  const rows = shares ?? []

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((share) => (
                <TableRow
                  key={share.id}
                  onClick={() => onShareClick(share.id)}
                  className="cursor-pointer hover:bg-muted/50"
                  data-id={share.id}
                >
                  <TableCell>{share.share_path}</TableCell>
                  <TableCell>{share.username}</TableCell>
                  <TableCell>{getStatusBadge(share.status)}</TableCell>
                  <TableCell>
                    {share.last_crawled ? new Date(share.last_crawled).toLocaleString() : "—"}
                  </TableCell>
                  <TableCell>{share.last_crawl_file_count}</TableCell>
                </TableRow >
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  No shares available.
                </TableCell>
              </TableRow>
            )
            }
          </TableBody >
        </Table >
      </div >
    </>
  )
}