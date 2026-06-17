// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import {
    GitBranch,
    Box,
    Activity,
    CheckIcon,
    AlertCircleIcon,
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
import type { VersionResponse, HelmChartVersionResponse, HealthResponse, LicenseResponse } from "@/services/neo-api"
import { IconDeviceDesktop, IconLayersDifference, IconPackage } from "@tabler/icons-react"

interface VersioningCardProps {
    version: VersionResponse | null
    helmChartVersion: HelmChartVersionResponse | null
    health: HealthResponse | null
    license: LicenseResponse | null
    className?: string
}

export function VersioningCard({ version, helmChartVersion, health, license, className }: VersioningCardProps) {
    const { t } = useTranslation()
    const versionLabel = version?.version ?? t("unknown", { ns: "monitoring" })
    const healthStatus = health?.status ?? t("notConnected", { ns: "monitoring" })
    const healthComponents = Object.entries(health?.components ?? {})
    const latestAppVersion = helmChartVersion?.app_version ?? t("checking", { ns: "monitoring" })
    const latestChartVersion = helmChartVersion?.chart_version ?? t("checking", { ns: "monitoring" })
    const [latestUiVersion, setLatestUiVersion] = useState<string>(t("checking", { ns: "monitoring" }))

    useEffect(() => {
        const fetchLatestVersion = async () => {
            try {
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

                const response = await fetch("https://api.github.com/repos/NetApp/neo-ui-framework/releases/latest", {
                    signal: controller.signal
                })
                clearTimeout(timeoutId)

                if (response.ok) {
                    const data = await response.json()
                    setLatestUiVersion(data.tag_name || "n/a")
                } else {
                    setLatestUiVersion("n/a")
                }
            } catch {
                setLatestUiVersion("n/a")
            }
        }

        fetchLatestVersion()
    }, [])

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    {t("systemVersions", { ns: "monitoring" })}
                </CardTitle>
                <CardDescription>
                    {t("softwareVersioning", { ns: "monitoring" })}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Current Versions */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Box className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Core</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                                {versionLabel}
                            </Badge>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <IconDeviceDesktop className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Console</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                                <a
                                    href="https://github.com/NetApp/neo-ui-framework"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline hover:text-primary transition-colors"
                                >
                                    {__APP_VERSION__}
                                </a>
                            </Badge>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* System Status & License Overview */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("statusLabel", { ns: "monitoring" })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge
                                variant="outline"
                                className={`${health?.status === "healthy"
                                    ? "text-green-600 border-green-200 dark:text-green-400 dark:border-green-800"
                                    : "text-destructive border-destructive/50"
                                    }`}
                            >
                                {healthStatus}
                            </Badge>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <CheckIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("licenseLabel", { ns: "monitoring" })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge
                                variant="outline"
                                className={`${(() => {
                                    const days = license?.details?.days_remaining
                                    if (typeof days !== "number") return ""
                                    if (days < 10) return "text-destructive border-destructive/50"
                                    return "text-green-600 border-green-200 dark:text-green-400 dark:border-green-800"
                                })()}`}
                            >
                                {license?.details?.days_remaining ?? t("unknown", { ns: "monitoring" })} {t("daysSuffix", { ns: "monitoring" })}
                            </Badge>
                        </div>
                    </div>
                </div>

                {healthComponents.length > 0 && (
                    <>
                        <Separator />

                        {/* Component Status */}
                        <div>
                            <h4 className="text-sm font-medium mb-3">{t("componentHealth", { ns: "monitoring" })}</h4>
                            <div className="space-y-2 text-sm">
                                {healthComponents.map(([key, value]) => {
                                    const isHealthy = value === "ok" || value === "healthy"
                                    const isNotConfigured = value === "not_configured"

                                    let badgeClass = "text-destructive border-destructive/50"
                                    let Icon = AlertCircleIcon

                                    if (isHealthy) {
                                        badgeClass = "text-green-600 border-green-200 dark:text-green-400 dark:border-green-800"
                                        Icon = CheckIcon
                                    } else if (isNotConfigured) {
                                        badgeClass = "text-orange-600 border-orange-200 dark:text-orange-400 dark:border-orange-800"
                                        Icon = AlertCircleIcon
                                    }

                                    const statusText = isHealthy
                                        ? t("healthy", { ns: "monitoring" })
                                        : isNotConfigured
                                            ? t("notConfigured", { ns: "monitoring" })
                                            : value

                                    return (
                                        <div key={key} className="flex items-center justify-between">
                                            <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}:</span>
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
                    </>
                )}

                <Separator />

                {/* Latest Available Versions */}
                <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <IconLayersDifference className="h-4 w-4" />
                        {t("latestAvailableVersions", { ns: "monitoring" })}
                    </h4>

                    <div className="space-y-3 text-sm">
                        {/* Helm Chart */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <IconPackage className="h-3 w-3" />
                                <span>{t("helmChart", { ns: "monitoring" })}</span>
                            </div>
                            <Badge variant="outline" className="font-mono text-xs">
                                <a
                                    href="https://github.com/NetApp/Innovation-Labs/tree/main/charts/netapp-neo"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline hover:text-primary transition-colors"
                                >
                                    {latestChartVersion}
                                </a>
                            </Badge>
                        </div>

                        {/* Neo Core (was App Version) */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Box className="h-3 w-3" />
                                <span>{t("neoCore", { ns: "monitoring" })}</span>
                            </div>
                            <Badge variant="outline" className="font-mono text-xs">
                                {helmChartVersion?.app_version === "Unknown" ? t("unableToCheck", { ns: "monitoring" }) : latestAppVersion}
                            </Badge>
                        </div>

                        {/* UI Framework Placeholder */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <IconDeviceDesktop className="h-3 w-3" />
                                <span>{t("neoConsole", { ns: "monitoring" })}</span>
                            </div>
                            <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
                                {latestUiVersion}
                            </Badge>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
