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
  // TaskCancelResponse,
} from "./models"
import { BaseApiClient, AuthenticationError } from "./api/base"
import { AuthApiClient } from "./api/auth"
import { SystemApiClient } from "./api/system"
import { UsersApiClient } from "./api/users"
import { SharesApiClient } from "./api/shares"
import { FilesApiClient } from "./api/files"
import { OperationsApiClient } from "./api/operations"
import { MonitoringApiClient } from "./api/monitoring"
import { TasksApiClient, type TaskCancelResponse } from "./api/tasks"
import { AnalyticsApiClient } from "./api/analytics"
import { HelmApiClient } from "./api/helm"
import { DataLoader } from "./data-loader"

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
  TaskCancelResponse,
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
  private dataLoader: DataLoader

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
    this.dataLoader = new DataLoader(30000) // 30 seconds default TTL
  }

  clearCache() {
    this.dataLoader.clear()
  }

  authenticate(username: string, password: string) {
    return this.auth.authenticate(username, password)
  }

  logout(token: string) {
    return this.auth.logout(token)
  }

  getHealth(token?: string) {
    return this.dataLoader.load(`health:${token || "public"}`, () => this.system.getHealth(token))
  }

  getLicenseStatus(token?: string) {
    return this.dataLoader.load(`license:${token || "public"}`, () => this.system.getLicenseStatus(token))
  }

  getVersion(token?: string) {
    return this.dataLoader.load(`version:${token || "public"}`, () => this.system.getVersion(token))
  }

  getDatabaseSize(token: string) {
    return this.dataLoader.load(`databaseSize:${token}`, () => this.system.getDatabaseSize(token))
  }

  getUsers(token: string) {
    return this.dataLoader.load(`users:${token}`, () => this.users.getUsers(token))
  }

  getMeUsers(token: string) {
    return this.dataLoader.load(`me:${token}`, () => this.users.getMeUsers(token))
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
    return this.dataLoader.load(`shares:${token}`, () => this.shares.getShares(token))
  }

  getShareDetails(token: string, shareId: string) {
    return this.dataLoader.load(`shareDetails:${token}:${shareId}`, () => this.shares.getShareDetails(token, shareId))
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
    const key = `files:${token}:${shareId}:${page}:${pageSize}`
    return this.dataLoader.load(key, () => this.files.getFiles(token, shareId, page, pageSize))
  }

  getFileMetadata(token: string, shareId: string, fileId: string) {
    return this.dataLoader.load(`fileMetadata:${token}:${shareId}:${fileId}`, () => this.files.getFileMetadata(token, shareId, fileId))
  }

  searchFiles(token: string, params: FileSearchParams) {
    const key = `searchFiles:${token}:${JSON.stringify(params)}`
    return this.dataLoader.load(key, () => this.files.searchFiles(token, params))
  }

  getOperations(token: string) {
    return this.dataLoader.load(`operations:${token}`, () => this.operations.getOperations(token))
  }

  getMonitoringOverview(token: string) {
    return this.dataLoader.load(`monitoringOverview:${token}`, () => this.monitoring.getMonitoringOverview(token), 3600000)
  }

  getMonitoringWorkers(token: string) {
    return this.dataLoader.load(`monitoringWorkers:${token}`, () => this.monitoring.getMonitoringWorkers(token), 3600000)
  }

  getMonitoringEnumeration(token: string) {
    return this.dataLoader.load(`monitoringEnumeration:${token}`, () => this.monitoring.getMonitoringEnumeration(token), 3600000)
  }

  getMonitoringGraphRateLimit(token: string) {
    return this.dataLoader.load(`monitoringGraphRateLimit:${token}`, () => this.monitoring.getMonitoringGraphRateLimit(token), 3600000)
  }

  getMonitoringFailedItems(token: string) {
    return this.dataLoader.load(`monitoringFailedItems:${token}`, () => this.monitoring.getMonitoringFailedItems(token), 3600000)
  }

  getTasks(token: string) {
    return this.dataLoader.load(`tasks:${token}`, () => this.tasks.getTasks(token), 3600000)
  }

  getTaskStatistics(token: string) {
    return this.dataLoader.load(`taskStatistics:${token}`, () => this.tasks.getTaskStatistics(token), 3600000)
  }

  deleteTask(token: string, taskId: string) {
    return this.tasks.deleteTask(token, taskId)
  }

  getFileAnalytics(token: string) {
    return this.dataLoader.load(`fileAnalytics:${token}`, () => this.analytics.getFileAnalytics(token), 3600000)
  }

  getSharesAnalytics(token: string) {
    return this.dataLoader.load(`sharesAnalytics:${token}`, () => this.analytics.getSharesAnalytics(token), 3600000)
  }

  getLatestHelmVersion() {
    return this.dataLoader.load(`latestHelmVersion`, () => this.helm.getLatestHelmVersion())
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