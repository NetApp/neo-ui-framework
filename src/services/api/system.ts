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
  SetupGraphResponse,
  SetupResetResponse,
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

  resetSetup() {
    appLogger.debug("Resetting setup state")
    return this.request<SetupResetResponse>("/api/v1/setup/reset", {
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
}