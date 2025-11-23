import { appLogger } from "@/services/app-logger"
import { BaseApiClient } from "./base"
import type {
  HealthResponse,
  LicenseResponse,
  VersionResponse,
  DatabaseSizeResponse,
} from "@/services/models"

export class SystemApiClient extends BaseApiClient {
  getHealth(token: string) {
    appLogger.debug("Fetching health status")
    return this.requestWithToken<HealthResponse>("/health", token)
  }

  getLicenseStatus(token: string) {
    appLogger.debug("Fetching license status")
    return this.requestWithToken<LicenseResponse>("/license/status", token)
  }

  getVersion(token: string) {
    appLogger.debug("Fetching version information")
    return this.requestWithToken<VersionResponse>("/version", token)
  }

  getDatabaseSize(token: string) {
    appLogger.debug("Fetching database size information")
    return this.requestWithToken<DatabaseSizeResponse>("/database/size", token)
  }
}