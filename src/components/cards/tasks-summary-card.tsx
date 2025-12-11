// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import {
    ListTodo,
    CheckCircle2,
    XCircle,
    Clock,
    Ban,
    PlayCircle
} from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { TaskStatisticsResponse } from "@/services/models"

interface TasksSummaryCardProps {
    stats: TaskStatisticsResponse | null
    className?: string
}

export function TasksSummaryCard({ stats, className }: TasksSummaryCardProps) {
    if (!stats) return null

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ListTodo className="h-5 w-5" />
                    Tasks Summary
                </CardTitle>
                <CardDescription>
                    Overview of background task execution status
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Total Tasks */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <ListTodo className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Total Tasks</span>
                    </div>
                    <div className="text-2xl font-bold">{stats.total_tasks}</div>
                </div>

                <Separator />

                {/* Task Status Breakdown */}
                <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        Status Breakdown
                    </h4>

                    <div className="space-y-3 text-sm">
                        {/* Running */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <PlayCircle className="h-3 w-3 text-blue-500" />
                                <span>Running</span>
                            </div>
                            <span className="font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-xs font-bold">
                                {stats.by_status.running}
                            </span>
                        </div>

                        {/* Pending */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-3 w-3 text-yellow-500" />
                                <span>Pending</span>
                            </div>
                            <span className="font-mono bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded text-xs">
                                {stats.by_status.pending}
                            </span>
                        </div>

                        {/* Completed */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                <span>Completed</span>
                            </div>
                            <span className="font-mono bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded text-xs">
                                {stats.by_status.completed}
                            </span>
                        </div>

                        {/* Failed */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <XCircle className="h-3 w-3 text-red-500" />
                                <span>Failed</span>
                            </div>
                            <span className="font-mono bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-0.5 rounded text-xs">
                                {stats.by_status.failed}
                            </span>
                        </div>

                        {/* Cancelled */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Ban className="h-3 w-3 text-gray-500" />
                                <span>Cancelled</span>
                            </div>
                            <span className="font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded text-xs">
                                {stats.by_status.cancelled}
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
