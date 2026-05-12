// Copyright 2025 NetApp, Inc. All Rights Reserved.
/**
 * Entra ID OAuth 2.0 Service
 * Implements OAuth 2.0 Authorization Code flow with PKCE
 * for secure authentication with Microsoft Entra ID
 */

import { appLogger } from "./app-logger"

/**
 * OAuth token response from the API
 */
export interface OAuthTokenResponse {
  access_token: string
  token_type: string
  expires_in?: number
  scope?: string
  id_token?: string
}

/**
 * OAuth state stored in session during flow
 */
interface OAuthState {
  state: string
  codeVerifier: string
  nonce: string
  redirectUri: string
  timestamp: number
}

/**
 * PKCE Challenge pair
 */
interface PKCEChallenge {
  codeVerifier: string
  codeChallenge: string
}

/**
 * Entra ID OAuth Service
 * Handles OAuth 2.0 Authorization Code flow with PKCE
 */
export class EntraIdOAuthService {
  private static readonly STATE_STORAGE_KEY = "entra_oauth_state"
  private static readonly TOKEN_STORAGE_KEY = "entra_oauth_token"
  private static readonly STATE_TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes

  private tenantId: string
  private clientId: string
  private redirectUri: string
  private apiUrl: string

  constructor() {
    this.tenantId = import.meta.env.VITE_ENTRA_TENANT_ID || ""
    this.clientId = import.meta.env.VITE_ENTRA_CLIENT_ID || ""
    this.redirectUri = import.meta.env.VITE_ENTRA_REDIRECT_URI || `${window.location.origin}/auth/callback`
    this.apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api"

    appLogger.debug("EntraIdOAuthService initialized", undefined, {
      tenantId: this.tenantId,
      clientId: this.clientId,
      redirectUri: this.redirectUri,
      apiUrl: this.apiUrl,
    })

    if (!this.isConfigured()) {
      appLogger.warn("Entra ID OAuth is not fully configured - check environment variables")
    }
  }

  /**
   * Check if OAuth is properly configured
   */
  isConfigured(): boolean {
    return !!(this.tenantId && this.clientId)
  }

  /**
   * Generate a random string for OAuth state parameter
   * Prevents CSRF attacks
   */
  private generateRandomString(length: number = 32): string {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"
    let result = ""
    const values = new Uint8Array(length)
    crypto.getRandomValues(values)
    for (let i = 0; i < length; i++) {
      result += charset[values[i] % charset.length]
    }
    return result
  }

  /**
   * Generate PKCE code verifier and challenge
   * Prevents authorization code interception
   */
  private async generatePKCEChallenge(): Promise<PKCEChallenge> {
    const codeVerifier = this.generateRandomString(128)

    // Create code challenge: SHA256(codeVerifier) base64url encoded
    const encoder = new TextEncoder()
    const data = encoder.encode(codeVerifier)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)

