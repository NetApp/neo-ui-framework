"use client"

import {
    Server,
    Database,
    Activity,
    Info
} from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import type { AclCacheStatisticsResponse } from "@/services/models"

interface AclCacheCardProps {
    stats: AclCacheStatisticsResponse | null
    className?: string
}

export function AclCacheCard({ stats, className }: AclCacheCardProps) {
    if (!stats) return null

    // Determine status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case "hot": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800"
            case "warm": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
            case "cold": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800"
            default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
        }
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Server className="h-5 w-5" />
                        ACL Cache Stats
                    </div>
                    <Badge variant="outline" className={getStatusColor(stats.status)}>
                        {stats.status.toUpperCase()}
                    </Badge>
                </CardTitle>
                <CardDescription>
                    Access Control List cache performance
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Capacity */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Database className="h-4 w-4" />
                            <span className="text-sm font-medium">Capacity Used</span>
                        </div>
                        <span className="text-sm font-mono">{stats.capacity_used_percent.toFixed(1)}%</span>
                    </div>
                    {/* Progress bar for capacity */}
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full ${stats.capacity_used_percent > 90 ? 'bg-red-500' : 'bg-primary'}`}
                            style={{ width: `${Math.min(stats.capacity_used_percent, 100)}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{stats.size} items</span>
                        <span>Max: {stats.max_size}</span>
                    </div>
                </div>

                <Separator />

                {/* Performance Stats */}
                <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Performance
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/50 p-2 rounded border">
                            <div className="text-xs text-muted-foreground">Hit Rate</div>
                            <div className="text-xl font-bold">{(stats.hit_rate * 100).toFixed(1)}%</div>
                        </div>
                        <div className="bg-muted/50 p-2 rounded border">
                            <div className="text-xs text-muted-foreground">Total Requests</div>
                            <div className="text-xl font-bold">{stats.total_requests.toLocaleString()}</div>
                        </div>
                        <div className="bg-muted/50 p-2 rounded border">
                            <div className="text-xs text-muted-foreground">Hits</div>
                            <div className="text-lg font-mono">{stats.hits.toLocaleString()}</div>
                        </div>
                        <div className="bg-muted/50 p-2 rounded border">
                            <div className="text-xs text-muted-foreground">Misses</div>
                            <div className="text-lg font-mono">{stats.misses.toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                {/* Recommendations */}
                {stats.recommendations && stats.recommendations.length > 0 && (
                    <>
                        <Separator />
                        <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-md border border-yellow-200 dark:border-yellow-900/50">
                            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2 flex items-center gap-2">
                                <Info className="h-4 w-4" />
                                Recommendations
                            </h4>
                            <ul className="list-disc pl-4 text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                                {stats.recommendations.map((rec, i) => (
                                    <li key={i}>{rec}</li>
                                ))}
                            </ul>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
