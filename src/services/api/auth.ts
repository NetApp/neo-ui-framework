// Copyright 2025 NetApp, Inc. All Rights Reserved.
import { appLogger } from "@/services/app-logger"
import { AuthenticationError, BaseApiClient } from "./base"
import type { TokenResponse } from "@/services/models"

export class AuthApiClient extends BaseApiClient {
  async authenticate(username: string, password: string): Promise<string> {
    appLogger.debug("Attempting authentication", undefined, { username })

    try {
      const response = await fetch(`${this.baseUrl}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({
          grant_type: "password",
          username,
          password,
          scope: "",
          client_id: "",
          client_secret: "",
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        appLogger.error(
          "Authentication failed",
          `Status: ${response.status}, Response: ${errorText}`,
          { username, status: response.status }
        )

        if (response.status === 401 || response.status === 403) {
          throw new AuthenticationError("Authentication failed. Please check your credentials.")
        }

        throw new Error(
          `Authentication failed (${response.status} ${response.statusText})`
        )
      }

      const data = (await response.json()) as TokenResponse

      if (!data.access_token) {
        appLogger.error("Authentication response missing access token", "Token response incomplete")
        throw new Error("Token response missing access_token")
      }

      appLogger.info("User authenticated successfully", undefined, { username })
      return data.access_token
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        appLogger.error(
          "Cannot connect to authentication server",
          "Network connection failed",
          { username }
        )
        throw new Error(
          "Cannot connect to server. Check if the API is running and CORS is enabled."
        )
      }
      throw error
    }
  }

  async logout(token: string): Promise<void> {
    appLogger.debug("Sending logout request to invalidate token")

    try {
      await this.requestWithToken<void>(
        "/logout",
        token,
        { method: "POST" },
        { parseJson: false }
      )
      appLogger.info("Token invalidated successfully on server")
    } catch (error) {
      appLogger.warn(
        "Failed to invalidate token on server",
        error instanceof Error ? error.message : "Unknown error"
      )
    }
  }
}