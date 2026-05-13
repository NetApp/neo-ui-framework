// Copyright 2025 NetApp, Inc. All Rights Reserved.
import { appLogger } from "@/services/app-logger"
import { BaseApiClient } from "./base"
import type {
  TasksResponse,
  TasksListResponse,
  TaskStatisticsResponse,
  AclCacheStatisticsResponse,
  TaskQueryParams,
} from "@/services/models"

export interface TaskCancelResponse {
  id?: string
  cancelled?: boolean
  status?: string
  task_id?: string
  message?: string
  graceful?: boolean
}

export class TasksApiClient extends BaseApiClient {
  async getTasks(token: string, query?: TaskQueryParams): Promise<TasksListResponse> {
    appLogger.debug("Fetching tasks")

    const params = new URLSearchParams()
    if (query?.status) {
      params.set("status", query.status)
    }
    if (query?.task_type) {
      params.set("task_type", query.task_type)
    }
    if (typeof query?.limit === "number") {
      params.set("limit", String(query.limit))
    }

    const endpoint = params.size > 0 ? `/tasks?${params.toString()}` : "/tasks"
    return this.requestApiV1WithToken<TasksListResponse>(endpoint, token)
  }

  getTask(token: string, taskId: string) {
    appLogger.debug("Fetching task by id", undefined, { taskId })
    return this.requestApiV1WithToken<TasksResponse>(`/tasks/${taskId}`, token)
  }

  getTaskDetailed(token: string, taskId: string) {
    appLogger.debug("Fetching detailed task by id", undefined, { taskId })
    return this.requestApiV1WithToken<TasksResponse>(`/tasks/${taskId}/detailed`, token)
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