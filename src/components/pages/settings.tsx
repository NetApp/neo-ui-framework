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
import { useTranslation } from "react-i18next"
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
import { Spinner } from "@/components/ui/spinner"
import type { LogLevel } from "@/services/app-logger"
import type { MonitoringOverviewResponse } from "@/services/neo-api"
import type { McpInfoResponse } from "@/services/models"
import { OverviewCard } from "@/components/cards/overview-card"
import { useSearchParams } from "react-router-dom"
import { useNeoApi } from "@/hooks/useNeoApi"
import { NeoApiService } from "@/services/neo-api"
import { Separator } from "@/components/ui/separator"
import { SUPPORTED_LOCALES, type AppLocale } from "@/i18n"

interface SettingsProps {
    monitoringOverview: MonitoringOverviewResponse | null
    state: ReturnType<typeof useNeoApi>["state"]
    handlers: ReturnType<typeof useNeoApi>["handlers"]
}

export default function Settings({ monitoringOverview, state, handlers }: SettingsProps) {
    const { monitoringTtl, filesTtl, cacheMaxSize, logLevel, locale, contentVisibilityEnabled, updateSettings } = useSettings()
    const { t } = useTranslation()

    const getSetupGraph = handlers.getSetupGraph
    const getSetupProxy = handlers.getSetupProxy
    const getSetupSsl = handlers.getSetupSsl
    const getMcpInfo = handlers.getMcpInfo  // Add this line

    const [searchParams, setSearchParams] = useSearchParams()

    const [localMonitoringTtl, setLocalMonitoringTtl] = useState(monitoringTtl)
    const [localFilesTtl, setLocalFilesTtl] = useState(filesTtl)
    const [localCacheMaxSize, setLocalCacheMaxSize] = useState(cacheMaxSize)
    const [localLogLevel, setLocalLogLevel] = useState<LogLevel>(logLevel)
    const [localLocale, setLocalLocale] = useState<AppLocale>(locale)
    const [localContentVisibilityEnabled, setLocalContentVisibilityEnabled] = useState(contentVisibilityEnabled)

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
    const [graphConfigured, setGraphConfigured] = useState(false)
    const [tenantId, setTenantId] = useState("")
    const [clientId, setClientId] = useState("")
    const [clientSecret, setClientSecret] = useState("")
    const [connectorId, setConnectorId] = useState("")
    const [connectorName, setConnectorName] = useState("")
    const [connectorDescription, setConnectorDescription] = useState("")
    const [clientSecretSet, setClientSecretSet] = useState(false)
    const [graphSaveResult, setGraphSaveResult] = useState<{ success: boolean; message: string } | null>(null)

    // Proxy Setup State
    const [proxyConfigured, setProxyConfigured] = useState(false)
    const [proxyUrl, setProxyUrl] = useState("")
    const [proxyUsername, setProxyUsername] = useState("")
    const [proxyPassword, setProxyPassword] = useState("")
    const [proxyPasswordSet, setProxyPasswordSet] = useState(false)
    const [proxySaveResult, setProxySaveResult] = useState<{ success: boolean; message: string } | null>(null)

    // SSL Setup State
    const [sslConfigured, setSslConfigured] = useState(false)
    const [verifySsl, setVerifySsl] = useState(false)
    const [sslTimeout, setSslTimeout] = useState(30)
    const [caCertificate, setCaCertificate] = useState("")
    const [allowLegacyCertificates, setAllowLegacyCertificates] = useState(false)
    const [customCaCertConfigured, setCustomCaCertConfigured] = useState(false)    
    const [sslSaveResult, setSslSaveResult] = useState<{ success: boolean; message: string } | null>(null)

    // NER Settings State
    const [nerEnabled, setNerEnabled] = useState(false)
    const [nerModel, setNerModel] = useState("")
    const [nerBatchSize, setNerBatchSize] = useState(32)
    const [nerConfidenceThreshold, setNerConfidenceThreshold] = useState(0.7)
    const [nerDevice, setNerDevice] = useState("")
    const [nerSaveResult, setNerSaveResult] = useState<{ success: boolean; message: string } | null>(null)
    const [isLoadingNerSettings, setIsLoadingNerSettings] = useState(true)

    const getErrorMessage = (error: unknown, fallback: string) => {
        if (error instanceof Error && error.message) {
            return error.message
        }
        return fallback
    }

    // Sync local state with context when context changes (e.g. initial load)
    useEffect(() => {
        setLocalMonitoringTtl(monitoringTtl)
        setLocalFilesTtl(filesTtl)
        setLocalCacheMaxSize(cacheMaxSize)
        setLocalLogLevel(logLevel)
        setLocalLocale(locale)
        setLocalContentVisibilityEnabled(contentVisibilityEnabled)
    }, [monitoringTtl, filesTtl, cacheMaxSize, logLevel, locale, contentVisibilityEnabled])

    const [mcpInfo, setMcpInfo] = useState<McpInfoResponse | null>(null)

    useEffect(() => {
        let isCancelled = false

        const loadSetupGraphConfig = async () => {
            try {
                const response = await getSetupGraph()
                if (isCancelled) return

                setGraphConfigured(Boolean(response.graph_configured))
                setTenantId(response.tenant_id ?? "")
                setClientId(response.client_id ?? "")
                setConnectorId(response.connector_id ?? "")
                setConnectorName(response.connector_name ?? "")
                setConnectorDescription(response.connector_description ?? "")
                setClientSecret("")
                setClientSecretSet(Boolean(response.client_secret_set))
            } catch {
                if (isCancelled) return
                setGraphConfigured(false)
                setClientSecretSet(false)
            }
        }

        loadSetupGraphConfig()

        return () => {
            isCancelled = true
        }
    }, [getSetupGraph])

    useEffect(() => {
        let isCancelled = false

        const loadSetupProxyConfig = async () => {
            try {
                const response = await getSetupProxy()
                if (isCancelled) return

                setProxyConfigured(Boolean(response.proxy_configured))
                setProxyUrl(response.proxy_url ?? "")
                setProxyUsername(response.proxy_username ?? "")
                setProxyPassword("")
                setProxyPasswordSet(Boolean(response.proxy_password_set))
            } catch {
                if (isCancelled) return
                setProxyConfigured(false)
                setProxyPasswordSet(false)
            }
        }

        loadSetupProxyConfig()

        return () => {
            isCancelled = true
        }
    }, [getSetupProxy])

    useEffect(() => {
        let isCancelled = false

        const loadSetupSslConfig = async () => {
            try {
                const response = await getSetupSsl()
                if (isCancelled) return

                setSslConfigured(Boolean(response.custom_ca_certificate_configured))
                setVerifySsl(response.verify_ssl)
                setSslTimeout(response.timeout)
                setAllowLegacyCertificates(response.allow_legacy_certificates)
                setCustomCaCertConfigured(response.custom_ca_certificate_configured)
                setCaCertificate("")
            } catch {
                // keep defaults if endpoint unavailable
            }
        }

        loadSetupSslConfig()

        return () => {
            isCancelled = true
        }
    }, [getSetupSsl])

    useEffect(() => {
        let isCancelled = false

        const loadNERSettings = async () => {
            if (!state.token) return
            try {
                setIsLoadingNerSettings(true)
                const api = new NeoApiService()
                const settings = await api.getNERSettings(state.token)
                if (isCancelled) return

                setNerEnabled(settings.enabled ?? false)
                setNerModel(settings.model ?? "")
                setNerBatchSize(settings.batch_size ?? 32)
                setNerConfidenceThreshold(settings.confidence_threshold ?? 0.7)
                setNerDevice(settings.device ?? "")
            } catch (error) {
                if (isCancelled) return
                console.error("Failed to load NER settings:", error)
            } finally {
                setIsLoadingNerSettings(false)
            }
        }

        loadNERSettings()

        return () => {
            isCancelled = true
        }
    }, [state.token])

    useEffect(() => {
        const fetchMcpInfo = async () => {
            try {
                const info = await getMcpInfo()
                console.log("Successfully fetched MCP Info:", info)
                setMcpInfo(info)
            } catch (error) {
                console.error("Failed to fetch MCP Info. Error:", error)
            }
        }
        if (state.token) {
            fetchMcpInfo()
        }
    }, [state.token, getMcpInfo])

    const handleSave = () => {
        updateSettings({
            monitoringTtl: Number(localMonitoringTtl),
            filesTtl: Number(localFilesTtl),
            cacheMaxSize: Number(localCacheMaxSize),
            logLevel: localLogLevel,
            locale: localLocale,
            contentVisibilityEnabled: localContentVisibilityEnabled,
        })
        toast.success(t("settingsSaved", { ns: "settings" }))
    }

    const handleLocaleChange = (nextLocale: string) => {
        const resolvedLocale = nextLocale as AppLocale
        setLocalLocale(resolvedLocale)
        updateSettings({ locale: resolvedLocale })
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
        } catch {
            setResetResult({ success: false, message: t("failedResetSetup", { ns: "settings" }) })
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
                setCompleteResult({ success: true, message: t("setupCompletedSuccessRestart", { ns: "settings" }) })
                setTimeout(() => {
                    window.location.reload()
                }, 30000)
            } else {
                setCompleteResult({ success: false, message: response.message || t("failedCompleteSetup", { ns: "settings" }) })
            }
        } catch  {
            setCompleteResult({ success: false, message: t("failedCompleteSetup", { ns: "settings" }) })
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
        } catch (error: unknown) {
            console.error("Failed to fetch initial credentials", error)
            // Check for 403 Forbidden which indicates credentials have been used
            const errorLike = error as { status?: number; response?: { status?: number }; message?: string }            
            if (errorLike.status === 403 || errorLike.response?.status === 403 || errorLike.message?.includes("403")) {
                setIsExpiredDialogOpen(true)
            }
        } finally {
            setIsFetchingCredentials(false)
        }
    }

    const handleUpdatePassword = async () => {
        setPasswordError(null)
        if (!newPassword || !confirmPassword) {
            setPasswordError(t("pleaseEnterBothPasswordFields", { ns: "settings" }))
            return
        }
        if (newPassword !== confirmPassword) {
            setPasswordError(t("passwordsDoNotMatch", { ns: "settings" }))
            return
        }
        if (!credentialsInit?.username || !credentialsInit?.password) {
            setPasswordError(t("initialCredentialsNotFound", { ns: "settings" }))
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
            toast.success(t("passwordUpdatedLogin", { ns: "settings" }))
        } catch (error: unknown) {
            setPasswordError(getErrorMessage(error, t("failedUpdatePassword", { ns: "settings" })))
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
            setLicenseSaveResult({ success: false, message: t("pleaseEnterLicenseKey", { ns: "settings" }) })
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
                setLicenseSaveResult({ success: false, message: response.message || t("licenseSetupFailed", { ns: "settings" }) })
            }
        } catch {
            setLicenseSaveResult({ success: false, message: t("failedConfigureLicense", { ns: "settings" }) })
        }
    }

    const handleSaveGraph = async () => {
        setGraphSaveResult(null)
        if (!clientSecret.trim()) {
            setGraphSaveResult({ success: false, message: t("clientSecretRequired", { ns: "settings" }) })
            return
        }        
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
                setGraphSaveResult({ success: true, message: response.message || t("graphConfiguredSuccessfully", { ns: "settings" }) })
                setTimeout(() => {
                    window.location.reload()
                }, 1500)
            } else {
                setGraphSaveResult({ success: false, message: response.message || t("graphSetupFailed", { ns: "settings" }) })
            }
        } catch {
            setGraphSaveResult({ success: false, message: t("failedConfigureGraph", { ns: "settings" }) })
        }
    }

    const handleSaveProxy = async () => {
        setProxySaveResult(null)
        const payload: { proxy_url: string; proxy_username?: string; proxy_password?: string } = {
            proxy_url: proxyUrl,
        }
        if (proxyUsername) payload.proxy_username = proxyUsername
        if (proxyPassword) payload.proxy_password = proxyPassword

        try {
            const response = await handlers.setupProxy(payload)
            if (response.success) {
                setProxySaveResult({ success: true, message: response.message || t("proxySettingsSavedSuccessfully", { ns: "settings" }) })
                setTimeout(() => {
                    window.location.reload()
                }, 1500)
            } else {
                setProxySaveResult({ success: false, message: response.message || t("proxySetupFailed", { ns: "settings" }) })
            }
        } catch {
            setProxySaveResult({ success: false, message: t("failedConfigureProxySettings", { ns: "settings" }) })
        }
    }

    const handleSaveSSL = async () => {
        setSslSaveResult(null)
        // POST /api/v1/setup/ssl endpoint to be implemented when backend supports it.
        setSslSaveResult({ success: true, message: t("sslSettingsSavedPlaceholder", { ns: "settings" }) })
        setTimeout(() => {
            window.location.reload()
        }, 1500)
    }

    const handleSaveNERSettings = async () => {
        if (!state.token) {
            setNerSaveResult({ success: false, message: "Authentication token not available" })
            return
        }
        setNerSaveResult(null)
        try {
            const api = new NeoApiService()
            // Only include fields with actual values, send null for empty strings
            const settings = {
                enabled: nerEnabled,
                model: nerModel.trim() || null,
                batch_size: nerBatchSize,
                confidence_threshold: nerConfidenceThreshold,
                device: nerDevice.trim() || null,
            }
            await api.updateNERSettings(state.token, settings)
            setNerSaveResult({ success: true, message: t("nerSettingsSaved", { ns: "settings" }) })
        } catch (error) {
            const message = getErrorMessage(error, t("failedSaveNERSettings", { ns: "settings" }))
            setNerSaveResult({ success: false, message })
        }
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
                                title={t("pageTitle", { ns: "settings" })}
                                showCacheStats={false}
                            />

                            <Tabs
                                value={currentTab}
                                onValueChange={(value) => setSearchParams({ tab: value })}
                                className="w-full"
                            >
                                <TabsList>
                                    <TabsTrigger value="neo-core">{t("neoCoreTab", { ns: "settings" })}</TabsTrigger>
                                    <TabsTrigger value="neo-mcp">{t("neoMcpTab", { ns: "settings" })}</TabsTrigger>
                                    <TabsTrigger value="content-visibility">{t("contentVisibilityTab", { ns: "settings" })}</TabsTrigger>
                                    <TabsTrigger value="cache">{t("cacheTab", { ns: "settings" })}</TabsTrigger>
                                    <TabsTrigger value="languages">{t("languagesTab", { ns: "settings" })}</TabsTrigger>
                                    <TabsTrigger value="logging">{t("loggingTab", { ns: "settings" })}</TabsTrigger>
                                    <TabsTrigger value="ner">{t("nerTab", { ns: "settings" })}</TabsTrigger>
                                </TabsList>
                                <TabsContent value="neo-core">
                                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                                        {/* Setup Configuration */}
                                        <Card className="col-span-1 lg:col-span-3">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Activity className="h-5 w-5" />
                                                    {t("neoCoreTitle", { ns: "settings" })}
                                                </CardTitle>
                                                <CardDescription>
                                                    {t("neoCoreDescription", { ns: "settings" })}
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
                                                                <span className="text-sm font-medium">{t("statusLabel", { ns: "settings" })}</span>
                                                            </div>
                                                            <div>
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`${setupStatus.setup_complete
                                                                        ? "text-green-600 border-green-200 dark:text-green-400 dark:border-green-800"
                                                                        : "text-orange-600 border-orange-200 dark:text-orange-400 dark:border-orange-800"
                                                                        } px-3 py-1`}
                                                                >
                                                                    {setupStatus.setup_complete ? t("completeStatus", { ns: "settings" }) : t("inProgressStatus", { ns: "settings" })}
                                                                </Badge>
                                                            </div>
                                                        </div>

                                                        {/* Step Count */}
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <ListChecks className="h-4 w-4 text-muted-foreground" />
                                                                <span className="text-sm font-medium">{t("stepsLabel", { ns: "settings" })}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xl font-bold">
                                                                    {stepsCompletedCount} / {requiredStepsCount}
                                                                </span>
                                                                <span className="text-sm text-muted-foreground">{t("requiredLabel", { ns: "settings" })}</span>
                                                            </div>
                                                        </div>

                                                        {/* Database Status */}
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium">{t("infrastructureLabel", { ns: "settings" })}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <div className={`h-2.5 w-2.5 rounded-full ${setupStatus.database_configured
                                                                    ? "bg-green-500"
                                                                    : "bg-red-500"
                                                                    }`} />
                                                                <span className={setupStatus.database_configured ? "text-foreground font-medium" : "text-muted-foreground"}>
                                                                    {t("databaseConfigured", { ns: "settings" })}
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
                                                        <h4 className="text-sm font-medium">{t("licenseKeyHeading", { ns: "settings" })}</h4>
                                                    </div>

                                                    {licenseSaveResult && (
                                                        <Alert variant={licenseSaveResult.success ? "default" : "destructive"} className={licenseSaveResult.success ? "border-green-500 text-green-600 dark:border-green-500 dark:text-green-500" : ""}>
                                                            {licenseSaveResult.success ? <IconCheck className="h-4 w-4" /> : <IconAlertTriangle className="h-4 w-4" />}
                                                            <AlertTitle>{licenseSaveResult.success ? t("successTitle", { ns: "settings" }) : t("errorTitle", { ns: "settings" })}</AlertTitle>
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
                                                                placeholder={t("licenseKeyPlaceholder", { ns: "settings" })}
                                                                type="password"
                                                            />
                                                            <Button onClick={handleSaveLicense}>{t("saveButton", { ns: "settings" })}</Button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Separator />

                                                <Accordion type="multiple" className="w-full">
                                                    {/* M365 Copilot Graph Setup */}
                                                    <AccordionItem value="m365">
                                                        <AccordionTrigger>
                                                            <div className="flex items-center gap-2">
                                                                <div className={`h-2.5 w-2.5 rounded-full ${graphConfigured ? "bg-green-500" : "bg-red-500"}`} />
                                                                <div className="flex flex-col items-start text-left">
                                                                    <h4 className="text-sm font-medium">{t("m365Heading", { ns: "settings" })}</h4>
                                                                    <p className="text-xs text-muted-foreground font-normal">
                                                                        {t("m365Description", { ns: "settings" })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </AccordionTrigger>
                                                        <AccordionContent>
                                                            <div className="space-y-4 pt-4 px-1">
                                                                {graphSaveResult && (
                                                                    <Alert variant={graphSaveResult.success ? "default" : "destructive"} className={graphSaveResult.success ? "border-green-500 text-green-600 dark:border-green-500 dark:text-green-500" : ""}>
                                                                        {graphSaveResult.success ? <IconCheck className="h-4 w-4" /> : <IconAlertTriangle className="h-4 w-4" />}
                                                                        <AlertTitle>{graphSaveResult.success ? t("successTitle", { ns: "settings" }) : t("errorTitle", { ns: "settings" })}</AlertTitle>
                                                                        <AlertDescription>
                                                                            {graphSaveResult.message}
                                                                        </AlertDescription>
                                                                    </Alert>
                                                                )}
                                                                <div className="space-y-4">
                                                                    <h4 className="text-xs font-medium uppercase text-muted-foreground">{t("requiredFields", { ns: "settings" })}</h4>
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
                                                                            <Label htmlFor="client-secret">Client Secret (Enter again to Save)</Label>
                                                                            <Input
                                                                                id="client-secret"
                                                                                type="password"
                                                                                value={clientSecret}
                                                                                onChange={(e) => setClientSecret(e.target.value)}
                                                                            />
                                                                            {clientSecretSet}          
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-4">
                                                                    <h4 className="text-xs font-medium uppercase text-muted-foreground">{t("optionalFields", { ns: "settings" })}</h4>
                                                                    <div className="grid gap-4 md:grid-cols-2">
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
                                                                            <Textarea
                                                                                id="connector-description"
                                                                                value={connectorDescription}
                                                                                onChange={(e) => setConnectorDescription(e.target.value)}
                                                                                className="min-h-[140px] resize-y"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-end">
                                                                    <Button onClick={handleSaveGraph}>{t("saveM365Settings", { ns: "settings" })}</Button>
                                                                </div>
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>

                                                    {/* Proxy Setup */}
                                                    <AccordionItem value="proxy">
                                                        <AccordionTrigger>
                                                            <div className="flex items-center gap-2">
                                                                <div className={`h-2.5 w-2.5 rounded-full ${proxyConfigured ? "bg-green-500" : "bg-red-500"}`} />
                                                                <div className="flex flex-col items-start text-left">
                                                                    <h4 className="text-sm font-medium">{t("proxyHeading", { ns: "settings" })}</h4>
                                                                    <p className="text-xs text-muted-foreground font-normal">
                                                                        {t("proxyDescription", { ns: "settings" })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </AccordionTrigger>
                                                        <AccordionContent>
                                                            <div className="space-y-4 pt-4 px-1">
                                                                {proxySaveResult && (
                                                                    <Alert variant={proxySaveResult.success ? "default" : "destructive"} className={proxySaveResult.success ? "border-green-500 text-green-600 dark:border-green-500 dark:text-green-500" : ""}>
                                                                        {proxySaveResult.success ? <IconCheck className="h-4 w-4" /> : <IconAlertTriangle className="h-4 w-4" />}
                                                                        <AlertTitle>{proxySaveResult.success ? t("successTitle", { ns: "settings" }) : t("errorTitle", { ns: "settings" })}</AlertTitle>
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
                                                                        {proxyPasswordSet && (
                                                                            <p className="text-xs text-muted-foreground">
                                                                                Existing password is already configured. Leave blank to keep current password.
                                                                            </p>
                                                                        )}                                                                        
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-end">
                                                                    <Button onClick={handleSaveProxy}>{t("saveProxySettings", { ns: "settings" })}</Button>
                                                                </div>
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>

                                                    {/* SSL Setup */}
                                                    <AccordionItem value="ssl">
                                                        <AccordionTrigger>
                                                            <div className="flex items-center gap-2">
                                                                   <div className={`h-2.5 w-2.5 rounded-full ${sslConfigured ? "bg-green-500" : "bg-red-500"}`} />
                                                                <div className="flex flex-col items-start text-left">
                                                                    <h4 className="text-sm font-medium">{t("sslHeading", { ns: "settings" })}</h4>
                                                                    <p className="text-xs text-muted-foreground font-normal">
                                                                        {t("sslDescription", { ns: "settings" })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </AccordionTrigger>
                                                        <AccordionContent>
                                                            <div className="space-y-4 pt-4 px-1">
                                                                {sslSaveResult && (
                                                                    <Alert variant={sslSaveResult.success ? "default" : "destructive"} className={sslSaveResult.success ? "border-green-500 text-green-600 dark:border-green-500 dark:text-green-500" : ""}>
                                                                        {sslSaveResult.success ? <IconCheck className="h-4 w-4" /> : <IconAlertTriangle className="h-4 w-4" />}
                                                                        <AlertTitle>{sslSaveResult.success ? t("successTitle", { ns: "settings" }) : t("errorTitle", { ns: "settings" })}</AlertTitle>
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
                                                                <div className="flex items-center space-x-2">
                                                                    <Switch
                                                                        id="allow-legacy-certificates"
                                                                        checked={allowLegacyCertificates}
                                                                        onCheckedChange={setAllowLegacyCertificates}
                                                                    />
                                                                    <Label htmlFor="allow-legacy-certificates">Allow Legacy Certificates</Label>
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
                                                                    {customCaCertConfigured && (
                                                                        <p className="text-xs text-muted-foreground">
                                                                            A custom CA certificate is already configured. Paste a new certificate above to replace it.
                                                                        </p>
                                                                    )}               
                                                                </div>
                                                                <div className="flex justify-end">
                                                                    <Button onClick={handleSaveSSL}>{t("saveSslSettings", { ns: "settings" })}</Button>
                                                                </div>
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                </Accordion>

                                                {/* <Separator /> */}

                                                {/* Reset and Complete Section */}
                                                {setupStatus && (
                                                    <div className="pt-4 space-y-4">
                                                        {resetResult && (
                                                            <Alert variant={resetResult.success ? "default" : "destructive"} className={resetResult.success ? "border-green-500 text-green-600 dark:border-green-500 dark:text-green-500" : ""}>
                                                                {resetResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                                                                <AlertTitle>{resetResult.success ? t("successTitle", { ns: "settings" }) : t("errorTitle", { ns: "settings" })}</AlertTitle>
                                                                <AlertDescription>
                                                                    {resetResult.message}
                                                                </AlertDescription>
                                                            </Alert>
                                                        )}
                                                        {completeResult && (
                                                            <Alert variant={completeResult.success ? "default" : "destructive"} className={completeResult.success ? "border-green-500 text-green-600 dark:border-green-500 dark:text-green-500" : ""}>
                                                                {completeResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                                                                <AlertTitle>{completeResult.success ? t("successTitle", { ns: "settings" }) : t("errorTitle", { ns: "settings" })}</AlertTitle>
                                                                <AlertDescription>
                                                                    {completeResult.message}
                                                                </AlertDescription>
                                                            </Alert>
                                                        )}
                                                    </div>
                                                )}
                                            </CardContent>

                                            {setupStatus && (
                                                <CardFooter className="flex justify-end gap-2 border-t p-6">
                                                    {setupStatus.setup_complete ? (
                                                        <>
                                                            <Button
                                                                onClick={handleGetCredentials}
                                                                disabled={isFetchingCredentials}
                                                            >
                                                                {isFetchingCredentials ? t("fetchingCredentials", { ns: "settings" }) : t("adminCredentials", { ns: "settings" })}
                                                            </Button>

                                                            <Dialog open={isCredentialsDialogOpen} onOpenChange={setIsCredentialsDialogOpen}>
                                                                <DialogContent>
                                                                    <DialogHeader>
                                                                        <DialogTitle>{t("initialAdminCredentials", { ns: "settings" })}</DialogTitle>
                                                                        <DialogDescription className="text-red-500 font-medium">
                                                                            {t("initialAdminCredentialsWarning", { ns: "settings" })}
                                                                        </DialogDescription>
                                                                    </DialogHeader>
                                                                    <div className="bg-slate-950 p-4 rounded-md font-mono text-sm space-y-2">
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-slate-400">{t("usernameLabel", { ns: "settings" })}</span>
                                                                            <span className="text-white">{credentialsInit?.username}</span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-slate-400">{t("passwordLabel", { ns: "settings" })}</span>
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
                                                                            <Label htmlFor="new-password">{t("newPasswordLabel", { ns: "settings" })}</Label>
                                                                            <Input
                                                                                id="new-password"
                                                                                type="password"
                                                                                value={newPassword}
                                                                                onChange={(e) => setNewPassword(e.target.value)}
                                                                                placeholder={t("newPasswordPlaceholder", { ns: "settings" })}
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label htmlFor="confirm-password">{t("confirmPasswordLabel", { ns: "settings" })}</Label>
                                                                            <Input
                                                                                id="confirm-password"
                                                                                type="password"
                                                                                value={confirmPassword}
                                                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                                                placeholder={t("confirmPasswordPlaceholder", { ns: "settings" })}
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
                                                                            {isUpdatingPassword ? t("updatingPassword", { ns: "settings" }) : t("updatePassword", { ns: "settings" })}
                                                                        </Button>
                                                                    </div>
                                                                    <DialogFooter>
                                                                        <Button onClick={() => setIsCredentialsDialogOpen(false)} variant="outline">{t("closeButton", { ns: "settings" })}</Button>
                                                                    </DialogFooter>
                                                                </DialogContent>
                                                            </Dialog>

                                                            <Dialog open={isExpiredDialogOpen} onOpenChange={setIsExpiredDialogOpen}>
                                                                <DialogContent>
                                                                    <DialogHeader>
                                                                        <DialogTitle className="flex items-center gap-2 text-destructive">
                                                                            <AlertTriangle className="h-5 w-5" />
                                                                            {t("credentialsExpiredTitle", { ns: "settings" })}
                                                                        </DialogTitle>
                                                                        <DialogDescription>
                                                                            {t("credentialsExpiredDescription", { ns: "settings" })}
                                                                            <br /><br />
                                                                            {t("credentialsExpiredResetHint", { ns: "settings" })}
                                                                        </DialogDescription>
                                                                    </DialogHeader>
                                                                    <DialogFooter>
                                                                        <Button variant="outline" onClick={() => setIsExpiredDialogOpen(false)}>{t("closeButton", { ns: "settings" })}</Button>
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
                                                                disabled={isResetting || isCompleting}
                                                            >
                                                                {isResetting ? t("resetting", { ns: "settings" }) : t("resetSetup", { ns: "settings" })}
                                                            </Button>

                                                            {setupStatus.steps_completed.includes("license") && (
                                                                <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
                                                                    <DialogTrigger asChild>
                                                                        <Button
                                                                            variant="default"
                                                                            size="sm"
                                                                            className="bg-green-600 hover:bg-green-700"
                                                                            disabled={isResetting || isCompleting}
                                                                        >
                                                                            {isCompleting ? t("completing", { ns: "settings" }) : t("setupCompleted", { ns: "settings" })}
                                                                        </Button>
                                                                    </DialogTrigger>
                                                                    <DialogContent>
                                                                        <DialogHeader>
                                                                            <DialogTitle>{t("completeSetupRestartTitle", { ns: "settings" })}</DialogTitle>
                                                                            <DialogDescription>
                                                                                {t("completeSetupRestartDescription", { ns: "settings" })}
                                                                            </DialogDescription>
                                                                        </DialogHeader>
                                                                        <DialogFooter>
                                                                            <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>{t("cancelButton", { ns: "settings" })}</Button>
                                                                            <Button onClick={handleCompleteSetup} className="bg-green-600 hover:bg-green-700">{t("confirmRestart", { ns: "settings" })}</Button>
                                                                        </DialogFooter>
                                                                    </DialogContent>
                                                                </Dialog>
                                                            )}
                                                        </>
                                                    )}
                                                </CardFooter>
                                            )}
                                        </Card>
                                    </div>
                                </TabsContent>
                                <TabsContent value="neo-mcp">
                                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                                        <Card className="col-span-1 lg:col-span-3">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Activity className="h-5 w-5" />
                                                    {t("mcpTitle", { ns: "settings" })}
                                                </CardTitle>
                                                <CardDescription>
                                                    {t("mcpDescription", { ns: "settings" })}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                {mcpInfo ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-4">
                                                            <div>
                                                                <h4 className="text-sm font-medium text-muted-foreground">{t("nameLabel", { ns: "settings" })}</h4>
                                                                <p className="text-sm">{mcpInfo.name}</p>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-medium text-muted-foreground">{t("versionLabel", { ns: "settings" })}</h4>
                                                                <p className="text-sm">{mcpInfo.version}</p>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-medium text-muted-foreground">{t("protocolVersionLabel", { ns: "settings" })}</h4>
                                                                <p className="text-sm">{mcpInfo.protocol_version}</p>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-medium text-muted-foreground">{t("transportLabel", { ns: "settings" })}</h4>
                                                                <p className="text-sm capitalize">{mcpInfo.transport.replace('-', ' ')}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2 pt-2">
                                                                <h4 className="text-sm font-medium text-muted-foreground">{t("oauthEnabledLabel", { ns: "settings" })}</h4>
                                                                <Badge variant={mcpInfo.oauth_enabled ? "default" : "secondary"}>
                                                                    {mcpInfo.oauth_enabled ? t("yesLabel", { ns: "settings" }) : t("noLabel", { ns: "settings" })}
                                                                </Badge>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div>
                                                                <h4 className="text-sm font-medium text-muted-foreground mb-2">{t("availableTools", { ns: "settings" })}</h4>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {mcpInfo.tools.map((tool) => (
                                                                        <Badge key={tool} variant="outline" className="bg-muted/50">
                                                                            {tool}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-medium text-muted-foreground mb-2">{t("endpointsLabel", { ns: "settings" })}</h4>
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
                                                        {t("fetchingMcpInformation", { ns: "settings" })}
                                                    </div>
                                                )}
                                            </CardContent>
                                            {mcpInfo?.oauth_enabled && (
                                                <CardFooter className="flex justify-end border-t p-6">
                                                    <Button onClick={handlers.handleOAuthLogin}>
                                                        {t("retrieveMcpToken", { ns: "settings" })}
                                                    </Button>
                                                </CardFooter>
                                            )}
                                        </Card>
                                    </div>
                                </TabsContent>
                                <TabsContent value="content-visibility">
                                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                                        <Card className="col-span-1 lg:col-span-3">
                                            <CardHeader>
                                                <CardTitle>{t("contentVisibilityTitle", { ns: "settings" })}</CardTitle>
                                                <CardDescription>
                                                    {t("contentVisibilityDescription", { ns: "settings" })}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-5">
                                                <Alert variant="destructive">
                                                    <IconAlertTriangle className="h-4 w-4" />
                                                    <AlertTitle>{t("contentVisibilityWarningTitle", { ns: "settings" })}</AlertTitle>
                                                    <AlertDescription>
                                                        {t("contentVisibilityWarningDescription", { ns: "settings" })}
                                                    </AlertDescription>
                                                </Alert>

                                                <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                    <div className="space-y-1 pr-6">
                                                        <Label htmlFor="content-visibility-toggle" className="text-sm font-medium">
                                                            {t("contentVisibilityToggleLabel", { ns: "settings" })}
                                                        </Label>
                                                        <p className="text-sm text-muted-foreground">
                                                            {t("contentVisibilityToggleHint", { ns: "settings" })}
                                                        </p>
                                                    </div>
                                                    <Switch
                                                        id="content-visibility-toggle"
                                                        checked={localContentVisibilityEnabled}
                                                        onCheckedChange={setLocalContentVisibilityEnabled}
                                                    />
                                                </div>
                                            </CardContent>
                                            <div className="border-t p-6 flex justify-end">
                                                <Button onClick={handleSave}>
                                                    <Save className="mr-2 size-4" />
                                                    {t("saveChanges", { ns: "settings" })}
                                                </Button>
                                            </div>
                                        </Card>
                                    </div>
                                </TabsContent>
                                <TabsContent value="cache">
                                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                                        <Card className="col-span-1 lg:col-span-3">
                                            <CardHeader>
                                                <CardTitle>{t("cacheTitle", { ns: "settings" })}</CardTitle>
                                                <CardDescription>
                                                    {t("cacheDescription", { ns: "settings" })}
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
                                                    {t("saveChanges", { ns: "settings" })}
                                                </Button>
                                            </div>
                                        </Card>
                                    </div>
                                </TabsContent>
                                <TabsContent value="logging">
                                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                                        <Card className="col-span-1 lg:col-span-3">
                                            <CardHeader>
                                                <CardTitle>{t("loggingTitle", { ns: "settings" })}</CardTitle>
                                                <CardDescription>
                                                    {t("loggingDescription", { ns: "settings" })}
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
                                <TabsContent value="languages">
                                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                                        <Card className="col-span-1 lg:col-span-3">
                                            <CardHeader>
                                                <CardTitle>{t("languagesTab", { ns: "settings" })}</CardTitle>
                                                <CardDescription>
                                                    {t("languageDescription", { ns: "settings" })}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="display-language">{t("languageLabel", { ns: "settings" })}</Label>
                                                    <Select value={localLocale} onValueChange={handleLocaleChange}>
                                                        <SelectTrigger id="display-language">
                                                            <SelectValue placeholder={t("language")} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {SUPPORTED_LOCALES.map((localeOption) => (
                                                                <SelectItem key={localeOption} value={localeOption}>
                                                                    {t(`languageOption_${localeOption}`)}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <p className="text-sm text-muted-foreground">
                                                        {t("languageSaveHint", { ns: "settings" })}
                                                    </p>
                                                </div>
                                            </CardContent>
                                            <div className="border-t p-6 flex justify-end">
                                                <Button onClick={handleSave}>
                                                    <Save className="mr-2 size-4" />
                                                    {t("saveChanges", { ns: "settings" })}
                                                </Button>
                                            </div>
                                        </Card>
                                    </div>
                                </TabsContent>
                                <TabsContent value="ner">
                                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                                        <Card className="col-span-1 lg:col-span-3">
                                            <CardHeader>
                                                <CardTitle>{t("nerSettingsTitle", { ns: "settings" })}</CardTitle>
                                                <CardDescription>
                                                    {t("nerSettingsDescription", { ns: "settings" })}
                                                </CardDescription>
                                            </CardHeader>
                                            {nerSaveResult && (
                                                <CardContent className="pt-4">
                                                    <Alert variant={nerSaveResult.success ? "default" : "destructive"}>
                                                        {nerSaveResult.success ? (
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        ) : (
                                                            <AlertTriangle className="h-4 w-4" />
                                                        )}
                                                        <AlertTitle>
                                                            {nerSaveResult.success ? t("success", { ns: "settings" }) : t("error", { ns: "settings" })}
                                                        </AlertTitle>
                                                        <AlertDescription>{nerSaveResult.message}</AlertDescription>
                                                    </Alert>
                                                </CardContent>
                                            )}
                                            <CardContent className="space-y-6">
                                                {isLoadingNerSettings ? (
                                                    <div className="flex items-center justify-center py-8">
                                                        <Spinner className="h-5 w-5" />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center gap-4">
                                                            <Label htmlFor="ner-enabled">{t("nerEnabled", { ns: "settings" })}</Label>
                                                            <Switch
                                                                id="ner-enabled"
                                                                checked={nerEnabled}
                                                                onCheckedChange={setNerEnabled}
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="ner-model">{t("nerModel", { ns: "settings" })}</Label>
                                                            <Input
                                                                id="ner-model"
                                                                placeholder="e.g., en_core_web_sm"
                                                                value={nerModel}
                                                                onChange={(e) => setNerModel(e.target.value)}
                                                            />
                                                            <p className="text-sm text-muted-foreground">
                                                                {t("nerModelDescription", { ns: "settings" })}
                                                            </p>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="ner-batch-size">{t("nerBatchSize", { ns: "settings" })}</Label>
                                                            <Input
                                                                id="ner-batch-size"
                                                                type="number"
                                                                min="1"
                                                                max="512"
                                                                value={nerBatchSize}
                                                                onChange={(e) => setNerBatchSize(Number(e.target.value))}
                                                            />
                                                            <p className="text-sm text-muted-foreground">
                                                                {t("nerBatchSizeDescription", { ns: "settings" })}
                                                            </p>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="ner-confidence">{t("nerConfidenceThreshold", { ns: "settings" })}</Label>
                                                            <Input
                                                                id="ner-confidence"
                                                                type="number"
                                                                min="0"
                                                                max="1"
                                                                step="0.01"
                                                                value={nerConfidenceThreshold}
                                                                onChange={(e) => setNerConfidenceThreshold(Number(e.target.value))}
                                                            />
                                                            <p className="text-sm text-muted-foreground">
                                                                {t("nerConfidenceDescription", { ns: "settings" })}
                                                            </p>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="ner-device">{t("nerDevice", { ns: "settings" })}</Label>
                                                            <Select value={nerDevice} onValueChange={setNerDevice}>
                                                                <SelectTrigger id="ner-device">
                                                                    <SelectValue placeholder={t("selectDevice", { ns: "settings" })} />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="cpu">CPU</SelectItem>
                                                                    <SelectItem value="cuda">CUDA (NVIDIA GPU)</SelectItem>
                                                                    <SelectItem value="mps">MPS (Apple Silicon)</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <p className="text-sm text-muted-foreground">
                                                                {t("nerDeviceDescription", { ns: "settings" })}
                                                            </p>
                                                        </div>
                                                    </>
                                                )}
                                            </CardContent>
                                            <div className="border-t p-6 flex justify-end">
                                                <Button onClick={handleSaveNERSettings} disabled={isLoadingNerSettings}>
                                                    <Save className="mr-2 size-4" />
                                                    {t("saveChanges", { ns: "settings" })}
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
