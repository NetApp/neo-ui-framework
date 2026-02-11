// Copyright 2025 NetApp, Inc. All Rights Reserved.
import { useState } from "react"
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

interface LoginPageProps {
    onConnect: (credentials: ConnectionCredentials) => Promise<void>
}

export default function LoginPage({ onConnect }: LoginPageProps) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            // The backend expects a username, but the UI prompt says "Email". 
            // We will pass the email value as the username.
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

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-black p-4">
            <Card className="w-full max-w-sm border-neutral-800 bg-neutral-900 text-neutral-50">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-xl font-semibold tracking-tight">
                        Login to Neo Console
                    </CardTitle>
                    <CardDescription className="text-neutral-400">
                        Enter your email below to login to your account
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
                                className="border-neutral-800 bg-neutral-950 text-neutral-50 placeholder:text-neutral-500 focus-visible:ring-neutral-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-neutral-200">Password</Label>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="border-neutral-800 bg-neutral-950 text-neutral-50 focus-visible:ring-neutral-700"
                            />
                        </div>
                        {error && (
                            <div className="text-sm text-red-500">
                                {error}
                            </div>
                        )}
                        <Button
                            type="submit"
                            className="w-full bg-neutral-100 text-neutral-900 hover:bg-neutral-200"
                            disabled={isLoading}
                        >
                            {isLoading ? "Logging in..." : "Login"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
