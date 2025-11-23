import { appLogger } from "@/services/app-logger"
import type {
  HealthResponse,
  LicenseResponse,
  VersionResponse,
  DatabaseSizeResponse,
  UserResponse,
  MeResponse,
  OperationResponse,
  SharesResponse,
  ShareDetailsResponse,
  FilesResponse,
  FileMetadataResponse,
  FileEntry,
  FileSearchParams,
  FileSearchResponse,
  MonitoringOverviewResponse,
  MonitoringWorkerResponse,
  MonitoringEnumerationResponse,
  MonitoringWorkersResponse,
  MonitoringGraphRateLimitResponse,
  MonitoringFailedItemsResponse,
  TasksResponse,
  TasksListResponse,
  TaskStatisticsResponse,
  HelmChartVersionResponse,
  TokenResponse,
} from "./models"
import { BaseApiClient, AuthenticationError } from "./api/base"
import { AuthApiClient } from "./api/auth"
import { SystemApiClient } from "./api/system"
import { UsersApiClient } from "./api/users"
import { SharesApiClient } from "./api/shares"
import { FilesApiClient } from "./api/files"
import { OperationsApiClient } from "./api/operations"
import { MonitoringApiClient } from "./api/monitoring"
import { TasksApiClient } from "./api/tasks"
import { AnalyticsApiClient } from "./api/analytics"
import { HelmApiClient } from "./api/helm"

export type {
  HealthResponse,
  LicenseResponse,
  VersionResponse,
  DatabaseSizeResponse,
  UserResponse,
  MeResponse,
  OperationResponse,
  SharesResponse,
  ShareDetailsResponse,
  FilesResponse,
  FileMetadataResponse,
  FileEntry,
  FileSearchParams,
  FileSearchResponse,
  MonitoringOverviewResponse,
  MonitoringWorkerResponse,
  MonitoringEnumerationResponse,
  MonitoringWorkersResponse,
  MonitoringGraphRateLimitResponse,
  MonitoringFailedItemsResponse,
  TasksResponse,
  TasksListResponse,
  TaskStatisticsResponse,
  HelmChartVersionResponse,
  TokenResponse,
}
export { AuthenticationError }

export class NeoApiService extends BaseApiClient {
  private auth: AuthApiClient
  private system: SystemApiClient
  private users: UsersApiClient
  private shares: SharesApiClient
  private files: FilesApiClient
  private operations: OperationsApiClient
  private monitoring: MonitoringApiClient
  private tasks: TasksApiClient
  private analytics: AnalyticsApiClient
  private helm: HelmApiClient

  constructor(baseUrl = "/api") {
    super(baseUrl)
    this.auth = new AuthApiClient(baseUrl)
    this.system = new SystemApiClient(baseUrl)
    this.users = new UsersApiClient(baseUrl)
    this.shares = new SharesApiClient(baseUrl)
    this.files = new FilesApiClient(baseUrl)
    this.operations = new OperationsApiClient(baseUrl)
    this.monitoring = new MonitoringApiClient(baseUrl)
    this.tasks = new TasksApiClient(baseUrl)
    this.analytics = new AnalyticsApiClient(baseUrl)
    this.helm = new HelmApiClient()
  }

  authenticate(username: string, password: string) {
    return this.auth.authenticate(username, password)
  }

  logout(token: string) {
    return this.auth.logout(token)
  }

  getHealth(token: string) {
    return this.system.getHealth(token)
  }

  getLicenseStatus(token: string) {
    return this.system.getLicenseStatus(token)
  }

  getVersion(token: string) {
    return this.system.getVersion(token)
  }

  getDatabaseSize(token: string) {
    return this.system.getDatabaseSize(token)
  }

  getUsers(token: string) {
    return this.users.getUsers(token)
  }

  getMeUsers(token: string) {
    return this.users.getMeUsers(token)
  }

  createUser(
    token: string,
    payload: {
      id: number
      username: string
      password: string
      email?: string
      is_active: boolean
      is_admin: boolean
    }
  ) {
    return this.users.createUser(token, payload)
  }

  changeMyPassword(token: string, payload: { current_password: string; new_password: string }) {
    return this.users.changeMyPassword(token, payload)
  }

  getShares(token: string) {
    return this.shares.getShares(token)
  }

  getShareDetails(token: string, shareId: string) {
    return this.shares.getShareDetails(token, shareId)
  }

  createShare(token: string, payload: Parameters<SharesApiClient["createShare"]>[1]) {
    return this.shares.createShare(token, payload)
  }

