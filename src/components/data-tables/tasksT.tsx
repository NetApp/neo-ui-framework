// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import { useState } from "react"
import { IconInfoCircle, IconTrash, IconMenu2 } from "@tabler/icons-react"
import { CheckCircle2, XCircle, Clock, Loader2, Ban } from "lucide-react"

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
import { Spinner } from "@/components/ui/spinner"
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

interface TasksTableProps {
  tasks: TasksResponse[] | null
  onDeleteTask: (taskId: string) => Promise<void>
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
    case "cancelled":
      return <Ban className="size-4 text-gray-600" />
    default:
      return null
  }
}

function getStatusBadge(status: string) {
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

function formatDuration(startedAt: string | null, completedAt: string | null): string {
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

export function TasksTable({ tasks, onDeleteTask }: TasksTableProps) {
  const rows = tasks ?? []
  const [selectedTask, setSelectedTask] = useState<TasksResponse | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const closeDialog = () => setSelectedTask(null)

  const openConfirm = (taskId: string) => {
    setPendingId(taskId)
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    if (!pendingId) return
    setSubmitting(true)
    setDeletingId(pendingId)
    try {
      await onDeleteTask(pendingId)
      setConfirmOpen(false)
      setPendingId(null)
    } finally {
      setSubmitting(false)
      setDeletingId(null)
    }
  }

  const isTaskBusy = (taskId: string) => {
    return deletingId === taskId
  }

  const canCancelTask = (status: string) => {
    const statusLower = status.toLowerCase()
    return statusLower === "pending" || statusLower === "running"
  }

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
                <TableRow
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
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
                  <TableCell className="text-right">
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="Task actions"
                          disabled={isTaskBusy(task.id)}
                        >
                          {isTaskBusy(task.id) ? (
                            <Spinner className="size-4" />
                          ) : (
                            <IconMenu2 className="size-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            onSelect={() => setSelectedTask(task)}
                            disabled={deletingId === task.id}
                          >
                            <IconInfoCircle className="mr-2 size-4" />
                            Details
                          </DropdownMenuItem>
                          {canCancelTask(task.status) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={() => openConfirm(task.id)}
                                disabled={deletingId === task.id}
                                className="text-red-600 focus:text-red-600"
                              >
                                <IconTrash className="mr-2 size-4" />
                                {deletingId === task.id ? "Cancelling..." : "Cancel"}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
            <DialogTitle>Cancel task?</DialogTitle>
            <DialogDescription className="text-destructive mb-4">
              <br />
              <p>This will attempt to cancel the running or pending task.</p>
              <p>Already completed or failed tasks cannot be cancelled.</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={submitting}
            >
              Close
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
                  Cancelling…
                </>
              ) : (
                "Cancel Task"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  <dd className="font-mono text-xs">{selectedTask.share_id ?? "N/A"}</dd>
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
                  <dt className="font-medium text-muted-foreground mb-1">
                    Cancellation Requested
                  </dt>
                  <dd>
                    <Badge
                      variant={
                        selectedTask.cancellation_requested ? "destructive" : "secondary"
                      }
                    >
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