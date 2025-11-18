"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type { 
  HealthResponse, 
  LicenseResponse, 
  VersionResponse,
  HelmChartVersionResponse,
  // DatabaseSizeResponse
} from "@/services/neo-api"
import { IconCpu, IconRuler3 } from "@tabler/icons-react"
import { HardDrive } from "lucide-react"
// import { DatabaseSizeCard } from "@/components/charts/databasesize"

interface SectionCardsProps {
  health: HealthResponse | null
  license: LicenseResponse | null
  version: VersionResponse | null
  helmChartVersion: HelmChartVersionResponse | null  // Add this
}

export function SectionCards({ health, license, version, helmChartVersion }: SectionCardsProps) {
  // Derive card values
  const healthStatus = health?.status ?? "Not connected"
  const versionLabel = version?.version ?? "Unknown"
  const buildDateLabel = version?.build_date
    ? version.build_date.split("T")[0] ?? "Unknown"
    : "Unknown"
  const latestAppVersion = helmChartVersion?.app_version ?? "Checking..."
  const latestChartVersion = helmChartVersion?.chart_version ?? "Checking..."



  return (
    <>
      {/* Existing top row cards */}
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Neo Instance</CardDescription>
            <CardTitle className="text-lg font-semibold">{healthStatus}</CardTitle>
          </CardHeader>
          <CardContent>
            {health && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <IconCpu className="text-muted-foreground" />
                <span> {health.metrics.cpu_percent.toFixed(1)}%</span> | 
                <IconRuler3 className="text-muted-foreground" /> 
                <span>{health.metrics.memory_percent.toFixed(1)}%</span> |
                <HardDrive className="text-muted-foreground" />
                <span>{health.metrics.disk_percent.toFixed(1)}%</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>License</CardDescription>
            <CardTitle className="text-lg font-semibold">Expires in {license?.details.days_remaining ?? "Unknown"} days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>
                Neo ID: {license?.details.connection_id ?? "Unknown"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Version</CardDescription>
            <CardTitle className="text-lg font-semibold">{versionLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>Release Date: {buildDateLabel}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Latest Release</CardDescription>
            <CardTitle className="text-lg font-semibold">
              {helmChartVersion?.app_version === "Unknown" ? "Unable to check" : latestAppVersion}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>Helm Chart: {latestChartVersion}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Database Size Card - spans 2 columns */}
      {/* <div className="px-4 lg:px-6">
        <DatabaseSizeCard databaseSize={databaseSize} />
      </div> */}
    </>
  )
}