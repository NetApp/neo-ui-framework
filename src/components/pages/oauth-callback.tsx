// Copyright 2025 NetApp, Inc. All Rights Reserved.
import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { appLogger } from "@/services/app-logger"
import { entraIdOAuthService } from "@/services/entra-id-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

/**
 * OAuth Callback Handler Page
 * 
 * This page handles the OAuth 2.0 callback from the authorization server.
 * It processes the authorization code and exchanges it for an access token.
 * 
 * The flow:
 * 1. User is redirected here with authorization code from /authorize endpoint
 * 2. We exchange the code for a token using /token endpoint
 * 3. Token is stored in sessionStorage
 * 4. We redirect back to the login page to complete the flow
 */
export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const processCallback = async () => {
      try {
        appLogger.info("Processing OAuth callback")

        const code = searchParams.get("code")
        const state = searchParams.get("state")
        const error = searchParams.get("error")
        const errorDescription = searchParams.get("error_description")

        // Handle authorization errors from Entra ID
        if (error) {
          appLogger.error("OAuth authorization error", `${error}: ${errorDescription}`)
          setError(`Authorization failed: ${error}${errorDescription ? ` - ${errorDescription}` : ""}`)
          setIsProcessing(false)
          return
        }

        if (!code || !state) {
          appLogger.error("OAuth callback missing parameters", "code or state not found")
          setError("Invalid callback parameters. Please try logging in again.")
          setIsProcessing(false)
          return
        }

        // Exchange code for token
        const accessToken = await entraIdOAuthService.handleCallback(
          code,
          state
        )

        appLogger.info("OAuth callback processed successfully", undefined, {
          tokenPresent: !!accessToken,
        })

        // Redirect back to login page where the token will be used
        // The login page will detect the token in sessionStorage and use it
        navigate("/")
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error"
        appLogger.error("OAuth callback processing failed", errorMsg)
        setError(errorMsg)
        setIsProcessing(false)
      }
    }

    processCallback()
  }, [searchParams, navigate])

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-black p-4">
      <Card className="w-full max-w-sm border-neutral-800 bg-neutral-900 text-neutral-50">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-semibold tracking-tight">
            {isProcessing ? "Signing In" : "Authentication Error"}
          </CardTitle>
          <CardDescription className="text-neutral-400">
            {isProcessing
              ? "Please wait while we complete your sign-in..."
              : "There was an error during authentication"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <Spinner className="size-8" />
              <p className="text-sm text-neutral-400">Processing authentication...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-red-900 bg-red-950 p-4">
                <p className="text-sm text-red-200">{error}</p>
              </div>
              <button
                onClick={() => window.location.href = "/"}
                className="w-full rounded-lg bg-neutral-100 px-4 py-2 text-center text-sm font-medium text-neutral-900 hover:bg-neutral-200"
              >
                Back to Login
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
