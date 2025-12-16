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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
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
    const [isCompleting, setIsCompleting] = useState(false)
    const [resetResult, setResetResult] = useState<{ success: boolean; message: string } | null>(null)
    const [completeResult, setCompleteResult] = useState<{ success: boolean; message: string } | null>(null)
    const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false)

    const handleReset = async () => {
        setIsResetting(true)
        setResetResult(null)
        try {
            let response
            if (status?.message === "LICENSE RECONFIGURATION MODE: Configure a valid license for connector ID: netappneo") {
                response = await handlers.factoryReset({
                    confirm: true,
                    preserve_encryption_key: true
                })
            } else {
                response = await handlers.resetSetup()
            }

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

    const handleCompleteSetup = async () => {
        setIsCompleting(true)
        setIsCompleteDialogOpen(false)
        setCompleteResult(null)
        try {
            const response = await handlers.completeSetup()
            if (response.success) {
                setCompleteResult({ success: true, message: "Setup completed successfully. Application will restart automatically in 30 seconds." })
                setTimeout(() => {
                    window.location.reload()
                }, 30000)
            } else {
                setCompleteResult({ success: false, message: response.message || "Failed to complete setup." })
            }
        } catch (error) {
            setCompleteResult({ success: false, message: "Failed to complete setup." })
        } finally {
            setIsCompleting(false)
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

                {/* Reset and Complete Section */}
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
                    {completeResult && (
                        <Alert variant={completeResult.success ? "default" : "destructive"} className={completeResult.success ? "border-green-500 text-green-600 dark:border-green-500 dark:text-green-500" : ""}>
                            {completeResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                            <AlertTitle>{completeResult.success ? "Success" : "Error"}</AlertTitle>
                            <AlertDescription>
                                {completeResult.message}
                            </AlertDescription>
                        </Alert>
                    )}
                    <div className="flex gap-2">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleReset}
                            className="flex-1"
                            disabled={isResetting || isCompleting}
                        >
                            {isResetting ? "Resetting..." : "Reset Setup"}
                        </Button>

                        {status.steps_completed.includes("license") && (
                            <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="default"
                                        size="sm"
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                        disabled={isResetting || isCompleting}
                                    >
                                        {isCompleting ? "Completing..." : "Setup Complete"}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Complete Setup & Restart?</DialogTitle>
                                        <DialogDescription>
                                            This will conclude the setup of Neo Core and trigger a restart of the container with the current configuration.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>Cancel</Button>
                                        <Button onClick={handleCompleteSetup} className="bg-green-600 hover:bg-green-700">Confirm & Restart</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