  updateShare(token: string, shareId: string, payload: Parameters<SharesApiClient["updateShare"]>[2]) {
    return this.shares.updateShare(token, shareId, payload)
  }

  deleteShare(token: string, shareId: string) {
    return this.shares.deleteShare(token, shareId)
  }

  startShareCrawl(token: string, shareId: string) {
    return this.shares.startShareCrawl(token, shareId)
  }

  getFiles(token: string, shareId: string, page?: number, pageSize?: number) {
    return this.files.getFiles(token, shareId, page, pageSize)
  }

  getFileMetadata(token: string, shareId: string, fileId: string) {
    return this.files.getFileMetadata(token, shareId, fileId)
  }

  searchFiles(token: string, params: FileSearchParams) {
    return this.files.searchFiles(token, params)
  }

  getOperations(token: string) {
    return this.operations.getOperations(token)
  }

  getMonitoringOverview(token: string) {
    return this.monitoring.getMonitoringOverview(token)
  }

  getMonitoringWorkers(token: string) {
    return this.monitoring.getMonitoringWorkers(token)
  }

  getMonitoringEnumeration(token: string) {
    return this.monitoring.getMonitoringEnumeration(token)
  }

  getMonitoringGraphRateLimit(token: string) {
    return this.monitoring.getMonitoringGraphRateLimit(token)
  }

  getMonitoringFailedItems(token: string) {
    return this.monitoring.getMonitoringFailedItems(token)
  }

  getTasks(token: string) {
    return this.tasks.getTasks(token)
  }

  getTaskStatistics(token: string) {
    return this.tasks.getTaskStatistics(token)
  }

  getFileAnalytics(token: string) {
    return this.analytics.getFileAnalytics(token)
  }

  getSharesAnalytics(token: string) {
    return this.analytics.getSharesAnalytics(token)
  }

  getLatestHelmVersion() {
    return this.helm.getLatestHelmVersion()
  }

  async fetchSystemData(token: string) {
    appLogger.info("Fetching system data")

    try {
      const [
        health,
        license,
        version,
        users,
        me,
        operations,
        shares,
        databaseSize,
        helmChartVersion,
      ] = await Promise.all([
        this.getHealth(token),
        this.getLicenseStatus(token),
        this.getVersion(token),
        this.getUsers(token),
        this.getMeUsers(token),
        this.getOperations(token),
        this.getShares(token),
        this.getDatabaseSize(token),
        this.getLatestHelmVersion(),
      ])

      appLogger.info("System data fetched successfully", undefined, {
        users_count: users.length,
        shares_count: shares.length,
        operations_count: operations.length,
        database_size_mb: databaseSize.database_file_size_mb,
        total_files_tracked: databaseSize.total_files_tracked,
        latest_app_version: helmChartVersion.app_version,
        latest_chart_version: helmChartVersion.chart_version,
      })

      return {
        health,
        license,
        version,
        users,
        me,
        operations,
        shares,
        files: null as FilesResponse | null,
        databaseSize,
        helmChartVersion,
      }
    } catch (error) {
      appLogger.error(
        "Failed to fetch system data",
        error instanceof Error ? error.message : "Unknown error"
      )
      throw error
    }
  }

  async fetchMonitoringData(token: string) {
    appLogger.info("Fetching monitoring data")

    try {
      const [
        overview,
        workers,
        enumeration,
        graphRateLimit,
        failedItems,
        tasks,
        taskStats,
        fileAnalytics,
        sharesAnalytics,
      ] = await Promise.all([
        this.getMonitoringOverview(token),
        this.getMonitoringWorkers(token),
        this.getMonitoringEnumeration(token),
        this.getMonitoringGraphRateLimit(token),
        this.getMonitoringFailedItems(token),
        this.getTasks(token),
        this.getTaskStatistics(token),
        this.getFileAnalytics(token),
        this.getSharesAnalytics(token),
      ])

      appLogger.info("Monitoring data fetched successfully", undefined, {
        total_workers: workers.total_workers,
        active_workers: workers.active_workers,
        total_tasks: taskStats.total_tasks,
        failed_items: failedItems.total_failed_items,
        file_types: fileAnalytics.length,
        shares_with_files: sharesAnalytics.length,
      })

      return {
        overview,
        workers,
        enumeration,
        graphRateLimit,
        failedItems,
        tasks,
        taskStats,
        fileAnalytics,
        sharesAnalytics,
      }
    } catch (error) {
      appLogger.error(
        "Failed to fetch monitoring data",
        error instanceof Error ? error.message : "Unknown error"
      )
      throw error
    }
  }
}