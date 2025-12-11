"use client"

import { useEffect, useState } from "react"
import { CheckCircle2Icon, AlertCircleIcon } from "lucide-react"

import type { TasksResponse, TaskStatisticsResponse, MonitoringOverviewResponse, AclCacheStatisticsResponse } from "@/services/neo-api"
import { AuthenticationError } from "@/services/neo-api"

import { TasksTable } from "@/components/data-tables/tasksT"
import { OverviewCard } from "@/components/cards/overview-card"
import { TasksSummaryCard } from "@/components/cards/tasks-summary-card"
import { AclCacheCard } from "@/components/cards/acl-cache-card"
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
      // Suppress alert for authentication errors
      if (error instanceof AuthenticationError) return

      setAlertVariant("error")
      setAlertMessage(error instanceof Error ? error.message : "Failed to refresh tasks")
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

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="mb-4">
              <OverviewCard
                overview={monitoringOverview}
                title="Tasks Overview"
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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 mb-6">
              <TasksSummaryCard stats={taskStats} />
              <AclCacheCard stats={aclCacheStats} />
            </div>

            <TasksTable tasks={tasks} onDeleteTask={onDeleteTask} />
          </div>
        </div>
      </div>
    </div>
  )
}