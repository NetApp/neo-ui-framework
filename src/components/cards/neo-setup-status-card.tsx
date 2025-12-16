// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import {
    Activity,
    ListChecks,
    Info,
    AlertTriangle,
    CheckCircle2
} from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { SetupStatusResponse } from "@/services/neo-api"
import { useNeoApi } from "@/hooks/useNeoApi"
import { useState } from "react"

interface NeoSetupStatusCardProps {
    status: SetupStatusResponse | null
    className?: string
}

export function NeoSetupStatusCard({ status, className }: NeoSetupStatusCardProps) {
    const { handlers } = useNeoApi()
    const [isResetting, setIsResetting] = useState(false)
    const [resetResult, setResetResult] = useState<{ success: boolean; message: string } | null>(null)

    const handleReset = async () => {
        setIsResetting(true)
        setResetResult(null)
        try {
            const response = await handlers.resetSetup()
            setResetResult(response)
            if (response.success) {
                setTimeout(() => {
                    window.location.reload()
                }, 1500)
            }
        } catch (error) {
            setResetResult({ success: false, message: "Failed to reset setup." })
        } finally {
            setIsResetting(false)
        }
    }

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
                    Current setup status of the Neo Core connector
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
                        {/* Database Step (Manually added) */}
                        <div className="flex items-center gap-2 text-sm">
                            <div className={`h-2 w-2 rounded-full ${status.database_configured
                                ? "bg-green-500"
                                : "bg-muted-foreground/30"
                                }`} />
                            <span className={status.database_configured ? "text-foreground" : "text-muted-foreground"}>
                                database
                            </span>
                        </div>
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

                {/* Optional Steps */}
                {status.optional_steps.length > 0 && (
                    <div className="mt-4">
                        <div className="flex items-center gap-2 mb-3">
                            <ListChecks className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Optional Steps</span>
                        </div>
                        <div className="grid gap-2">
                            {status.optional_steps.map((step, index) => (
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
                )}

                {status.message && (
                    <div className="rounded-md bg-muted p-3">
                        <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 mt-0.5 text-blue-500" />
                            <p className="text-sm">{status.message}</p>
                        </div>
                    </div>
                )}

                {/* Reset Section */}
                <div className="mt-6 pt-4 border-t space-y-4">
                    {resetResult && (
                        <Alert variant={resetResult.success ? "default" : "destructive"} className={resetResult.success ? "border-green-500 text-green-600 dark:border-green-500 dark:text-green-500" : ""}>
                            {resetResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                            <AlertTitle>{resetResult.success ? "Success" : "Error"}</AlertTitle>
                            <AlertDescription>
                                {resetResult.message}
                            </AlertDescription>
                        </Alert>
                    )}
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleReset}
                        className="w-full"
                        disabled={isResetting}
                    >
                        {isResetting ? "Resetting..." : "Reset Setup"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
