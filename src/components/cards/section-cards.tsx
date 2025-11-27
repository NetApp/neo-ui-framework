"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

import type {
  HealthResponse,
  LicenseResponse,
  VersionResponse,
  HelmChartVersionResponse,
  // DatabaseSizeResponse
} from "@/services/neo-api"
import { IconCpu, IconRuler3 } from "@tabler/icons-react"
import { HardDrive, CheckIcon, AlertCircleIcon, Info } from "lucide-react"
// import { DatabaseSizeCard } from "@/components/charts/databasesize"

interface SectionCardsProps {
  health: HealthResponse | null
  license: LicenseResponse | null
  version: VersionResponse | null
  helmChartVersion: HelmChartVersionResponse | null
  className?: string
}

export function SectionCards({ health, license, version, helmChartVersion, className }: SectionCardsProps) {
  const [healthDialogOpen, setHealthDialogOpen] = useState(false)

  // Derive card values
  const healthStatus = health?.status ?? "Not connected"
  const versionLabel = version?.version ?? "Unknown"
  const buildDateLabel = version?.build_date
    ? version.build_date.split("T")[0] ?? "Unknown"
    : "Unknown"
  const latestAppVersion = helmChartVersion?.app_version ?? "Checking..."
  const latestChartVersion = helmChartVersion?.chart_version ?? "Checking..."

  const healthComponents = [
    { key: "database", label: "Database" },
    { key: "filesystem", label: "Filesystem" },
    { key: "graph_connector", label: "Graph Connector" },
    { key: "shares", label: "Shares" },
  ]

  return (
    <>
      {/* Existing top row cards */}
      <div className={`*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 ${className}`}>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Neo Instance</CardDescription>
            <CardTitle className="text-lg font-semibold">
              <Button
                variant="ghost"
                size={null}
                className="h-auto p-0 hover:bg-transparent font-semibold text-lg"
                onClick={() => setHealthDialogOpen(true)}
                aria-label="View detailed health status information"
              >
                {healthStatus}
                <Info className="ml-1 h-4 w-4" aria-hidden="true" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {health && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <IconCpu className="text-muted-foreground" aria-hidden="true" />
                <span> {health.metrics.cpu_percent.toFixed(1)}%</span> |
                <IconRuler3 className="text-muted-foreground" aria-hidden="true" />
                <span>{health.metrics.memory_percent.toFixed(1)}%</span> |
                <HardDrive className="text-muted-foreground" aria-hidden="true" />
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

      {/* Health Status Dialog */}
      <Dialog open={healthDialogOpen} onOpenChange={setHealthDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>System Health Status</DialogTitle>
            <DialogDescription>
              Detailed health information for all system components
            </DialogDescription>
          </DialogHeader>

          {health ? (
            <div className="space-y-4">
              {/* Overall Status */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Overall Status</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(health.timestamp).toLocaleString()}
                  </p>
                </div>
                <Badge
                  variant={health.status === "healthy" ? "default" : "destructive"}
                  className={`text-base ${health.status === "healthy"
                      ? "bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                      : ""
                    }`}
                >
                  {health.status}
                </Badge>
              </div>

              <Separator />

              {/* Components Status */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Components</h3>
                {healthComponents.map(({ key, label }) => {
                  const component = health.components[key as keyof typeof health.components]

                  // Handle shares component differently (has active_count and errors)
                  if (key === "shares" && component && 'active_count' in component) {
                    const isHealthy = component.errors.length === 0
                    return (
                      <div key={key} className="rounded-lg border p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-medium">{label}</p>
                              <p className="text-sm text-muted-foreground">
                                {component.active_count} active share{component.active_count !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={isHealthy ? "default" : "destructive"}
                            className={`gap-1 ${isHealthy
                                ? "bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                                : ""
                              }`}
                          >
                            {isHealthy ? (
                              <CheckIcon className="h-3 w-3" />
                            ) : (
                              <AlertCircleIcon className="h-3 w-3" />
                            )}
                            {isHealthy ? "Healthy" : "Errors"}
                          </Badge>
                        </div>
                        {!isHealthy && component.errors.length > 0 && (
                          <div className="mt-3 space-y-1">
                            {component.errors.map((error, idx) => (
                              <p key={idx} className="text-sm text-destructive">
                                • {error}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  }

                  // Handle other components (database, filesystem, graph_connector)
                  if (component && 'status' in component) {
                    const isHealthy = component.status === "healthy"
                    return (
                      <div key={key} className="rounded-lg border p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{label}</p>
                          </div>
                          <Badge
                            variant={isHealthy ? "default" : "destructive"}
                            className={`gap-1 ${isHealthy
                                ? "bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                                : ""
                              }`}
                          >
                            {isHealthy ? (
                              <CheckIcon className="h-3 w-3" />
                            ) : (
                              <AlertCircleIcon className="h-3 w-3" />
                            )}
                            {component.status}
                          </Badge>
                        </div>
                        {component.error && (
                          <p className="mt-2 text-sm text-destructive">
                            Error: {component.error}
                          </p>
                        )}
                      </div>
                    )
                  }

                  return null
                })}
              </div>

              <Separator />

              {/* System Metrics */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">System Metrics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg border p-3 text-center">
                    <IconCpu className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
                    <p className="text-2xl font-bold">{health.metrics.cpu_percent.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">CPU</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <IconRuler3 className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
                    <p className="text-2xl font-bold">{health.metrics.memory_percent.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">Memory</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <HardDrive className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
                    <p className="text-2xl font-bold">{health.metrics.disk_percent.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">Disk</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No health data available
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Database Size Card - spans 2 columns */}
      {/* <div className="px-4 lg:px-6">
        <DatabaseSizeCard databaseSize={databaseSize} />
      </div> */}
    </>
  )
}