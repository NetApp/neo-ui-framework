import { CheckCircle2, XCircle, Clock, Loader2, Ban } from "lucide-react"
import type { TasksResponse } from "@/services/neo-api"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface TasksTableProps {
  tasks: TasksResponse[] | null
  onTaskClick: (task: TasksResponse) => void
}

export function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
      return <CheckCircle2 className="size-4 text-green-600" />
    case "failed":
      return <XCircle className="size-4 text-red-600" />
    case "running":
      return <Loader2 className="size-4 text-blue-600 animate-spin" />
    case "pending":
      return <Clock className="size-4 text-yellow-600" />
    case "cancelled":
      return <Ban className="size-4 text-gray-600" />
    default:
      return null
  }
}

export function getStatusBadge(status: string) {
  const statusLower = status.toLowerCase()

  const colors: Record<string, string> = {
    completed: "text-green-600 border-green-200 dark:text-green-400 dark:border-green-800",
    failed: "text-destructive border-destructive/50",
    running: "text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800",
    pending: "text-yellow-600 border-yellow-200 dark:text-yellow-400 dark:border-yellow-800",
    cancelled: "text-gray-600 border-gray-200 dark:text-gray-400 dark:border-gray-800",
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

export function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt || !completedAt) return "N/A"

  const start = new Date(startedAt).getTime()
  const end = new Date(completedAt).getTime()
  const durationMs = end - start

  if (isNaN(durationMs) || durationMs < 0) return "N/A"

  if (durationMs < 1000) return `${durationMs}ms`
  if (durationMs < 60000) return `${(durationMs / 1000).toFixed(2)}s`
  if (durationMs < 3600000) return `${(durationMs / 60000).toFixed(2)}m`
  return `${(durationMs / 3600000).toFixed(2)}h`
}

export function TasksTable({ tasks, onTaskClick }: TasksTableProps) {
  const rows = tasks ?? []

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted">
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Share ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? (
            rows.map((task) => (
              <TableRow
                key={task.id}
                onClick={() => onTaskClick(task)}
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell className="font-medium">{task.name}</TableCell>
                <TableCell>{getStatusBadge(task.status)}</TableCell>
                <TableCell className="text-sm">
                  {new Date(task.created_at).toLocaleString()}
                </TableCell>
                <TableCell className="text-sm">
                  {formatDuration(task.started_at, task.completed_at)}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {task.share_id ? task.share_id.substring(0, 8) + "..." : "—"}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                No tasks available.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}