// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  IconActivity,
  IconRefresh,
} from "@tabler/icons-react"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { NeoApiService } from "@/services/neo-api"
import { useNeoApi } from "@/hooks/useNeoApi"
import type {
  MonitoringOverviewResponse,
  MonitoringWorkersResponse,
  MonitoringEnumerationResponse,
  MonitoringGraphRateLimitResponse,
  MonitoringFailedItemsResponse,
  TasksResponse,
  TaskStatisticsResponse,
  DatabaseSizeResponse,
  HealthResponse,
  LicenseResponse,
  VersionResponse,
  HelmChartVersionResponse,
  AclCacheStatisticsResponse,
  MonitoringWorkQueueStatsResponse,
  MonitoringServicesResponse,
  MonitoringTuningRecommendationsResponse,
  MonitoringTuningHistoryResponse,
  MonitoringTuningStatusResponse,
} from "@/services/neo-api"
import { FileTypeChart } from "@/components/charts/filetype"
import { SharesDistributionChart } from "@/components/charts/sharesdistribution"
import { DatabaseSizeCard } from "@/components/charts/databasesize"
import { ContentSavingsChart } from "@/components/charts/contentsavings"
import { VersioningCard } from "@/components/cards/versioning-card"
import { CacheStatsCard } from "@/components/cards/cache-stats-card"
import { TasksSummaryCard } from "@/components/cards/tasks-summary-card"
import { AclCacheCard } from "@/components/cards/acl-cache-card"

interface MonitoringChartProps {
  monitoring: {
    overview: MonitoringOverviewResponse | null
    workers: MonitoringWorkersResponse | null
    enumeration: MonitoringEnumerationResponse | null
    graphRateLimit: MonitoringGraphRateLimitResponse | null
    failedItems: MonitoringFailedItemsResponse | null
    tasks: TasksResponse[] | null
    taskStats: TaskStatisticsResponse | null
    aclCacheStats: AclCacheStatisticsResponse | null
    fileAnalytics: { file_type: string; count: number; total_size: number }[] | null
    sharesAnalytics: { share_id: string; share_name: string; share_path: string; count: number; total_size: number }[] | null
  }
  databaseSize: DatabaseSizeResponse | null
  onRefreshMonitoring: () => Promise<void>
  onRetryWorkItems: (shareId: string, workItemIds: string[]) => Promise<boolean>
  health: HealthResponse | null
  license: LicenseResponse | null
  version: VersionResponse | null
  helmChartVersion: HelmChartVersionResponse | null
  cacheStats?: {
    sizeBytes: number
    items: number
  }
}

