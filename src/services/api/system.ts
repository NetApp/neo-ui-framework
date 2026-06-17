// Copyright 2025 NetApp, Inc. All Rights Reserved.
import { appLogger } from "@/services/app-logger"
import { BaseApiClient } from "./base"
import type {
  HealthResponse,
  LicenseResponse,
  VersionResponse,
  DatabaseSizeResponse,
  SetupStatusResponse,
  SetupLicenseRequest,
  SetupLicenseResponse,
  SetupGraphRequest,
  SetupGraphConfigResponse,
  SetupGraphResponse,
  SetupProxyRequest,
  SetupProxyResponse,
  SetupProxyConfigResponse,
  SetupSslConfigResponse,
  SetupResetResponse,
  SetupFactoryResetRequest,
  SetupCompleteResponse,
  InitialCredentialsResponse,
  McpInfoResponse,
  Body_configure_oauth_api_v1_setup_oauth_post,
  Body_configure_mcp_oauth_api_v1_setup_mcp_post,
  MCPOAuthSettingsResponse,
  SetupOAuthResponse,
} from "@/services/models"

function withSuccessMessage<T extends { success?: boolean; message?: string }>(
  response: T | undefined,
  defaultMessage: string
): T {
  return {
    ...response,
    success: response?.success ?? true,
    message: response?.message ?? defaultMessage,
  } as T
}

export class SystemApiClient extends BaseApiClient {
  getSetupStatus() {
    appLogger.debug("Fetching setup status")
    return this.requestApiV1<SetupStatusResponse>("/setup/status")
  }

  async setupLicense(request: SetupLicenseRequest) {
    appLogger.debug("Setting up license")
    const response = await this.requestApiV1<SetupLicenseResponse>("/setup/license", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })

    return withSuccessMessage(response, "License configured successfully.")
  }

  async setupGraph(request: SetupGraphRequest) {
    appLogger.debug("Setting up graph connection")
    const response = await this.requestApiV1<SetupGraphResponse>("/setup/graph", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })

    return withSuccessMessage(response, "Graph configuration saved successfully.")
  }

  getSetupGraph() {
    appLogger.debug("Fetching graph setup configuration")
    return this.requestApiV1<SetupGraphConfigResponse>("/setup/graph", {
      method: "GET",
    })
  }  

  async setupProxy(request: SetupProxyRequest) {
    appLogger.debug("Configuring proxy settings")
    const response = await this.requestApiV1<SetupProxyResponse>("/setup/proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })

    return withSuccessMessage(response, "Proxy settings saved successfully.")
  }

  getSetupProxy() {
    appLogger.debug("Fetching proxy setup configuration")
    return this.requestApiV1<SetupProxyConfigResponse>("/setup/proxy", {
      method: "GET",
    })
  }  

  getSetupSsl() {
    appLogger.debug("Fetching SSL setup configuration")
    return this.requestApiV1<SetupSslConfigResponse>("/setup/ssl", {
      method: "GET",
    })
  }  

  async resetSetup() {
    appLogger.debug("Resetting setup state")
    const response = await this.requestApiV1<SetupResetResponse>("/setup/reset", {
      method: "POST",
    })

    return withSuccessMessage(response, "Setup state reset successfully.")
  }

  async factoryReset(payload: SetupFactoryResetRequest) {
    appLogger.debug("Performing factory reset")
    const response = await this.requestApiV1<SetupResetResponse>("/setup/factory-reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    return withSuccessMessage(response, "Factory reset completed successfully.")
  }

  getInitialCredentials() {
    appLogger.debug("Fetching initial credentials")
    return this.requestApiV1<InitialCredentialsResponse>("/setup/initial-credentials", {
      method: "GET",
    })
  }

  async completeSetup() {
    appLogger.debug("Completing setup")
    const response = await this.requestApiV1<SetupCompleteResponse>("/setup/complete", {
      method: "POST",
    })

    return withSuccessMessage(response, "Setup completed successfully.")
  }

  getHealth(token?: string) {
    appLogger.debug("Fetching health status")
    if (token) {
      return this.requestBackendWithToken<HealthResponse>("/health/detailed", token)
    }
    return this.requestBackend<HealthResponse>("/health/detailed")
  }

  getLicenseStatus(token?: string) {
    appLogger.debug("Fetching license status")
    if (token) {
      return this.requestApiV1WithToken<LicenseResponse>("/license/status", token)
    }
    return this.requestApiV1<LicenseResponse>("/license/status")
  }

  getVersion(token?: string) {
    appLogger.debug("Fetching version information")
    if (token) {
      return this.requestBackendWithToken<VersionResponse>("/version", token)
    }
    return this.requestBackend<VersionResponse>("/version")
  }

  getDatabaseSize(token: string) {
    appLogger.debug("Fetching database size information")
    return this.requestApiV1WithToken<DatabaseSizeResponse>("/monitoring/database/size", token)
  }

  async setupOauth(payload: Body_configure_oauth_api_v1_setup_oauth_post) {
    appLogger.debug("Setting up MCP OAuth")
    const response = await this.requestApiV1<SetupOAuthResponse>("/setup/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    })

    return withSuccessMessage(response, "MCP OAuth configured successfully.")
  }

  getSetupMcpOauth() {
    appLogger.debug("Fetching MCP OAuth setup configuration")
    return this.requestApiV1<MCPOAuthSettingsResponse>("/setup/mcp", {
      method: "GET",
    })
  }

  async setupMcpOauth(payload: Body_configure_mcp_oauth_api_v1_setup_mcp_post) {
    appLogger.debug("Configuring MCP OAuth setup")
    const response = await this.requestApiV1<SetupOAuthResponse>("/setup/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    return withSuccessMessage(response, "MCP OAuth configured successfully.")
  }

  getMcpInfo(token: string) {
    appLogger.debug("Fetching MCP info")
    return this.requestBackendWithToken<McpInfoResponse>("/mcp/info", token)
  }
}