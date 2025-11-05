"use client"

import { useEffect } from "react"
import { 
  SectionCards 
} from "@/components/sections/cards"
import { 
  DashboardChart 
} from "@/components/data-tables/dashboard-chart"
import type { 
  HealthResponse, 
  LicenseResponse, 
  VersionResponse,
  MonitoringOverviewResponse,
  MonitoringWorkersResponse,
  MonitoringEnumerationResponse,
  MonitoringGraphRateLimitResponse,
  MonitoringFailedItemsResponse,
  TasksResponse,
  TaskStatisticsResponse,
  FileAnalyticsResponse
} from "@/services/neo-api"

interface DashboardProps {
  health: HealthResponse | null
  license: LicenseResponse | null
  version: VersionResponse | null
  monitoring: {
    overview: MonitoringOverviewResponse | null
    workers: MonitoringWorkersResponse | null
    enumeration: MonitoringEnumerationResponse | null
    graphRateLimit: MonitoringGraphRateLimitResponse | null
    failedItems: MonitoringFailedItemsResponse | null
    tasks: TasksResponse[] | null
    taskStats: TaskStatisticsResponse | null
    fileAnalytics: { file_type: string; count: number; total_size: number }[] | null
  }
  onFetchMonitoring: () => Promise<void>
}

export default function Dashboard({ health, license, version, monitoring, onFetchMonitoring }: DashboardProps) {
  // Load monitoring data on mount
  useEffect(() => {
    onFetchMonitoring().catch((error) => {
      console.error("Failed to load monitoring data:", error)
    })
  }, [onFetchMonitoring])

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards health={health} license={license} version={version} />
          <div className="px-4 lg:px-6">
            <DashboardChart monitoring={monitoring} onRefreshMonitoring={onFetchMonitoring} />
          </div>
        </div>
      </div>
    </div>
  )
}
