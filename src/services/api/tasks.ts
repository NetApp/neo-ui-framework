import { appLogger } from "@/services/app-logger"
import { BaseApiClient } from "./base"
import type { TasksResponse, TaskStatisticsResponse } from "@/services/models"

export class TasksApiClient extends BaseApiClient {
  getTasks(token: string) {
    appLogger.debug("Fetching tasks")
    return this.requestWithToken<TasksResponse[]>("/tasks", token)
  }

  getTaskStatistics(token: string) {
    appLogger.debug("Fetching task statistics")
    return this.requestWithToken<TaskStatisticsResponse>("/tasks/statistics/summary", token)
  }
}