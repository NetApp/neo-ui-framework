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
} from "@/services/models"

export class SystemApiClient extends BaseApiClient {
  getSetupStatus() {
    appLogger.debug("Fetching setup status")
    return this.request<SetupStatusResponse>("/api/v1/setup/status")
  }

  setupLicense(request: SetupLicenseRequest) {
    appLogger.debug("Setting up license")
    return this.request<SetupLicenseResponse>("/api/v1/setup/license", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })
  }

  setupGraph(request: SetupGraphRequest) {
    appLogger.debug("Setting up graph connection")
    return this.request<SetupGraphResponse>("/api/v1/setup/graph", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })
  }

  getSetupGraph() {
    appLogger.debug("Fetching graph setup configuration")
    return this.request<SetupGraphConfigResponse>("/api/v1/setup/graph", {
      method: "GET",
    })
  }  

  setupProxy(request: SetupProxyRequest) {
    appLogger.debug("Configuring proxy settings")
    return this.request<SetupProxyResponse>("/api/v1/setup/proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })
  }

  getSetupProxy() {
    appLogger.debug("Fetching proxy setup configuration")
    return this.request<SetupProxyConfigResponse>("/api/v1/setup/proxy", {
      method: "GET",
    })
  }  

  getSetupSsl() {
    appLogger.debug("Fetching SSL setup configuration")
    return this.request<SetupSslConfigResponse>("/api/v1/setup/ssl", {
      method: "GET",
    })
  }  

  resetSetup() {
    appLogger.debug("Resetting setup state")
    return this.request<SetupResetResponse>("/api/v1/setup/reset", {
      method: "POST",
    })
  }

  factoryReset(payload: SetupFactoryResetRequest) {
    appLogger.debug("Performing factory reset")
    return this.request<SetupResetResponse>("/api/v1/setup/factory-reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
  }

  getInitialCredentials() {
    appLogger.debug("Fetching initial credentials")
    return this.request<InitialCredentialsResponse>("/api/v1/setup/initial-credentials", {
      method: "GET",
    })
  }

  completeSetup() {
    appLogger.debug("Completing setup")
    return this.request<SetupCompleteResponse>("/api/v1/setup/complete", {
      method: "POST",
    })
  }

  getHealth(token?: string) {
    appLogger.debug("Fetching health status")
    if (token) {
      return this.requestWithToken<HealthResponse>("/health", token)
    }
    return this.request<HealthResponse>("/health")
  }

  getLicenseStatus(token?: string) {
    appLogger.debug("Fetching license status")
    if (token) {
      return this.requestWithToken<LicenseResponse>("/license/status", token)
    }
    return this.request<LicenseResponse>("/license/status")
  }

  getVersion(token?: string) {
    appLogger.debug("Fetching version information")
    if (token) {
      return this.requestWithToken<VersionResponse>("/version", token)
    }
    return this.request<VersionResponse>("/version")
  }

  getDatabaseSize(token: string) {
    appLogger.debug("Fetching database size information")
    return this.requestWithToken<DatabaseSizeResponse>("/database/size", token)
  }

  setupOauth(payload: any) {
    appLogger.debug("Setting up OAuth")
    return this.request<any>("/api/v1/setup/oauth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    })
  }

  getMcpInfo(token: string) {
    appLogger.debug("Fetching MCP info")
    return this.requestWithToken<McpInfoResponse>("/mcp/info", token)
  }
}