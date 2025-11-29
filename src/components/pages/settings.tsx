"use client"

import { useState, useEffect } from "react"
import { useSettings } from "@/context/settings-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Save } from "lucide-react"
import type { LogLevel } from "@/services/app-logger"

export default function Settings() {
    const { monitoringTtl, filesTtl, cacheMaxSize, logLevel, updateSettings } = useSettings()

    const [localMonitoringTtl, setLocalMonitoringTtl] = useState(monitoringTtl)
    const [localFilesTtl, setLocalFilesTtl] = useState(filesTtl)
    const [localCacheMaxSize, setLocalCacheMaxSize] = useState(cacheMaxSize)
    const [localLogLevel, setLocalLogLevel] = useState<LogLevel>(logLevel)

    // Sync local state with context when context changes (e.g. initial load)
    useEffect(() => {
        setLocalMonitoringTtl(monitoringTtl)
        setLocalFilesTtl(filesTtl)
        setLocalCacheMaxSize(cacheMaxSize)
        setLocalLogLevel(logLevel)
    }, [monitoringTtl, filesTtl, cacheMaxSize, logLevel])

    const handleSave = () => {
        updateSettings({
            monitoringTtl: Number(localMonitoringTtl),
            filesTtl: Number(localFilesTtl),
            cacheMaxSize: Number(localCacheMaxSize),
            logLevel: localLogLevel,
        })
        toast.success("Settings saved successfully")
    }

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    <div className="px-4 lg:px-6">
                        <h1 className="text-2xl font-bold tracking-tight mb-4">Settings</h1>

                        <div className="grid gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Cache Configuration</CardTitle>
                                    <CardDescription>
                                        Manage the performance and memory usage of the application cache.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="monitoring-ttl">Monitoring Data TTL (minutes)</Label>
                                        <Input
                                            id="monitoring-ttl"
                                            type="number"
                                            min="1"
                                            value={localMonitoringTtl}
                                            onChange={(e) => setLocalMonitoringTtl(Number(e.target.value))}
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            How long to keep monitoring data (tasks, workers, etc.) in memory.
                                        </p>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="files-ttl">Files Data TTL (minutes)</Label>
                                        <Input
                                            id="files-ttl"
                                            type="number"
                                            min="1"
                                            value={localFilesTtl}
                                            onChange={(e) => setLocalFilesTtl(Number(e.target.value))}
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            How long to keep file lists and metadata in memory.
                                        </p>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="cache-size">Max Cache Size (MB)</Label>
                                        <Input
                                            id="cache-size"
                                            type="number"
                                            min="10"
                                            value={localCacheMaxSize}
                                            onChange={(e) => setLocalCacheMaxSize(Number(e.target.value))}
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            Maximum approximate memory usage for the cache before eviction starts.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Logging Configuration</CardTitle>
                                    <CardDescription>
                                        Control the verbosity of application logs.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="log-level">Minimum Log Level</Label>
                                        <Select
                                            value={localLogLevel}
                                            onValueChange={(value) => setLocalLogLevel(value as LogLevel)}
                                        >
                                            <SelectTrigger id="log-level">
                                                <SelectValue placeholder="Select log level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="DEBUG">DEBUG (All logs)</SelectItem>
                                                <SelectItem value="INFO">INFO (Standard logs)</SelectItem>
                                                <SelectItem value="WARN">WARN (Warnings only)</SelectItem>
                                                <SelectItem value="ERROR">ERROR (Errors only)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-sm text-muted-foreground">
                                            Set the minimum severity level for logs to be recorded and displayed.
                                            Higher levels reduce console noise and memory usage.
                                        </p>
                                    </div>

                                    <div className="pt-4">
                                        <Button onClick={handleSave}>
                                            <Save className="mr-2 size-4" />
                                            Save Changes
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
