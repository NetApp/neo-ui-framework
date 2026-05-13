// Copyright 2025 NetApp, Inc. All Rights Reserved.
import { appLogger } from "@/services/app-logger"
import { BaseApiClient } from "./base"
import type {
  MonitoringOverviewResponse,
  MonitoringWorkersResponse,
  MonitoringEnumerationResponse,
  MonitoringGraphRateLimitResponse,
  MonitoringFailedItemsResponse,
  MonitoringWorkQueueStatsResponse,
  MonitoringServicesResponse,
  MonitoringRetryFailedResponse,
  MonitoringSizingProfileResponse,
  MonitoringSizingCurrentResponse,
  MonitoringSizingParameterResponse,
  MonitoringBenchmarkRunResponse,
  MonitoringBenchmarkStatusResponse,
  MonitoringBenchmarkResultResponse,
  MonitoringBenchmarkHistoryResponse,
  MonitoringTuningRecommendationsResponse,
  MonitoringTuningHistoryResponse,
  MonitoringTuningApplyResponse,
  MonitoringTuningRollbackResponse,
  MonitoringTuningStatusResponse,
} from "@/services/models"

export class MonitoringApiClient extends BaseApiClient {
  getMonitoringOverview(token: string) {
    appLogger.debug("Fetching monitoring overview")
    return this.requestApiV1WithToken<MonitoringOverviewResponse>("/monitoring/overview", token)
  }

  getMonitoringWorkers(token: string) {
    appLogger.debug("Fetching monitoring workers")
    return this.requestApiV1WithToken<MonitoringWorkersResponse>("/monitoring/workers", token)
  }

  getMonitoringEnumeration(token: string) {
    appLogger.debug("Fetching monitoring enumeration")
    return this.requestApiV1WithToken<MonitoringEnumerationResponse>("/monitoring/enumeration", token)
  }

  getMonitoringGraphRateLimit(token: string) {
    appLogger.debug("Fetching monitoring graph rate limit")
    return this.requestApiV1WithToken<MonitoringGraphRateLimitResponse>(
      "/monitoring/graph-rate-limit",
      token
    )
  }

  getMonitoringFailedItems(
    token: string,
    options?: {
      shareId?: string
      workType?: string
      limit?: number
    }
  ) {
    appLogger.debug("Fetching monitoring failed items")
    const params = new URLSearchParams()
    if (options?.shareId) {
      params.append("share_id", options.shareId)
    }
    if (options?.workType) {
      params.append("work_type", options.workType)
    }
    if (typeof options?.limit === "number") {
      params.append("limit", String(options.limit))
    }

    const query = params.toString()
    const endpoint = query ? `/monitoring/failed-items?${query}` : "/monitoring/failed-items"

    return this.requestApiV1WithToken<MonitoringFailedItemsResponse>(endpoint, token)
  }

  getMonitoringWorkQueue(token: string) {
    appLogger.debug("Fetching monitoring work queue")
    return this.requestApiV1WithToken<MonitoringWorkQueueStatsResponse>("/monitoring/work-queue", token)
  }

  getMonitoringWorkQueueByShare(token: string, shareId: string) {
    appLogger.debug("Fetching monitoring work queue by share", undefined, { shareId })
    return this.requestApiV1WithToken<MonitoringWorkQueueStatsResponse>(`/monitoring/work-queue/by-share/${encodeURIComponent(shareId)}`, token)
  }

  getMonitoringServices(token: string) {
    appLogger.debug("Fetching monitoring services health")
    return this.requestApiV1WithToken<MonitoringServicesResponse>("/monitoring/services", token)
  }

