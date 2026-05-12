// Copyright 2025 NetApp, Inc. All Rights Reserved.
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
  CreateDatasetRequest,
  DatasetResponse,
  DatasetListResponse,
  SetupLicenseRequest,
  SetupLicenseResponse,
  SetupStatusResponse,
    DatasetItemsResponse,
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
  Body_configure_oauth_api_v1_setup_oauth_post,
  EntraLinkRequest,
  EntraUnlinkRequest,
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
import { DatasetsApiClient } from "./api/datasets"
import { NERApiClient } from "./api/ner"
import { DataLoader } from "./data-loader"



export type {
  HealthResponse,
  LicenseResponse,
  VersionResponse,
  DatabaseSizeResponse,
  SetupStatusResponse,
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
  CreateDatasetRequest,
  DatasetResponse,
  DatasetListResponse,
  DatasetItemsResponse,
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
  Body_configure_oauth_api_v1_setup_oauth_post,
}
export { AuthenticationError, AuthorizationError }
function normalizeCacheKeyValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeCacheKeyValue)
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = normalizeCacheKeyValue((value as Record<string, unknown>)[key])
        return result
      }, {})
  }

  return value
}

function buildNormalizedCacheKey(prefix: string, token: string, value: unknown) {
  return `${prefix}:${token}:${JSON.stringify(normalizeCacheKeyValue(value))}`
}

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
  private datasetsClient: DatasetsApiClient
  private nerClient: NERApiClient
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
    this.datasetsClient = new DatasetsApiClient(baseUrl)
    this.nerClient = new NERApiClient(baseUrl)
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

  async setupLicense(request: SetupLicenseRequest): Promise<SetupLicenseResponse> {
    return this.system.setupLicense(request)
  }

  async setupOauth(payload: Body_configure_oauth_api_v1_setup_oauth_post) {
    return this.system.setupOauth(payload)
  }

  async setupGraph(request: SetupGraphRequest): Promise<SetupGraphResponse> {
    return this.system.setupGraph(request)
  }

  async getSetupGraph(): Promise<SetupGraphConfigResponse> {
    return this.system.getSetupGraph()
  }  

  async setupProxy(request: SetupProxyRequest): Promise<SetupProxyResponse> {
    return this.system.setupProxy(request)
  }

  async getSetupProxy(): Promise<SetupProxyConfigResponse> {
    return this.system.getSetupProxy()
  }  

  async getSetupSsl(): Promise<SetupSslConfigResponse> {
    return this.system.getSetupSsl()
  }  

  resetSetup() {
    return this.system.resetSetup()
  }

  factoryReset(request: SetupFactoryResetRequest) {
    return this.system.factoryReset(request)
  }

  getInitialCredentials() {
    return this.system.getInitialCredentials()
  }

  completeSetup() {
    return this.system.completeSetup()
  }

  authenticate(username: string, password: string) {
    return this.auth.authenticate(username, password)
  }

  async handleOAuthLogin() {
    return this.auth.initiateOAuthLogin()
  }

  getOAuthConfig() {
    return this.auth.getOAuthConfig()
  }

  getUserInfo(token: string) {
    return this.auth.getUserInfo(token)
  }

  getGroups(token: string) {
    return this.auth.getGroups(token)
  }

  validateToken(token: string) {
    return this.auth.validateToken(token)
  }

  getWhoAmI(token: string) {
    return this.auth.getWhoAmI(token)
  }

  linkEntraIdentity(token: string, payload: EntraLinkRequest) {
    return this.auth.linkEntraIdentity(token, payload)
  }

  unlinkEntraIdentity(token: string, payload: EntraUnlinkRequest) {
    return this.auth.unlinkEntraIdentity(token, payload)
  }

  refreshAccessToken(token: string) {
    return this.auth.refreshAccessToken(token)
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

  getSetupStatus() {
    return this.dataLoader.load("setupStatus", () => this.system.getSetupStatus(), this.monitoringTtl)
  }

  getMcpInfo(token: string) {
    return this.dataLoader.load(`mcpInfo:${token}`, () => this.system.getMcpInfo(token), this.monitoringTtl)
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

  getFiles(token: string, shareId: string, page?: number, pageSize?: number, includeContent: boolean = false) {
    const key = `files:${token}:${shareId}:${page}:${pageSize}:${includeContent}`
    return this.dataLoader.load(key, () => this.files.getFiles(token, shareId, page, pageSize, includeContent), this.filesTtl)
  }

  getFileMetadata(token: string, shareId: string, fileId: string, includeContent: boolean = false) {
    return this.dataLoader.load(`fileMetadata:${token}:${shareId}:${fileId}:${includeContent}`, () => this.files.getFileMetadata(token, shareId, fileId, includeContent), this.filesTtl)
  }

  searchFiles(token: string, params: FileSearchParams) {
    const key = buildNormalizedCacheKey("searchFiles", token, params)
    return this.dataLoader.load(key, () => this.files.searchFiles(token, params), this.filesTtl)
  }

  searchContent(token: string, payload: ContentSearchRequest) {
    const key = buildNormalizedCacheKey("searchContent", token, payload)
    return this.dataLoader.load(key, () => this.files.searchContent(token, payload), this.filesTtl)
  }

  createDataset(token: string, payload: CreateDatasetRequest): Promise<DatasetResponse> {
    return this.files.createDataset(token, payload)
  }

  getDatasets(token: string, page: number = 1, pageSize: number = 50, ownedOnly: boolean = false): Promise<DatasetListResponse> {
    return this.datasetsClient.getDatasets(token, page, pageSize, ownedOnly)
  }

  getDatasetItems(token: string, datasetId: string, page: number = 1, pageSize: number = 50): Promise<DatasetItemsResponse> {
    return this.datasetsClient.getDatasetItems(token, datasetId, page, pageSize)
  }

  deleteDataset(token: string, datasetId: string): Promise<void> {
    return this.datasetsClient.deleteDataset(token, datasetId)
  }

  deleteDatasetItems(token: string, datasetId: string, fileIds: string[]): Promise<void> {
    return this.datasetsClient.deleteDatasetItems(token, datasetId, fileIds)
  }

  addDatasetItems(token: string, datasetId: string, fileIds: string[], notes?: string): Promise<void> {
    return this.datasetsClient.addDatasetItems(token, datasetId, fileIds, notes)
  }

  getMyDocuments(token: string, page: number = 1, pageSize: number = 100, includeContent: boolean = false) {
    const key = `myDocuments:${token}:${page}:${pageSize}:${includeContent}`
    return this.dataLoader.load(key, () => this.files.getMyDocuments(token, page, pageSize, includeContent), this.filesTtl)
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

  // NER API methods
  async getNERStats(token: string) {
    return this.nerClient.getNERStats(token)
  }

  async getShareNERStats(token: string, shareId: string) {
    return this.nerClient.getShareNERStats(token, shareId)
  }

  async getNERSchemas(token: string) {
    return this.nerClient.getNERSchemas(token)
  }

  async searchEntities(
    token: string,
    query: string,
    options?: {
      entityType?: string
      shareId?: string
      shareIds?: string
      matchMode?: "substring" | "exact" | "prefix"
      limit?: number
      cursor?: string
    }
  ) {
    return this.nerClient.searchEntities(token, query, options)
  }

  async getEntityAggregates(
    token: string,
    options?: {
      entityType?: string
      shareId?: string
      shareIds?: string
      limit?: number
    }
  ) {
    return this.nerClient.getEntityAggregates(token, options)
  }

  async countEntityMentions(
    token: string,
    query: string,
    options?: {
      entityType?: string
      shareId?: string
      shareIds?: string
      matchMode?: "exact" | "prefix" | "substring"
    }
  ) {
    return this.nerClient.countEntityMentions(token, query, options)
  }

  async getFileNERResults(token: string, fileId: string) {
    return this.nerClient.getFileNERResults(token, fileId)
  }

  async getShareNERResults(
    token: string,
    shareId: string,
    page: number = 1,
    pageSize: number = 100,
    entityType?: string
  ) {
    return this.nerClient.getShareNERResults(token, shareId, page, pageSize, entityType)
  }

  async getPendingNER(
    token: string,
    options?: {
      shareId?: string
      limit?: number
    }
  ) {
    return this.nerClient.getPendingNER(token, options)
  }

  async triggerShareReanalysis(token: string, shareId: string, force: boolean = false) {
    return this.nerClient.triggerShareReanalysis(token, shareId, force)
  }

}
