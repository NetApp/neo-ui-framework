// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import {
    IconCheck,
    IconAlertTriangle,
    IconCopy
} from "@tabler/icons-react"
import {
    Activity,
    ListChecks,
    CheckCircle2,
    AlertTriangle
} from "lucide-react"
import { useState, useEffect } from "react"
import { useSettings } from "@/context/settings-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Save } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { LogLevel } from "@/services/app-logger"
import type { MonitoringOverviewResponse } from "@/services/neo-api"
import type { McpInfoResponse } from "@/services/models"
import { OverviewCard } from "@/components/cards/overview-card"
import { useSearchParams } from "react-router-dom"
import { useNeoApi } from "@/hooks/useNeoApi"
import { NeoApiService } from "@/services/neo-api"
import { Separator } from "@/components/ui/separator"

interface SettingsProps {
    monitoringOverview: MonitoringOverviewResponse | null
    state: ReturnType<typeof useNeoApi>["state"]
    handlers: ReturnType<typeof useNeoApi>["handlers"]
}

export default function Settings({ monitoringOverview, state, handlers }: SettingsProps) {
    const { monitoringTtl, filesTtl, cacheMaxSize, logLevel, updateSettings } = useSettings()
    const [searchParams, setSearchParams] = useSearchParams()

    const [localMonitoringTtl, setLocalMonitoringTtl] = useState(monitoringTtl)
    const [localFilesTtl, setLocalFilesTtl] = useState(filesTtl)
    const [localCacheMaxSize, setLocalCacheMaxSize] = useState(cacheMaxSize)
    const [localLogLevel, setLocalLogLevel] = useState<LogLevel>(logLevel)

    // Setup Status State
    const [isResetting, setIsResetting] = useState(false)
    const [isCompleting, setIsCompleting] = useState(false)
    const [resetResult, setResetResult] = useState<{ success: boolean; message: string } | null>(null)
    const [completeResult, setCompleteResult] = useState<{ success: boolean; message: string } | null>(null)
    const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false)
    const [isFetchingCredentials, setIsFetchingCredentials] = useState(false)
    const [credentialsInit, setCredentialsInit] = useState<{ username: string; password: string; message: string } | null>(null)
    const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false)
    const [isExpiredDialogOpen, setIsExpiredDialogOpen] = useState(false)
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [passwordError, setPasswordError] = useState<string | null>(null)
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

    // Setup Tab State
    const [licenseKey, setLicenseKey] = useState("")
    const [licenseSaveResult, setLicenseSaveResult] = useState<{ success: boolean; message: string } | null>(null)

    // M365 Copilot Graph Setup State
    const [tenantId, setTenantId] = useState("your-tenant-id")
    const [clientId, setClientId] = useState("your-client-id")
    const [clientSecret, setClientSecret] = useState("your-client-secret")
    const [connectorId, setConnectorId] = useState("netappneo")
    const [connectorName, setConnectorName] = useState("NetApp NEO Connector")
    const [connectorDescription, setConnectorDescription] = useState("The connector contains information contained in the on premises or on-prem file share server. This drive is called J drive and this contains documents and files. These are of type DOC, DOCM, DOCX, DOT, DOTX, EML, GIF, HTML, JPEG, JPG, MHT, MHTML, MSG, NWS, OBD, OBT, ODP, ODS, ODT, ONE, PDF, PNG, POT, PPS, PPT, PPTM, PPTX, TXT, XLB, XLC, XLSB, XLS, XLSX, XLT, XLXM, XML, XPS, and ZIP.")
    const [graphSaveResult, setGraphSaveResult] = useState<{ success: boolean; message: string } | null>(null)

    // Proxy Setup State
    const [proxyUrl, setProxyUrl] = useState("")
    const [proxyUsername, setProxyUsername] = useState("")
    const [proxyPassword, setProxyPassword] = useState("")
    const [proxySaveResult, setProxySaveResult] = useState<{ success: boolean; message: string } | null>(null)

    // SSL Setup State
    const [verifySsl, setVerifySsl] = useState(true)
    const [sslTimeout, setSslTimeout] = useState(30)
    const [caCertificate, setCaCertificate] = useState("")
    const [sslSaveResult, setSslSaveResult] = useState<{ success: boolean; message: string } | null>(null)

    // Sync local state with context when context changes (e.g. initial load)
    useEffect(() => {
        setLocalMonitoringTtl(monitoringTtl)
        setLocalFilesTtl(filesTtl)
        setLocalCacheMaxSize(cacheMaxSize)
        setLocalLogLevel(logLevel)
    }, [monitoringTtl, filesTtl, cacheMaxSize, logLevel])

    const [mcpInfo, setMcpInfo] = useState<McpInfoResponse | null>(null)

    useEffect(() => {
        const fetchMcpInfo = async () => {
            try {
                const info = await handlers.getMcpInfo()
                console.log("Successfully fetched MCP Info:", info)
                setMcpInfo(info)
            } catch (error) {
                console.error("Failed to fetch MCP Info. Error:", error)
            }
        }
        if (state.token) {
            fetchMcpInfo()
        }
    }, [state.token])

    const handleSave = () => {
        updateSettings({
            monitoringTtl: Number(localMonitoringTtl),
            filesTtl: Number(localFilesTtl),
            cacheMaxSize: Number(localCacheMaxSize),
            logLevel: localLogLevel,
        })
        toast.success("Settings saved successfully")
    }

    // Setup Handlers
    const handleReset = async () => {
        setIsResetting(true)
        setResetResult(null)
        try {
            let response
            if (state.setupStatus?.message === "LICENSE RECONFIGURATION MODE: Configure a valid license for connector ID: netappneo") {
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

    const handleGetCredentials = async () => {
        setIsFetchingCredentials(true)
        try {
            const response = await handlers.getInitialCredentials()
            setCredentialsInit(response)
            setIsCredentialsDialogOpen(true)
        } catch (error: any) {
            console.error("Failed to fetch initial credentials", error)
            // Check for 403 Forbidden which indicates credentials have been used
            if (error?.status === 403 || error?.response?.status === 403 || error?.message?.includes("403")) {
                setIsExpiredDialogOpen(true)
            }
        } finally {
            setIsFetchingCredentials(false)
        }
    }

    const handleUpdatePassword = async () => {
        setPasswordError(null)
        if (!newPassword || !confirmPassword) {
            setPasswordError("Please enter both password fields.")
            return
        }
        if (newPassword !== confirmPassword) {
            setPasswordError("Passwords do not match.")
            return
        }
        if (!credentialsInit?.username || !credentialsInit?.password) {
            setPasswordError("Initial credentials not found.")
            return
        }

        setIsUpdatingPassword(true)
        try {
            // We need to authenticate manually here because we are likely not logged in yet,
            // or we are logged in with the wrong context. We want to use the JUST retrieved credentials.
            const api = new NeoApiService()
            const token = await api.authenticate(credentialsInit.username, credentialsInit.password)

            await api.changeMyPassword(token, {
                current_password: credentialsInit.password,
                new_password: newPassword
            })

            setIsCredentialsDialogOpen(false)
            setNewPassword("")
            setConfirmPassword("")
            toast.success("Password updated successfully. You can now log in.")
        } catch (error: any) {
            setPasswordError(error.message || "Failed to update password.")
        } finally {
            setIsUpdatingPassword(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    const handleSaveLicense = async () => {
        setLicenseSaveResult(null)
        if (!licenseKey) {
            setLicenseSaveResult({ success: false, message: "Please enter a license key." })
            return
        }

        const payload = { license_key: licenseKey }
        try {
            const response = await handlers.setupLicense(payload)
            if (response.success) {
                setLicenseSaveResult({ success: true, message: response.message })
                setTimeout(() => {
                    window.location.reload()
                }, 1500)
            } else {
                setLicenseSaveResult({ success: false, message: response.message || "License setup failed." })
            }
        } catch (error) {
            setLicenseSaveResult({ success: false, message: "Failed to configure license." })
        }
    }

    const handleSaveGraph = async () => {
        setGraphSaveResult(null)
        const payload = {
            tenant_id: tenantId,
            client_id: clientId,
            client_secret: clientSecret,
            connector_id: connectorId,
            connector_name: connectorName,
            connector_description: connectorDescription
        }

        try {
            const response = await handlers.setupGraph(payload)
            if (response.success) {
                setGraphSaveResult({ success: true, message: response.message || "Graph configured successfully." })
                setTimeout(() => {
                    window.location.reload()
                }, 1500)
            } else {
                setGraphSaveResult({ success: false, message: response.message || "Graph setup failed." })
            }
        } catch (error) {
            setGraphSaveResult({ success: false, message: "Failed to configure Graph." })
        }
    }

    const handleSaveProxy = async () => {
        setProxySaveResult(null)
        // Placeholder implementation
        setProxySaveResult({ success: true, message: "Proxy settings saved (placeholder)." })
        setTimeout(() => {
            window.location.reload()
        }, 1500)
    }

    const handleSaveSSL = async () => {
        setSslSaveResult(null)
        // Placeholder implementation
        setSslSaveResult({ success: true, message: "SSL settings saved (placeholder)." })
        setTimeout(() => {
            window.location.reload()
        }, 1500)
    }

    const currentTab = searchParams.get("tab") || "neo-core"

    // Derive Steps for Status View
    const setupStatus = state.setupStatus
    const stepsCompletedCount = setupStatus?.steps_completed.length ?? 0
    const requiredStepsCount = setupStatus?.required_steps.length ?? 0

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    <div className="px-4 lg:px-6">
                        <div className="space-y-6">
                            <OverviewCard
                                overview={monitoringOverview}
                                title="Settings"
                                showCacheStats={false}
                            />

                            <Tabs
                                value={currentTab}
                                onValueChange={(value) => setSearchParams({ tab: value })}
                                className="w-full"
                            >
                                <TabsList>
                                    <TabsTrigger value="neo-core">Neo Core Setup</TabsTrigger>
                                    <TabsTrigger value="neo-mcp">Neo MCP</TabsTrigger>
                                    <TabsTrigger value="cache">Cache Configuration</TabsTrigger>
                                    <TabsTrigger value="logging">Logging Configuration</TabsTrigger>
                                </TabsList>
                                <TabsContent value="neo-core">
                                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                                        {/* Setup Configuration */}
                                        <Card className="col-span-1 lg:col-span-3">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Activity className="h-5 w-5" />
                                                    Neo Core Setup
                                                </CardTitle>
                                                <CardDescription>
                                                    Configure and monitor the status of the Neo Core connector.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                {/* STATUS SECTION */}
                                                {setupStatus && (
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-muted/50 rounded-lg">
                                                        {/* Status Badge */}
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <Activity className="h-4 w-4 text-muted-foreground" />
                                                                <span className="text-sm font-medium">Status</span>
                                                            </div>
                                                            <div>
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`${setupStatus.setup_complete
                                                                        ? "text-green-600 border-green-200 dark:text-green-400 dark:border-green-800"
                                                                        : "text-orange-600 border-orange-200 dark:text-orange-400 dark:border-orange-800"
                                                                        } px-3 py-1`}
                                                                >
                                                                    {setupStatus.setup_complete ? "Complete" : "In Progress"}
                                                                </Badge>
                                                            </div>
                                                        </div>

                                                        {/* Step Count */}
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

                                                        {/* Database Status */}
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium">Infrastructure</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <div className={`h-2.5 w-2.5 rounded-full ${setupStatus.database_configured
                                                                    ? "bg-green-500"
                                                                    : "bg-red-500"
                                                                    }`} />
                                                                <span className={setupStatus.database_configured ? "text-foreground font-medium" : "text-muted-foreground"}>
                                                                    Database Configured
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <Separator />

                                                {/* FORMS */}

                                                {/* License Key Setup */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-2.5 w-2.5 rounded-full ${setupStatus?.steps_completed.includes("license")
                                                            ? "bg-green-500"
                                                            : "bg-red-500"
                                                            }`} />
                                                        <h4 className="text-sm font-medium">License Key</h4>
                                                    </div>

                                                    {licenseSaveResult && (
                                                        <Alert variant={licenseSaveResult.success ? "default" : "destructive"} className={licenseSaveResult.success ? "border-green-500 text-green-600 dark:border-green-500 dark:text-green-500" : ""}>
                                                            {licenseSaveResult.success ? <IconCheck className="h-4 w-4" /> : <IconAlertTriangle className="h-4 w-4" />}
                                                            <AlertTitle>{licenseSaveResult.success ? "Success" : "Error"}</AlertTitle>
                                                            <AlertDescription>
                                                                {licenseSaveResult.message}
                                                            </AlertDescription>
                                                        </Alert>
                                                    )}
                                                    <div className="grid gap-2">
                                                        <div className="flex gap-2">
                                                            <Input
                                                                id="license-key"
                                                                value={licenseKey}
                                                                onChange={(e) => setLicenseKey(e.target.value)}
                                                                placeholder="Enter license key..."
                                                                type="password"
                                                            />
                                                            <Button onClick={handleSaveLicense}>Save</Button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Separator />

                                                <Accordion type="multiple" className="w-full">
                                                    {/* M365 Copilot Graph Setup */}
                                                    <AccordionItem value="m365">
                                                        <AccordionTrigger>
                                                            <div className="flex items-center gap-2">
                                                                <div className={`h-2.5 w-2.5 rounded-full ${setupStatus?.steps_completed.includes("graph") || setupStatus?.steps_completed.includes("m365")
                                                                    ? "bg-green-500"
                                                                    : "bg-red-500"
                                                                    }`} />
                                                                <div className="flex flex-col items-start text-left">
                                                                    <h4 className="text-sm font-medium">M365 Copilot Graph Setup (optional)</h4>
                                                                    <p className="text-xs text-muted-foreground font-normal">
                                                                        Configure settings for Microsoft 365 Copilot Graph integration.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </AccordionTrigger>
                                                        <AccordionContent>
                                                            <div className="space-y-4 pt-4 px-1">
                                                                {graphSaveResult && (
                                                                    <Alert variant={graphSaveResult.success ? "default" : "destructive"} className={graphSaveResult.success ? "border-green-500 text-green-600 dark:border-green-500 dark:text-green-500" : ""}>
                                                                        {graphSaveResult.success ? <IconCheck className="h-4 w-4" /> : <IconAlertTriangle className="h-4 w-4" />}
                                                                        <AlertTitle>{graphSaveResult.success ? "Success" : "Error"}</AlertTitle>
                                                                        <AlertDescription>
                                                                            {graphSaveResult.message}
                                                                        </AlertDescription>
                                                                    </Alert>
                                                                )}
                                                                <div className="space-y-4">
                                                                    <h4 className="text-xs font-medium uppercase text-muted-foreground">Required Fields</h4>
                                                                    <div className="grid gap-4 md:grid-cols-3">
                                                                        <div className="grid gap-2">
                                                                            <Label htmlFor="tenant-id">Tenant ID</Label>
                                                                            <Input
                                                                                id="tenant-id"
                                                                                value={tenantId}
                                                                                onChange={(e) => setTenantId(e.target.value)}
                                                                            />
                                                                        </div>
                                                                        <div className="grid gap-2">
                                                                            <Label htmlFor="client-id">Client ID</Label>
                                                                            <Input
                                                                                id="client-id"
                                                                                value={clientId}
                                                                                onChange={(e) => setClientId(e.target.value)}
                                                                            />
                                                                        </div>
                                                                        <div className="grid gap-2">
                                                                            <Label htmlFor="client-secret">Client Secret</Label>
                                                                            <Input
                                                                                id="client-secret"
                                                                                type="password"
                                                                                value={clientSecret}
                                                                                onChange={(e) => setClientSecret(e.target.value)}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-4">
                                                                    <h4 className="text-xs font-medium uppercase text-muted-foreground">Optional Fields</h4>
                                                                    <div className="grid gap-4 md:grid-cols-3">
                                                                        <div className="grid gap-2">
                                                                            <Label htmlFor="connector-id">Connector ID</Label>
                                                                            <Input
                                                                                id="connector-id"
                                                                                value={connectorId}
                                                                                onChange={(e) => setConnectorId(e.target.value)}
                                                                            />
                                                                        </div>
                                                                        <div className="grid gap-2">
                                                                            <Label htmlFor="connector-name">Connector Name</Label>
                                                                            <Input
                                                                                id="connector-name"
                                                                                value={connectorName}
                                                                                onChange={(e) => setConnectorName(e.target.value)}
                                                                            />
                                                                        </div>
                                                                        <div className="grid gap-2">
                                                                            <Label htmlFor="connector-description">Connector Description</Label>
                                                                            <Input
                                                                                id="connector-description"
                                                                                value={connectorDescription}
                                                                                onChange={(e) => setConnectorDescription(e.target.value)}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-end">
                                                                    <Button onClick={handleSaveGraph}>Save M365 Settings</Button>
                                                                </div>
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>

                                                    {/* Proxy Setup */}
                                                    <AccordionItem value="proxy">
                                                        <AccordionTrigger>
                                                            <div className="flex items-center gap-2">
                                                                <div className={`h-2.5 w-2.5 rounded-full ${setupStatus?.steps_completed.includes("proxy")
                                                                    ? "bg-green-500"
                                                                    : "bg-red-500"
                                                                    }`} />
                                                                <div className="flex flex-col items-start text-left">
                                                                    <h4 className="text-sm font-medium">Proxy Setup (optional)</h4>
                                                                    <p className="text-xs text-muted-foreground font-normal">
                                                                        Configure proxy settings for outbound connections.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </AccordionTrigger>
                                                        <AccordionContent>
                                                            <div className="space-y-4 pt-4 px-1">
                                                                {proxySaveResult && (
                                                                    <Alert variant={proxySaveResult.success ? "default" : "destructive"} className={proxySaveResult.success ? "border-green-500 text-green-600 dark:border-green-500 dark:text-green-500" : ""}>
                                                                        {proxySaveResult.success ? <IconCheck className="h-4 w-4" /> : <IconAlertTriangle className="h-4 w-4" />}
                                                                        <AlertTitle>{proxySaveResult.success ? "Success" : "Error"}</AlertTitle>
                                                                        <AlertDescription>
                                                                            {proxySaveResult.message}
                                                                        </AlertDescription>
                                                                    </Alert>
                                                                )}
                                                                <div className="grid gap-4 md:grid-cols-3">
                                                                    <div className="grid gap-2">
                                                                        <Label htmlFor="proxy-url">Proxy URL</Label>
                                                                        <Input
                                                                            id="proxy-url"
                                                                            value={proxyUrl}
                                                                            onChange={(e) => setProxyUrl(e.target.value)}
                                                                            placeholder="http://proxy.example.com:8080"
                                                                        />
                                                                    </div>
                                                                    <div className="grid gap-2">
                                                                        <Label htmlFor="proxy-username">Username (Optional)</Label>
                                                                        <Input
                                                                            id="proxy-username"
                                                                            value={proxyUsername}
                                                                            onChange={(e) => setProxyUsername(e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className="grid gap-2">
                                                                        <Label htmlFor="proxy-password">Password (Optional)</Label>
                                                                        <Input
                                                                            id="proxy-password"
                                                                            type="password"
                                                                            value={proxyPassword}
                                                                            onChange={(e) => setProxyPassword(e.target.value)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-end">
                                                                    <Button onClick={handleSaveProxy}>Save Proxy Settings</Button>
                                                                </div>
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>

                                                    {/* SSL Setup */}
                                                    <AccordionItem value="ssl">
                                                        <AccordionTrigger>
                                                            <div className="flex items-center gap-2">
                                                                <div className={`h-2.5 w-2.5 rounded-full ${setupStatus?.steps_completed.includes("ssl") || setupStatus?.steps_completed.includes("certificate")
                                                                    ? "bg-green-500"
                                                                    : "bg-red-500"
                                                                    }`} />
                                                                <div className="flex flex-col items-start text-left">
                                                                    <h4 className="text-sm font-medium">SSL Setup (optional)</h4>
                                                                    <p className="text-xs text-muted-foreground font-normal">
                                                                        Configure SSL/TLS settings for secure connections.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </AccordionTrigger>
                                                        <AccordionContent>
                                                            <div className="space-y-4 pt-4 px-1">
                                                                {sslSaveResult && (
                                                                    <Alert variant={sslSaveResult.success ? "default" : "destructive"} className={sslSaveResult.success ? "border-green-500 text-green-600 dark:border-green-500 dark:text-green-500" : ""}>
                                                                        {sslSaveResult.success ? <IconCheck className="h-4 w-4" /> : <IconAlertTriangle className="h-4 w-4" />}
                                                                        <AlertTitle>{sslSaveResult.success ? "Success" : "Error"}</AlertTitle>
                                                                        <AlertDescription>
                                                                            {sslSaveResult.message}
                                                                        </AlertDescription>
                                                                    </Alert>
                                                                )}
                                                                <div className="flex items-center space-x-2">
                                                                    <Switch
                                                                        id="verify-ssl"
                                                                        checked={verifySsl}
                                                                        onCheckedChange={setVerifySsl}
                                                                    />
                                                                    <Label htmlFor="verify-ssl">Verify SSL Certificates</Label>
                                                                </div>

                                                                <div className="grid gap-2">
                                                                    <Label htmlFor="ssl-timeout">Timeout (seconds)</Label>
                                                                    <Input
                                                                        id="ssl-timeout"
                                                                        type="number"
                                                                        min="1"
                                                                        value={sslTimeout}
                                                                        onChange={(e) => setSslTimeout(Number(e.target.value))}
                                                                    />
                                                                </div>

                                                                <div className="grid gap-2">
                                                                    <Label htmlFor="ca-certificate">CA Certificate</Label>
                                                                    <Textarea
                                                                        id="ca-certificate"
                                                                        value={caCertificate}
                                                                        onChange={(e) => setCaCertificate(e.target.value)}
                                                                        placeholder="-----BEGIN CERTIFICATE-----..."
                                                                        className="min-h-[100px] font-mono text-xs"
                                                                    />
                                                                </div>
                                                                <div className="flex justify-end">
                                                                    <Button onClick={handleSaveSSL}>Save SSL Settings</Button>
                                                                </div>
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                </Accordion>

                                                <Separator />

                                                {/* Reset and Complete Section */}
                                                {(setupStatus && (
                                                    <div className="pt-4 space-y-4">
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
                                                            {setupStatus.setup_complete ? (
                                                                <>
                                                                    <Button
                                                                        className="flex-1"
                                                                        onClick={handleGetCredentials}
                                                                        disabled={isFetchingCredentials}
                                                                    >
                                                                        {isFetchingCredentials ? "Fetching Credentials..." : "Admin Credentials"}
                                                                    </Button>

                                                                    <Dialog open={isCredentialsDialogOpen} onOpenChange={setIsCredentialsDialogOpen}>
                                                                        <DialogContent>
                                                                            <DialogHeader>
                                                                                <DialogTitle>Initial Admin Credentials</DialogTitle>
                                                                                <DialogDescription className="text-red-500 font-medium">
                                                                                    Please change this password immediately after logging in. This endpoint will be disabled after first login.
                                                                                </DialogDescription>
                                                                            </DialogHeader>
                                                                            <div className="bg-slate-950 p-4 rounded-md font-mono text-sm space-y-2">
                                                                                <div className="flex justify-between items-center">
                                                                                    <span className="text-slate-400">Username:</span>
                                                                                    <span className="text-white">{credentialsInit?.username}</span>
                                                                                </div>
                                                                                <div className="flex justify-between items-center">
                                                                                    <span className="text-slate-400">Password:</span>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="text-white">{credentialsInit?.password}</span>
                                                                                        <button onClick={() => credentialsInit?.password && copyToClipboard(credentialsInit.password)} className="text-slate-400 hover:text-white transition-colors">
                                                                                            <IconCopy size={16} />
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            <Separator className="my-4" />

                                                                            <div className="space-y-4">
                                                                                <div className="space-y-2">
                                                                                    <Label htmlFor="new-password">New Password</Label>
                                                                                    <Input
                                                                                        id="new-password"
                                                                                        type="password"
                                                                                        value={newPassword}
                                                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                                                        placeholder="Enter new password"
                                                                                    />
                                                                                </div>
                                                                                <div className="space-y-2">
                                                                                    <Label htmlFor="confirm-password">Confirm Password</Label>
                                                                                    <Input
                                                                                        id="confirm-password"
                                                                                        type="password"
                                                                                        value={confirmPassword}
                                                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                                                        placeholder="Confirm new password"
                                                                                    />
                                                                                </div>
                                                                                {passwordError && (
                                                                                    <p className="text-sm text-destructive font-medium">{passwordError}</p>
                                                                                )}
                                                                                <Button
                                                                                    className="w-full bg-green-600 hover:bg-green-700"
                                                                                    onClick={handleUpdatePassword}
                                                                                    disabled={isUpdatingPassword}
                                                                                >
                                                                                    {isUpdatingPassword ? "Updating Password..." : "Update Password"}
                                                                                </Button>
                                                                            </div>
                                                                            <DialogFooter>
                                                                                <Button onClick={() => setIsCredentialsDialogOpen(false)} variant="outline">Close</Button>
                                                                            </DialogFooter>
                                                                        </DialogContent>
                                                                    </Dialog>

                                                                    <Dialog open={isExpiredDialogOpen} onOpenChange={setIsExpiredDialogOpen}>
                                                                        <DialogContent>
                                                                            <DialogHeader>
                                                                                <DialogTitle className="flex items-center gap-2 text-destructive">
                                                                                    <AlertTriangle className="h-5 w-5" />
                                                                                    Credentials Expired
                                                                                </DialogTitle>
                                                                                <DialogDescription>
                                                                                    The initial admin credentials have already been used and cannot be recovered.
                                                                                    <br /><br />
                                                                                    If you have lost your password, you will need to perform a factory reset to restore access.
                                                                                </DialogDescription>
                                                                            </DialogHeader>
                                                                            <DialogFooter>
                                                                                <Button variant="outline" onClick={() => setIsExpiredDialogOpen(false)}>Close</Button>
                                                                            </DialogFooter>
                                                                        </DialogContent>
                                                                    </Dialog>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Button
                                                                        variant="destructive"
                                                                        size="sm"
                                                                        onClick={handleReset}
                                                                        className="flex-1"
                                                                        disabled={isResetting || isCompleting}
                                                                    >
                                                                        {isResetting ? "Resetting..." : "Reset Setup"}
                                                                    </Button>

                                                                    {setupStatus.steps_completed.includes("license") && (
                                                                        <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
                                                                            <DialogTrigger asChild>
                                                                                <Button
                                                                                    variant="default"
                                                                                    size="sm"
                                                                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                                                                    disabled={isResetting || isCompleting}
                                                                                >
                                                                                    {isCompleting ? "Completing..." : "Setup Completed"}
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
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}

                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>
                                <TabsContent value="neo-mcp">
                                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                                        <Card className="col-span-1 lg:col-span-3">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Activity className="h-5 w-5" />
                                                    Neo MCP Information
                                                </CardTitle>
                                                <CardDescription>
                                                    View the Model Context Protocol settings and capabilities for this instance.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                {mcpInfo ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-4">
                                                            <div>
                                                                <h4 className="text-sm font-medium text-muted-foreground">Name</h4>
                                                                <p className="text-sm">{mcpInfo.name}</p>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-medium text-muted-foreground">Version</h4>
                                                                <p className="text-sm">{mcpInfo.version}</p>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-medium text-muted-foreground">Protocol Version</h4>
                                                                <p className="text-sm">{mcpInfo.protocol_version}</p>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-medium text-muted-foreground">Transport</h4>
                                                                <p className="text-sm capitalize">{mcpInfo.transport.replace('-', ' ')}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2 pt-2">
                                                                <h4 className="text-sm font-medium text-muted-foreground">OAuth Enabled</h4>
                                                                <Badge variant={mcpInfo.oauth_enabled ? "default" : "secondary"}>
                                                                    {mcpInfo.oauth_enabled ? "Yes" : "No"}
                                                                </Badge>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div>
                                                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Available Tools</h4>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {mcpInfo.tools.map((tool) => (
                                                                        <Badge key={tool} variant="outline" className="bg-muted/50">
                                                                            {tool}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Endpoints</h4>
                                                                <div className="space-y-2">
                                                                    {Object.entries(mcpInfo.endpoints).map(([key, url]) => (
                                                                        <div key={key} className="flex flex-col gap-1">
                                                                            <span className="text-xs uppercase text-muted-foreground">{key.replace('_', ' ')}</span>
                                                                            <div className="flex items-center justify-between rounded-md border bg-muted p-2">
                                                                                <code className="text-xs truncate max-w-[80%]">{url as string}</code>
                                                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(url as string)}>
                                                                                    <IconCopy className="h-3 w-3" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center p-8 text-muted-foreground">
                                                        Fetching MCP Information...
                                                    </div>
                                                )}
                                            </CardContent>
                                            {mcpInfo?.oauth_enabled && (
                                                <CardFooter className="flex justify-end border-t p-6">
                                                    <Button onClick={handlers.handleOAuthLogin}>
                                                        Retrieve MCP Token
                                                    </Button>
                                                </CardFooter>
                                            )}
                                        </Card>
                                    </div>
                                </TabsContent>
                                <TabsContent value="cache">
                                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                                        <Card className="col-span-1 lg:col-span-3">
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
                                            <div className="border-t p-6 flex justify-end">
                                                <Button onClick={handleSave}>
                                                    <Save className="mr-2 size-4" />
                                                    Save Changes
                                                </Button>
                                            </div>
                                        </Card>
                                    </div>
                                </TabsContent>
                                <TabsContent value="logging">
                                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                                        <Card className="col-span-1 lg:col-span-3">
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
                                            </CardContent>
                                            <div className="border-t p-6 flex justify-end">
                                                <Button onClick={handleSave}>
                                                    <Save className="mr-2 size-4" />
                                                    Save Changes
                                                </Button>
                                            </div>
                                        </Card>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div >
                </div >
            </div >
        </div >
    )
}
