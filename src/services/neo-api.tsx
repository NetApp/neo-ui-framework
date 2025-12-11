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
  AclCacheStatisticsResponse,
  HelmChartVersionResponse,
  TokenResponse,
  ContentSearchRequest,
  ContentSearchResponse,
  // TaskCancelResponse,
} from "./models"
import { BaseApiClient, AuthenticationError, AuthorizationError } from "./api/base"
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
  AclCacheStatisticsResponse,
  HelmChartVersionResponse,
  TokenResponse,
  TaskCancelResponse,
  ContentSearchRequest,
  ContentSearchResponse,
}
export { AuthenticationError, AuthorizationError }

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
  private monitoringTtl: number = 10 * 60 * 1000
  private filesTtl: number = 10 * 60 * 1000

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

  updateConfig(config: { monitoringTtl?: number; filesTtl?: number; cacheMaxSize?: number }) {
    if (config.monitoringTtl) this.monitoringTtl = config.monitoringTtl * 60 * 1000
    if (config.filesTtl) this.filesTtl = config.filesTtl * 60 * 1000
    if (config.cacheMaxSize) this.dataLoader.setMaxSize(config.cacheMaxSize * 1024 * 1024)
  }

  clearCache() {
    this.dataLoader.clear()
  }

  getCacheStats() {
    return this.dataLoader.getStats()
  }

  authenticate(username: string, password: string) {
    return this.auth.authenticate(username, password)
  }

  logout(token: string) {
    return this.auth.logout(token)
  }

  getHealth(token?: string) {
    return this.dataLoader.load(`health:${token || "public"}`, () => this.system.getHealth(token), this.monitoringTtl)
  }

  getLicenseStatus(token?: string) {
    return this.dataLoader.load(`license:${token || "public"}`, () => this.system.getLicenseStatus(token), this.monitoringTtl)
  }

  getVersion(token?: string) {
    return this.dataLoader.load(`version:${token || "public"}`, () => this.system.getVersion(token), this.monitoringTtl)
  }

  getDatabaseSize(token: string) {
    return this.dataLoader.load(`databaseSize:${token}`, () => this.system.getDatabaseSize(token), this.monitoringTtl)
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
    return this.dataLoader.load(key, () => this.files.getFiles(token, shareId, page, pageSize), this.filesTtl)
  }

  getFileMetadata(token: string, shareId: string, fileId: string) {
    return this.dataLoader.load(`fileMetadata:${token}:${shareId}:${fileId}`, () => this.files.getFileMetadata(token, shareId, fileId), this.filesTtl)
  }

  searchFiles(token: string, params: FileSearchParams) {
    const key = `searchFiles:${token}:${JSON.stringify(params)}`
    return this.dataLoader.load(key, () => this.files.searchFiles(token, params), this.filesTtl)
  }

  searchContent(token: string, payload: ContentSearchRequest) {
    const key = `searchContent:${token}:${JSON.stringify(payload)}`
    return this.dataLoader.load(key, () => this.files.searchContent(token, payload), this.filesTtl)
  }

  getMyDocuments(token: string, page: number = 1, pageSize: number = 100) {
    const key = `myDocuments:${token}:${page}:${pageSize}`
    return this.dataLoader.load(key, () => this.files.getMyDocuments(token, page, pageSize), this.filesTtl)
  }

  getOperations(token: string) {
    return this.dataLoader.load(`operations:${token}`, () => this.operations.getOperations(token))
  }

  getMonitoringOverview(token: string) {
    return this.dataLoader.load(`monitoringOverview:${token}`, () => this.monitoring.getMonitoringOverview(token), this.monitoringTtl)
  }

  getMonitoringWorkers(token: string) {
    return this.dataLoader.load(`monitoringWorkers:${token}`, () => this.monitoring.getMonitoringWorkers(token), this.monitoringTtl)
  }

  getMonitoringEnumeration(token: string) {
    return this.dataLoader.load(`monitoringEnumeration:${token}`, () => this.monitoring.getMonitoringEnumeration(token), this.monitoringTtl)
  }

  getMonitoringGraphRateLimit(token: string) {
    return this.dataLoader.load(`monitoringGraphRateLimit:${token}`, () => this.monitoring.getMonitoringGraphRateLimit(token), this.monitoringTtl)
  }

  getMonitoringFailedItems(token: string) {
    return this.dataLoader.load(`monitoringFailedItems:${token}`, () => this.monitoring.getMonitoringFailedItems(token), this.monitoringTtl)
  }

  retryWorkItems(token: string, shareId: string, workItemIds: string[]) {
    return this.monitoring.retryWorkItems(token, shareId, workItemIds)
  }

  getTasks(token: string) {
    return this.dataLoader.load(`tasks:${token}`, () => this.tasks.getTasks(token), this.monitoringTtl)
  }

  getTaskStatistics(token: string) {
    return this.dataLoader.load(`taskStatistics:${token}`, () => this.tasks.getTaskStatistics(token), this.monitoringTtl)
  }

  getAclCacheStatistics(token: string) {
    return this.dataLoader.load(`aclCacheStatistics:${token}`, () => this.tasks.getAclCacheStatistics(token), this.monitoringTtl)
  }

  deleteTask(token: string, taskId: string) {
    return this.tasks.deleteTask(token, taskId)
  }

  getFileAnalytics(token: string) {
    return this.dataLoader.load(`fileAnalytics:${token}`, () => this.analytics.getFileAnalytics(token), this.monitoringTtl)
  }

  getSharesAnalytics(token: string) {
    return this.dataLoader.load(`sharesAnalytics:${token}`, () => this.analytics.getSharesAnalytics(token), this.monitoringTtl)
  }

  getLatestHelmVersion() {
    return this.dataLoader.load(`latestHelmVersion`, () => this.helm.getLatestHelmVersion())
  }

  async fetchSystemData(token: string) {
    appLogger.info("Fetching system data")

    // Helper to fetch data that might be restricted for non-admins
    const fetchOptional = async <T,>(
      promise: Promise<T>,
      defaultValue: T | null = null
    ): Promise<T | null> => {
      try {
        return await promise
      } catch (error) {
        if (error instanceof AuthorizationError) {
          appLogger.warn("Access denied for optional resource", undefined, {
            error: error.message,
          })
          return defaultValue
        }
        throw error
      }
    }

    try {
      appLogger.debug("System fetch logic", undefined, {
        reason: "Active token found - fetching full system data"
      })

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
        fetchOptional(this.getHealth(token), null),
        fetchOptional(this.getLicenseStatus(token), null),
        fetchOptional(this.getVersion(token), null),
        fetchOptional(this.getUsers(token), []),
        fetchOptional(this.getMeUsers(token), null),
        fetchOptional(this.getOperations(token), []),
        fetchOptional(this.getShares(token), []),
        fetchOptional(this.getDatabaseSize(token), null),
        fetchOptional(this.getLatestHelmVersion(), null),
      ])

      appLogger.info("System data fetched successfully", undefined, {
        users_count: users?.length ?? 0,
        shares_count: shares?.length ?? 0,
        operations_count: operations?.length ?? 0,
        database_size_mb: databaseSize?.database_file_size_mb ?? 0,
        total_files_tracked: databaseSize?.total_files_tracked ?? 0,
        latest_app_version: helmChartVersion?.app_version ?? "unknown",
        latest_chart_version: helmChartVersion?.chart_version ?? "unknown",
      })

      return {
        health,
        license,
        version,
        users: (users && users.length > 0) ? users : (me ? [me] : []),
        me,
        operations: operations || [],
        shares: shares || [],
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
        aclCacheStats,
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
        this.getAclCacheStatistics(token),
      ])

      appLogger.info("Monitoring data fetched successfully", undefined, {
        total_workers: workers.total_workers,
        active_workers: workers.active_workers,
        total_tasks: taskStats.total_tasks,
        failed_items: failedItems.total_failed_items,
        file_types: fileAnalytics.length,
        shares_with_files: sharesAnalytics.length,
        acl_cache_stats: true,
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
        aclCacheStats,
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