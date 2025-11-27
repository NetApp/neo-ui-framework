"use client"

import { useEffect } from "react"
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
import {
    useState
} from "react"
import type {
    DatabaseSizeResponse,
    MonitoringOverviewResponse,
    MonitoringWorkersResponse,
    MonitoringEnumerationResponse,
    MonitoringGraphRateLimitResponse,
    MonitoringFailedItemsResponse,
    TasksResponse,
    TaskStatisticsResponse,
} from "@/services/neo-api"

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
        fileAnalytics: { file_type: string; count: number; total_size: number }[] | null
        sharesAnalytics: { share_id: string; share_name: string; share_path: string; count: number; total_size: number }[] | null
    }
    onFetchMonitoring: () => Promise<void>
}

export default function Monitoring({ databaseSize, monitoring, onFetchMonitoring }: MonitoringProps) {
    const [alertMessage, setAlertMessage] = useState<string | null>(null)
    const [alertVariant, setAlertVariant] = useState<"success" | "error">("success")

    useEffect(() => {
        if (!alertMessage) return

        const timer = window.setTimeout(() => {
            setAlertMessage(null)
        }, 5_000)

        return () => window.clearTimeout(timer)
    }, [alertMessage])

    // Load monitoring data on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                await onFetchMonitoring()
            } catch (error) {
                setAlertVariant("error")
                setAlertMessage(error instanceof Error ? error.message : "Failed to load monitoring data")
            }
        }
        fetchData()
    }, [onFetchMonitoring])

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
                                description="Real-time monitoring data for NetApp Neo operations. Auto-refreshes every 60 seconds."
                            />
                        </div>
                        <MonitoringChart
                            databaseSize={databaseSize}
                            monitoring={monitoring}
                            onRefreshMonitoring={onFetchMonitoring}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
