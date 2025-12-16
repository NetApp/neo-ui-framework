// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import {
    IconSettings,
    IconCheck,
    IconAlertTriangle
} from "@tabler/icons-react"
import { useState, useEffect } from "react"
import { useSettings } from "@/context/settings-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Save } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { LogLevel } from "@/services/app-logger"
import type { MonitoringOverviewResponse } from "@/services/neo-api"
import { OverviewCard } from "@/components/cards/overview-card"
import { useSearchParams } from "react-router-dom"
import { useNeoApi } from "@/hooks/useNeoApi"
import { NeoSetupStatusCard } from "@/components/cards/neo-setup-status-card"
import { Separator } from "@/components/ui/separator"

interface SettingsProps {
    monitoringOverview: MonitoringOverviewResponse | null
    cacheStats?: {
        sizeBytes: number
        items: number
    }
}

export default function Settings({ monitoringOverview }: SettingsProps) {
    const { monitoringTtl, filesTtl, cacheMaxSize, logLevel, updateSettings } = useSettings()
    const { state, handlers } = useNeoApi()
    const [searchParams, setSearchParams] = useSearchParams()

    const [localMonitoringTtl, setLocalMonitoringTtl] = useState(monitoringTtl)
    const [localFilesTtl, setLocalFilesTtl] = useState(filesTtl)
    const [localCacheMaxSize, setLocalCacheMaxSize] = useState(cacheMaxSize)
    const [localLogLevel, setLocalLogLevel] = useState<LogLevel>(logLevel)

    // Setup Tab State
    // Setup Tab State
    const [licenseKey, setLicenseKey] = useState("")
    const [licenseSaveResult, setLicenseSaveResult] = useState<{ success: boolean; message: string } | null>(null)

    // M365 Copilot Graph Setup State
    const [m365Enabled, setM365Enabled] = useState(false)
    const [tenantId, setTenantId] = useState("your-tenant-id")
    const [clientId, setClientId] = useState("your-client-id")
    const [clientSecret, setClientSecret] = useState("your-client-secret")
    const [connectorId, setConnectorId] = useState("netappneo")
    const [connectorName, setConnectorName] = useState("NetApp NEO Connector")
    const [connectorDescription, setConnectorDescription] = useState("The connector contains information contained in the on premises or on-prem file share server. This drive is called J drive and this contains documents and files. These are of type DOC, DOCM, DOCX, DOT, DOTX, EML, GIF, HTML, JPEG, JPG, MHT, MHTML, MSG, NWS, OBD, OBT, ODP, ODS, ODT, ONE, PDF, PNG, POT, PPS, PPT, PPTM, PPTX, TXT, XLB, XLC, XLSB, XLS, XLSX, XLT, XLXM, XML, XPS, and ZIP.")
    const [graphSaveResult, setGraphSaveResult] = useState<{ success: boolean; message: string } | null>(null)

    // Proxy Setup State
    const [proxyEnabled, setProxyEnabled] = useState(false)
    const [proxyUrl, setProxyUrl] = useState("")
    const [proxyUsername, setProxyUsername] = useState("")
    const [proxyPassword, setProxyPassword] = useState("")
    const [proxySaveResult, setProxySaveResult] = useState<{ success: boolean; message: string } | null>(null)

    // SSL Setup State
    const [sslEnabled, setSslEnabled] = useState(false)
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

    const handleSave = () => {
        updateSettings({
            monitoringTtl: Number(localMonitoringTtl),
            filesTtl: Number(localFilesTtl),
            cacheMaxSize: Number(localCacheMaxSize),
            logLevel: localLogLevel,
        })
        toast.success("Settings saved successfully")
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
                                    <TabsTrigger value="neo-core">Neo Core</TabsTrigger>
                                    <TabsTrigger value="cache">Cache Configuration</TabsTrigger>
                                    <TabsTrigger value="logging">Logging Configuration</TabsTrigger>
                                </TabsList>
                                <TabsContent value="neo-core">
                                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                                        {/* Status Card */}
                                        <NeoSetupStatusCard
                                            status={state.setupStatus}
                                            className="col-span-1"
                                        />

                                        {/* Connector Configuration */}
                                        <Card className="col-span-1 lg:col-span-3">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <IconSettings className="h-5 w-5" />
                                                    Configuration
                                                </CardTitle>
                                                <CardDescription>
                                                    Configure the Neo Core connector settings.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                {/* License Key Setup */}
                                                <div className="space-y-4">
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
                                                        <Label htmlFor="license-key">License Key</Label>
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

                                                {/* M365 Copilot Graph Setup */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-1">
                                                            <h4 className="text-sm font-medium">M365 Copilot Graph Setup (optional)</h4>
                                                            <p className="text-sm text-muted-foreground">
                                                                Configure settings for Microsoft 365 Copilot Graph integration.
                                                            </p>
                                                        </div>
                                                        <Switch
                                                            checked={m365Enabled}
                                                            onCheckedChange={setM365Enabled}
                                                        />
                                                    </div>
                                                    {m365Enabled && (
                                                        <div className="space-y-4 pt-4">
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
                                                    )}
                                                </div>

                                                <Separator />

                                                {/* Proxy Setup */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-1">
                                                            <h4 className="text-sm font-medium">Proxy Setup (optional)</h4>
                                                            <p className="text-sm text-muted-foreground">
                                                                Configure proxy settings for outbound connections.
                                                            </p>
                                                        </div>
                                                        <Switch
                                                            checked={proxyEnabled}
                                                            onCheckedChange={setProxyEnabled}
                                                        />
                                                    </div>
                                                    {proxyEnabled && (
                                                        <div className="space-y-4 pt-4">
                                                            {proxySaveResult && (
                                                                <Alert variant={proxySaveResult.success ? "default" : "destructive"} className={proxySaveResult.success ? "border-green-500 text-green-600 dark:border-green-500 dark:text-green-500" : ""}>
                                                                    {proxySaveResult.success ? <IconCheck className="h-4 w-4" /> : <IconAlertTriangle className="h-4 w-4" />}
                                                                    <AlertTitle>{proxySaveResult.success ? "Success" : "Error"}</AlertTitle>
                                                                    <AlertDescription>
                                                                        {proxySaveResult.message}
                                                                    </AlertDescription>
                                                                </Alert>
                                                            )}
                                                            <div className="grid gap-4 md:grid-cols-2">
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
                                                    )}
                                                </div>

                                                <Separator />

                                                {/* SSL Setup */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-1">
                                                            <h4 className="text-sm font-medium">SSL Setup (optional)</h4>
                                                            <p className="text-sm text-muted-foreground">
                                                                Configure SSL/TLS settings for secure connections.
                                                            </p>
                                                        </div>
                                                        <Switch
                                                            checked={sslEnabled}
                                                            onCheckedChange={setSslEnabled}
                                                        />
                                                    </div>
                                                    {sslEnabled && (
                                                        <div className="space-y-4 pt-4">
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
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>
                                <TabsContent value="cache">
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
                                        <div className="border-t p-6 flex justify-end">
                                            <Button onClick={handleSave}>
                                                <Save className="mr-2 size-4" />
                                                Save Changes
                                            </Button>
                                        </div>
                                    </Card>
                                </TabsContent>
                                <TabsContent value="logging">
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
                                        </CardContent>
                                        <div className="border-t p-6 flex justify-end">
                                            <Button onClick={handleSave}>
                                                <Save className="mr-2 size-4" />
                                                Save Changes
                                            </Button>
                                        </div>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}
