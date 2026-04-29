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
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  onFetchTasks: () => Promise<void>
  onDeleteTask: (taskId: string) => Promise<void>
  monitoringOverview: MonitoringOverviewResponse | null
}

export default function Tasks({ tasks, taskStats, aclCacheStats, onFetchTasks, onDeleteTask, monitoringOverview }: TasksProps) {
  const { t } = useTranslation()
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [alertVariant, setAlertVariant] = useState<"success" | "error">("success")
  const [initialLoad, setInitialLoad] = useState(true)

  const [selectedTask, setSelectedTask] = useState<TasksResponse | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [taskToCancel, setTaskToCancel] = useState<TasksResponse | null>(null)

  const handleRefresh = async () => {
    try {
      await onFetchTasks()
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
    if (tasks === null && taskStats === null && aclCacheStats === null) {
      handleRefresh()
    } else {
      setInitialLoad(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!alertMessage) return

    const timer = window.setTimeout(() => {
      setAlertMessage(null)
    }, 5_000)

    return () => window.clearTimeout(timer)
  }, [alertMessage])

  const handleTaskClick = (task: TasksResponse) => {
    setSelectedTask(task)
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
        setSelectedTask(null)
        handleRefresh()
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


            <TasksTable tasks={tasks} onTaskClick={handleTaskClick} />
          </div>
        </div>
      </div>

      <Sheet open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <SheetContent className="w-[90vw] sm:w-[85vw] sm:max-w-[85vw] flex flex-col p-0 gap-0">
          <div className="flex-1 overflow-y-auto p-6 flex flex-col">
            <SheetHeader className="mb-4 p-0">
              <SheetTitle>{t("detailsTitle", { ns: "tasks" })}</SheetTitle>
              <SheetDescription>
                {t("detailsDescription", { ns: "tasks" })}
              </SheetDescription>
            </SheetHeader>

            {selectedTask ? (
              <div className="space-y-6">
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
          <SheetFooter className="p-4 border-t gap-2 sm:gap-0">
            {selectedTask && canCancelTask(selectedTask.status) && (
              <Button
                variant="destructive"
                onClick={() => handleCancelClick(selectedTask)}
                className="mr-auto"
              >
                <IconTrash className="mr-2 size-4" />
                {t("cancelTask", { ns: "tasks" })}
              </Button>
            )}
            <SheetClose asChild>
              <Button variant="outline">{t("closeButton", { ns: "tasks" })}</Button>
            </SheetClose>
          </SheetFooter>
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