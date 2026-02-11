// Copyright 2025 NetApp, Inc. All Rights Reserved.
import { useEffect, useState, useCallback } from "react"
import {
    MonitoringChart
} from "@/components/data-tables/monitoringT"
import { OverviewCard } from "@/components/cards/overview-card"
import {
    Alert,
    AlertDescription,
    AlertTitle
} from "@/components/ui/alert"
import {
    CheckCircle2Icon,
    AlertCircleIcon
} from "lucide-react"

import type {
    DatabaseSizeResponse,
    MonitoringOverviewResponse,
    MonitoringWorkersResponse,
    MonitoringEnumerationResponse,
    MonitoringGraphRateLimitResponse,
    MonitoringFailedItemsResponse,
    TasksResponse,
    TaskStatisticsResponse,
    AclCacheStatisticsResponse,
    HealthResponse,
    LicenseResponse,
    VersionResponse,
    HelmChartVersionResponse,
} from "@/services/neo-api"
import { AuthenticationError } from "@/services/neo-api"

interface MonitoringProps {
    databaseSize: DatabaseSizeResponse | null
    monitoring: {
        overview: MonitoringOverviewResponse | null
        workers: MonitoringWorkersResponse | null
        enumeration: MonitoringEnumerationResponse | null
        graphRateLimit: MonitoringGraphRateLimitResponse | null
        failedItems: MonitoringFailedItemsResponse | null
        tasks: TasksResponse[] | null
        taskStats: TaskStatisticsResponse | null
        aclCacheStats: AclCacheStatisticsResponse | null
        fileAnalytics: { file_type: string; count: number; total_size: number }[] | null
        sharesAnalytics: { share_id: string; share_name: string; share_path: string; count: number; total_size: number }[] | null
    }
    onFetchMonitoring: (force?: boolean) => Promise<void>
    cacheStats?: {
        sizeBytes: number
        items: number
    }
    onRetryWorkItems: (shareId: string, workItemIds: string[]) => Promise<boolean>
    health: HealthResponse | null
    license: LicenseResponse | null
    version: VersionResponse | null
    helmChartVersion: HelmChartVersionResponse | null
}

export default function Monitoring({
    databaseSize,
    monitoring,
    onFetchMonitoring,
    cacheStats,
    onRetryWorkItems,
    health,
    license,
    version,
    helmChartVersion,
}: MonitoringProps) {
    // const { state } = useNeoApi()
    const [alertMessage, setAlertMessage] = useState<string | null>(null)
    const [alertVariant, setAlertVariant] = useState<"success" | "error">("success")

    const handleFetchMonitoring = useCallback(async (force?: boolean) => {
        try {
            await onFetchMonitoring(force)
        } catch (error) {
            // Suppress alert for authentication errors as they are handled globally
            if (error instanceof AuthenticationError) return

            setAlertVariant("error")
            setAlertMessage(error instanceof Error ? error.message : "Failed to refresh monitoring data")
        }
    }, [onFetchMonitoring])

    useEffect(() => {
        if (!alertMessage) return

        const timer = window.setTimeout(() => {
            setAlertMessage(null)
        }, 5_000)

        return () => window.clearTimeout(timer)
    }, [alertMessage])

    // Load monitoring data on mount
    useEffect(() => {
        handleFetchMonitoring()
    }, [handleFetchMonitoring])

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    <div className="px-4 lg:px-6">
                        {alertMessage ? (
                            <Alert
                                variant={alertVariant === "success" ? "default" : "destructive"}
                                className="mb-4"
                            >
                                {alertVariant === "success" ? <CheckCircle2Icon /> : <AlertCircleIcon />}
                                <AlertTitle>{alertMessage}</AlertTitle>
                                <AlertDescription />
                            </Alert>
                        ) : null}
                        <div className="mb-4">
                            <OverviewCard
                                overview={monitoring.overview}
                                title="Monitoring Overview"
                                showCacheStats={false}
                                cacheStats={cacheStats}
                            />
                        </div>
                        <MonitoringChart
                            databaseSize={databaseSize}
                            monitoring={monitoring}
                            onRefreshMonitoring={onFetchMonitoring}
                            onRetryWorkItems={onRetryWorkItems}
                            health={health}
                            license={license}
                            version={version}
                            helmChartVersion={helmChartVersion}
                            cacheStats={cacheStats}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
