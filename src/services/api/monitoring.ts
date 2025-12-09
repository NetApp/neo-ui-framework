import { appLogger } from "@/services/app-logger"
import { BaseApiClient } from "./base"
import type {
  MonitoringOverviewResponse,
  MonitoringWorkersResponse,
  MonitoringEnumerationResponse,
  MonitoringGraphRateLimitResponse,
  MonitoringFailedItemsResponse,
} from "@/services/models"

export class MonitoringApiClient extends BaseApiClient {
  getMonitoringOverview(token: string) {
    appLogger.debug("Fetching monitoring overview")
    return this.requestWithToken<MonitoringOverviewResponse>("/monitoring/overview", token)
  }

  getMonitoringWorkers(token: string) {
    appLogger.debug("Fetching monitoring workers")
    return this.requestWithToken<MonitoringWorkersResponse>("/monitoring/workers", token)
  }

  getMonitoringEnumeration(token: string) {
    appLogger.debug("Fetching monitoring enumeration")
    return this.requestWithToken<MonitoringEnumerationResponse>("/monitoring/enumeration", token)
  }

  getMonitoringGraphRateLimit(token: string) {
    appLogger.debug("Fetching monitoring graph rate limit")
    return this.requestWithToken<MonitoringGraphRateLimitResponse>(
      "/monitoring/graph-rate-limit",
      token
    )
  }

  getMonitoringFailedItems(token: string) {
    appLogger.debug("Fetching monitoring failed items")
    return this.requestWithToken<MonitoringFailedItemsResponse>("/monitoring/failed-items", token)
  }

  retryWorkItems(token: string, shareId: string, workItemIds: string[]) {
    appLogger.debug("Retrying failed work items", undefined, { shareId, count: workItemIds.length })
    return this.requestWithToken<void>("/work-items/retry", token, {
      method: "POST",
      body: JSON.stringify({
        share_id: shareId,
        work_item_ids: workItemIds.join(","),
      }),
    })
  }
}