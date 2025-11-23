"use client"

import { useState } from "react"
import { IconInfoCircle } from "@tabler/icons-react"
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react"

import type { TasksResponse } from "@/services/neo-api"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
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
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
      return <CheckCircle2 className="size-4 text-green-600" />
    case "failed":
      return <XCircle className="size-4 text-red-600" />
    case "running":
      return <Loader2 className="size-4 text-blue-600 animate-spin" />
    case "pending":
      return <Clock className="size-4 text-yellow-600" />
    default:
      return null
  }
}

function getStatusBadge(status: string) {
  const statusLower = status.toLowerCase()

  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    completed: "default",
    failed: "destructive",
    running: "secondary",
    pending: "outline",
  }

  const colors: Record<string, string> = {
    completed: "bg-green-500 hover:bg-green-600 text-white",
    failed: "bg-red-500 hover:bg-red-600 text-white",
    running: "bg-blue-500 hover:bg-blue-600 text-white",
    pending: "bg-yellow-500 hover:bg-yellow-600 text-white",
  }

  return (
    <Badge
      variant={variants[statusLower] || "outline"}
      className={`gap-1 ${colors[statusLower] || ""}`}
    >
      {getStatusIcon(status)}
      {status}
    </Badge>
  )
}

function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt || !completedAt) return "N/A"

  const start = new Date(startedAt).getTime()
  const end = new Date(completedAt).getTime()
  const durationMs = end - start

  if (durationMs < 1000) return `${durationMs}ms`
  if (durationMs < 60000) return `${(durationMs / 1000).toFixed(2)}s`
  if (durationMs < 3600000) return `${(durationMs / 60000).toFixed(2)}m`
  return `${(durationMs / 3600000).toFixed(2)}h`
}

export function TasksTable({ tasks }: TasksTableProps) {
  const rows = tasks ?? []
  const [selectedTask, setSelectedTask] = useState<TasksResponse | null>(null)

  const closeDialog = () => setSelectedTask(null)

  return (
    <>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Share ID</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((task) => (
                <TableRow key={task.id}>
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
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Task details"
                      onClick={() => setSelectedTask(task)}
                    >
                      <IconInfoCircle className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                  No tasks available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={selectedTask !== null} onOpenChange={(open) => (open ? null : closeDialog())}>
        <DialogContent className="sm:max-w-[90vw] lg:max-w-[70vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">Task Details</DialogTitle>
            <DialogDescription className="text-center mb-4">
              Full information about the selected task
            </DialogDescription>
          </DialogHeader>
          <Separator />
          {selectedTask ? (
            <div className="space-y-6 mt-4">
              <dl className="grid grid-cols-1 gap-y-4 text-sm sm:grid-cols-2 sm:gap-x-6">
                <div className="rounded-lg border p-3">
                  <dt className="font-medium text-muted-foreground mb-1">Task ID</dt>
                  <dd className="font-mono text-xs break-all">{selectedTask.id}</dd>
                </div>
                <div className="rounded-lg border p-3">
                  <dt className="font-medium text-muted-foreground mb-1">Name</dt>
                  <dd className="font-medium">{selectedTask.name}</dd>
                </div>
                <div className="rounded-lg border p-3">
                  <dt className="font-medium text-muted-foreground mb-1">Status</dt>
                  <dd>{getStatusBadge(selectedTask.status)}</dd>
                </div>
                <div className="rounded-lg border p-3">
                  <dt className="font-medium text-muted-foreground mb-1">Share ID</dt>
                  <dd className="font-mono text-xs">
                    {selectedTask.share_id ?? "N/A"}
                  </dd>
                </div>
                <div className="rounded-lg border p-3">
                  <dt className="font-medium text-muted-foreground mb-1">Created</dt>
                  <dd>{new Date(selectedTask.created_at).toLocaleString()}</dd>
                </div>
                <div className="rounded-lg border p-3">
                  <dt className="font-medium text-muted-foreground mb-1">Started</dt>
                  <dd>
                    {selectedTask.started_at
                      ? new Date(selectedTask.started_at).toLocaleString()
                      : "N/A"}
                  </dd>
                </div>
                <div className="rounded-lg border p-3">
                  <dt className="font-medium text-muted-foreground mb-1">Completed</dt>
                  <dd>
                    {selectedTask.completed_at
                      ? new Date(selectedTask.completed_at).toLocaleString()
                      : "N/A"}
                  </dd>
                </div>
                <div className="rounded-lg border p-3">
                  <dt className="font-medium text-muted-foreground mb-1">Duration</dt>
                  <dd className="font-semibold">
                    {formatDuration(selectedTask.started_at, selectedTask.completed_at)}
                  </dd>
                </div>
                <div className="rounded-lg border p-3">
                  <dt className="font-medium text-muted-foreground mb-1">Progress</dt>
                  <dd>{selectedTask.progress ?? "N/A"}</dd>
                </div>
                <div className="rounded-lg border p-3">
                  <dt className="font-medium text-muted-foreground mb-1">Cancellation Requested</dt>
                  <dd>
                    <Badge variant={selectedTask.cancellation_requested ? "destructive" : "secondary"}>
                      {selectedTask.cancellation_requested ? "Yes" : "No"}
                    </Badge>
                  </dd>
                </div>
              </dl>

              <Separator />

              <div className="space-y-3">
                <h3 className="font-semibold">Result</h3>
                <div className="rounded-lg border bg-muted">
                  <pre className="p-4 overflow-auto text-xs">
                    {JSON.stringify(selectedTask.result, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Metadata</h3>
                <div className="rounded-lg border bg-muted">
                  <pre className="p-4 overflow-auto text-xs">
                    {JSON.stringify(selectedTask.metadata, null, 2)}
                  </pre>
                </div>
              </div>

              {selectedTask.error && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-destructive">Error</h3>
                  <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
                    <p className="text-sm text-destructive">{selectedTask.error}</p>
                  </div>
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}