    // Convert to base64url
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const codeChallenge = btoa(String.fromCharCode(...hashArray))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "")

    return { codeVerifier, codeChallenge }
  }

  /**
   * Save OAuth state to sessionStorage
   * Includes PKCE verifier, state parameter, nonce, and timestamp
   */
  private saveState(state: OAuthState): void {
    try {
      sessionStorage.setItem(
        EntraIdOAuthService.STATE_STORAGE_KEY,
        JSON.stringify(state)
      )
      appLogger.debug("OAuth state saved to sessionStorage")
    } catch (error) {
      appLogger.error(
        "Failed to save OAuth state",
        error instanceof Error ? error.message : "Unknown error"
      )
      throw new Error("Failed to save OAuth state. Check sessionStorage availability.")
    }
  }

  /**
   * Retrieve and validate OAuth state from sessionStorage
   * Checks for expiry and removes state after retrieval
   */
  private retrieveAndClearState(): OAuthState | null {
    try {
      const stored = sessionStorage.getItem(EntraIdOAuthService.STATE_STORAGE_KEY)
      if (!stored) {
        appLogger.warn("OAuth state not found in sessionStorage")
        return null
      }

      const state = JSON.parse(stored) as OAuthState

      // Check if state has expired
      if (Date.now() - state.timestamp > EntraIdOAuthService.STATE_TIMEOUT_MS) {
        appLogger.warn("OAuth state has expired")
        sessionStorage.removeItem(EntraIdOAuthService.STATE_STORAGE_KEY)
        return null
      }

      // Clear state after retrieval (one-time use)
      sessionStorage.removeItem(EntraIdOAuthService.STATE_STORAGE_KEY)

      appLogger.debug("OAuth state retrieved and cleared from sessionStorage")
      return state
    } catch (error) {
      appLogger.error(
        "Failed to retrieve OAuth state",
        error instanceof Error ? error.message : "Unknown error"
      )
      return null
    }
  }

  /**
   * Initiate OAuth authorization flow
   * Redirects user to Entra ID for authentication
   */
  async initiateAuthorizationFlow(): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error("Entra ID OAuth is not configured. Check environment variables.")
    }

    try {
      appLogger.debug("Initiating OAuth authorization flow")

      // Generate PKCE challenge
      const { codeVerifier, codeChallenge } = await this.generatePKCEChallenge()

      // Generate state and nonce for security
      const state = this.generateRandomString(32)
      const nonce = this.generateRandomString(32)

      // Save state for validation in callback
      this.saveState({
        state,
        codeVerifier,
        nonce,
        redirectUri: this.redirectUri,
        timestamp: Date.now(),
      })

      // Build authorization URL
      const authorizeUrl = new URL(`/authorize`, this.apiUrl)
      authorizeUrl.searchParams.set("response_type", "code")
      authorizeUrl.searchParams.set("client_id", this.clientId)
      authorizeUrl.searchParams.set("redirect_uri", this.redirectUri)
      authorizeUrl.searchParams.set("scope", "openid profile email")
      authorizeUrl.searchParams.set("state", state)
      authorizeUrl.searchParams.set("nonce", nonce)
      authorizeUrl.searchParams.set("code_challenge", codeChallenge)
      authorizeUrl.searchParams.set("code_challenge_method", "S256")
      authorizeUrl.searchParams.set("prompt", "select_account")

      appLogger.info("Redirecting to authorization endpoint", undefined, {
        tenantId: this.tenantId,
        clientId: this.clientId,
      })

      // Redirect to authorization endpoint
      window.location.href = authorizeUrl.toString()
    } catch (error) {
      appLogger.error(
        "Failed to initiate OAuth flow",
        error instanceof Error ? error.message : "Unknown error"
      )
      throw error
    }
  }

  /**
   * Handle OAuth callback
   * Exchanges authorization code for token
   */
  async handleCallback(
    code: string,
    state: string,
    error?: string,
    errorDescription?: string
  ): Promise<string | null> {
    try {
      // Check for authorization error from Entra ID
      if (error) {
        throw new Error(
          `Authorization failed: ${error}${errorDescription ? ` - ${errorDescription}` : ""}`
        )
      }

      if (!code) {
        throw new Error("Authorization code not found in callback")
      }

      // Retrieve and validate state
      const savedState = this.retrieveAndClearState()
      if (!savedState) {
        throw new Error("OAuth state not found or expired. Please try logging in again.")
      }

      if (savedState.state !== state) {
        throw new Error("State parameter mismatch. This may indicate a security issue.")
      }

      // Exchange code for token
      const token = await this.exchangeCodeForToken(code, savedState.codeVerifier)

      // Store token
      this.saveToken(token)

      appLogger.info("OAuth callback handled successfully")
      return token.access_token
    } catch (error) {
      appLogger.error(
        "OAuth callback error",
        error instanceof Error ? error.message : "Unknown error"
      )
      throw error
    }
  }

  /**
   * Exchange authorization code for access token
   */
  private async exchangeCodeForToken(
    code: string,
    codeVerifier: string
  ): Promise<OAuthTokenResponse> {
    try {
      appLogger.debug("Exchanging authorization code for token")

      const tokenUrl = new URL(`/token`, this.apiUrl)
      const response = await fetch(tokenUrl.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: this.redirectUri,
          client_id: this.clientId,
          code_verifier: codeVerifier,
        }).toString(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        appLogger.error(
          "Token exchange failed",
          `Status: ${response.status}, Response: ${errorText}`
        )
        throw new Error(
          `Token exchange failed: ${response.status} ${response.statusText}`
        )
      }

      const data = (await response.json()) as OAuthTokenResponse

      if (!data.access_token) {
        throw new Error("Token response missing access_token")
      }

      appLogger.info("Token exchange successful")
      return data
    } catch (error) {
      appLogger.error(
        "Token exchange error",
        error instanceof Error ? error.message : "Unknown error"
      )
      throw error
    }
  }

  /**
   * Save token to sessionStorage
   */
  private saveToken(token: OAuthTokenResponse): void {
    try {
      sessionStorage.setItem(
        EntraIdOAuthService.TOKEN_STORAGE_KEY,
        JSON.stringify({
          ...token,
          savedAt: Date.now(),
        })
      )
      appLogger.debug("OAuth token saved to sessionStorage")
    } catch (error) {
      appLogger.error(
        "Failed to save OAuth token",
        error instanceof Error ? error.message : "Unknown error"
      )
    }
  }

  /**
   * Get stored token
   */
  getStoredToken(): OAuthTokenResponse | null {
    try {
      const stored = sessionStorage.getItem(EntraIdOAuthService.TOKEN_STORAGE_KEY)
      if (!stored) return null
      return JSON.parse(stored) as OAuthTokenResponse
    } catch (error) {
      appLogger.warn(
        "Failed to retrieve stored token",
        error instanceof Error ? error.message : "Unknown error"
      )
      return null
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(expiresIn?: number): boolean {
    if (!expiresIn) return false
    const stored = sessionStorage.getItem(EntraIdOAuthService.TOKEN_STORAGE_KEY)
    if (!stored) return true

    try {
      const token = JSON.parse(stored) as OAuthTokenResponse & { savedAt: number }
      const expiryTime = token.savedAt + (expiresIn * 1000)
      return Date.now() > expiryTime
    } catch {
      return true
    }
  }

  /**
   * Clear stored token (logout)
   */
  clearToken(): void {
    try {
      sessionStorage.removeItem(EntraIdOAuthService.TOKEN_STORAGE_KEY)
      sessionStorage.removeItem(EntraIdOAuthService.STATE_STORAGE_KEY)
      appLogger.debug("OAuth tokens cleared from sessionStorage")
    } catch (error) {
      appLogger.warn(
        "Failed to clear OAuth tokens",
        error instanceof Error ? error.message : "Unknown error"
      )
    }
  }

  /**
   * Decode ID token claims (without verification - verification done by API)
   * This is safe because the token comes from our trusted API
   */
  decodeIdTokenClaims(idToken: string): Record<string, unknown> {
    try {
      const parts = idToken.split(".")
      if (parts.length !== 3) {
        throw new Error("Invalid token format")
      }

      // Decode the payload (second part)
      const payload = parts[1]
      const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
      const claims = JSON.parse(decoded) as Record<string, unknown>

      return claims
    } catch (error) {
      appLogger.warn(
        "Failed to decode ID token",
        error instanceof Error ? error.message : "Unknown error"
      )
      return {}
    }
  }
}

// Create singleton instance
export const entraIdOAuthService = new EntraIdOAuthService()
