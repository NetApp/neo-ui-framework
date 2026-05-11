// Copyright 2025 NetApp, Inc. All Rights Reserved.
import { appLogger } from "@/services/app-logger"
import { BaseApiClient } from "./base"
import type { TasksListResponse, TaskStatisticsResponse, AclCacheStatisticsResponse } from "@/services/models"

export interface TaskCancelResponse {
  id?: string
  cancelled?: boolean
  status?: string
  task_id?: string
  message?: string
  graceful?: boolean
}

export class TasksApiClient extends BaseApiClient {
  async getTasks(token: string) {
    appLogger.debug("Fetching tasks")
    const response = await this.requestApiV1WithToken<TasksListResponse>("/tasks", token)
    // Return just the tasks array for backwards compatibility
    return response.tasks
  }

  getTaskStatistics(token: string) {
    appLogger.debug("Fetching task statistics")
    return this.requestApiV1WithToken<TaskStatisticsResponse>("/tasks/statistics/summary", token)
  }

  getAclCacheStatistics(token: string) {
    appLogger.debug("Fetching ACL cache statistics")
    return this.requestApiV1WithToken<AclCacheStatisticsResponse>("/tasks/statistics/acl-cache", token)
  }

  deleteTask(token: string, taskId: string) {
    appLogger.debug("Sending DELETE request to cancel task", undefined, { taskId })

    return this.requestWithToken<TaskCancelResponse>(
      this.buildApiV1Path(`/tasks/${taskId}`),
      token,
      { method: "DELETE" }
    )
  }
}