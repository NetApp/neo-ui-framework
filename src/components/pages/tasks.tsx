// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { CheckCircle2Icon, AlertCircleIcon } from "lucide-react"

import type { TasksResponse, TaskStatisticsResponse, MonitoringOverviewResponse, AclCacheStatisticsResponse } from "@/services/neo-api"
import { AuthenticationError } from "@/services/neo-api"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import {
  IconTrash
} from "@tabler/icons-react"

import { TasksTable, getStatusBadge, formatDuration } from "@/components/data-tables/tasksT"
import { OverviewCard } from "@/components/cards/overview-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface TasksProps {
  tasks: TasksResponse[] | null
  taskStats: TaskStatisticsResponse | null
  aclCacheStats: AclCacheStatisticsResponse | null
  onFetchTasks: (options?: {
    force?: boolean
    status?: string | null
    taskType?: string | null
    limit?: number
  }) => Promise<{
    count: number
    hasMore: boolean
    requestedLimit: number
  }>
  onGetTaskDetailed: (taskId: string) => Promise<TasksResponse>
  onDeleteTask: (taskId: string) => Promise<void>
  monitoringOverview: MonitoringOverviewResponse | null
}

export default function Tasks({
  tasks,
  onFetchTasks,
  onGetTaskDetailed,
  onDeleteTask,
  monitoringOverview,
}: TasksProps) {
  const { t } = useTranslation()
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [alertVariant, setAlertVariant] = useState<"success" | "error">("success")
  const [initialLoad, setInitialLoad] = useState(true)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [loadingTaskDetails, setLoadingTaskDetails] = useState(false)

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<TasksResponse | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [taskToCancel, setTaskToCancel] = useState<TasksResponse | null>(null)

  const [statusFilter, setStatusFilter] = useState("all")
  const [taskTypeInput, setTaskTypeInput] = useState("")
  const [appliedStatusFilter, setAppliedStatusFilter] = useState("all")
  const [appliedTaskType, setAppliedTaskType] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState(100)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [hasMorePages, setHasMorePages] = useState(false)

  const rows = tasks ?? []
  const startIndex = (currentPage - 1) * pageSize
  const pageRows = rows.slice(startIndex, startIndex + pageSize)
  const totalPages = Math.max(1, Math.ceil(Math.max(totalItems, 1) / pageSize))

  const fetchPage = async (
    page: number,
    options?: {
      force?: boolean
      status?: string
      taskType?: string | null
      pageSizeOverride?: number
    }
  ) => {
    const effectiveStatus = options?.status ?? appliedStatusFilter
    const effectiveTaskType = options?.taskType ?? appliedTaskType
    const effectivePageSize = options?.pageSizeOverride ?? pageSize
    const requestedLimit = page * effectivePageSize
    setLoadingTasks(true)
    try {
      const meta = await onFetchTasks({
        force: options?.force,
        status: effectiveStatus === "all" ? null : effectiveStatus,
        taskType: effectiveTaskType,
        limit: requestedLimit,
      })

      const inferredTotal = meta.hasMore
        ? Math.max(meta.count, requestedLimit + 1)
        : Math.max(meta.count, requestedLimit)

      setTotalItems(inferredTotal)
      setHasMorePages(meta.hasMore)
    } finally {
      setLoadingTasks(false)
    }
  }

  const handleRefresh = async (force?: boolean) => {
    try {
      await fetchPage(currentPage, {
        force,
        status: appliedStatusFilter,
        taskType: appliedTaskType,
      })
      if (!initialLoad) {
        setAlertVariant("success")
        setAlertMessage(t("refreshedSuccessfully", { ns: "tasks" }))
      }
    } catch (error) {
      // Suppress alert for authentication errors
      if (error instanceof AuthenticationError) return

      setAlertVariant("error")
      setAlertMessage(error instanceof Error ? error.message : t("failedToRefresh", { ns: "tasks" }))
    } finally {
      setInitialLoad(false)
    }
  }

  useEffect(() => {
    // Always force-refresh tasks on page mount so pagination metadata is accurate.
    void handleRefresh(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!alertMessage) return

    const timer = window.setTimeout(() => {
      setAlertMessage(null)
    }, 5_000)

    return () => window.clearTimeout(timer)
  }, [alertMessage])

  const handleTaskClick = async (task: TasksResponse) => {
    setSelectedTaskId(task.id)
    setSelectedTask(task)
    setLoadingTaskDetails(true)

    try {
      const detailedTask = await onGetTaskDetailed(task.id)
      setSelectedTask((prev) => (prev?.id === task.id ? detailedTask : prev))
    } catch (error) {
      setAlertVariant("error")
      setAlertMessage(error instanceof Error ? error.message : t("detailsLoadFailed", { ns: "tasks" }))
    } finally {
      setLoadingTaskDetails(false)
    }
  }

  const handleCancelClick = (task: TasksResponse) => {
    setTaskToCancel(task)
    setIsConfirmOpen(true)
  }

  const handleConfirmCancel = async () => {
    if (taskToCancel) {
      try {
        await onDeleteTask(taskToCancel.id)
        setAlertVariant("success")
        setAlertMessage(t("cancellationRequested", { ns: "tasks" }))
        setIsConfirmOpen(false)
        setTaskToCancel(null)
        setSelectedTaskId(null)
        setSelectedTask(null)
        setCurrentPage(1)
        await fetchPage(1, { force: true })
      } catch (error) {
        setAlertVariant("error")
        setAlertMessage(error instanceof Error ? error.message : t("failedToCancel", { ns: "tasks" }))
      }
    }
  }

  const canCancelTask = (status: string) => {
    const statusLower = status.toLowerCase()
    return statusLower === "pending" || statusLower === "running"
  }

  const handleApplyFilters = async () => {
    const normalizedTaskType = taskTypeInput.trim() || null
    const normalizedStatus = statusFilter
    setAppliedStatusFilter(normalizedStatus)
    setAppliedTaskType(normalizedTaskType)
    setCurrentPage(1)
    await fetchPage(1, {
      force: true,
      status: normalizedStatus,
      taskType: normalizedTaskType,
      pageSizeOverride: pageSize,
    })
  }

  const handleClearFilters = async () => {
    setStatusFilter("all")
    setTaskTypeInput("")
    setAppliedStatusFilter("all")
    setAppliedTaskType(null)
    setCurrentPage(1)
    setPageSize(100)
    await fetchPage(1, {
      force: true,
      status: "all",
      taskType: null,
      pageSizeOverride: 100,
    })
  }

  const handlePageSizeChange = async (nextPageSize: number) => {
    setPageSize(nextPageSize)
    setCurrentPage(1)
    await fetchPage(1, {
      force: true,
      status: appliedStatusFilter,
      taskType: appliedTaskType,
      pageSizeOverride: nextPageSize,
    })
  }

  const handlePageChange = async (nextPage: number) => {
    if (nextPage < 1 || nextPage === currentPage) return
    setCurrentPage(nextPage)
    await fetchPage(nextPage)
  }

  const canGoNext = currentPage < totalPages || hasMorePages

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="mb-4">
              <OverviewCard
                overview={monitoringOverview}
                title={t("pageTitle", { ns: "tasks" })}
                showCacheStats={false}
              />
            </div>
            <div className="mb-4 flex justify-between items-center">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 w-full">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t("filterStatusLabel", { ns: "tasks" })}</p>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("filterStatusAll", { ns: "tasks" })}</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="running">Running</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t("filterTaskTypeLabel", { ns: "tasks" })}</p>
                  <Input
                    value={taskTypeInput}
                    onChange={(event) => setTaskTypeInput(event.target.value)}
                    placeholder={t("filterTaskTypePlaceholder", { ns: "tasks" })}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t("limitLabel", { ns: "tasks" })}</p>
                  <Select value={String(pageSize)} onValueChange={(value) => void handlePageSizeChange(Number(value))}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="200">200</SelectItem>
                      <SelectItem value="500">500</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={handleApplyFilters} disabled={loadingTasks}>{t("applyFilters", { ns: "tasks" })}</Button>
                  <Button variant="outline" onClick={handleClearFilters} disabled={loadingTasks}>{t("clearFilters", { ns: "tasks" })}</Button>
                </div>
              </div>
            </div>

            {alertMessage ? (
              <Alert
                variant={alertVariant === "success" ? "default" : "destructive"}
                className="mb-4"
              >
                {alertVariant === "success" ? <CheckCircle2Icon /> : <AlertCircleIcon />}
                <AlertTitle>{alertMessage}</AlertTitle>
                <AlertDescription />
              </Alert>
            ) : null}

            <TasksTable
              tasks={pageRows}
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={Math.max(totalItems, rows.length)}
              totalPages={Math.max(totalPages, currentPage)}
              hasNextPage={canGoNext}
              isLoading={loadingTasks}
              onPageChange={handlePageChange}
              onTaskClick={handleTaskClick}
            />
          </div>
        </div>
      </div>

      <Sheet
        open={!!selectedTaskId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTaskId(null)
            setSelectedTask(null)
          }
        }}
      >
        <SheetContent side="top" hideCloseButton className="max-h-[95vh] flex flex-col p-0 gap-0">
          <div className="flex-1 overflow-y-auto p-6 flex flex-col">
            <SheetHeader className="mb-4 p-0">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <SheetTitle>{t("detailsTitle", { ns: "tasks" })}</SheetTitle>
                  <SheetDescription>
                    {t("detailsDescription", { ns: "tasks" })}
                  </SheetDescription>
                </div>
                {selectedTask && (
                  <div className="flex gap-2">
                    <Button
                      variant={canCancelTask(selectedTask.status) ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => handleCancelClick(selectedTask)}
                      disabled={!canCancelTask(selectedTask.status)}
                    >
                      <IconTrash className="mr-2 size-4" />
                      {t("cancelTask", { ns: "tasks" })}
                    </Button>
                    <SheetClose asChild>
                      <Button variant="outline" size="sm">{t("closeButton", { ns: "tasks" })}</Button>
                    </SheetClose>
                  </div>
                )}
              </div>
            </SheetHeader>

            {selectedTask ? (
              <div className="space-y-6">
                {loadingTaskDetails ? (
                  <Alert className="mb-2">
                    <AlertCircleIcon />
                    <AlertTitle>{t("loadingTaskDetails", { ns: "tasks" })}</AlertTitle>
                    <AlertDescription />
                  </Alert>
                ) : null}
                <dl className="grid grid-cols-1 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-6">
                  <div>
                    <dt className="font-medium text-muted-foreground mb-1">{t("taskId", { ns: "tasks" })}</dt>
                    <dd className="font-mono text-xs break-all bg-muted p-2 rounded">{selectedTask.id}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground mb-1">{t("nameLabel", { ns: "tasks" })}</dt>
                    <dd className="font-medium p-2">{selectedTask.name}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground mb-1">{t("statusLabel", { ns: "tasks" })}</dt>
                    <dd className="p-2">{getStatusBadge(selectedTask.status)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground mb-1">{t("shareId", { ns: "tasks" })}</dt>
                    <dd className="font-mono text-xs bg-muted p-2 rounded">{selectedTask.share_id ?? "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground mb-1">{t("createdLabel", { ns: "tasks" })}</dt>
                    <dd className="p-2">{new Date(selectedTask.created_at).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground mb-1">{t("startedLabel", { ns: "tasks" })}</dt>
                    <dd className="p-2">
                      {selectedTask.started_at
                        ? new Date(selectedTask.started_at).toLocaleString()
                        : "N/A"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground mb-1">{t("completedLabel", { ns: "tasks" })}</dt>
                    <dd className="p-2">
                      {selectedTask.completed_at
                        ? new Date(selectedTask.completed_at).toLocaleString()
                        : "N/A"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground mb-1">{t("durationLabel", { ns: "tasks" })}</dt>
                    <dd className="font-semibold p-2">
                      {formatDuration(selectedTask.started_at, selectedTask.completed_at)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground mb-1">{t("progressLabel", { ns: "tasks" })}</dt>
                    <dd className="p-2">{selectedTask.progress ?? "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground mb-1">
                      {t("cancellationRequestedLabel", { ns: "tasks" })}
                    </dt>
                    <dd className="p-2">
                      <Badge
                        variant={
                          selectedTask.cancellation_requested ? "destructive" : "secondary"
                        }
                      >
                        {selectedTask.cancellation_requested ? t("yesLabel", { ns: "tasks" }) : t("noLabel", { ns: "tasks" })}
                      </Badge>
                    </dd>
                  </div>
                </dl>

                <Separator />

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">{t("resultLabel", { ns: "tasks" })}</h3>
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <pre className="overflow-auto text-xs whitespace-pre-wrap">
                      {JSON.stringify(selectedTask.result, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">{t("metadataLabel", { ns: "tasks" })}</h3>
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <pre className="overflow-auto text-xs whitespace-pre-wrap">
                      {JSON.stringify(selectedTask.metadata, null, 2)}
                    </pre>
                  </div>
                </div>

                {selectedTask.error && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-destructive text-sm">{t("errorLabel", { ns: "tasks" })}</h3>
                    <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
                      <p className="text-sm text-destructive whitespace-pre-wrap">{selectedTask.error}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={t("cancelTaskTitle", { ns: "tasks" })}
        description={t("cancelTaskDescription", { ns: "tasks" })}
        onConfirm={handleConfirmCancel}
        confirmText={t("cancelTask", { ns: "tasks" })}
        variant="destructive"
      />
    </div>
  )
}