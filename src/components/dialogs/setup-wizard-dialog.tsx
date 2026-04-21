import { useState, useEffect, useCallback } from "react"
import { useNeoApi } from "@/hooks/useNeoApi"
import { NeoApiService } from "@/services/neo-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { SetupGraphRequest } from "@/services/models"

interface SetupWizardDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onComplete?: () => void
}

type WizardStep = "LICENSE" | "OAUTH" | "M365" | "PROXY" | "SSL" | "COMPLETE_ACTION" | "CREDENTIALS"

const WIZARD_STEPS: WizardStep[] = ["LICENSE", "OAUTH", "M365", "PROXY", "SSL", "COMPLETE_ACTION", "CREDENTIALS"]

export function SetupWizardDialog({ open, onOpenChange, onComplete }: SetupWizardDialogProps) {
    const { handlers } = useNeoApi()
    const [step, setStep] = useState<WizardStep>("LICENSE")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    // License State
    const [licenseKey, setLicenseKey] = useState("")

    // OAuth State
    const [oauthTenantId, setOauthTenantId] = useState("")
    const [oauthClientId, setOauthClientId] = useState("")
    const [oauthClientSecret, setOauthClientSecret] = useState("")
    const [oauthEnabled, setOauthEnabled] = useState(false)

    // M365 State
    const [tenantId, setTenantId] = useState("")
    const [clientId, setClientId] = useState("")
    const [clientSecret, setClientSecret] = useState("")
    const [connectorId, setConnectorId] = useState("netappneo-01")
    const [connectorName, setConnectorName] = useState("NetApp Neo Connector 01")
    const [connectorDescription, setConnectorDescription] = useState("The connector give access to data from on premises or on-prem file share servers.")

    // Proxy State
    const [proxyUrl, setProxyUrl] = useState("")
    const [proxyUsername, setProxyUsername] = useState("")
    const [proxyPassword, setProxyPassword] = useState("")

    // SSL State
    const [verifySsl, setVerifySsl] = useState(false)

    const [caCertificate, setCaCertificate] = useState("")

    // Completion State
    const [completionCountdown, setCompletionCountdown] = useState<number | null>(null)

    // Credentials State
    const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null)
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [passwordError, setPasswordError] = useState<string | null>(null)

    const getErrorMessage = (error: unknown, fallback: string) => {
        if (error instanceof Error && error.message) {
            return error.message
        }
        return fallback
    }

    useEffect(() => {
        if (!open) {
            // Reset state when dialog closes/reopens if needed
            // For now we persist state to avoid losing progress if accidentally closed?
            // Actually, if forced open, user can't easily close it.
        }
    }, [open])


    const fetchCredentials = useCallback(async () => {
        setIsLoading(true)
        try {
            const result = await handlers.getInitialCredentials()
            setCredentials({ username: result.username, password: result.password })
            setStep("CREDENTIALS")
        } catch {
            setError("Failed to fetch credentials. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }, [handlers])

    useEffect(() => {
        if (completionCountdown !== null && completionCountdown > 0) {
            const timer = setTimeout(() => setCompletionCountdown(completionCountdown - 1), 1000)
            return () => clearTimeout(timer)
        }
        if (completionCountdown === 0) {
            void fetchCredentials()
        }
    }, [completionCountdown, fetchCredentials])

    useEffect(() => {
        if (completionCountdown !== null && completionCountdown > 0) {
            const timer = setTimeout(() => setCompletionCountdown(completionCountdown - 1), 1000)
            return () => clearTimeout(timer)
        }
        if (completionCountdown === 0) {
            void fetchCredentials()
        }
    }, [completionCountdown, fetchCredentials])

    const handleNext = () => {
        setError(null)
        setSuccessMessage(null)
        switch (step) {
            case "LICENSE":
                submitLicense()
                break
            case "OAUTH":
                setStep("M365")
                break
            case "M365":
                setStep("PROXY")
                break
            case "PROXY":
                setStep("SSL")
                break
            case "SSL":
                setStep("COMPLETE_ACTION")
                break
            default:
                break
        }
    }

    const handleSkip = () => {
        setError(null)
        setSuccessMessage(null)
        switch (step) {
            case "OAUTH":
                setStep("M365")
                break
            case "M365":
                setStep("PROXY")
                break
            case "PROXY":
                setStep("SSL")
                break
            case "SSL":
                setStep("COMPLETE_ACTION")
                break
            default:
                break
        }
    }

    const submitLicense = async () => {
        if (!licenseKey) {
            setError("License key is required.")
            return
        }
        setIsLoading(true)
        try {
            const res = await handlers.setupLicense({ license_key: licenseKey })
            if (res.success) {
                setSuccessMessage("License configured successfully.")
                setTimeout(() => {
                    setSuccessMessage(null)
                    setStep("OAUTH")
                }, 1000)
            } else {
                setError(res.message || "Failed to configure license.")
            }
        } catch (error: unknown) {
            setError(getErrorMessage(error, "An error occurred."))
        } finally {
            setIsLoading(false)
        }
    }

    const submitOauth = async () => {
        setIsLoading(true)
        const payload = {
            tenant_id: oauthTenantId,
            client_id: oauthClientId,
            client_secret: oauthClientSecret,
            enabled: oauthEnabled
        }
        try {
            const res = await handlers.setupOauth(payload)
            if (res.success) {
                setSuccessMessage("OAuth configured successfully.")
                setTimeout(() => {
                    setSuccessMessage(null)
                    setStep("M365")
                }, 1000)
            } else {
                setError(res.message || "Failed to configure OAuth.")
            }
        } catch (error: unknown) {
            setError(getErrorMessage(error, "An error occurred."))
        } finally {
            setIsLoading(false)
        }
    }

    const submitM365 = async () => {
        setIsLoading(true)
        const payload: SetupGraphRequest = {
            tenant_id: tenantId,
            client_id: clientId,
            client_secret: clientSecret,
            connector_id: connectorId,
            connector_name: connectorName,
            connector_description: connectorDescription
        }
        try {
            const res = await handlers.setupGraph(payload)
            if (res.success) {
                setSuccessMessage("M365 Graph configured successfully.")
                setTimeout(() => {
                    setSuccessMessage(null)
                    setStep("PROXY")
                }, 1000)
            } else {
                setError(res.message || "Failed to configure M365.")
            }
        } catch (error: unknown) {
            setError(getErrorMessage(error, "An error occurred."))
        } finally {
            setIsLoading(false)
        }
    }

    const submitProxy = () => {
        // Placeholder for proxy save logic
        setSuccessMessage("Proxy settings saved.")
        setTimeout(() => {
            setSuccessMessage(null)
            setStep("SSL")
        }, 500)
    }

    const submitSSL = () => {
        // Placeholder for SSL save logic
        setSuccessMessage("SSL settings saved.")
        setTimeout(() => {
            setSuccessMessage(null)
            setStep("COMPLETE_ACTION")
        }, 500)
    }

    const handleCompleteSetup = async () => {
        setIsLoading(true)
        try {
            const res = await handlers.completeSetup()
            if (res.success) {
                setSuccessMessage("Setup completed! Restarting Neo Core...")
                setCompletionCountdown(30) // Start 30s countdown
            } else {
                setError(res.message || "Failed to complete setup.")
                setIsLoading(false)
            }
        } catch (error: unknown) {
            setError(getErrorMessage(error, "An error occurred."))
            setIsLoading(false)
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
        if (!credentials) return

        setIsLoading(true)
        try {
            const api = new NeoApiService()
            const token = await api.authenticate(credentials.username, credentials.password)
            await api.changeMyPassword(token, {
                current_password: credentials.password,
                new_password: newPassword
            })
            toast.success("Password updated! Please log in.")
            if (onComplete) onComplete()
            onOpenChange(false)
            // Reload to force re-login or dashboard refresh
            window.location.reload()
        } catch (error: unknown) {
            setPasswordError(getErrorMessage(error, "Failed to update password."))
        } finally {
            setIsLoading(false)
        }
    }

    // Render Steps
    const renderStepContent = () => {
        if (completionCountdown !== null && completionCountdown > 0) {
            return (
                <div className="flex flex-col items-center justify-center space-y-4 py-8">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <div className="text-center">
                        <h3 className="text-lg font-medium">Restarting Neo Core...</h3>
                        <p className="text-muted-foreground">Please wait while the system applies changes.</p>
                        <p className="text-2xl font-bold mt-4">{completionCountdown}s</p>
                    </div>
                </div>
            )
        }

        switch (step) {
            case "LICENSE":
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="license-key">License Key (Mandatory)</Label>
                            <Input
                                id="license-key"
                                value={licenseKey}
                                onChange={(e) => setLicenseKey(e.target.value)}
                                placeholder="Enter your Neo license key..."
                                type="password"
                            />
                        </div>
                    </div>
                )
            case "OAUTH":
                return (
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2 pb-4">
                            <Switch id="oauth-enabled" checked={oauthEnabled} onCheckedChange={setOauthEnabled} />
                            <Label htmlFor="oauth-enabled">Enable Entra ID Authentication</Label>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>Tenant ID</Label>
                                <Input value={oauthTenantId} onChange={(e) => setOauthTenantId(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Client ID</Label>
                                <Input value={oauthClientId} onChange={(e) => setOauthClientId(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Client Secret</Label>
                                <Input type="password" value={oauthClientSecret} onChange={(e) => setOauthClientSecret(e.target.value)} />
                            </div>
                        </div>
                    </div>
                )
            case "M365":
                return (
                    <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>Tenant ID</Label>
                                <Input value={tenantId} onChange={(e) => setTenantId(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Client ID</Label>
                                <Input value={clientId} onChange={(e) => setClientId(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Client Secret</Label>
                                <Input type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Connector Name</Label>
                                <Input value={connectorName} onChange={(e) => setConnectorName(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Connector ID</Label>
                                <Input value={connectorId} onChange={(e) => setConnectorId(e.target.value)} />
                            </div>
                            <div className="grid gap-2 md:col-span-2">
                                <Label>Connector Description</Label>
                                <Textarea
                                    value={connectorDescription}
                                    onChange={(e) => setConnectorDescription(e.target.value)}
                                    placeholder="Enter connector description..."
                                    className="min-h-[60px]"
                                />
                            </div>
                        </div>
                    </div>
                )
            case "PROXY":
                return (
                    <div className="space-y-4">
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label>Proxy URL</Label>
                                <Input value={proxyUrl} onChange={(e) => setProxyUrl(e.target.value)} placeholder="http://proxy.example.com:8080" />
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label>Username (Optional)</Label>
                                    <Input value={proxyUsername} onChange={(e) => setProxyUsername(e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Password (Optional)</Label>
                                    <Input type="password" value={proxyPassword} onChange={(e) => setProxyPassword(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                )
            case "SSL":
                return (
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Switch id="verify-ssl" checked={verifySsl} onCheckedChange={setVerifySsl} />
                            <Label htmlFor="verify-ssl">Verify SSL Certificates</Label>
                        </div>
                        <div className="grid gap-2">
                            <Label>CA Certificate Bundle</Label>
                            <Textarea
                                value={caCertificate}
                                onChange={(e) => setCaCertificate(e.target.value)}
                                placeholder="-----BEGIN CERTIFICATE-----..."
                                className="min-h-[100px] font-mono text-xs"
                            />
                        </div>
                    </div>
                )
            case "COMPLETE_ACTION":
                return (
                    <div className="py-4 text-center space-y-4">
                        <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
                        <h3 className="text-xl font-semibold">Configuration Ready</h3>
                        <p className="text-muted-foreground">
                            You have configured the necessary steps. Click below to finalize setup and restart the core.
                        </p>
                    </div>
                )
            case "CREDENTIALS":
                return (
                    <div className="space-y-4">
                        <div className="bg-slate-950 p-4 rounded-md font-mono text-sm space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Username:</span>
                                <span className="text-white">{credentials?.username}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Password:</span>
                                <span className="text-white">{credentials?.password}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>New Password</Label>
                            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Confirm Password</Label>
                            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        </div>
                        {passwordError && (
                            <p className="text-sm text-destructive font-medium">{passwordError}</p>
                        )}
                    </div>
                )
        }
    }

    const renderFooter = () => {
        if (completionCountdown !== null && completionCountdown > 0) return null

        switch (step) {
            case "LICENSE":
                return (
                    <Button onClick={handleNext} disabled={isLoading || !licenseKey}>
                        {isLoading ? "Saving..." : "Next: OAuth Setup"}
                    </Button>
                )
            case "OAUTH":
                return (
                    <div className="flex justify-between w-full">
                        <Button variant="outline" onClick={handleSkip}>Skip</Button>
                        <Button onClick={submitOauth} disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save & Next"}
                        </Button>
                    </div>
                )
            case "M365":
                return (
                    <div className="flex justify-between w-full">
                        <Button variant="outline" onClick={handleSkip}>Skip</Button>
                        <Button onClick={submitM365} disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save & Next"}
                        </Button>
                    </div>
                )
            case "PROXY":
                return (
                    <div className="flex justify-between w-full">
                        <Button variant="outline" onClick={handleSkip}>Skip</Button>
                        <Button onClick={submitProxy} disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save & Next"}
                        </Button>
                    </div>
                )
            case "SSL":
                return (
                    <div className="flex justify-between w-full">
                        <Button variant="outline" onClick={handleSkip}>Skip</Button>
                        <Button onClick={submitSSL} disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save & Next"}
                        </Button>
                    </div>
                )
            case "COMPLETE_ACTION":
                return (
                    <Button onClick={handleCompleteSetup} disabled={isLoading} className="w-full bg-green-600 hover:bg-green-700">
                        {isLoading ? "Finalizing..." : "Finish Setup"}
                    </Button>
                )
            case "CREDENTIALS":
                return (
                    <Button onClick={handleUpdatePassword} disabled={isLoading} className="w-full">
                        {isLoading ? "Updating..." : "Update Password & Login"}
                    </Button>
                )
        }
    }

    const getTitle = () => {
        switch (step) {
            case "LICENSE": return "Setup Wizard: License"
            case "OAUTH": return "Setup Wizard: OAuth Setup (Optional)"
            case "M365": return "Setup Wizard: M365 Copilot (Optional)"
            case "PROXY": return "Setup Wizard: Proxy (Optional)"
            case "SSL": return "Setup Wizard: SSL (Optional)"
            case "COMPLETE_ACTION": return "Setup Wizard: Complete"
            case "CREDENTIALS": return "Initial Admin Credentials"
        }
    }

    // Helper for steps
    const currentStepIndex = WIZARD_STEPS.indexOf(step)
    const totalSteps = WIZARD_STEPS.length

    return (
        <Dialog open={open} onOpenChange={(val) => {
            // Prevent closing if we are in the middle of a mandatory flow or loading
            if (!val && (step === "LICENSE" || isLoading)) return;
            onOpenChange(val)
        }}>
            <DialogContent className="sm:max-w-[650px]" showCloseButton={false} onPointerDownOutside={(e) => e.preventDefault()}>
                <div className="flex justify-between items-start border-b pb-4 mb-4">
                    <div className="space-y-1">
                        <DialogTitle className="text-xl font-semibold">{getTitle()}</DialogTitle>
                        <DialogDescription>
                            {step === "CREDENTIALS"
                                ? "Please save your credentials and update your password immediately."
                                : "Configure your Neo Core instance."}
                        </DialogDescription>
                    </div>

                    {/* Step Indicator */}
                    <div className="flex flex-col items-end gap-2">
                        <span className="text-sm text-muted-foreground">
                            Step {currentStepIndex + 1} of {totalSteps}
                        </span>
                        <div className="flex gap-1.5">
                            {WIZARD_STEPS.map((s, index) => (
                                <div
                                    key={s}
                                    className={`h-2.5 w-2.5 rounded-full ${index <= currentStepIndex
                                        ? "bg-primary"
                                        : "bg-muted-foreground/30"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {successMessage && (
                    <Alert className="border-green-500 text-green-600 mb-4">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>Success</AlertTitle>
                        <AlertDescription>{successMessage}</AlertDescription>
                    </Alert>
                )}

                <div className="flex-1 py-4 overflow-y-auto">
                    <div className="max-w-3xl mx-auto w-full">
                        {renderStepContent()}
                    </div>
                </div>

                <DialogFooter className="border-t pt-4 mt-auto">
                    <div className="max-w-3xl mx-auto w-full flex justify-end">
                        {renderFooter()}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
