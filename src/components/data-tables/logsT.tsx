// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import { useMemo, useState } from "react"

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

const MAX_LOG_DETAIL_CHARS = 20_000

function truncateLogContent(value: string) {
  const hiddenChars = value.length - MAX_LOG_DETAIL_CHARS

  if (value.length <= MAX_LOG_DETAIL_CHARS) {
    return {
      content: value,
      truncated: false,
      hiddenChars: 0,
    }
  }

  return {
    content: `${value.slice(0, MAX_LOG_DETAIL_CHARS)}\n\n[truncated: ${hiddenChars.toLocaleString()} additional characters omitted]`,
    truncated: true,
    hiddenChars,
  }
}

function LogDetailsContent({ label, value }: { label: string; value: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const displayValue = useMemo(() => {
    if (!isOpen) return null
    return truncateLogContent(value)
  }, [isOpen, value])

  return (
    <details className="text-xs" onToggle={(event) => setIsOpen(event.currentTarget.open)}>
      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
        {label}
      </summary>
      {isOpen && displayValue ? (
        <>
          {displayValue.truncated ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Display capped at {MAX_LOG_DETAIL_CHARS.toLocaleString()} characters. {displayValue.hiddenChars.toLocaleString()} additional characters omitted.
            </p>
          ) : null}
          <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
            {displayValue.content}
          </pre>
        </>
      ) : null}
    </details>
  )
}

function LogContextDetails({ context }: { context: Record<string, unknown> }) {
  const [isOpen, setIsOpen] = useState(false)
  const serializedContext = useMemo(() => {
    if (!isOpen) return null

    try {
      return truncateLogContent(JSON.stringify(context, null, 2))
    } catch {
      return truncateLogContent("[unserializable log context]")
    }
  }, [context, isOpen])

  return (
    <details className="text-xs" onToggle={(event) => setIsOpen(event.currentTarget.open)}>
      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
        View context
      </summary>
      {isOpen && serializedContext ? (
        <>
          {serializedContext.truncated ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Display capped at {MAX_LOG_DETAIL_CHARS.toLocaleString()} characters. {serializedContext.hiddenChars.toLocaleString()} additional characters omitted.
            </p>
          ) : null}
          <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
            {serializedContext.content}
          </pre>
        </>
      ) : null}
    </details>
  )
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
                    <LogDetailsContent label="View" value={log.details} />
                  ) : log.context ? (
                    <LogContextDetails context={log.context} />
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