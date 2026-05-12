// Copyright 2025 NetApp, Inc. All Rights Reserved.
import { useCallback, useState, useEffect } from "react"
import { appLogger } from "@/services/app-logger"
import { entraIdOAuthService, type OAuthTokenResponse } from "@/services/entra-id-auth"

/**
 * Hook for managing Entra ID OAuth authentication
 * Handles OAuth flow initiation, token storage, and refresh
 */
export function useEntraIdAuth() {
  const [token, setToken] = useState<OAuthTokenResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check for stored token on mount
  useEffect(() => {
    const stored = entraIdOAuthService.getStoredToken()
    if (stored) {
      setToken(stored)
      appLogger.debug("Found existing Entra ID OAuth token")
    }
  }, [])

  /**
   * Initiate OAuth authorization flow
   */
  const initiateLogin = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (!entraIdOAuthService.isConfigured()) {
        throw new Error(
          "Entra ID OAuth is not configured. Please check environment variables: " +
          "VITE_ENTRA_TENANT_ID and VITE_ENTRA_CLIENT_ID"
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
    isConfigured: isConfigured(),
    initiateLogin,
    logout,
    getAccessToken,
    getTokenClaims,
  }
}
