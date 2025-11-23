import { appLogger } from "@/services/app-logger"
import { BaseApiClient } from "./base"
import type { TasksListResponse, TaskStatisticsResponse } from "@/services/models"

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
}