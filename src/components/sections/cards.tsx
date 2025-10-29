"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card"
import type { HealthResponse, LicenseResponse, VersionResponse } from "../services/neo-api"

interface SectionCardsProps {
  health: HealthResponse | null
  license: LicenseResponse | null
  version: VersionResponse | null
}

export function SectionCards({ health, license, version }: SectionCardsProps) {
  // Derive card values
  const healthStatus = health?.status ?? "Not connected"
  const licenseStatus = license?.message ?? "Not available"
  const versionLabel = version?.version ?? "Unknown"
  const latestLabel = version?.latest ?? version?.build_date ?? "Unknown"

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>NetApp Neo</CardDescription>
          <CardTitle className="text-lg font-semibold">{healthStatus}</CardTitle>
        </CardHeader>
        <CardContent>
          {health && (
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <p>CPU: {health.metrics.cpu_percent.toFixed(1)}% | Memory: {health.metrics.memory_percent.toFixed(1)}% | Disk: {health.metrics.disk_percent.toFixed(1)}%</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>License</CardDescription>
          <CardTitle className="text-lg font-semibold">{licenseStatus} for {license?.details.days_remaining ?? "Unknown"} days</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mt-2 text-sm text-muted-foreground">Connection ID: {license?.details.connection_id ?? "Unknown"}</p>
        </CardContent>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Version</CardDescription>
          <CardTitle className="text-lg font-semibold">{versionLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mt-2 text-sm text-muted-foreground">Build date: {version?.build_date ?? "Unknown"}</p>
        </CardContent>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Latest</CardDescription>
          <CardTitle className="text-lg font-semibold">Most recent build</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mt-2 text-sm text-muted-foreground">{latestLabel}</p>
        </CardContent>
      </Card>
    </div>
  )
}