// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  IconAlertTriangle,
  IconClock,
  IconUsers,
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
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
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
  const {
    overview,
    workers,
    enumeration,
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
  const stoppingWorkers = workers?.stopping_workers
    ?? workers?.workers?.filter((worker) => worker.status === "stopping").length
    ?? 0
  const stoppedWorkers = workers?.stopped_workers
    ?? workers?.workers?.filter((worker) => worker.status === "stopped").length
    ?? 0

  const workQueue = overview?.work_queue
  const pendingItems = workQueue?.total_pending ?? workQueue?.pending_items ?? 0
  const claimedItems = workQueue?.total_claimed ?? workQueue?.claimed_items ?? 0
  const processingItems = workQueue?.total_processing ?? workQueue?.processing_items ?? 0
  const failedItemsCount = workQueue?.total_failed ?? workQueue?.failed_items ?? 0
  const abandonedItems = workQueue?.total_abandoned ?? workQueue?.abandoned_items ?? 0
  const totalItems = workQueue?.total_items ?? (pendingItems + claimedItems + processingItems + failedItemsCount + abandonedItems)

  const handleRetryWorkItems = onRetryWorkItems
  const [isRetrying, setIsRetrying] = useState(false)
  const [isLoadingNerStatus, setIsLoadingNerStatus] = useState(false)
  const [nerStatusError, setNerStatusError] = useState<string | null>(null)
  const [nerStatus, setNerStatus] = useState<Record<string, unknown> | null>(null)

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

  const handleRetry = async () => {
    if (!failedItems?.failed_items || failedItems.failed_items.length === 0) return

    setIsRetrying(true)
    try {
      // Group items by share_id
      const itemsByShare: Record<string, string[]> = {}
      failedItems.failed_items.forEach((item) => {
        if (!itemsByShare[item.share_id]) {
          itemsByShare[item.share_id] = []
        }
        itemsByShare[item.share_id].push(item.id)
      })

      // Send retry request for each share
      await Promise.all(
        Object.entries(itemsByShare).map(([shareId, workItemIds]) =>
          handleRetryWorkItems(shareId, workItemIds)
        )
      )

      // Refresh data
      await onRefreshMonitoring()
    } catch (error) {
      console.error("Retry failed:", error)
    } finally {
      setIsRetrying(false)
    }
  }

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
    const fetchNerStatus = async () => {
      if (!token) return

      setIsLoadingNerStatus(true)
      setNerStatusError(null)
      try {
        const api = new NeoApiService()
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
  }, [token, t])

  return (
    <Tabs defaultValue="neo" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="neo">{t("neoTab", { ns: "monitoring" })}</TabsTrigger>
        <TabsTrigger value="data-corpus">{t("dataCorpusTab", { ns: "monitoring" })}</TabsTrigger>
        <TabsTrigger value="crawling">{t("crawlingTab", { ns: "monitoring" })}</TabsTrigger>
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Workers Status */}
          <Card className="md:col-span-1 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("workers", { ns: "monitoring" })}</CardTitle>
              <IconUsers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {workers ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">{workers?.total_workers ?? 0}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("totalWorkers", { ns: "monitoring" })}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span>{t("active", { ns: "monitoring" })}</span>
                      <Badge variant="outline" className="font-mono text-xs">{workers?.active_workers ?? 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t("stale", { ns: "monitoring", defaultValue: "Stale" })}</span>
                      <Badge variant="outline" className="font-mono text-xs">{staleWorkers}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t("stopping", { ns: "monitoring" })}</span>
                      <Badge variant="outline" className="font-mono text-xs">{stoppingWorkers}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t("stopped", { ns: "monitoring" })}</span>
                      <Badge variant="outline" className="font-mono text-xs">{stoppedWorkers}</Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">{t("noDataAvailable", { ns: "monitoring" })}</div>
              )}
            </CardContent>
          </Card>

          {/* Work Queue Overview */}
          <Card className="md:col-span-1 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("workQueue", { ns: "monitoring" })}</CardTitle>
              <IconActivity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {workQueue ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">{totalItems}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{t("totalItems", { ns: "monitoring" })}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">{processingItems}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{t("processing", { ns: "monitoring" })}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span>{t("pending", { ns: "monitoring" })}</span>
                      <Badge variant="outline" className="font-mono text-xs">{pendingItems}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t("claimed", { ns: "monitoring" })}</span>
                      <Badge variant="outline" className="font-mono text-xs">{claimedItems}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-destructive">{t("failed", { ns: "monitoring" })}</span>
                      <Badge variant="outline" className="font-mono text-xs text-destructive border-destructive/50">{failedItemsCount}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-destructive">{t("abandoned", { ns: "monitoring", defaultValue: "Abandoned" })}</span>
                      <Badge variant="outline" className="font-mono text-xs text-destructive border-destructive/50">{abandonedItems}</Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">{t("noDataAvailable", { ns: "monitoring" })}</div>
              )}
            </CardContent>
          </Card>

          {/* Enumeration Status */}
          <Card className="md:col-span-1 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("enumeration", { ns: "monitoring" })}</CardTitle>
              <IconActivity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {enumeration ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">{enumeration?.completed_enumerations_last_24h ?? 0}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("completed24h", { ns: "monitoring" })}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{t("avgDuration", { ns: "monitoring" })}:</span>
                      <Badge variant="outline" className="font-mono text-xs">{enumeration?.avg_enumeration_duration_seconds?.toFixed(1) ?? "0.0"}s</Badge>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>{t("active", { ns: "monitoring" })}:</span>
                      <Badge variant="outline" className="font-mono text-xs">{enumeration?.active_enumerations?.length ?? 0}</Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">{t("noDataAvailable", { ns: "monitoring" })}</div>
              )}
            </CardContent>
          </Card>

          {/* Graph Rate Limit */}
          <Card className="md:col-span-1 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("graphRateLimit", { ns: "monitoring" })}</CardTitle>
              <IconClock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {graphRateLimit ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">{graphRateLimit?.requests_remaining ?? 0}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("requestsRemaining", { ns: "monitoring" })}</p>
                  <Progress
                    value={((graphRateLimit?.requests_remaining ?? 0) / ((graphRateLimit?.requests_made ?? 0) + (graphRateLimit?.requests_remaining ?? 1))) * 100}
                    className="h-2"
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1">
                      {t("made", { ns: "monitoring" })}:
                      <Badge variant="outline" className="font-mono text-xs">{graphRateLimit?.requests_made ?? 0}</Badge>
                    </span>
                    <Badge variant={graphRateLimit?.rate_limited ? "destructive" : "default"}>
                      {graphRateLimit?.rate_limited ? t("limited", { ns: "monitoring" }) : t("activeStatus", { ns: "monitoring" })}
                    </Badge>
                  </div>
                  {graphRateLimit?.reset_time && (
                    <p className="text-xs text-muted-foreground">
                      {t("resets", { ns: "monitoring" })}: {new Date(graphRateLimit.reset_time).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">{t("noDataAvailable", { ns: "monitoring" })}</div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">{t("failedItems", { ns: "monitoring" })}</CardTitle>
                {failedItems && failedItems.total_failed_items > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="h-7 text-xs"
                  >
                    <IconRefresh className={`mr-1 h-3 w-3 ${isRetrying ? "animate-spin" : ""}`} />
                    {t("retryFailedItems", { ns: "monitoring" })}
                  </Button>
                )}
              </div>
              <IconAlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {failedItems ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-destructive border-destructive/50">{failedItems?.total_failed_items ?? 0}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("totalFailed", { ns: "monitoring" })}</p>
                  {failedItems?.failed_items && failedItems.failed_items.length > 0 && (
                    <div className="space-y-1">
                      <Separator />
                      <p className="text-xs font-medium">{t("recentFailures", { ns: "monitoring" })}</p>
                      {failedItems.failed_items.slice(0, 3).map((item, index) => (
                        <div key={index} className="text-xs">
                          <div className="truncate font-medium">{item.filename || item.file_path}</div>
                          <div className="text-muted-foreground truncate">{item.error_message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">{t("noDataAvailable", { ns: "monitoring" })}</div>
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
