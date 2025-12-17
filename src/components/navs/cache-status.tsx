// Copyright 2025 NetApp, Inc. All Rights Reserved.
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { IconDatabase } from "@tabler/icons-react"
import { Progress } from "@/components/ui/progress"

import { useSettings } from "@/context/settings-context"

interface CacheStatusProps {
    stats?: {
        sizeBytes: number
        maxSizeBytes: number
        items: number
    }
}

function formatBytes(bytes: number, decimals = 2) {
    if (!bytes) return "0 Bytes"
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function CacheStatus({ stats }: CacheStatusProps) {
    const { monitoringTtl, filesTtl } = useSettings()
    const navigate = useNavigate()

    if (!stats) return null

    const percentUsed = stats.maxSizeBytes > 0
        ? Math.min((stats.sizeBytes / stats.maxSizeBytes) * 100, 100)
        : 0

    return (
        <HoverCard>
            <HoverCardTrigger asChild>
                <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => navigate("/settings?tab=cache")}
                >
                    <IconDatabase className="h-4 w-4" />
                    Cache
                </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-[500px]" align="end">
                <div className="flex justify-between space-x-4">
                    <div className="space-y-1">
                        <h4 className="font-semibold leading-none tracking-tight">Cache Status</h4>
                        <p className="text-sm text-muted-foreground">
                            Current usage of the local cache
                        </p>
                    </div>
                </div>
                <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Usage</span>
                            <span className="font-medium">{Math.round(percentUsed)}%</span>
                        </div>
                        <Progress value={percentUsed} className="h-2" />
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">Mon. TTL</span>
                            <span className="text-sm font-medium">{monitoringTtl} min</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">Files TTL</span>
                            <span className="text-sm font-medium">{filesTtl} min</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">Items</span>
                            <span className="text-sm font-medium">{stats.items.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">Size</span>
                            <span className="text-sm font-medium">
                                {formatBytes(stats.sizeBytes)}
                                <span className="text-xs text-muted-foreground ml-1">
                                    / {formatBytes(stats.maxSizeBytes)}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    )
}
