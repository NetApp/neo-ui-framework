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
  SetupOAuthResponse,
} from "@/services/models"

export class SystemApiClient extends BaseApiClient {
  getSetupStatus() {
    appLogger.debug("Fetching setup status")
    return this.requestApiV1<SetupStatusResponse>("/setup/status")
  }

  setupLicense(request: SetupLicenseRequest) {
    appLogger.debug("Setting up license")
    return this.requestApiV1<SetupLicenseResponse>("/setup/license", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })
  }

  setupGraph(request: SetupGraphRequest) {
    appLogger.debug("Setting up graph connection")
    return this.requestApiV1<SetupGraphResponse>("/setup/graph", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })
  }

  getSetupGraph() {
    appLogger.debug("Fetching graph setup configuration")
    return this.requestApiV1<SetupGraphConfigResponse>("/setup/graph", {
      method: "GET",
    })
  }  

  setupProxy(request: SetupProxyRequest) {
    appLogger.debug("Configuring proxy settings")
    return this.requestApiV1<SetupProxyResponse>("/setup/proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })
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

  resetSetup() {
    appLogger.debug("Resetting setup state")
    return this.requestApiV1<SetupResetResponse>("/setup/reset", {
      method: "POST",
    })
  }

  factoryReset(payload: SetupFactoryResetRequest) {
    appLogger.debug("Performing factory reset")
    return this.requestApiV1<SetupResetResponse>("/setup/factory-reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
  }

  getInitialCredentials() {
    appLogger.debug("Fetching initial credentials")
    return this.requestApiV1<InitialCredentialsResponse>("/setup/initial-credentials", {
      method: "GET",
    })
  }

  completeSetup() {
    appLogger.debug("Completing setup")
    return this.requestApiV1<SetupCompleteResponse>("/setup/complete", {
      method: "POST",
    })
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

setupOauth(payload: Body_configure_oauth_api_v1_setup_oauth_post) {
  appLogger.debug("Setting up OAuth")
  return this.requestApiV1<SetupOAuthResponse>("/setup/oauth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload)
  })
}

  getMcpInfo(token: string) {
    appLogger.debug("Fetching MCP info")
    return this.requestBackendWithToken<McpInfoResponse>("/mcp/info", token)
  }
}