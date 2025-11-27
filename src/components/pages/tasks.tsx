"use client"

import { useEffect, useState } from "react"
import { CheckCircle2Icon, AlertCircleIcon } from "lucide-react"

import type { TasksResponse, TaskStatisticsResponse, MonitoringOverviewResponse } from "@/services/neo-api"

import { TasksTable } from "@/components/data-tables/tasksT"
import { MonitoringOverviewCard } from "@/components/cards/monitoring-overview-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface TasksProps {
  tasks: TasksResponse[] | null
  taskStats: TaskStatisticsResponse | null
  onFetchTasks: () => Promise<void>
  onDeleteTask: (taskId: string) => Promise<void>
  monitoringOverview: MonitoringOverviewResponse | null
}

export default function Tasks({ tasks, taskStats, onFetchTasks, onDeleteTask, monitoringOverview }: TasksProps) {
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [alertVariant, setAlertVariant] = useState<"success" | "error">("success")
  const [initialLoad, setInitialLoad] = useState(true)

  const handleRefresh = async () => {
    try {
      await onFetchTasks()
      if (!initialLoad) {
        setAlertVariant("success")
        setAlertMessage("Tasks refreshed successfully!")
      }
    } catch (error) {
      setAlertVariant("error")
      setAlertMessage(error instanceof Error ? error.message : "Failed to refresh tasks")
    } finally {
      setInitialLoad(false)
    }
  }

  useEffect(() => {
    if (tasks === null && taskStats === null) {
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

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="mb-4">
              <MonitoringOverviewCard
                overview={monitoringOverview}
                title="Tasks Overview"
                description="Monitor background tasks and system operations."
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

            {taskStats && (
              <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Tasks</CardDescription>
                    <CardTitle className="text-3xl">{taskStats.total_tasks}</CardTitle>
                  </CardHeader>
                  <CardContent />
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Pending</CardDescription>
                    <CardTitle className="text-3xl text-yellow-600">
                      {taskStats.by_status.pending}
                    </CardTitle>
                  </CardHeader>
                  <CardContent />
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Running</CardDescription>
                    <CardTitle className="text-3xl text-blue-600">
                      {taskStats.by_status.running}
                    </CardTitle>
                  </CardHeader>
                  <CardContent />
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Completed</CardDescription>
                    <CardTitle className="text-3xl text-green-600">
                      {taskStats.by_status.completed}
                    </CardTitle>
                  </CardHeader>
                  <CardContent />
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Failed</CardDescription>
                    <CardTitle className="text-3xl text-red-600">
                      {taskStats.by_status.failed}
                    </CardTitle>
                  </CardHeader>
                  <CardContent />
                </Card>
              </div>
            )}

            <TasksTable tasks={tasks} onDeleteTask={onDeleteTask} />
          </div>
        </div>
      </div>
    </div>
  )
}