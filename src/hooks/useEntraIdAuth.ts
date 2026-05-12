// Copyright 2025 NetApp, Inc. All Rights Reserved.
import { useCallback, useState, useEffect } from "react"
import { appLogger } from "@/services/app-logger"
import { entraIdOAuthService, type OAuthTokenResponse } from "@/services/entra-id-auth"

/**
 * Hook for managing Entra ID OAuth authentication
 * Handles OAuth flow initiation, token storage, and refresh
 */
export function useEntraIdAuth() {
  const CALLBACK_GUARD_KEY = "entra_oauth_callback_guard"
  const [token, setToken] = useState<OAuthTokenResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCheckingMcpOauth, setIsCheckingMcpOauth] = useState(true)
  const [isMcpOauthConfigured, setIsMcpOauthConfigured] = useState(false)

  // Check for stored token on mount
  useEffect(() => {
    const stored = entraIdOAuthService.getStoredToken()
    if (stored) {
      setToken(stored)
      appLogger.debug("Found existing Entra ID OAuth token")
    }

    // Fallback: some backend OAuth flows can return code/state to the login route
    // instead of /auth/callback. Handle that here so sign-in still completes.
    const processCallbackOnCurrentRoute = async () => {
      if (stored) return

      const hashQuery = window.location.hash.includes("?")
        ? window.location.hash.split("?")[1]
        : ""
      const params = new URLSearchParams(window.location.search || hashQuery)
      const code = params.get("code")
      const state = params.get("state")
      const authError = params.get("error")
      const errorDescription = params.get("error_description")

      if (!(code && state) && !authError) {
        if (code && !state) {
          setError("Invalid callback parameters. Please try logging in again.")
        }
        return
      }

      const callbackSignature = `${code ?? ""}:${state ?? ""}:${authError ?? ""}`
      const lastProcessed = sessionStorage.getItem(CALLBACK_GUARD_KEY)
      if (lastProcessed === callbackSignature) {
        appLogger.debug("Skipping duplicate OAuth callback processing")
        return
      }

      sessionStorage.setItem(CALLBACK_GUARD_KEY, callbackSignature)

      setIsLoading(true)
      setError(null)

      try {
        await entraIdOAuthService.handleCallback(
          code ?? "",
          state ?? "",
          authError ?? undefined,
          errorDescription ?? undefined
        )

        const refreshedToken = entraIdOAuthService.getStoredToken()
        if (refreshedToken) {
          setToken(refreshedToken)
        }

        // Clean callback params from URL after processing.
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.hash}`)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "OAuth callback processing failed"
        setError(errorMsg)
        sessionStorage.removeItem(CALLBACK_GUARD_KEY)
      } finally {
        setIsLoading(false)
      }
    }

    void processCallbackOnCurrentRoute()

    const loadMcpOauthStatus = async () => {
      try {
        const status = await entraIdOAuthService.getMcpOauthStatus()
        setIsMcpOauthConfigured(status.configured)
      } finally {
        setIsCheckingMcpOauth(false)
      }
    }

    void loadMcpOauthStatus()
  }, [])

  useEffect(() => {
    if (!token?.refresh_token || !token.expires_in) {
      return
    }

    const refreshLeadMs = 60 * 1000
    const remainingMs = entraIdOAuthService.getMillisecondsUntilExpiry()
    if (remainingMs === null) {
      return
    }

    const refreshInMs = Math.max(0, remainingMs - refreshLeadMs)

    const timer = window.setTimeout(() => {
      const refresh = async () => {
        try {
          const refreshed = await entraIdOAuthService.refreshStoredToken()
          if (refreshed) {
            setToken(refreshed)
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : "Automatic token refresh failed"
          appLogger.warn("Automatic token refresh failed", errorMsg)
          
          // Check if token is already expired - if so, auto-clear and redirect to login
          const remainingMs = entraIdOAuthService.getMillisecondsUntilExpiry()
          if (remainingMs !== null && remainingMs <= 0) {
            appLogger.info("Token expired, clearing session and redirecting to login")
            entraIdOAuthService.clearToken()
            setToken(null)
            setError("Session expired. Please log in again.")
            
            // Redirect to login page
            window.location.hash = "#/"
          } else {
            // Token not expired yet, just show error
            setError(errorMsg)
          }
        }
      }

      void refresh()
    }, refreshInMs)

    return () => {
      window.clearTimeout(timer)
    }
  }, [token?.access_token, token?.refresh_token, token?.expires_in])

  /**
   * Initiate OAuth authorization flow
   */
  const initiateLogin = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const status = await entraIdOAuthService.getMcpOauthStatus()
      setIsMcpOauthConfigured(status.configured)

      if (!status.configured) {
        throw new Error(
          status.message ||
          "MCP OAuth is not configured. Configure it in Settings > MCP before using Entra ID login."
        )
      }

      appLogger.info("Initiating Entra ID OAuth login flow")
      await entraIdOAuthService.initiateAuthorizationFlow()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "OAuth login failed"
      appLogger.error("OAuth login initiation failed", errorMsg)
      setError(errorMsg)
      setIsLoading(false)
    }
  }, [])

  /**
   * Clear OAuth token (logout)
   */
  const logout = useCallback(() => {
    appLogger.debug("Clearing Entra ID OAuth token")
    entraIdOAuthService.clearToken()
    setToken(null)
    setError(null)
  }, [])

  /**
   * Check if OAuth is configured
   */
  const isConfigured = useCallback(() => {
    return entraIdOAuthService.isConfigured()
  }, [])

  /**
   * Get OAuth token access token string
   */
  const getAccessToken = useCallback((): string | null => {
    return token?.access_token ?? null
  }, [token])

  /**
   * Decode ID token claims
   */
  const getTokenClaims = useCallback(() => {
    if (!token?.id_token) return null
    return entraIdOAuthService.decodeIdTokenClaims(token.id_token)
  }, [token])

  return {
    token,
    isLoading,
    error,
    isCheckingMcpOauth,
    isMcpOauthConfigured,
    isConfigured: isConfigured(),
    initiateLogin,
    logout,
    getAccessToken,
    getTokenClaims,
  }
}
