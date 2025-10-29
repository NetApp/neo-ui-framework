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
  const licenseStatus = license?.status ?? "Not available"
  const licenseExpiry = license?.expires_on ?? null
  const versionLabel = version?.version ?? "Unknown"
  const latestLabel = version?.latest ?? version?.build ?? "Unknown"

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Health</CardTitle>
          <CardDescription>Overall connector status</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold capitalize">{healthStatus}</p>
          {health && (
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <p>CPU: {health.metrics.cpu_percent.toFixed(1)}%</p>
              <p>Memory: {health.metrics.memory_percent.toFixed(1)}%</p>
              <p>Disk: {health.metrics.disk_percent.toFixed(1)}%</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardTitle>License</CardTitle>
          <CardDescription>Activation state</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold capitalize">{licenseStatus}</p>
          {licenseExpiry && (
            <p className="mt-2 text-sm text-muted-foreground">
              Expires: {new Date(licenseExpiry).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Version</CardTitle>
          <CardDescription>Current deployment</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{versionLabel}</p>
        </CardContent>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Latest</CardTitle>
          <CardDescription>Most recent build</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{latestLabel}</p>
        </CardContent>
      </Card>
    </div>
  )
}