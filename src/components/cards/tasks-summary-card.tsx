// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import { useTranslation } from "react-i18next"
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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { TaskStatisticsResponse } from "@/services/models"

interface TasksSummaryCardProps {
    stats: TaskStatisticsResponse | null
    className?: string
}

export function TasksSummaryCard({ stats, className }: TasksSummaryCardProps) {
    const { t } = useTranslation()
    if (!stats) return null

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ListTodo className="h-5 w-5" />
                    {t("tasksSummary", { ns: "monitoring" })}
                </CardTitle>
                <CardDescription>
                    {t("tasksSummaryDescription", { ns: "monitoring" })}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Total Tasks */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <ListTodo className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{t("totalTasks", { ns: "monitoring" })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">{stats.total_tasks}</Badge>
                    </div>
                </div>

                <Separator />

                {/* Task Status Breakdown */}
                <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        {t("statusBreakdown", { ns: "monitoring" })}
                    </h4>

                    <div className="space-y-3 text-sm">
                        {/* Running */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <PlayCircle className="h-3 w-3 text-blue-500" />
                                <span>{t("running", { ns: "monitoring" })}</span>
                            </div>
                            <Badge variant="outline" className="font-mono text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                                {stats.by_status.running}
                            </Badge>
                        </div>

                        {/* Pending */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-3 w-3 text-yellow-500" />
                                <span>{t("pending", { ns: "monitoring" })}</span>
                            </div>
                            <Badge variant="outline" className="font-mono text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800">
                                {stats.by_status.pending}
                            </Badge>
                        </div>

                        {/* Completed */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                <span>{t("completed", { ns: "monitoring" })}</span>
                            </div>
                            <Badge variant="outline" className="font-mono text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                                {stats.by_status.completed}
                            </Badge>
                        </div>

                        {/* Failed */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <XCircle className="h-3 w-3 text-red-500" />
                                <span>{t("failed", { ns: "monitoring" })}</span>
                            </div>
                            <Badge variant="outline" className="font-mono text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">
                                {stats.by_status.failed}
                            </Badge>
                        </div>

                        {/* Cancelled */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Ban className="h-3 w-3 text-gray-500" />
                                <span>{t("cancelled", { ns: "monitoring" })}</span>
                            </div>
                            <Badge variant="outline" className="font-mono text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700">
                                {stats.by_status.cancelled}
                            </Badge>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
