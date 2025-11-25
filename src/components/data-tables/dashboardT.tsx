"use client"

import { useEffect } from "react"
import {
  IconRefresh,
  IconAlertTriangle,
  IconClock,
  IconUsers,
  IconActivity
} from "@tabler/icons-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
} from "@/services/neo-api"
import { FileTypeChart } from "@/components/charts/filetype"
import { SharesDistributionChart } from "@/components/charts/sharesdistribution"
import { DatabaseSizeCard } from "@/components/charts/databasesize"
import { ContentSavingsChart } from "@/components/charts/contentsavings"

interface DashboardChartProps {
  monitoring: {
    overview: MonitoringOverviewResponse | null
    workers: MonitoringWorkersResponse | null
    enumeration: MonitoringEnumerationResponse | null
    graphRateLimit: MonitoringGraphRateLimitResponse | null
    failedItems: MonitoringFailedItemsResponse | null
    tasks: TasksResponse[] | null
    taskStats: TaskStatisticsResponse | null
    fileAnalytics: { file_type: string; count: number; total_size: number }[] | null
    sharesAnalytics: { share_id: string; share_name: string; share_path: string; count: number; total_size: number }[] | null
  }
  databaseSize: DatabaseSizeResponse | null
  onRefreshMonitoring: () => Promise<void>
}

export function DashboardChart({ databaseSize, monitoring, onRefreshMonitoring }: DashboardChartProps) {
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Refresh Controls */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Monitoring Overview
            <Button
              size="sm"
              onClick={onRefreshMonitoring}
              className="h-8"
            >
              <IconRefresh className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Real-time monitoring data for NetApp Neo operations. Auto-refreshes every 60 seconds.
            {overview?.timestamp && (
              <span className="block mt-1">
                Last updated (UTC): {new Date(overview.timestamp).toLocaleString()}
              </span>
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Database Size Card */}
      <DatabaseSizeCard databaseSize={databaseSize} />

      {/* Content Savings Chart */}
      <ContentSavingsChart databaseSize={databaseSize} />

      {/* File Types Distribution */}
      <FileTypeChart fileAnalytics={fileAnalytics} />

      {/* Document Distribution by Shares */}
      <SharesDistributionChart sharesAnalytics={sharesAnalytics} />

      {/* Work Queue Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Work Queue</CardTitle>
          <IconActivity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {overview?.work_queue ? (
            <div className="space-y-2">
              <div className="text-2xl font-bold">{overview.work_queue.total_items}</div>
              <p className="text-xs text-muted-foreground">Total items</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Pending: {overview.work_queue.pending_items}</span>
                  <span>Processing: {overview.work_queue.processing_items}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Claimed: {overview.work_queue.claimed_items}</span>
                  <span className="text-destructive">Failed: {overview.work_queue.failed_items}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No data available</div>
          )}
        </CardContent>
      </Card>

      {/* Enumeration Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Enumeration</CardTitle>
          <IconActivity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {enumeration ? (
            <div className="space-y-2">
              <div className="text-2xl font-bold">{enumeration.completed_enumerations_last_24h}</div>
              <p className="text-xs text-muted-foreground">Completed (24h)</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Avg Duration:</span>
                  <span>{enumeration.avg_enumeration_duration_seconds.toFixed(1)}s</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Active:</span>
                  <Badge variant="default">{enumeration.active_enumerations.length}</Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No data available</div>
          )}
        </CardContent>
      </Card>

      {/* Workers Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Workers</CardTitle>
          <IconUsers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {workers ? (
            <div className="space-y-2">
              <div className="text-2xl font-bold">{workers.total_workers}</div>
              <p className="text-xs text-muted-foreground">Total workers</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs">Active</span>
                  <Badge variant="default">{workers.active_workers}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Stopping</span>
                  <Badge variant="secondary">{workers.stopping_workers}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Stopped</span>
                  <Badge variant="outline">{workers.stopped_workers}</Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No data available</div>
          )}
        </CardContent>
      </Card>

      {/* Graph Rate Limit */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Graph Rate Limit</CardTitle>
          <IconClock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {graphRateLimit ? (
            <div className="space-y-2">
              <div className="text-2xl font-bold">{graphRateLimit.requests_remaining}</div>
              <p className="text-xs text-muted-foreground">Requests remaining</p>
              <Progress
                value={(graphRateLimit.requests_remaining / (graphRateLimit.requests_made + graphRateLimit.requests_remaining)) * 100}
                className="h-2"
              />
              <div className="flex items-center justify-between text-xs">
                <span>Made: {graphRateLimit.requests_made}</span>
                <Badge variant={graphRateLimit.rate_limited ? "destructive" : "default"}>
                  {graphRateLimit.rate_limited ? "Limited" : "Active"}
                </Badge>
              </div>
              {graphRateLimit.reset_time && (
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

      {/* Failed Items */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Failed Items</CardTitle>
          <IconAlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {failedItems ? (
            <div className="space-y-2">
              <div className="text-2xl font-bold text-destructive">{failedItems.total_failed_items}</div>
              <p className="text-xs text-muted-foreground">Total failed</p>
              {failedItems.failed_items.length > 0 && (
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

      {/* Task Statistics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasks</CardTitle>
          <IconActivity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {taskStats ? (
            <div className="space-y-2">
              <div className="text-2xl font-bold">{taskStats.total_tasks}</div>
              <p className="text-xs text-muted-foreground">Total tasks</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>Pending:</span>
                  <Badge variant="secondary">{taskStats.by_status.pending}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Running:</span>
                  <Badge variant="default">{taskStats.by_status.running}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Completed:</span>
                  <Badge variant="outline">{taskStats.by_status.completed}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Failed:</span>
                  <Badge variant="destructive">{taskStats.by_status.failed}</Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No data available</div>
          )}
        </CardContent>
      </Card>

      {/* File Types Breakdown - to be used for debugging*/}
      {/* <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Document Breakdown</CardTitle>
          <IconActivity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {fileAnalytics && fileAnalytics.length > 0 ? (
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {fileAnalytics.reduce((sum, item) => sum + item.count, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Total documents</p>
              // <div className="space-y-1">
                {fileAnalytics.slice(0, 4).map((item, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="uppercase">{item.file_type}</span>
                    <Badge variant="outline">{item.count}</Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No document data available</div>
          )}
        </CardContent>
      </Card> */}


    </div>
  )
}
