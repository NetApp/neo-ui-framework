// Copyright 2025 NetApp, Inc. All Rights Reserved.
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ConnectionCredentials } from "@/services/models"
import { useEntraIdAuth } from "@/hooks/useEntraIdAuth"
import { appLogger } from "@/services/app-logger"

interface LoginPageProps {
    onConnect: (credentials: ConnectionCredentials) => Promise<void>
    onOAuthLogin?: () => Promise<void> | void
    onEntraIdLogin?: (token: string) => Promise<void>
}

export default function LoginPage({ onConnect, onOAuthLogin, onEntraIdLogin }: LoginPageProps) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const exchangedEntraTokenRef = useRef<string | null>(null)
    const {
        token: entraToken,
        isLoading: entraLoading,
        error: entraError,
        initiateLogin: initiateEntraLogin,
        isConfigured: entraConfigured,
    } = useEntraIdAuth()

    useEffect(() => {
        if (!entraToken?.access_token || !onEntraIdLogin) return
        if (exchangedEntraTokenRef.current === entraToken.access_token) return

        const exchangeToken = async () => {
            setIsLoading(true)
            setError(null)
            try {
                appLogger.debug("Exchanging Entra ID OAuth token for API token")
                await onEntraIdLogin(entraToken.access_token)
                exchangedEntraTokenRef.current = entraToken.access_token
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : "Failed to exchange Entra ID token"
                setError(errorMsg)
                appLogger.error("Entra ID token exchange error", errorMsg)
            } finally {
                setIsLoading(false)
            }
        }

        void exchangeToken()
    }, [entraToken, onEntraIdLogin])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            await onConnect({
                username: email,
                password,
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : "Authentication failed")
        } finally {
            setIsLoading(false)
        }
    }

    const handleEntraLogin = async () => {
        setError(null)
        try {
            await initiateEntraLogin()
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Failed to initiate Entra ID login"
            setError(errorMsg)
            appLogger.error("Entra ID login error", errorMsg)
        }
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-black p-4">
            <Card className="w-full max-w-sm border-neutral-800 bg-neutral-900 text-neutral-50">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-xl font-semibold tracking-tight">Login to Neo Console</CardTitle>
                    <CardDescription className="text-neutral-400">
                        Enter your credentials below to login to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-neutral-200">User Account</Label>
                            <Input
                                id="email"
                                type="text"
                                placeholder="johndoe"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="username"
                                className="border-neutral-800 bg-neutral-950 text-neutral-50 placeholder:text-neutral-500 focus-visible:ring-neutral-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-neutral-200">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                className="border-neutral-800 bg-neutral-950 text-neutral-50 focus-visible:ring-neutral-700"
                            />
                        </div>

                        {(error || entraError) && (
                            <div className="text-sm text-red-500">{error || entraError}</div>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-neutral-100 text-neutral-900 hover:bg-neutral-200"
                            disabled={isLoading || entraLoading}
                        >
                            {isLoading ? "Logging in..." : "Login"}
                        </Button>

                        {entraConfigured && (
                            <Button
                                type="button"
                                className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                                onClick={handleEntraLogin}
                                disabled={entraLoading || isLoading}
                            >
                                {entraLoading ? "Signing in with Entra ID..." : "Sign in with Entra ID"}
                            </Button>
                        )}

                        {onOAuthLogin && (
                            <>
                                <div className="relative my-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-neutral-800" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-neutral-900 px-2 text-neutral-500">Or</span>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-neutral-50"
                                    onClick={onOAuthLogin}
                                >
                                    Get SSO MCP Token
                                </Button>
                            </>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
