// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import {
    Activity,
    Server,
    ListChecks,
    Info
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
import type { SetupStatusResponse } from "@/services/neo-api"

interface NeoSetupStatusCardProps {
    status: SetupStatusResponse | null
    className?: string
}

export function NeoSetupStatusCard({ status, className }: NeoSetupStatusCardProps) {
    if (!status) return null

    const stepsCompletedCount = status.steps_completed.length
    const requiredStepsCount = status.required_steps.length

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Setup
                </CardTitle>
                <CardDescription>
                    Current configuration status of the Neo Core connector
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Overall Status */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Status</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge
                                variant="outline"
                                className={`${status.setup_complete
                                    ? "text-green-600 border-green-200 dark:text-green-400 dark:border-green-800"
                                    : "text-orange-600 border-orange-200 dark:text-orange-400 dark:border-orange-800"
                                    } text-xl px-3 py-1`}
                            >
                                {status.setup_complete ? "Complete" : "In Progress"}
                            </Badge>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <ListChecks className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Steps</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold">
                                {stepsCompletedCount} / {requiredStepsCount}
                            </span>
                            <span className="text-sm text-muted-foreground">Required</span>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Required Steps */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <ListChecks className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Required Steps</span>
                    </div>
                    <div className="grid gap-2">
                        {status.required_steps.map((step, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                                <div className={`h-2 w-2 rounded-full ${status.steps_completed.includes(step)
                                        ? "bg-green-500"
                                        : "bg-muted-foreground/30"
                                    }`} />
                                <span className={status.steps_completed.includes(step) ? "text-foreground" : "text-muted-foreground"}>
                                    {step}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <Separator />

                {/* Configuration Details */}
                <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Server className="h-4 w-4" />
                        Configuration Details
                    </h4>
                    <div className="grid gap-3 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Database Configured:</span>
                            <Badge variant="outline" className={status.database_configured ? "text-green-600 border-green-200" : "text-destructive border-destructive/50"}>
                                {status.database_configured ? "Yes" : "No"}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Config Storage:</span>
                            <Badge variant="outline" className="text-blue-600 border-blue-200">
                                {status.config_storage}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Persistent:</span>
                            <Badge variant="outline" className={status.persistence_info.persistent ? "text-green-600 border-green-200" : "text-orange-600 border-orange-200"}>
                                {status.persistence_info.persistent ? "Yes" : "No"}
                            </Badge>
                        </div>
                    </div>
                </div>

                {status.message && (
                    <div className="rounded-md bg-muted p-3">
                        <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 mt-0.5 text-blue-500" />
                            <p className="text-sm">{status.message}</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
