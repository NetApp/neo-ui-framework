import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import type { MonitoringOverviewResponse } from "@/services/neo-api"
import { useSettings } from "@/context/settings-context"

import { Database, Clock, HardDrive } from "lucide-react"

interface OverviewCardProps {
    overview: MonitoringOverviewResponse | null
    title?: string
    description?: string
    showCacheStats?: boolean
    variant?: "default" | "files"
    cacheStats?: {
        sizeBytes: number
        items: number
    }
}

export function OverviewCard({
    overview,
    title = "Monitoring Overview",
    description = "Real-time monitoring data for NetApp Neo operations. Auto-refreshes every 60 seconds.",
    showCacheStats = true,
    variant = "default",
    cacheStats
}: OverviewCardProps) {
    const { monitoringTtl, filesTtl, cacheMaxSize } = useSettings()

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
        <Card className="md:col-span-2 lg:col-span-4">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    {title}
                </CardTitle>
                <CardDescription>
                    {description}
                    {overview?.timestamp && (
                        <span className="block mt-1">
                            Last updated (UTC): {new Date(overview.timestamp).toLocaleString()}
                        </span>
                    )}
                    {overview?.timestamp && (
                        <span className="block">
                            Next refresh (UTC): {new Date(new Date(overview.timestamp).getTime() + monitoringTtl * 60 * 1000).toLocaleString()}
                        </span>
                    )}
                </CardDescription>
            </CardHeader>
            {showCacheStats && (
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {variant === "files" ? (
                            <div className="flex flex-col space-y-1.5 p-4 border rounded-lg bg-muted/50">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Database className="h-4 w-4" />
                                    <span className="text-sm font-medium">Caching Strategy</span>
                                </div>
                                <div className="text-2xl font-bold">LRU</div>
                            </div>
                        ) : (
                            <div className="flex flex-col space-y-1.5 p-4 border rounded-lg bg-muted/50">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span className="text-sm font-medium">Monitoring TTL</span>
                                </div>
                                <div className="text-2xl font-bold">{monitoringTtl} min</div>
                            </div>
                        )}
                        <div className="flex flex-col space-y-1.5 p-4 border rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm font-medium">Files TTL</span>
                            </div>
                            <div className="text-2xl font-bold">{filesTtl} min</div>
                        </div>
                        <div className="flex flex-col space-y-1.5 p-4 border rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Database className="h-4 w-4" />
                                <span className="text-sm font-medium">Cache Size Limit</span>
                            </div>
                            <div className="text-2xl font-bold">{cacheMaxSize} MB</div>
                        </div>
                        <div className="flex flex-col space-y-1.5 p-4 border rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <HardDrive className="h-4 w-4" />
                                <span className="text-sm font-medium">Current Usage</span>
                            </div>
                            <div className="flex flex-col">
                                <div className="text-2xl font-bold">{formatBytes(cacheStats?.sizeBytes || 0)}</div>
                                <div className="text-xs text-muted-foreground">{cacheStats?.items || 0} items</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    )
}
