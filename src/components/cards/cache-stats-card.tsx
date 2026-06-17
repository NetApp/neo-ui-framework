// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import { useTranslation } from "react-i18next"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Clock, HardDrive } from "lucide-react"
import { IconTable } from "@tabler/icons-react"
import { useSettings } from "@/context/settings-context"

interface CacheStatsCardProps {
    cacheStats?: {
        sizeBytes: number
        items: number
    }
    className?: string
}

export function CacheStatsCard({ cacheStats, className }: CacheStatsCardProps) {
    const { t } = useTranslation()
    const { monitoringTtl, filesTtl, cacheMaxSize } = useSettings()

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <IconTable className="h-5 w-5" />
                    {t("cacheStatistics", { ns: "monitoring" })}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("ttlConfiguration", { ns: "monitoring" })}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{t("monitoringLabel", { ns: "monitoring" })}:</span>
                            <Badge variant="outline" className="font-mono text-xs">
                                {monitoringTtl} {t("minSuffix", { ns: "monitoring" })}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{t("filesLabel", { ns: "monitoring" })}:</span>
                            <Badge variant="outline" className="font-mono text-xs">
                                {filesTtl} {t("minSuffix", { ns: "monitoring" })}
                            </Badge>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <HardDrive className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("storageLimit", { ns: "monitoring" })}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{t("maxSizeLabel", { ns: "monitoring" })}:</span>
                            <Badge variant="outline" className="font-mono text-xs">
                                {cacheMaxSize} MB
                            </Badge>
                        </div>
                    </div>

                    <Separator />

                    {/* Current Usage */}
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                            <IconTable className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("currentUsage", { ns: "monitoring" })}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">{t("sizeLabel", { ns: "monitoring" })}:</span>
                            <Badge variant="outline" className="font-mono text-xs">
                                {formatBytes(cacheStats?.sizeBytes || 0)}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">{t("itemsLabel", { ns: "monitoring" })}:</span>
                            <Badge variant="outline" className="font-mono text-xs">
                                {cacheStats?.items || 0}
                            </Badge>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
