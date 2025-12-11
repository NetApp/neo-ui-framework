"use client"

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
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
                    Cache Statistics
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">TTL Configuration</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Monitoring:</span>
                            <span className="font-mono">{monitoringTtl} min</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Files:</span>
                            <span className="font-mono">{filesTtl} min</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <HardDrive className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Storage Limit</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Max Size:</span>
                            <span className="font-mono">{cacheMaxSize} MB</span>
                        </div>
                    </div>

                    <Separator />

                    {/* Current Usage */}
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                            <IconTable className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Current Usage</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Size:</span>
                            <span className="font-mono">{formatBytes(cacheStats?.sizeBytes || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Items:</span>
                            <span className="font-mono">{cacheStats?.items || 0}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
