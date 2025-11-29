"use client"

import {
    GitBranch,
    Tag,
    Layers,
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

interface VersioningCardProps {
    version: VersionResponse | null
    helmChartVersion: HelmChartVersionResponse | null
    className?: string
}

export function VersioningCard({ version, helmChartVersion, className }: VersioningCardProps) {
    const versionLabel = version?.version ?? "Unknown"
    const buildDateLabel = version?.build_date
        ? version.build_date.split("T")[0] ?? "Unknown"
        : "Unknown"
    const latestAppVersion = helmChartVersion?.app_version ?? "Checking..."
    const latestChartVersion = helmChartVersion?.chart_version ?? "Checking..."

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    System Versions
                </CardTitle>
                <CardDescription>
                    Software versioning and release information
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Current Versions */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Box className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Neo Core</span>
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
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">UI Framework</span>
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
                        <Layers className="h-4 w-4" />
                        Latest Available Versions
                    </h4>

                    <div className="space-y-3 text-sm">
                        {/* Helm Chart */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Box className="h-3 w-3" />
                                <span>Helm Chart</span>
                            </div>
                            <a
                                href="https://github.com/NetApp/Innovation-Labs/tree/main/charts/netapp-copilot-connector"
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
                                <span>Neo Core</span>
                            </div>
                            <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">
                                {helmChartVersion?.app_version === "Unknown" ? "Unable to check" : latestAppVersion}
                            </span>
                        </div>

                        {/* UI Framework Placeholder */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Tag className="h-3 w-3" />
                                <span>UI Framework</span>
                            </div>
                            <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs text-muted-foreground">
                                Checking...
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
