import { appLogger } from "@/services/app-logger"
import { BaseApiClient } from "./base"
import type { TasksListResponse, TaskStatisticsResponse } from "@/services/models"

export interface TaskCancelResponse {
  status: string
  task_id: string
  message: string
  graceful: boolean
}

export class TasksApiClient extends BaseApiClient {
  async getTasks(token: string) {
    appLogger.debug("Fetching tasks")
    const response = await this.requestWithToken<TasksListResponse>("/tasks", token)
    // Return just the tasks array for backwards compatibility
    return response.tasks
  }

  getTaskStatistics(token: string) {
    appLogger.debug("Fetching task statistics")
    return this.requestWithToken<TaskStatisticsResponse>("/tasks/statistics/summary", token)
  }

  deleteTask(token: string, taskId: string) {
    appLogger.debug("Sending DELETE request to cancel task", undefined, { taskId })

    return this.requestWithToken<TaskCancelResponse>(
      `/tasks/${taskId}`,
      token,
      { method: "DELETE" }
    )
  }
}