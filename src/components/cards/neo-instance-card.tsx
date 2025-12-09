"use client"

import {
    Activity,
    CheckIcon,
    AlertCircleIcon,
    HardDrive
} from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { HealthResponse, LicenseResponse } from "@/services/neo-api"
import { IconCpu, IconRuler3, IconArrowsJoin } from "@tabler/icons-react"

interface NeoInstanceCardProps {
    health: HealthResponse | null
    license: LicenseResponse | null
    className?: string
}

export function NeoInstanceCard({ health, license, className }: NeoInstanceCardProps) {
    const healthStatus = health?.status ?? "Not connected"
    const healthComponents = [
        { key: "database", label: "Database" },
        { key: "filesystem", label: "Filesystem" },
        { key: "graph_connector", label: "Graph Connector" },
        { key: "shares", label: "Shares" },
    ]

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <IconArrowsJoin className="h-5 w-5" />
                    Neo Instance
                </CardTitle>
                <CardDescription>
                    System health, license status, and resource usage
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* System Status & License Overview */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">System Status</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge
                                variant="outline"
                                className={`${health?.status === "healthy"
                                    ? "text-green-600 border-green-200 dark:text-green-400 dark:border-green-800"
                                    : "text-destructive border-destructive/50"
                                    } text-xl px-3 py-1`}
                            >
                                {healthStatus}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Last check: {health?.timestamp ? new Date(health.timestamp).toLocaleString() : "Unknown"}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <CheckIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">License</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge
                                variant="outline"
                                className={`${(() => {
                                    const days = license?.details.days_remaining
                                    if (typeof days !== 'number') return ""
                                    if (days < 10) return "text-destructive border-destructive/50"
                                    if (days < 90) return "text-orange-600 border-orange-200 dark:text-orange-400 dark:border-orange-800"
                                    return "text-green-600 border-green-200 dark:text-green-400 dark:border-green-800"
                                })()} text-xl px-3 py-1`}
                            >
                                {license?.details.days_remaining ?? "Unknown"} days
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            ID: {license?.details.connection_id ?? "Unknown"}
                        </p>
                    </div>
                </div>

                <Separator />

                {/* Resource Metrics */}
                <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Resource Usage
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-lg border p-3 text-center">
                            <IconCpu className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
                            <p className="text-xl font-bold">{health?.metrics?.cpu_percent?.toFixed(1) ?? "0.0"}%</p>
                            <p className="text-xs text-muted-foreground">CPU</p>
                        </div>
                        <div className="rounded-lg border p-3 text-center">
                            <IconRuler3 className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
                            <p className="text-xl font-bold">{health?.metrics?.memory_percent?.toFixed(1) ?? "0.0"}%</p>
                            <p className="text-xs text-muted-foreground">Memory</p>
                        </div>
                        <div className="rounded-lg border p-3 text-center">
                            <HardDrive className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
                            <p className="text-xl font-bold">{health?.metrics?.disk_percent?.toFixed(1) ?? "0.0"}%</p>
                            <p className="text-xs text-muted-foreground">Disk</p>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Component Status Table */}
                <div>
                    <h4 className="text-sm font-medium mb-3">Component Health</h4>
                    <div className="space-y-2 text-sm">
                        {healthComponents.map(({ key, label }) => {
                            if (!health || !health.components) return null
                            const component = health.components[key as keyof typeof health.components]
                            let isHealthy = false
                            let isNotConfigured = false
                            let statusText = "Unknown"

                            if (key === "shares" && component && 'active_count' in component) {
                                isHealthy = component.errors.length === 0
                                statusText = isHealthy ? "Healthy" : "Errors"
                            } else if (component && 'status' in component) {
                                isHealthy = component.status === "healthy"
                                isNotConfigured = component.status === "not_configured"
                                statusText = component.status
                            }

                            let badgeClass = "text-destructive border-destructive/50"
                            let Icon = AlertCircleIcon

                            if (isHealthy) {
                                badgeClass = "text-green-600 border-green-200 dark:text-green-400 dark:border-green-800"
                                Icon = CheckIcon
                            } else if (isNotConfigured) {
                                badgeClass = "text-orange-600 border-orange-200 dark:text-orange-400 dark:border-orange-800"
                                Icon = AlertCircleIcon
                            }

                            return (
                                <div key={key} className="flex items-center justify-between">
                                    <span className="text-muted-foreground">{label}:</span>
                                    <Badge
                                        variant="outline"
                                        className={`gap-1 ${badgeClass}`}
                                    >
                                        <Icon className="h-3 w-3" />
                                        {statusText}
                                    </Badge>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