export function MonitoringChart({
  databaseSize,
  monitoring,
  onRefreshMonitoring,
  onRetryWorkItems,
  health,
  license,
  version,
  helmChartVersion,
  cacheStats
}: MonitoringChartProps) {
  const { t } = useTranslation()
  const { state } = useNeoApi()
  const token = state.token
  const shares = state.shares
  const api = useMemo(() => new NeoApiService(), [])
  const {
    workers,
    graphRateLimit,
    failedItems,
    // tasks, 
    taskStats,
    fileAnalytics,
    sharesAnalytics
  } = monitoring

  const staleWorkers = workers?.stale_workers
    ?? workers?.workers?.filter((worker) => worker.status === "stale").length
    ?? 0

  const [isRetrying, setIsRetrying] = useState(false)
  const [isLoadingNerStatus, setIsLoadingNerStatus] = useState(false)
  const [nerStatusError, setNerStatusError] = useState<string | null>(null)
  const [nerStatus, setNerStatus] = useState<Record<string, unknown> | null>(null)
  const [isLoadingIncident, setIsLoadingIncident] = useState(false)
  const [incidentError, setIncidentError] = useState<string | null>(null)
  const [incidentWorkQueue, setIncidentWorkQueue] = useState<MonitoringWorkQueueStatsResponse | null>(null)
  const [incidentServices, setIncidentServices] = useState<MonitoringServicesResponse | null>(null)
  const [failedFilterShare, setFailedFilterShare] = useState<string>("")
  const [failedFilterWorkType, setFailedFilterWorkType] = useState<string>("all")
  const [isLoadingFailedQueue, setIsLoadingFailedQueue] = useState(false)
  const [selectedFailedItemIds, setSelectedFailedItemIds] = useState<Set<string>>(new Set())
  const [failedQueueData, setFailedQueueData] = useState<MonitoringFailedItemsResponse | null>(null)
  const [selectedShareDrilldown, setSelectedShareDrilldown] = useState<string>("")
  const [shareDrilldownData, setShareDrilldownData] = useState<MonitoringWorkQueueStatsResponse | null>(null)
  const [isLoadingShareDrilldown, setIsLoadingShareDrilldown] = useState(false)
  const [incidentRefreshSeconds, setIncidentRefreshSeconds] = useState<string>("60")
  const [isLoadingOptimization, setIsLoadingOptimization] = useState(false)
  const [isApplyingTuning, setIsApplyingTuning] = useState(false)
  const [isRollingBackTuning, setIsRollingBackTuning] = useState(false)
  const [optimizationError, setOptimizationError] = useState<string | null>(null)
  const [optimizationNotice, setOptimizationNotice] = useState<string | null>(null)
  const [tuningReason, setTuningReason] = useState("")
  const [tuningRecommendations, setTuningRecommendations] = useState<MonitoringTuningRecommendationsResponse | null>(null)
  const [tuningHistory, setTuningHistory] = useState<MonitoringTuningHistoryResponse | null>(null)
  const [tuningStatus, setTuningStatus] = useState<MonitoringTuningStatusResponse | null>(null)
  const [localTuningTimeline, setLocalTuningTimeline] = useState<Record<string, unknown>[]>([])

  const normalizedNerStatus = useMemo(() => {
    if (!nerStatus) return null

    const statusValue = typeof nerStatus.status === "string"
      ? nerStatus.status.toLowerCase()
      : undefined
    const runningValue = typeof nerStatus.running === "boolean"
      ? nerStatus.running
      : undefined
    const healthyValue = typeof nerStatus.healthy === "boolean"
      ? nerStatus.healthy
      : undefined

    const isRunning = runningValue
      ?? healthyValue
      ?? (statusValue ? ["ok", "healthy", "running", "active", "up", "ready"].includes(statusValue) : false)

    return {
      isRunning,
      statusValue,
      device: typeof nerStatus.device === "string" ? nerStatus.device : null,
      model: typeof nerStatus.model === "string" ? nerStatus.model : null,
      message: typeof nerStatus.message === "string" ? nerStatus.message : null,
    }
  }, [nerStatus])

  const fetchIncidentData = useCallback(async () => {
    if (!token) return

    setIsLoadingIncident(true)
    setIncidentError(null)

    try {
      const [workQueueResponse, servicesResponse] = await Promise.all([
        api.getMonitoringWorkQueue(token),
        api.getMonitoringServices(token),
      ])

      setIncidentWorkQueue(workQueueResponse)
      setIncidentServices(servicesResponse)
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : t("refreshFailed", { ns: "monitoring" })
      setIncidentError(message)
    } finally {
      setIsLoadingIncident(false)
    }
  }, [api, token, t])

  const fetchFailedQueue = useCallback(async () => {
    if (!token || !failedFilterShare) {
      setFailedQueueData(null)
      setSelectedFailedItemIds(new Set())
      return
    }

    setIsLoadingFailedQueue(true)
    try {
      const failedResponse = await api.getMonitoringFailedItems(token, {
        shareId: failedFilterShare,
        workType: failedFilterWorkType === "all" ? undefined : failedFilterWorkType,
        limit: 200,
      })

      setFailedQueueData(failedResponse)
      setSelectedFailedItemIds(new Set())
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : t("refreshFailed", { ns: "monitoring" })
      setIncidentError(message)
    } finally {
      setIsLoadingFailedQueue(false)
    }
  }, [api, failedFilterShare, failedFilterWorkType, token, t])

  const fetchShareDrilldown = useCallback(async (shareId: string) => {
    if (!token || !shareId) {
      setShareDrilldownData(null)
      return
    }

    setIsLoadingShareDrilldown(true)
    try {
      const byShareResponse = await api.getMonitoringWorkQueueByShare(token, shareId)
      setShareDrilldownData(byShareResponse)
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : t("refreshFailed", { ns: "monitoring" })
      setIncidentError(message)
      setShareDrilldownData(null)
    } finally {
      setIsLoadingShareDrilldown(false)
    }
  }, [api, token, t])

  const fetchOptimizationData = useCallback(async () => {
    if (!token) return

    setIsLoadingOptimization(true)
    setOptimizationError(null)
    try {
      const [recommendationsResponse, historyResponse, statusResponse] = await Promise.all([
        api.getMonitoringTuningRecommendations(token),
        api.getMonitoringTuningHistory(token),
        api.getMonitoringTuningStatus(token),
      ])

      setTuningRecommendations(recommendationsResponse)
      setTuningHistory(historyResponse)
      setTuningStatus(statusResponse)
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : t("refreshFailed", { ns: "monitoring" })
      setOptimizationError(message)
    } finally {
      setIsLoadingOptimization(false)
    }
  }, [api, token, t])

  const handleToggleFailedItem = useCallback((itemId: string, checked: boolean) => {
    setSelectedFailedItemIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(itemId)
      } else {
        next.delete(itemId)
      }
      return next
    })
  }, [])

  const handleToggleAllFailedItems = useCallback((checked: boolean) => {
    if (!failedQueueData?.failed_items?.length) return

    if (checked) {
      setSelectedFailedItemIds(
        new Set(
          failedQueueData.failed_items.map((item, index) => {
            return (typeof item.id === "string" && item.id.trim().length > 0)
              ? item.id
              : `failed-row-${index}`
          })
        )
      )
      return
    }

    setSelectedFailedItemIds(new Set())
  }, [failedQueueData])

  const handleRetrySelectedFailedItems = useCallback(async () => {
    if (!failedQueueData?.failed_items?.length || selectedFailedItemIds.size === 0) return

    const itemsByShare: Record<string, string[]> = {}
    failedQueueData.failed_items.forEach((item, index) => {
      const rowKey = (typeof item.id === "string" && item.id.trim().length > 0)
        ? item.id
        : `failed-row-${index}`
      if (!selectedFailedItemIds.has(rowKey)) return

      const itemId = typeof item.id === "string" && item.id.trim().length > 0 ? item.id : null
      const shareId = (typeof item.share_id === "string" && item.share_id.trim().length > 0)
        ? item.share_id
        : failedFilterShare

      if (!itemId || !shareId) return

      if (!itemsByShare[shareId]) {
        itemsByShare[shareId] = []
      }
      itemsByShare[shareId].push(itemId)
    })

    if (Object.keys(itemsByShare).length === 0) {
      setIncidentError(t("failedItemsNotRetryable", {
        ns: "monitoring",
        defaultValue: "Selected rows do not include retry identifiers."
      }))
      return
    }

    setIsRetrying(true)
    try {
      await Promise.all(
        Object.entries(itemsByShare).map(([shareId, workItemIds]) => onRetryWorkItems(shareId, workItemIds))
      )

      await onRefreshMonitoring()
      await Promise.all([fetchIncidentData(), fetchFailedQueue()])
    } finally {
      setIsRetrying(false)
    }
  }, [failedQueueData, selectedFailedItemIds, failedFilterShare, onRetryWorkItems, onRefreshMonitoring, fetchIncidentData, fetchFailedQueue, t])

  const handleRetrySingleFailedItem = useCallback(async (shareId: string, workItemId: string) => {
    setIsRetrying(true)
    try {
      await onRetryWorkItems(shareId, [workItemId])
      await onRefreshMonitoring()
      await Promise.all([fetchIncidentData(), fetchFailedQueue()])
    } finally {
      setIsRetrying(false)
    }
  }, [onRetryWorkItems, onRefreshMonitoring, fetchIncidentData, fetchFailedQueue])

  const handleApplyTuningRecommendation = useCallback(async (recommendation: Record<string, unknown>) => {
    if (!token) return

    const reason = tuningReason.trim()
    if (!reason) {
      setOptimizationError(t("provideReasonBeforeApplying", {
        ns: "monitoring",
        defaultValue: "Capture a reason before applying or rolling back tuning changes."
      }))
      return
    }

    const parameter =
      (typeof recommendation.parameter === "string" ? recommendation.parameter : undefined)
      ?? (typeof recommendation.key === "string" ? recommendation.key : undefined)
      ?? (typeof recommendation.name === "string" ? recommendation.name : undefined)

    const valueRaw = recommendation.value
      ?? recommendation.recommended_value
      ?? recommendation.target_value

    if (!parameter || valueRaw === undefined || valueRaw === null) {
      setOptimizationError(t("invalidRecommendationPayload", {
        ns: "monitoring",
        defaultValue: "Recommendation payload is missing parameter or value."
      }))
      return
    }

    setIsApplyingTuning(true)
    setOptimizationError(null)
    setOptimizationNotice(null)

    try {
      const response = await api.applyMonitoringTuning(token, parameter, String(valueRaw), reason)
      setOptimizationNotice(response.message ?? t("tuningApplySucceeded", {
        ns: "monitoring",
        defaultValue: "Tuning recommendation applied."
      }))

      setLocalTuningTimeline((prev) => [{
        timestamp: new Date().toISOString(),
        action: "apply",
        parameter,
        value: String(valueRaw),
        reason,
      }, ...prev].slice(0, 10))

      setTuningReason("")
      await fetchOptimizationData()
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : t("operationFailed", { ns: "monitoring", defaultValue: "Operation failed" })
      setOptimizationError(message)
    } finally {
      setIsApplyingTuning(false)
    }
  }, [api, token, tuningReason, t, fetchOptimizationData])

  const handleRollbackTuning = useCallback(async () => {
    if (!token) return

    const reason = tuningReason.trim()
    if (!reason) {
      setOptimizationError(t("provideReasonBeforeRollback", {
        ns: "monitoring",
        defaultValue: "Capture a rollback reason before continuing."
      }))
      return
    }

    setIsRollingBackTuning(true)
    setOptimizationError(null)
    setOptimizationNotice(null)
    try {
      const response = await api.rollbackMonitoringTuning(token)
      setOptimizationNotice(response.message ?? t("tuningRollbackSucceeded", {
        ns: "monitoring",
        defaultValue: "Rollback completed successfully."
      }))

      setLocalTuningTimeline((prev) => [{
        timestamp: new Date().toISOString(),
        action: "rollback",
        reason,
      }, ...prev].slice(0, 10))

      setTuningReason("")
      await fetchOptimizationData()
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : t("operationFailed", { ns: "monitoring", defaultValue: "Operation failed" })
      setOptimizationError(message)
    } finally {
      setIsRollingBackTuning(false)
    }
  }, [api, token, tuningReason, t, fetchOptimizationData])

  // Auto-refresh monitoring data every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      onRefreshMonitoring().catch((error) => {
        console.error("Auto-refresh failed:", error)
      })
    }, 60000)

    return () => clearInterval(interval)
  }, [onRefreshMonitoring])

  useEffect(() => {
    fetchIncidentData()
    const interval = window.setInterval(fetchIncidentData, Number(incidentRefreshSeconds) * 1000)
    return () => window.clearInterval(interval)
  }, [fetchIncidentData, incidentRefreshSeconds])

  useEffect(() => {
    fetchOptimizationData()
    const interval = window.setInterval(fetchOptimizationData, 120000)
    return () => window.clearInterval(interval)
  }, [fetchOptimizationData])

  useEffect(() => {
    fetchFailedQueue()
  }, [fetchFailedQueue])

  useEffect(() => {
    if (!selectedShareDrilldown) {
      setShareDrilldownData(null)
      return
    }
    fetchShareDrilldown(selectedShareDrilldown)
  }, [fetchShareDrilldown, selectedShareDrilldown])

  useEffect(() => {
    const fetchNerStatus = async () => {
      if (!token) return

      setIsLoadingNerStatus(true)
      setNerStatusError(null)
      try {
        const statusResponse = await api.getNERStatus(token)
        setNerStatus(statusResponse)
      } catch (error) {
        const message = error instanceof Error
          ? error.message
          : t("refreshFailed", { ns: "monitoring" })
        setNerStatusError(message)
      } finally {
        setIsLoadingNerStatus(false)
      }
    }

    fetchNerStatus()
    const interval = window.setInterval(fetchNerStatus, 60000)
    return () => window.clearInterval(interval)
  }, [api, token, t])

  const serviceRows = useMemo(() => {
    if (!incidentServices) return []

    const rows: { name: string; status: string; healthy: boolean }[] = []

    const servicesField = incidentServices.services
    if (Array.isArray(servicesField)) {
      servicesField.forEach((service, index) => {
        const name = service.name ?? service.service ?? `service-${index + 1}`
        const status = String(service.status ?? (service.healthy ? "healthy" : "unknown"))
        const healthy = typeof service.healthy === "boolean"
          ? service.healthy
          : ["healthy", "ok", "running", "active", "up"].includes(status.toLowerCase())
        rows.push({ name, status, healthy })
      })
      return rows
    }

    if (servicesField && typeof servicesField === "object") {
      Object.entries(servicesField).forEach(([name, value]) => {
        if (typeof value === "string") {
          const status = value
          rows.push({
            name,
            status,
            healthy: ["healthy", "ok", "running", "active", "up"].includes(status.toLowerCase()),
          })
          return
        }

        if (typeof value === "boolean") {
          rows.push({
            name,
            status: value ? "healthy" : "unhealthy",
            healthy: value,
          })
          return
        }

        if (value && typeof value === "object") {
          const objectValue = value as Record<string, unknown>
          const runningInstances = typeof objectValue.running_instances === "number"
            ? objectValue.running_instances
            : undefined
          const totalInstances = typeof objectValue.total_instances === "number"
            ? objectValue.total_instances
            : undefined

          const rawStatus = typeof objectValue.status === "string"
            ? objectValue.status
            : (typeof objectValue.healthy === "boolean"
              ? (objectValue.healthy ? "healthy" : "unhealthy")
              : (runningInstances !== undefined && totalInstances !== undefined
                ? `${runningInstances}/${totalInstances} running`
                : "unknown"))

          const healthy = typeof objectValue.healthy === "boolean"
            ? objectValue.healthy
            : (runningInstances !== undefined
              ? runningInstances > 0
              : ["healthy", "ok", "running", "active", "up"].includes(rawStatus.toLowerCase()))
          rows.push({ name, status: rawStatus, healthy })
        }
      })
      return rows
    }

    Object.entries(incidentServices).forEach(([name, value]) => {
      if (name === "services" || name === "timestamp") return
      if (typeof value === "string") {
        rows.push({
          name,
          status: value,
          healthy: ["healthy", "ok", "running", "active", "up"].includes(value.toLowerCase()),
        })
      } else if (typeof value === "boolean") {
        rows.push({ name, status: value ? "healthy" : "unhealthy", healthy: value })
      }
    })

    return rows
  }, [incidentServices])

  const unhealthyServicesCount = serviceRows.filter((service) => !service.healthy).length

  const shareIds = useMemo(() => {
    const uniqueShareIds = new Set<string>()

    if (failedItems?.failed_items) {
      failedItems.failed_items.forEach((item) => {
        if (item.share_id) {
          uniqueShareIds.add(item.share_id)
        }
      })
    }

    const byShare = incidentWorkQueue?.by_share
    if (Array.isArray(byShare)) {
      byShare.forEach((item) => {
        if (item.share_id) {
          uniqueShareIds.add(item.share_id)
        }
      })
    } else if (byShare && typeof byShare === "object") {
      Object.entries(byShare).forEach(([shareId, value]) => {
        uniqueShareIds.add(shareId)
        if (value?.share_id) {
          uniqueShareIds.add(value.share_id)
        }
      })
    }

    return Array.from(uniqueShareIds)
  }, [failedItems, incidentWorkQueue])

  const failedQueueItems = useMemo(() => failedQueueData?.failed_items ?? [], [failedQueueData])

  const failureSummaryEntries = useMemo(() => {
    const summary = failedQueueData?.failure_summary
    if (!summary || typeof summary !== "object") return [] as Array<[string, number]>
    return Object.entries(summary)
      .map(([message, count]) => [message, typeof count === "number" ? count : 0] as [string, number])
      .sort((a, b) => b[1] - a[1])
  }, [failedQueueData])

  const failedShareOptions = useMemo(() => {
    const uniqueShareIds = new Set<string>()

    shares?.forEach((share) => {
      if (share.id) {
        uniqueShareIds.add(String(share.id))
      }
    })

    sharesAnalytics?.forEach((share) => {
      if (share.share_id) {
        uniqueShareIds.add(share.share_id)
      }
    })

    failedQueueItems.forEach((item) => {
      if (item.share_id) {
        uniqueShareIds.add(item.share_id)
      }
    })

    failedItems?.failed_items?.forEach((item) => {
      if (item.share_id) {
        uniqueShareIds.add(item.share_id)
      }
    })

    shareIds.forEach((shareId) => uniqueShareIds.add(shareId))
    return Array.from(uniqueShareIds)
  }, [shares, sharesAnalytics, failedQueueItems, failedItems, shareIds])

  const failedWorkTypeOptions = useMemo(() => {
    const uniqueWorkTypes = new Set<string>()
    failedQueueItems.forEach((item) => {
      if (item.work_type) {
        uniqueWorkTypes.add(item.work_type)
      }
    })
    return Array.from(uniqueWorkTypes)
  }, [failedQueueItems])

  const byShareItems = useMemo(() => {
    const source = incidentWorkQueue?.by_share
    if (!source) return [] as MonitoringWorkQueueStatsResponse[]

    if (Array.isArray(source)) {
      return source.map((item) => ({
        ...item,
      })) as MonitoringWorkQueueStatsResponse[]
    }

    return Object.entries(source).map(([shareId, item]) => ({
      share_id: item.share_id ?? shareId,
      ...item,
    })) as MonitoringWorkQueueStatsResponse[]
  }, [incidentWorkQueue?.by_share])

  const sumWorkTypeCounts = useCallback((value: unknown): number => {
    if (!value || typeof value !== "object") return 0
    return Object.values(value as Record<string, unknown>).reduce<number>((sum, entry) => {
      return sum + (typeof entry === "number" ? entry : 0)
    }, 0)
  }, [])

  const readQueueMetrics = useCallback((item?: Record<string, unknown> | null) => {
    if (!item) {
      return {
        pending: 0,
        processing: 0,
        claimed: 0,
        completed: 0,
        failed: 0,
        total: 0,
      }
    }

    const byStatusAndType =
      item.by_status_and_type && typeof item.by_status_and_type === "object"
        ? (item.by_status_and_type as Record<string, unknown>)
        : null

    const pending =
      (typeof item.pending_items === "number" ? item.pending_items : undefined)
      ?? (typeof item.pending_work_items === "number" ? item.pending_work_items : undefined)
      ?? (typeof item.total_pending === "number" ? item.total_pending : undefined)
      ?? 0

    const processing =
      (typeof item.processing_items === "number" ? item.processing_items : undefined)
      ?? (typeof item.total_processing === "number" ? item.total_processing : undefined)
      ?? (byStatusAndType ? sumWorkTypeCounts(byStatusAndType.processing) : 0)

    const claimed =
      (typeof item.claimed_items === "number" ? item.claimed_items : undefined)
      ?? (typeof item.total_claimed === "number" ? item.total_claimed : undefined)
      ?? (byStatusAndType ? sumWorkTypeCounts(byStatusAndType.claimed) : 0)

    const completed =
      (typeof item.completed_items === "number" ? item.completed_items : undefined)
      ?? (typeof item.total_completed === "number" ? item.total_completed : undefined)
      ?? (byStatusAndType ? sumWorkTypeCounts(byStatusAndType.completed) : 0)

    const failed =
      (typeof item.failed_items === "number" ? item.failed_items : undefined)
      ?? (typeof item.total_failed === "number" ? item.total_failed : undefined)
      ?? (byStatusAndType ? sumWorkTypeCounts(byStatusAndType.failed) : 0)

    const total =
      (typeof item.total_items === "number" ? item.total_items : undefined)
      ?? (pending + processing + claimed + completed + failed)

    return {
      pending,
      processing,
      claimed,
      completed,
      failed,
      total,
    }
  }, [sumWorkTypeCounts])

  const maxPressure = useMemo(() => {
    if (byShareItems.length === 0) return 1
    return Math.max(
      ...byShareItems.map((item) => {
        const metrics = readQueueMetrics(item as Record<string, unknown>)
        const pending = metrics.pending
        const processing = metrics.processing
        const failed = metrics.failed
        return pending + processing * 1.5 + failed * 3
      }),
      1
    )
  }, [byShareItems, readQueueMetrics])

  const selectedSharePressure = useMemo(() => {
    if (!selectedShareDrilldown) return null
    return byShareItems.find((item) => String(item.share_id ?? "") === selectedShareDrilldown) ?? null
  }, [byShareItems, selectedShareDrilldown])

  const globalQueueMetrics = useMemo(() => {
    return readQueueMetrics((incidentWorkQueue ?? null) as Record<string, unknown> | null)
  }, [incidentWorkQueue, readQueueMetrics])

  const globalAverageProcessingTimeMs =
    typeof (incidentWorkQueue as Record<string, unknown> | null)?.average_processing_time_ms === "number"
      ? ((incidentWorkQueue as Record<string, unknown>).average_processing_time_ms as number)
      : null

  const globalOldestPendingAgeSeconds =
    typeof (incidentWorkQueue as Record<string, unknown> | null)?.oldest_pending_age_seconds === "number"
      ? ((incidentWorkQueue as Record<string, unknown>).oldest_pending_age_seconds as number)
      : null

  const recommendationRows = useMemo(() => {
    const source = tuningRecommendations?.recommendations
    if (!Array.isArray(source)) return [] as Record<string, unknown>[]

    return source
      .map((entry) => {
        const recommendation = entry as Record<string, unknown>
        const impactRaw = recommendation.impact_score
          ?? recommendation.score
          ?? recommendation.impact
        const impactScore = typeof impactRaw === "number"
          ? impactRaw
          : (typeof impactRaw === "string" && !Number.isNaN(Number(impactRaw)) ? Number(impactRaw) : null)

        return {
          ...recommendation,
          parameter:
            (typeof recommendation.parameter === "string" ? recommendation.parameter : undefined)
            ?? (typeof recommendation.key === "string" ? recommendation.key : undefined)
            ?? (typeof recommendation.name === "string" ? recommendation.name : "-"),
          nextValue:
            recommendation.value
            ?? recommendation.recommended_value
            ?? recommendation.target_value
            ?? "-",
          currentValue:
            recommendation.current_value
            ?? recommendation.old_value
            ?? recommendation.previous_value
            ?? "-",
          rationale:
            (typeof recommendation.reason === "string" ? recommendation.reason : undefined)
            ?? (typeof recommendation.rationale === "string" ? recommendation.rationale : undefined)
            ?? (typeof recommendation.description === "string" ? recommendation.description : ""),
          impactScore,
        }
      })
      .sort((a, b) => {
        const first = typeof a.impactScore === "number" ? a.impactScore : -1
        const second = typeof b.impactScore === "number" ? b.impactScore : -1
        return second - first
      })
  }, [tuningRecommendations])

  const timelineRows = useMemo(() => {
    const historySource = tuningHistory && Array.isArray(tuningHistory.history)
      ? tuningHistory.history
      : []

    const normalizedHistory = historySource
      .map((entry, index) => {
        const row = entry as Record<string, unknown>
        const timestamp =
          (typeof row.timestamp === "string" ? row.timestamp : undefined)
          ?? (typeof row.changed_at === "string" ? row.changed_at : undefined)
          ?? (typeof row.created_at === "string" ? row.created_at : undefined)
          ?? (typeof row.applied_at === "string" ? row.applied_at : undefined)
          ?? new Date(0).toISOString()

        const action =
          (typeof row.action === "string" ? row.action : undefined)
          ?? (typeof row.event_type === "string" ? row.event_type : undefined)
          ?? (typeof row.type === "string" ? row.type : undefined)
          ?? "change"

        const parameter =
          (typeof row.parameter === "string" ? row.parameter : undefined)
          ?? (typeof row.key === "string" ? row.key : undefined)
          ?? (typeof row.name === "string" ? row.name : undefined)
          ?? "-"

        const reason =
          (typeof row.reason === "string" ? row.reason : undefined)
          ?? (typeof row.message === "string" ? row.message : undefined)
          ?? ""

        return {
          id: `history-${index}-${timestamp}`,
          timestamp,
          action,
          parameter,
          before: row.old_value ?? row.before_value ?? row.previous_value ?? "-",
          after: row.new_value ?? row.after_value ?? row.value ?? "-",
          reason,
          source: "history",
        }
      })

    const localRows = localTuningTimeline.map((entry, index) => {
      const timestamp = typeof entry.timestamp === "string" ? entry.timestamp : new Date().toISOString()
      return {
        id: `local-${index}-${timestamp}`,
        timestamp,
        action: typeof entry.action === "string" ? entry.action : "change",
        parameter: typeof entry.parameter === "string" ? entry.parameter : "-",
        before: "-",
        after: entry.value ?? "-",
        reason: typeof entry.reason === "string" ? entry.reason : "",
        source: "local",
      }
    })

    return [...localRows, ...normalizedHistory]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 12)
  }, [tuningHistory, localTuningTimeline])

  const computeDiffBadge = useCallback((before: unknown, after: unknown) => {
    const beforeString = String(before ?? "")
    const afterString = String(after ?? "")

    const beforeNumber = Number(beforeString)
    const afterNumber = Number(afterString)
    const bothNumeric = Number.isFinite(beforeNumber) && Number.isFinite(afterNumber)

    if (bothNumeric) {
      if (afterNumber > beforeNumber) {
        return {
          label: `+${afterNumber - beforeNumber}`,
          trend: "up" as const,
          className: "bg-emerald-50 text-emerald-700 border-emerald-200",
          arrow: "↑",
        }
      }

      if (afterNumber < beforeNumber) {
        return {
          label: `${afterNumber - beforeNumber}`,
          trend: "down" as const,
          className: "bg-red-50 text-red-700 border-red-200",
          arrow: "↓",
        }
      }

      return {
        label: "0",
        trend: "flat" as const,
        className: "bg-muted text-muted-foreground border-border",
        arrow: "→",
      }
    }

    if (beforeString !== afterString) {
      return {
        label: t("changed", { ns: "monitoring", defaultValue: "Changed" }),
        trend: "changed" as const,
        className: "bg-amber-50 text-amber-700 border-amber-200",
        arrow: "↺",
      }
    }

    return {
      label: t("unchanged", { ns: "monitoring", defaultValue: "Unchanged" }),
      trend: "flat" as const,
      className: "bg-muted text-muted-foreground border-border",
      arrow: "→",
    }
  }, [t])

  return (
    <Tabs defaultValue="neo" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="neo">{t("neoTab", { ns: "monitoring" })}</TabsTrigger>
        <TabsTrigger value="data-corpus">{t("dataCorpusTab", { ns: "monitoring" })}</TabsTrigger>
        <TabsTrigger value="crawling">{t("crawlingTab", { ns: "monitoring" })}</TabsTrigger>
        <TabsTrigger value="optimization">{t("optimizationTab", { ns: "monitoring", defaultValue: "Optimization" })}</TabsTrigger>
        <TabsTrigger value="tasks">{t("tasksTab", { ns: "monitoring" })}</TabsTrigger>
        <TabsTrigger value="ner">{t("nerTab", { ns: "monitoring" })}</TabsTrigger>
      </TabsList>

      {/* Neo Tab */}
      <TabsContent value="neo">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* System Versions Card */}
          <VersioningCard
            version={version}
            helmChartVersion={helmChartVersion}
            health={health}
            license={license}
            className="md:col-span-1 lg:col-span-1"
          />

          {/* Database Size Card */}
          <DatabaseSizeCard databaseSize={databaseSize} className="lg:col-span-1" />

          {/* Cache Stats Card */}
          <CacheStatsCard cacheStats={cacheStats} className="lg:col-span-1" />
        </div>
      </TabsContent>

      {/* Data Corpus Tab */}
      <TabsContent value="data-corpus">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Content Savings Chart */}
          <ContentSavingsChart databaseSize={databaseSize} className="md:col-span-1 lg:col-span-1" />

          {/* File Types Distribution */}
          <div className="md:col-span-1 lg:col-span-1">
            <FileTypeChart fileAnalytics={fileAnalytics} />
          </div>

          {/* Document Distribution by Shares */}
          <div className="md:col-span-1 lg:col-span-1">
            <SharesDistributionChart sharesAnalytics={sharesAnalytics} />
          </div>
        </div>
      </TabsContent>

      {/* Crawling Tab */}
      <TabsContent value="crawling">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{t("serviceHealth", { ns: "monitoring", defaultValue: "Service Health" })}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>{t("healthy", { ns: "monitoring" })}</span>
                  <Badge variant={unhealthyServicesCount > 0 ? "destructive" : "outline"} className="font-mono">
                    {serviceRows.length - unhealthyServicesCount}/{serviceRows.length || 0}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {serviceRows.slice(0, 3).map((service) => service.name).join(", ") || t("noDataAvailable", { ns: "monitoring" })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{t("workers", { ns: "monitoring" })}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>{t("active", { ns: "monitoring" })}</span>
                  <Badge variant="outline" className="font-mono">{workers?.active_workers ?? 0}/{workers?.total_workers ?? 0}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>{t("stale", { ns: "monitoring", defaultValue: "Stale" })}</span>
                  <Badge variant={staleWorkers > 0 ? "destructive" : "outline"} className="font-mono">{staleWorkers}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{t("graphRateLimit", { ns: "monitoring" })}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>{t("requestsRemaining", { ns: "monitoring" })}</span>
                  <Badge variant="outline" className="font-mono">{graphRateLimit?.requests_remaining ?? 0}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>{t("statusLabel", { ns: "monitoring" })}</span>
                  <Badge variant={graphRateLimit?.rate_limited ? "destructive" : "outline"}>
                    {graphRateLimit?.rate_limited ? t("limited", { ns: "monitoring" }) : t("activeStatus", { ns: "monitoring" })}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t("queuePressure", { ns: "monitoring", defaultValue: "Queue Pressure" })}</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={incidentRefreshSeconds} onValueChange={setIncidentRefreshSeconds}>
                  <SelectTrigger className="h-7 w-[130px] text-xs">
                    <SelectValue placeholder={t("autoRefresh", { ns: "monitoring", defaultValue: "Auto refresh" })} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15s</SelectItem>
                    <SelectItem value="30">30s</SelectItem>
                    <SelectItem value="60">60s</SelectItem>
                    <SelectItem value="120">120s</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={fetchIncidentData} disabled={isLoadingIncident}>
                  <IconRefresh className={`mr-1 h-3 w-3 ${isLoadingIncident ? "animate-spin" : ""}`} />
                  {t("refresh", { ns: "common", defaultValue: "Refresh" })}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-3 grid gap-2 text-xs md:grid-cols-4 lg:grid-cols-6">
                <div className="rounded border p-2">
                  <div className="text-muted-foreground">{t("pending", { ns: "monitoring" })}</div>
                  <div className="font-mono">{globalQueueMetrics.pending}</div>
                </div>
                <div className="rounded border p-2">
                  <div className="text-muted-foreground">{t("claimed", { ns: "monitoring" })}</div>
                  <div className="font-mono">{globalQueueMetrics.claimed}</div>
                </div>
                <div className="rounded border p-2">
                  <div className="text-muted-foreground">{t("processing", { ns: "monitoring" })}</div>
                  <div className="font-mono">{globalQueueMetrics.processing}</div>
                </div>
                <div className="rounded border p-2">
                  <div className="text-muted-foreground">{t("completed", { ns: "monitoring" })}</div>
                  <div className="font-mono">{globalQueueMetrics.completed}</div>
                </div>
                <div className="rounded border p-2">
                  <div className="text-muted-foreground">{t("failed", { ns: "monitoring" })}</div>
                  <div className="font-mono text-destructive">{globalQueueMetrics.failed}</div>
                </div>
                <div className="rounded border p-2">
                  <div className="text-muted-foreground">{t("totalItems", { ns: "monitoring" })}</div>
                  <div className="font-mono">{globalQueueMetrics.total}</div>
                </div>
              </div>

              <div className="mb-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>
                  {t("avgDuration", { ns: "monitoring" })}: {globalAverageProcessingTimeMs !== null ? `${globalAverageProcessingTimeMs.toFixed(1)} ms` : "-"}
                </span>
                <span>
                  {t("oldestPendingAge", { ns: "monitoring", defaultValue: "Oldest pending age" })}: {globalOldestPendingAgeSeconds !== null ? `${globalOldestPendingAgeSeconds.toFixed(0)} s` : "-"}
                </span>
              </div>

              {byShareItems.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-6">
                  {byShareItems.map((item) => {
                    const shareId = String(item.share_id ?? "unknown")
                    const metrics = readQueueMetrics(item as Record<string, unknown>)
                    const pending = metrics.pending
                    const processing = metrics.processing
                    const failed = metrics.failed
                    const pressure = pending + processing * 1.5 + failed * 3
                    const intensity = Math.max(0.1, Math.min(1, pressure / maxPressure))

                    return (
                      <button
                        key={shareId}
                        type="button"
                        className="rounded-md border p-2 text-left"
                        style={{ backgroundColor: `rgba(239,68,68,${intensity * 0.35})` }}
                        onClick={() => {
                          setFailedFilterShare(shareId)
                          setSelectedShareDrilldown(shareId)
                        }}
                      >
                        <div className="truncate text-[11px] font-medium">{shareId}</div>
                        <div className="mt-1 text-[10px] text-muted-foreground">
                          {t("pending", { ns: "monitoring" })}: {pending}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {t("failed", { ns: "monitoring" })}: {failed}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t("shareDrilldown", { ns: "monitoring", defaultValue: "Share Drilldown" })}</CardTitle>
              <Select value={selectedShareDrilldown || "__none"} onValueChange={(value) => setSelectedShareDrilldown(value === "__none" ? "" : value)}>
                <SelectTrigger className="h-7 w-[220px] text-xs">
                  <SelectValue placeholder={t("selectShare", { ns: "monitoring", defaultValue: "Select share" })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">{t("selectShare", { ns: "monitoring", defaultValue: "Select share" })}</SelectItem>
                  {failedShareOptions.map((shareId) => (
                    <SelectItem key={shareId} value={shareId}>{shareId}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {selectedShareDrilldown && (shareDrilldownData || selectedSharePressure) ? (
                (() => {
                  const drilldownSource = (shareDrilldownData ?? selectedSharePressure ?? null) as Record<string, unknown> | null
                  const metrics = readQueueMetrics(drilldownSource)
                  const byStatusAndType =
                    drilldownSource?.by_status_and_type && typeof drilldownSource.by_status_and_type === "object"
                      ? (drilldownSource.by_status_and_type as Record<string, unknown>)
                      : null

                  return (
                    <div className="space-y-3">
                      <div className="grid gap-2 text-xs md:grid-cols-6">
                        <div className="rounded border p-2">
                          <div className="text-muted-foreground">{t("pending", { ns: "monitoring" })}</div>
                          <div className="font-mono">{metrics.pending}</div>
                        </div>
                        <div className="rounded border p-2">
                          <div className="text-muted-foreground">{t("processing", { ns: "monitoring" })}</div>
                          <div className="font-mono">{metrics.processing}</div>
                        </div>
                        <div className="rounded border p-2">
                          <div className="text-muted-foreground">{t("claimed", { ns: "monitoring" })}</div>
                          <div className="font-mono">{metrics.claimed}</div>
                        </div>
                        <div className="rounded border p-2">
                          <div className="text-muted-foreground">{t("completed", { ns: "monitoring" })}</div>
                          <div className="font-mono">{metrics.completed}</div>
                        </div>
                        <div className="rounded border p-2">
                          <div className="text-muted-foreground">{t("failed", { ns: "monitoring" })}</div>
                          <div className="font-mono text-destructive">{metrics.failed}</div>
                        </div>
                        <div className="rounded border p-2">
                          <div className="text-muted-foreground">{t("totalItems", { ns: "monitoring" })}</div>
                          <div className="font-mono">{metrics.total}</div>
                        </div>
                      </div>

                      {byStatusAndType ? (
                        <div className="rounded border p-2">
                          <div className="mb-2 text-xs font-medium text-muted-foreground">{t("statusBreakdown", { ns: "monitoring" })}</div>
                          <div className="space-y-1 text-xs">
                            {Object.entries(byStatusAndType).map(([status, value]) => {
                              const entry = value && typeof value === "object"
                                ? (value as Record<string, unknown>)
                                : null
                              const summary = entry
                                ? Object.entries(entry)
                                  .map(([workType, count]) => `${workType}: ${typeof count === "number" ? count : 0}`)
                                  .join(" | ")
                                : "-"

                              return (
                                <div key={status} className="flex flex-wrap items-center gap-2">
                                  <Badge variant="outline" className="font-mono text-[11px]">{status}</Badge>
                                  <span className="text-muted-foreground">{summary}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )
                })()
              ) : (
                <div className="text-sm text-muted-foreground">
                  {isLoadingShareDrilldown
                    ? t("loading", { ns: "monitoring", defaultValue: "Loading..." })
                    : t("selectShareToInspect", { ns: "monitoring", defaultValue: "Select a share to inspect queue details." })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-3 pb-2">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <CardTitle className="text-sm font-medium">{t("failedItems", { ns: "monitoring" })}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={fetchFailedQueue}
                    disabled={isLoadingFailedQueue}
                  >
                    <IconRefresh className={`mr-1 h-3 w-3 ${isLoadingFailedQueue ? "animate-spin" : ""}`} />
                    {t("refresh", { ns: "common", defaultValue: "Refresh" })}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleRetrySelectedFailedItems}
                    disabled={selectedFailedItemIds.size === 0 || isRetrying}
                  >
                    <IconRefresh className={`mr-1 h-3 w-3 ${isRetrying ? "animate-spin" : ""}`} />
                    {t("retrySelected", { ns: "monitoring", defaultValue: "Retry selected" })}
                  </Button>
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                <Select value={failedFilterShare} onValueChange={setFailedFilterShare}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectShare", { ns: "monitoring", defaultValue: "Select share" })} />
                  </SelectTrigger>
                  <SelectContent>
                    {failedShareOptions.map((shareId) => (
                      <SelectItem key={shareId} value={shareId}>{shareId}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={failedFilterWorkType} onValueChange={setFailedFilterWorkType}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("workType", { ns: "monitoring", defaultValue: "Work type" })} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allWorkTypes", { ns: "monitoring", defaultValue: "All work types" })}</SelectItem>
                    {failedWorkTypeOptions.map((workType) => (
                      <SelectItem key={workType} value={workType}>{workType}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center text-xs text-muted-foreground">
                  {t("selectedCount", { ns: "monitoring", defaultValue: "Selected" })}: {selectedFailedItemIds.size}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {failureSummaryEntries.length > 0 ? (
                <div className="mb-3 rounded border p-2">
                  <div className="mb-2 text-xs font-medium text-muted-foreground">{t("failureSummary", { ns: "monitoring", defaultValue: "Failure Summary" })}</div>
                  <div className="space-y-1 text-xs">
                    {failureSummaryEntries.slice(0, 3).map(([message, count]) => (
                      <div key={message} className="flex items-center justify-between gap-2">
                        <span className="truncate text-muted-foreground">{message}</span>
                        <Badge variant="outline" className="font-mono">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {!failedFilterShare ? (
                <div className="text-sm text-muted-foreground">
                  {t("selectShareToViewFailed", { ns: "monitoring", defaultValue: "Select a share to view failed items." })}
                </div>
              ) : failedQueueItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="w-10 py-2">
                          <Checkbox
                            checked={selectedFailedItemIds.size > 0 && selectedFailedItemIds.size === failedQueueItems.length}
                            onCheckedChange={(checked) => handleToggleAllFailedItems(Boolean(checked))}
                            aria-label="Select all failed items"
                          />
                        </th>
                        <th className="py-2">{t("fileMetadata", { ns: "monitoring" })}</th>
                        <th className="py-2">{t("workQueue", { ns: "monitoring" })}</th>
                        <th className="py-2">{t("error", { ns: "monitoring", defaultValue: "Error" })}</th>
                        <th className="py-2">{t("actions", { ns: "common", defaultValue: "Actions" })}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {failedQueueItems.map((item, index) => {
                        const raw = item as unknown as Record<string, unknown>
                        const metadata = (raw.metadata && typeof raw.metadata === "object")
                          ? (raw.metadata as Record<string, unknown>)
                          : null
                        const workItem = (raw.work_item && typeof raw.work_item === "object")
                          ? (raw.work_item as Record<string, unknown>)
                          : null
                        const errorObj = (raw.error && typeof raw.error === "object")
                          ? (raw.error as Record<string, unknown>)
                          : null

                        const fileLabel = item.filename
                          || item.file_path
                          || (typeof raw.file_name === "string" ? raw.file_name : undefined)
                          || (typeof raw.path === "string" ? raw.path : undefined)
                          || (typeof metadata?.filename === "string" ? metadata.filename : undefined)
                          || (typeof metadata?.file_path === "string" ? metadata.file_path : undefined)
                          || (typeof workItem?.filename === "string" ? workItem.filename : undefined)
                          || (typeof workItem?.file_path === "string" ? workItem.file_path : undefined)
                          || (typeof item.id === "string" && item.id.trim().length > 0 ? item.id : undefined)
                          || t("metadataUnavailable", { ns: "monitoring", defaultValue: "Metadata unavailable" })

                        const workType = item.work_type
                          || (typeof raw.type === "string" ? raw.type : undefined)
                          || (typeof raw.task_type === "string" ? raw.task_type : undefined)
                          || (typeof metadata?.work_type === "string" ? metadata.work_type : undefined)
                          || (typeof workItem?.work_type === "string" ? workItem.work_type : undefined)

                        const retryCount = item.retry_count
                          ?? (typeof raw.retries === "number" ? raw.retries : undefined)
                          ?? (typeof raw.retry_attempt === "number" ? raw.retry_attempt : undefined)
                          ?? (typeof metadata?.retry_count === "number" ? metadata.retry_count : undefined)
                          ?? (typeof workItem?.retry_count === "number" ? workItem.retry_count : undefined)

                        const maxRetries = item.max_retries
                          ?? (typeof raw.max_retry === "number" ? raw.max_retry : undefined)
                          ?? (typeof metadata?.max_retries === "number" ? metadata.max_retries : undefined)
                          ?? (typeof workItem?.max_retries === "number" ? workItem.max_retries : undefined)

                        const resolvedError = item.error_message
                          || (typeof raw.last_error === "string" ? raw.last_error : undefined)
                          || (typeof raw.message === "string" ? raw.message : undefined)
                          || (typeof metadata?.error_message === "string" ? metadata.error_message : undefined)
                          || (typeof workItem?.error_message === "string" ? workItem.error_message : undefined)
                          || (typeof errorObj?.message === "string" ? errorObj.message : undefined)
                          || (typeof errorObj?.detail === "string" ? errorObj.detail : undefined)
                          || (failureSummaryEntries.length > 0 ? failureSummaryEntries[0][0] : undefined)

                        const rowKey = (typeof item.id === "string" && item.id.trim().length > 0)
                          ? item.id
                          : `failed-row-${index}`

                        const retryItemId = (typeof item.id === "string" && item.id.trim().length > 0)
                          ? item.id
                          : null
                        const retryShareId = (typeof item.share_id === "string" && item.share_id.trim().length > 0)
                          ? item.share_id
                          : failedFilterShare
                        const isRowRetryable = Boolean(retryItemId && retryShareId)

                        return (
                          <tr key={rowKey} className="border-b align-top">
                            <td className="py-2">
                              <Checkbox
                                checked={selectedFailedItemIds.has(rowKey)}
                                onCheckedChange={(checked) => handleToggleFailedItem(rowKey, Boolean(checked))}
                                aria-label={`Select failed item ${rowKey}`}
                              />
                            </td>
                            <td className="py-2 pr-2">
                              <div className="max-w-[280px] truncate text-xs font-medium">{fileLabel}</div>
                              <div className="text-[11px] text-muted-foreground">{item.share_id || failedFilterShare || "-"}</div>
                            </td>
                            <td className="py-2 pr-2">
                              <div className="text-xs">{workType || t("unknown", { ns: "monitoring", defaultValue: "Unknown" })}</div>
                              <div className="text-[11px] text-muted-foreground">retry {retryCount ?? "-"}/{maxRetries ?? "-"}</div>
                            </td>
                            <td className="py-2">
                              <div className="max-w-[420px] truncate text-xs text-muted-foreground">{resolvedError || "-"}</div>
                            </td>
                            <td className="py-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => {
                                  if (!retryShareId || !retryItemId) return
                                  handleRetrySingleFailedItem(retryShareId, retryItemId)
                                }}
                                disabled={isRetrying || !isRowRetryable}
                              >
                                {t("retry", { ns: "monitoring", defaultValue: "Retry" })}
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">{t("noDataAvailable", { ns: "monitoring" })}</div>
              )}
            </CardContent>
          </Card>

          {incidentError ? <p className="text-xs text-destructive">{incidentError}</p> : null}
        </div>
      </TabsContent>

      <TabsContent value="optimization">
        <div className="space-y-4">
          <Card>
            <CardHeader className="space-y-3 pb-2">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <CardTitle className="text-sm font-medium">
                  {t("guidedAutoTuning", { ns: "monitoring", defaultValue: "Guided Auto-Tuning" })}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={fetchOptimizationData}
                    disabled={isLoadingOptimization}
                  >
                    <IconRefresh className={`mr-1 h-3 w-3 ${isLoadingOptimization ? "animate-spin" : ""}`} />
                    {t("refresh", { ns: "common", defaultValue: "Refresh" })}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleRollbackTuning}
                    disabled={isRollingBackTuning || isApplyingTuning}
                  >
                    <IconRefresh className={`mr-1 h-3 w-3 ${isRollingBackTuning ? "animate-spin" : ""}`} />
                    {t("rollback", { ns: "monitoring", defaultValue: "Rollback" })}
                  </Button>
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                <div className="rounded border p-2 text-xs">
                  <div className="text-muted-foreground">{t("tunerStatus", { ns: "monitoring", defaultValue: "Tuner status" })}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant={(tuningStatus?.enabled ?? false) ? "outline" : "destructive"}>
                      {String(tuningStatus?.status ?? ((tuningStatus?.enabled ?? false) ? "enabled" : "disabled"))}
                    </Badge>
                  </div>
                </div>
                <div className="rounded border p-2 text-xs">
                  <div className="text-muted-foreground">{t("recommendationQueue", { ns: "monitoring", defaultValue: "Recommendation queue" })}</div>
                  <div className="mt-1 font-mono text-sm">{recommendationRows.length}</div>
                </div>
                <div className="rounded border p-2 text-xs">
                  <div className="text-muted-foreground">{t("lastRun", { ns: "monitoring", defaultValue: "Last run" })}</div>
                  <div className="mt-1 text-sm">{tuningStatus?.last_run_at ? new Date(tuningStatus.last_run_at).toLocaleString() : "-"}</div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {t("changeReason", { ns: "monitoring", defaultValue: "Change reason (required for apply/rollback)" })}
                </label>
                <Textarea
                  value={tuningReason}
                  onChange={(event) => setTuningReason(event.target.value)}
                  placeholder={t("changeReasonPlaceholder", {
                    ns: "monitoring",
                    defaultValue: "Example: Reduce queue latency during high pending pressure"
                  })}
                  className="min-h-[72px] text-sm"
                />
              </div>

              {optimizationNotice ? (
                <p className="text-xs text-emerald-700">{optimizationNotice}</p>
              ) : null}
              {optimizationError ? (
                <p className="text-xs text-destructive">{optimizationError}</p>
              ) : null}
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {t("recommendationQueue", { ns: "monitoring", defaultValue: "Recommendation queue" })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recommendationRows.length > 0 ? (
                <div className="space-y-2">
                  {recommendationRows.map((recommendation, index) => {
                    const parameter = String(recommendation.parameter ?? "-")
                    const currentValue = String(recommendation.currentValue ?? "-")
                    const nextValue = String(recommendation.nextValue ?? "-")
                    const rationale = typeof recommendation.rationale === "string" ? recommendation.rationale : ""
                    const impactScore = typeof recommendation.impactScore === "number"
                      ? recommendation.impactScore
                      : null

                    return (
                      <div key={`${parameter}-${index}`} className="rounded border p-3">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-medium">{parameter}</div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-[11px]">
                              {t("impactScore", { ns: "monitoring", defaultValue: "Impact" })}: {impactScore ?? "-"}
                            </Badge>
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleApplyTuningRecommendation(recommendation)}
                              disabled={isApplyingTuning || isRollingBackTuning}
                            >
                              {t("apply", { ns: "monitoring", defaultValue: "Apply" })}
                            </Button>
                          </div>
                        </div>

                        <div className="grid gap-2 text-xs md:grid-cols-2">
                          <div className="rounded bg-muted/40 p-2">
                            <div className="text-muted-foreground">{t("before", { ns: "monitoring", defaultValue: "Before" })}</div>
                            <div className="font-mono">{currentValue}</div>
                          </div>
                          <div className="rounded bg-muted/40 p-2">
                            <div className="text-muted-foreground">{t("after", { ns: "monitoring", defaultValue: "After" })}</div>
                            <div className="font-mono">{nextValue}</div>
                          </div>
                        </div>

                        {rationale ? (
                          <p className="mt-2 text-xs text-muted-foreground">{rationale}</p>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {isLoadingOptimization
                    ? t("loading", { ns: "monitoring", defaultValue: "Loading..." })
                    : t("noRecommendations", { ns: "monitoring", defaultValue: "No recommendations available." })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {t("tuningTimeline", { ns: "monitoring", defaultValue: "Tuning timeline" })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timelineRows.length > 0 ? (
                <div className="space-y-2">
                  {timelineRows.map((row) => (
                    <div key={row.id} className="rounded border p-2 text-xs">
                      {(() => {
                        const diff = computeDiffBadge(row.before, row.after)
                        return (
                          <>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-[11px]">{row.action}</Badge>
                          <span className="font-medium">{row.parameter}</span>
                        </div>
                        <span className="text-muted-foreground">{new Date(row.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground">
                        <span>{t("before", { ns: "monitoring", defaultValue: "Before" })}: {String(row.before)}</span>
                        <span>|</span>
                        <span>{t("after", { ns: "monitoring", defaultValue: "After" })}: {String(row.after)}</span>
                        <Badge variant="outline" className={`text-[11px] ${diff.className}`}>
                          {diff.arrow} {diff.label}
                        </Badge>
                      </div>
                      {row.reason ? <div className="mt-1 text-muted-foreground">{String(row.reason)}</div> : null}
                          </>
                        )
                      })()}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">{t("noHistory", { ns: "monitoring", defaultValue: "No tuning history available." })}</div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="tasks">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <TasksSummaryCard stats={taskStats} className="md:col-span-1 lg:col-span-1" />
          <AclCacheCard stats={monitoring.aclCacheStats} className="md:col-span-1 lg:col-span-1" />
        </div>
      </TabsContent>

      {/* NER Tab */}
      <TabsContent value="ner">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="md:col-span-1 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("nerStatus", { ns: "monitoring" })}</CardTitle>
              <IconActivity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {isLoadingNerStatus ? (
                    <Badge variant="outline">
                      {t("checking", { ns: "monitoring", defaultValue: "Checking..." })}
                    </Badge>
                  ) : nerStatusError ? (
                    <Badge variant="destructive">
                      {t("notConnected", { ns: "monitoring", defaultValue: "Not connected" })}
                    </Badge>
                  ) : (
                    <Badge
                      variant="default"
                      className={normalizedNerStatus?.isRunning ? "bg-green-600" : "bg-amber-600"}
                    >
                      {normalizedNerStatus?.isRunning
                        ? t("activeStatus", { ns: "monitoring" })
                        : t("unknown", { ns: "monitoring", defaultValue: "Unknown" })}
                    </Badge>
                  )}
                </div>
                {nerStatusError ? (
                  <p className="text-xs text-muted-foreground">{nerStatusError}</p>
                ) : normalizedNerStatus?.message ? (
                  <p className="text-xs text-muted-foreground">{normalizedNerStatus.message}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">{t("nerServiceRunning", { ns: "monitoring" })}</p>
                )}
                {normalizedNerStatus?.device && (
                  <p className="text-xs text-muted-foreground">{t("nerDeviceLabel", { ns: "monitoring" })}: {normalizedNerStatus.device}</p>
                )}
                {normalizedNerStatus?.model && (
                  <p className="text-xs text-muted-foreground">{t("nerModelLabel", { ns: "monitoring" })}: {normalizedNerStatus.model}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  )
}
