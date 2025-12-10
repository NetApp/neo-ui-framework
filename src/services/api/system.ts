import { appLogger } from "@/services/app-logger"
import { BaseApiClient } from "./base"
import type {
  HealthResponse,
  LicenseResponse,
  VersionResponse,
  DatabaseSizeResponse,
  SetupStatus,
} from "@/services/models"

export class SystemApiClient extends BaseApiClient {
  getSetupStatus(token?: string) {
    appLogger.debug("Fetching setup status")
    if (token) {
      return this.requestWithToken<SetupStatus>("/setup/status", token)
    }
    return this.request<SetupStatus>("/setup/status")
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