  retryFailedItems(token: string, shareId?: string | null, workItemIds?: string[]) {
    appLogger.debug("Retrying failed items", undefined, {
      shareId: shareId ?? null,
      count: workItemIds?.length ?? 0,
    })

    const params = new URLSearchParams()
    if (shareId) {
      params.append("share_id", shareId)
    }

    const formData = new FormData()
    workItemIds?.forEach((workItemId) => formData.append("work_item_ids", workItemId))

    return this.request<MonitoringRetryFailedResponse>(
      `${this.buildApiV1Path("/monitoring/retry-failed")}?${params}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      },
      {
        expectAuth: true,
      }
    )
  }

  retryWorkItems(token: string, shareId: string, workItemIds: string[]) {
    appLogger.debug("Retrying failed work items", undefined, { shareId, count: workItemIds.length })
    const params = new URLSearchParams()
    if (shareId) {
      params.append("share_id", shareId)
    }

    const formData = new FormData()
    workItemIds.forEach((workItemId) => formData.append("work_item_ids", workItemId))

    return this.request<void>(
      `${this.buildApiV1Path("/monitoring/work-items/retry")}?${params}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      },
      {
        expectAuth: true,
      }
    )
  }

  getMonitoringSizingProfiles(token: string) {
    appLogger.debug("Fetching monitoring sizing profiles")
    return this.requestApiV1WithToken<MonitoringSizingProfileResponse[] | Record<string, unknown>>("/monitoring/sizing/profiles", token)
  }

  getMonitoringSizingCurrent(token: string) {
    appLogger.debug("Fetching monitoring current sizing")
    return this.requestApiV1WithToken<MonitoringSizingCurrentResponse>("/monitoring/sizing/current", token)
  }

  getMonitoringSizingParameters(token: string) {
    appLogger.debug("Fetching monitoring sizing parameters")
    return this.requestApiV1WithToken<MonitoringSizingParameterResponse[] | Record<string, unknown>>("/monitoring/sizing/parameters", token)
  }

  runMonitoringBenchmark(
    token: string,
    options?: {
      shareId?: string
      sampleSize?: number
      stages?: string
    }
  ) {
    appLogger.debug("Starting monitoring benchmark", undefined, options)
    const params = new URLSearchParams()
    if (options?.shareId) {
      params.append("share_id", options.shareId)
    }
    if (typeof options?.sampleSize === "number") {
      params.append("sample_size", String(options.sampleSize))
    }
    if (options?.stages) {
      params.append("stages", options.stages)
    }

    return this.requestWithToken<MonitoringBenchmarkRunResponse>(
      `${this.buildApiV1Path("/monitoring/benchmark/run")}?${params}`,
      token,
      {
        method: "POST",
      }
    )
  }

  getMonitoringBenchmarkStatus(token: string) {
    appLogger.debug("Fetching monitoring benchmark status")
    return this.requestApiV1WithToken<MonitoringBenchmarkStatusResponse>("/monitoring/benchmark/status", token)
  }

  getMonitoringBenchmarkResults(token: string) {
    appLogger.debug("Fetching monitoring benchmark results")
    return this.requestApiV1WithToken<MonitoringBenchmarkResultResponse | Record<string, unknown>>("/monitoring/benchmark/results", token)
  }

  getMonitoringBenchmarkHistory(token: string) {
    appLogger.debug("Fetching monitoring benchmark history")
    return this.requestApiV1WithToken<MonitoringBenchmarkHistoryResponse>("/monitoring/benchmark/history", token)
  }

  getMonitoringTuningRecommendations(token: string) {
    appLogger.debug("Fetching monitoring tuning recommendations")
    return this.requestApiV1WithToken<MonitoringTuningRecommendationsResponse>("/monitoring/tuning/recommendations", token)
  }

  getMonitoringTuningHistory(token: string) {
    appLogger.debug("Fetching monitoring tuning history")
    return this.requestApiV1WithToken<MonitoringTuningHistoryResponse>("/monitoring/tuning/history", token)
  }

  applyMonitoringTuning(token: string, parameter: string, value: string, reason?: string) {
    appLogger.debug("Applying monitoring tuning", undefined, { parameter, reason: reason ?? "manual" })
    const params = new URLSearchParams({
      parameter,
      value,
      reason: reason ?? "manual",
    })

    return this.requestWithToken<MonitoringTuningApplyResponse>(
      `${this.buildApiV1Path("/monitoring/tuning/apply")}?${params}`,
      token,
      {
        method: "POST",
      }
    )
  }

  rollbackMonitoringTuning(token: string) {
    appLogger.debug("Rolling back monitoring tuning")
    return this.requestApiV1WithToken<MonitoringTuningRollbackResponse>("/monitoring/tuning/rollback", token, {
      method: "POST",
    })
  }

  getMonitoringTuningStatus(token: string) {
    appLogger.debug("Fetching monitoring tuning status")
    return this.requestApiV1WithToken<MonitoringTuningStatusResponse>("/monitoring/tuning/status", token)
  }
}