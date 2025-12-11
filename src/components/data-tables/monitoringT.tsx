"use client"

import { useEffect, useState } from "react"
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
import { NeoInstanceCard } from "@/components/cards/neo-instance-card"
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

  const handleRetryWorkItems = onRetryWorkItems
  const [isRetrying, setIsRetrying] = useState(false)

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

  return (
    <Tabs defaultValue="neo" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="neo">Neo Instance</TabsTrigger>
        <TabsTrigger value="data-corpus">Data Corpus</TabsTrigger>
        <TabsTrigger value="crawling">Crawling Jobs</TabsTrigger>
        <TabsTrigger value="tasks">Tasks</TabsTrigger>
      </TabsList>

      {/* Neo Tab */}
      <TabsContent value="neo">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* System Versions Card */}
          <VersioningCard
            version={version}
            helmChartVersion={helmChartVersion}
            className="md:col-span-1 lg:col-span-1"
          />

          {/* Neo Instance Card */}
          <NeoInstanceCard
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
              <CardTitle className="text-sm font-medium">Workers</CardTitle>
              <IconUsers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {workers ? (
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{workers?.total_workers ?? 0}</div>
                  <p className="text-xs text-muted-foreground">Total workers</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Active</span>
                      <Badge variant="default">{workers?.active_workers ?? 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Stopping</span>
                      <Badge variant="secondary">{workers?.stopping_workers ?? 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Stopped</span>
                      <Badge variant="outline">{workers?.stopped_workers ?? 0}</Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>

          {/* Work Queue Overview */}
          <Card className="md:col-span-1 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Work Queue</CardTitle>
              <IconActivity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {overview?.work_queue ? (
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{overview?.work_queue?.total_items ?? 0}</div>
                  <p className="text-xs text-muted-foreground">Total items</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Pending: {overview?.work_queue?.pending_items ?? 0}</span>
                      <span>Processing: {overview?.work_queue?.processing_items ?? 0}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Claimed: {overview?.work_queue?.claimed_items ?? 0}</span>
                      <span className="text-destructive">Failed: {overview?.work_queue?.failed_items ?? 0}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>

          {/* Enumeration Status */}
          <Card className="md:col-span-1 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enumeration</CardTitle>
              <IconActivity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {enumeration ? (
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{enumeration?.completed_enumerations_last_24h ?? 0}</div>
                  <p className="text-xs text-muted-foreground">Completed (24h)</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Avg Duration:</span>
                      <span>{enumeration?.avg_enumeration_duration_seconds?.toFixed(1) ?? "0.0"}s</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Active:</span>
                      <Badge variant="default">{enumeration?.active_enumerations?.length ?? 0}</Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>

          {/* Graph Rate Limit */}
          <Card className="md:col-span-1 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Graph Rate Limit</CardTitle>
              <IconClock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {graphRateLimit ? (
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{graphRateLimit?.requests_remaining ?? 0}</div>
                  <p className="text-xs text-muted-foreground">Requests remaining</p>
                  <Progress
                    value={((graphRateLimit?.requests_remaining ?? 0) / ((graphRateLimit?.requests_made ?? 0) + (graphRateLimit?.requests_remaining ?? 1))) * 100}
                    className="h-2"
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span>Made: {graphRateLimit?.requests_made ?? 0}</span>
                    <Badge variant={graphRateLimit?.rate_limited ? "destructive" : "default"}>
                      {graphRateLimit?.rate_limited ? "Limited" : "Active"}
                    </Badge>
                  </div>
                  {graphRateLimit?.reset_time && (
                    <p className="text-xs text-muted-foreground">
                      Resets: {new Date(graphRateLimit.reset_time).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Failed Items</CardTitle>
                {failedItems && failedItems.total_failed_items > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="h-7 text-xs"
                  >
                    <IconRefresh className={`mr-1 h-3 w-3 ${isRetrying ? "animate-spin" : ""}`} />
                    Retry failed items
                  </Button>
                )}
              </div>
              <IconAlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {failedItems ? (
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-destructive">{failedItems?.total_failed_items ?? 0}</div>
                  <p className="text-xs text-muted-foreground">Total failed</p>
                  {failedItems?.failed_items && failedItems.failed_items.length > 0 && (
                    <div className="space-y-1">
                      <Separator />
                      <p className="text-xs font-medium">Recent failures:</p>
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
                <div className="text-sm text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>

        </div>
      </TabsContent>

      <TabsContent value="tasks">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          <TasksSummaryCard stats={taskStats} />
          <AclCacheCard stats={monitoring.aclCacheStats} />
        </div>
      </TabsContent>
    </Tabs>
  )
}
