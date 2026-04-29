// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import {
    GitBranch,
    Box
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
import type { VersionResponse, HelmChartVersionResponse } from "@/services/neo-api"
import { IconDeviceDesktop, IconLayersDifference, IconPackage } from "@tabler/icons-react"

interface VersioningCardProps {
    version: VersionResponse | null
    helmChartVersion: HelmChartVersionResponse | null
    className?: string
}

export function VersioningCard({ version, helmChartVersion, className }: VersioningCardProps) {
    const { t } = useTranslation()
    const versionLabel = version?.version ?? t("unknown", { ns: "monitoring" })
    const buildDateLabel = version?.build_date
        ? version.build_date.split("T")[0] ?? t("unknown", { ns: "monitoring" })
        : t("unknown", { ns: "monitoring" })
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
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Box className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("neoCore", { ns: "monitoring" })}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">{versionLabel}</div>
                            <Badge variant="outline">
                                {buildDateLabel}
                            </Badge>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <IconDeviceDesktop className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("uiFramework", { ns: "monitoring" })}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <a
                                href="https://github.com/NetApp/neo-ui-framework"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-2xl font-bold hover:underline hover:text-primary transition-colors"
                            >
                                {__APP_VERSION__}
                            </a>
                        </div>
                    </div>
                </div>

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
                            <a
                                href="https://github.com/NetApp/Innovation-Labs/tree/main/charts/netapp-neo"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono bg-muted px-2 py-0.5 rounded text-xs hover:underline hover:text-primary transition-colors"
                            >
                                {latestChartVersion}
                            </a>
                        </div>

                        {/* Neo Core (was App Version) */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Box className="h-3 w-3" />
                                <span>{t("neoCore", { ns: "monitoring" })}</span>
                            </div>
                            <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">
                                {helmChartVersion?.app_version === "Unknown" ? t("unableToCheck", { ns: "monitoring" }) : latestAppVersion}
                            </span>
                        </div>

                        {/* UI Framework Placeholder */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <IconDeviceDesktop className="h-3 w-3" />
                                <span>{t("neoConsole", { ns: "monitoring" })}</span>
                            </div>
                            <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs text-muted-foreground">
                                {latestUiVersion}
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
