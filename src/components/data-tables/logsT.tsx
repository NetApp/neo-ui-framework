// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AppLogEntry } from "@/services/app-logger"

interface LogsTableProps {
  logs: AppLogEntry[] | null
  loading?: boolean
}

const levelVariant: Record<AppLogEntry["level"], "default" | "secondary" | "destructive" | "outline"> = {
  ERROR: "destructive",
  WARN: "secondary",
  INFO: "default",
  DEBUG: "outline",
  OPERATION: "default",
}

export function LogsTable({ logs, loading = false }: LogsTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        Loading logs…
      </div>
    )
  }

  const rows = logs ?? []

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted">
          <TableRow>
            <TableHead className="w-[200px]">Timestamp</TableHead>
            <TableHead className="w-[100px]">Level</TableHead>
            <TableHead className="min-w-[300px]">Message</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? (
            rows.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap text-sm font-mono text-xs">
                  {log.timestamp.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge variant={levelVariant[log.level]}>{log.level}</Badge>
                </TableCell>
                <TableCell className="text-sm">{log.message}</TableCell>
                <TableCell className="text-sm">
                  {log.details ? (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        View
                      </summary>
                      <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
                        {log.details}
                      </pre>
                    </details>
                  ) : log.context ? (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        View context
                      </summary>
                      <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
                        {JSON.stringify(log.context, null, 2)}
                      </pre>
                    </details>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                No logs available.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}