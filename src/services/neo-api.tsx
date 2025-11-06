import { appLogger } from "@/services/app-logger"
import type {
  HealthResponse,
  LicenseResponse,
  VersionResponse,
  DatabaseSizeResponse,  // Add this import
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
  TokenResponse,
  MonitoringOverviewResponse,
  MonitoringWorkerResponse,
  MonitoringEnumerationResponse,
  MonitoringWorkersResponse,
  MonitoringGraphRateLimitResponse,
  MonitoringFailedItemsResponse,
  TasksResponse,
  TaskStatisticsResponse,
  TaskResponse,
} from "./models"

// Also add to exports
export type {
  HealthResponse,
  LicenseResponse,
  VersionResponse,
  DatabaseSizeResponse,  // Add this export
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
  TaskStatisticsResponse,
  TaskResponse,
}

export class AuthenticationError extends Error {
  constructor(message = "Session expired. Please reconnect.") {
    super(message)
    this.name = "AuthenticationError"
  }
}

export class NeoApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = "/api"
  }

  async authenticate(username: string, password: string): Promise<string> {
    appLogger.debug("Attempting authentication", undefined, { username })

    try {
      const response = await fetch(`${this.baseUrl}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({
          grant_type: "password",
          username,
          password,
          scope: "",
          client_id: "",
          client_secret: "",
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        appLogger.error(
          "Authentication failed",
          `Status: ${response.status}, Response: ${errorText}`,
          { username, status: response.status }
        )

        if (response.status === 401 || response.status === 403) {
          throw new AuthenticationError("Invalid username or password.")
        }
        throw new Error(
          `Authentication failed (${response.status} ${response.statusText})`
        )
      }

      const data = (await response.json()) as TokenResponse

      if (!data.access_token) {
        appLogger.error("Authentication response missing access token", "Token response incomplete")
        throw new Error("Token response missing access_token")
      }

      appLogger.info("User authenticated successfully", undefined, { username })
      return data.access_token
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        appLogger.error(
          "Cannot connect to authentication server",
          "Network connection failed",
          { username }
        )
        throw new Error(
          "Cannot connect to server. Check if the API is running and CORS is enabled."
        )
      }
      throw error
    }
  }

  private async fetchWithToken<T>(endpoint: string, token: string): Promise<T> {
    appLogger.debug(`Fetching from endpoint: ${endpoint}`)

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        appLogger.error(
          `API endpoint failed: ${endpoint}`,
          `Status: ${response.status}, Response: ${errorText}`,
          { endpoint, status: response.status }
        )

        if (response.status === 401 || response.status === 403) {
          throw new AuthenticationError()
        }
        throw new Error(
          `${endpoint} failed (${response.status} ${response.statusText})`
        )
      }

      appLogger.debug(`Successfully fetched from endpoint: ${endpoint}`)
      return response.json() as Promise<T>
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        appLogger.error(
          `Cannot connect to endpoint: ${endpoint}`,
          "Network connection failed",
          { endpoint }
        )
        throw new Error(
          `Cannot connect to ${endpoint}. Check if the API is running and CORS is enabled.`
        )
      }
      throw error
    }
  }

  async getHealth(token: string): Promise<HealthResponse> {
    appLogger.debug("Fetching health status")
    return this.fetchWithToken<HealthResponse>("/health", token)
  }

  async getLicenseStatus(token: string): Promise<LicenseResponse> {
    appLogger.debug("Fetching license status")
    return this.fetchWithToken<LicenseResponse>("/license/status", token)
  }

  async getVersion(token: string): Promise<VersionResponse> {
    appLogger.debug("Fetching version information")
    return this.fetchWithToken<VersionResponse>("/version", token)
  }

  async getUsers(token: string): Promise<UserResponse[]> {
    appLogger.debug("Fetching users list")
    return this.fetchWithToken<UserResponse[]>("/users/", token)
  }

  async getMeUsers(token: string): Promise<MeResponse> {
    appLogger.debug("Fetching current user information")
    return this.fetchWithToken<MeResponse>("/users/me", token)
  }

  async getOperations(token: string): Promise<OperationResponse[]> {
    appLogger.debug("Fetching operations list")
    return this.fetchWithToken<OperationResponse[]>("/operations/", token)
  }

  async getShares(token: string): Promise<SharesResponse[]> {
    appLogger.debug("Fetching shares list")
    return this.fetchWithToken<SharesResponse[]>("/shares", token)
  }

  async deleteShare(token: string, shareId: string): Promise<void> {
    appLogger.debug("Sending DELETE request to share", undefined, { shareId })

    const response = await fetch(`${this.baseUrl}/shares/${shareId}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      appLogger.error(
        `DELETE /shares/${shareId} failed`,
        `Status: ${response.status}, Response: ${errorText}`,
        { shareId, status: response.status }
      )

      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError()
      }
      throw new Error(
        `Share deletion failed (${response.status} ${response.statusText})`
      )
    }

    appLogger.debug("Share deletion request successful", undefined, { shareId })
  }

  async createShare(
    token: string,
    payload: {
      share_path: string
      username: string
      password: string
      crawl_schedule: string
      rules: {
        exclude_patterns: string[]
        include_patterns: string[]
        max_file_size: number
        min_file_size: number
        persist_file_content: boolean
      }
      realm: string
      use_kerberos: string
      workgroup: string
      resolve_order: string
    }
  ): Promise<void> {
    appLogger.debug("Sending POST request to create share", undefined, {
      share_path: payload.share_path,
    })

    const response = await fetch(`${this.baseUrl}/shares`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      appLogger.error(
        "POST /shares failed",
        `Status: ${response.status}, Response: ${errorText}`,
        { share_path: payload.share_path, status: response.status }
      )

      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError()
      }
      throw new Error(
        `Share creation failed (${response.status} ${response.statusText})`
      )
    }

    appLogger.debug("Share creation request successful", undefined, {
      share_path: payload.share_path,
    })
  }

  async updateShare(
    token: string,
    shareId: string,
    payload: {
      share_path: string
      username: string
      password: string
      crawl_schedule: string
      rules: Record<string, unknown>
      realm: string
      use_kerberos: string
      workgroup: string
      resolve_order: string
    }
  ): Promise<void> {
    appLogger.debug("Sending PATCH request to update share", undefined, {
      shareId,
      share_path: payload.share_path,
    })

    const response = await fetch(`${this.baseUrl}/shares/${shareId}`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      appLogger.error(
        `PATCH /shares/${shareId} failed`,
        `Status: ${response.status}, Response: ${errorText}`,
        { shareId, status: response.status }
      )

      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError()
      }
      throw new Error(
        `Share update failed (${response.status} ${response.statusText})`
      )
    }

    appLogger.debug("Share update request successful", undefined, { shareId })
  }

  async startShareCrawl(token: string, shareId: string): Promise<void> {
    appLogger.debug("Sending POST request to start share crawl", undefined, { shareId })

    const response = await fetch(`${this.baseUrl}/shares/${shareId}/crawl`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      appLogger.error(
        `POST /shares/${shareId}/crawl failed`,
        `Status: ${response.status}, Response: ${errorText}`,
        { shareId, status: response.status }
      )

      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError()
      }
      throw new Error(
        `Share crawl failed (${response.status} ${response.statusText})`
      )
    }

    appLogger.debug("Share crawl request successful", undefined, { shareId })
  }

  async getShareDetails(token: string, shareId: string): Promise<ShareDetailsResponse> {
    appLogger.debug("Fetching share details", undefined, { shareId })
    return this.fetchWithToken<ShareDetailsResponse>(`/shares/${shareId}`, token)
  }

  async getFiles(token: string, shareId: string): Promise<FilesResponse> {
    appLogger.debug("Fetching files for share", undefined, { shareId })
    return this.fetchWithToken<FilesResponse>(`/shares/${shareId}/files`, token)
  }

  async getFileMetadata(
    token: string,
    shareId: string,
    fileId: string
  ): Promise<FileMetadataResponse> {
    appLogger.debug("Fetching file metadata", undefined, { shareId, fileId })
    return this.fetchWithToken<FileMetadataResponse>(
      `/shares/${shareId}/files/metadata?file_id=${encodeURIComponent(fileId)}`,
      token
    )
  }

  async searchFiles(token: string, params: FileSearchParams): Promise<FileSearchResponse> {
    appLogger.debug("Searching files", undefined, {
      query: params.query,
      share_id: params.share_id,
    })

    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return
      }
      if (typeof value === "number") {
        searchParams.append(key, value.toString())
        return
      }
      searchParams.append(key, value)
    })

    const query = searchParams.toString()
    return this.fetchWithToken<FileSearchResponse>(`/files${query ? `?${query}` : ""}`, token)
  }

  async createUser(
    token: string,
    payload: {
      id: number
      username: string
      password: string
      email?: string
      is_active: boolean
      is_admin: boolean
    }
  ): Promise<void> {
    appLogger.debug("Sending POST request to create user", undefined, {
      username: payload.username,
    })

    const response = await fetch(`${this.baseUrl}/users/`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      appLogger.error(
        "POST /users/ failed",
        `Status: ${response.status}, Response: ${errorText}`,
        { username: payload.username, status: response.status }
      )

      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError()
      }
      throw new Error(`User creation failed (${response.status} ${response.statusText})`)
    }

    appLogger.debug("User creation request successful", undefined, {
      username: payload.username,
    })
  }

  async fetchSystemData(token: string) {
    appLogger.info("Fetching system data")

    try {
      const [health, license, version, users, me, operations, shares, databaseSize] = await Promise.all([
        this.getHealth(token),
        this.getLicenseStatus(token),
        this.getVersion(token),
        this.getUsers(token),
        this.getMeUsers(token),
        this.getOperations(token),
        this.getShares(token),
        this.getDatabaseSize(token),
      ])

      appLogger.info("System data fetched successfully", undefined, {
        users_count: users.length,
        shares_count: shares.length,
        operations_count: operations.length,
        database_size_mb: databaseSize.database_file_size_mb,
        total_files_tracked: databaseSize.total_files_tracked,
      })

      return { health, license, version, users, me, operations, shares, files: null, databaseSize }
    } catch (error) {
      appLogger.error(
        "Failed to fetch system data",
        error instanceof Error ? error.message : "Unknown error"
      )
      throw error
    }
  }

  async changeMyPassword(
    token: string,
    payload: { current_password: string; new_password: string }
  ): Promise<void> {
    appLogger.debug("Sending PATCH request to change password")

    const response = await fetch(`${this.baseUrl}/users/me/password`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      appLogger.error(
        "PATCH /users/me/password failed",
        `Status: ${response.status}, Response: ${errorText}`,
        { status: response.status }
      )

      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError()
      }
      throw new Error(
        `Password change failed (${response.status} ${response.statusText})`
      )
    }

    appLogger.info("Password changed successfully")
  }

  // Monitoring API methods
  async getMonitoringOverview(token: string): Promise<MonitoringOverviewResponse> {
    appLogger.debug("Fetching monitoring overview")
    return this.fetchWithToken<MonitoringOverviewResponse>("/monitoring/overview", token)
  }

  async getMonitoringWorkers(token: string): Promise<MonitoringWorkersResponse> {
    appLogger.debug("Fetching monitoring workers")
    return this.fetchWithToken<MonitoringWorkersResponse>("/monitoring/workers", token)
  }

  async getMonitoringEnumeration(token: string): Promise<MonitoringEnumerationResponse> {
    appLogger.debug("Fetching monitoring enumeration")
    return this.fetchWithToken<MonitoringEnumerationResponse>("/monitoring/enumeration", token)
  }

  async getMonitoringGraphRateLimit(token: string): Promise<MonitoringGraphRateLimitResponse> {
    appLogger.debug("Fetching monitoring graph rate limit")
    return this.fetchWithToken<MonitoringGraphRateLimitResponse>("/monitoring/graph-rate-limit", token)
  }

  async getMonitoringFailedItems(token: string): Promise<MonitoringFailedItemsResponse> {
    appLogger.debug("Fetching monitoring failed items")
    return this.fetchWithToken<MonitoringFailedItemsResponse>("/monitoring/failed-items", token)
  }

  async getTasks(token: string): Promise<TasksResponse[]> {
    appLogger.debug("Fetching tasks")
    return this.fetchWithToken<TasksResponse[]>("/tasks", token)
  }

  async getTaskStatistics(token: string): Promise<TaskStatisticsResponse> {
    appLogger.debug("Fetching task statistics")
    return this.fetchWithToken<TaskStatisticsResponse>("/tasks/statistics/summary", token)
  }

  async getFileAnalytics(token: string): Promise<{ file_type: string; count: number; total_size: number }[]> {
    appLogger.debug("Fetching file analytics data")
    
    try {
      // Get all files across all shares by fetching all pages
      const allFiles: FileEntry[] = []
      let page = 1
      let hasNextPage = true
      
      while (hasNextPage) {
        appLogger.debug(`Fetching files page ${page}`)
        const response = await this.fetchWithToken<FileSearchResponse>(`/files?page=${page}&page_size=1000`, token)
        
        allFiles.push(...response.files)
        
        // Check if there are more pages
        hasNextPage = response.has_next
        page += 1
        
        appLogger.debug(`Fetched page ${page - 1}: ${response.files.length} files, has_next: ${response.has_next}`)
      }
      
      appLogger.info(`Fetched all files: ${allFiles.length} total files across ${page - 1} pages`)
      
      // Define specific file types we want to track
      const targetTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt']
      
      // Group files by type and calculate statistics
      const fileTypeMap = new Map<string, { count: number; total_size: number }>()
      
      // Initialize target types with zero counts
      targetTypes.forEach(type => {
        fileTypeMap.set(type, { count: 0, total_size: 0 })
      })
      
      // Add "Other" category for all non-target file types
      fileTypeMap.set('other', { count: 0, total_size: 0 })
      
      allFiles.forEach(file => {
        const fileType = file.file_type?.toLowerCase() || 'unknown'
        
        // Check if it's one of our target types
        if (targetTypes.includes(fileType)) {
          const current = fileTypeMap.get(fileType)!
          fileTypeMap.set(fileType, {
            count: current.count + 1,
            total_size: current.total_size + file.size
          })
        } else {
          // Add to "Other" category
          const current = fileTypeMap.get('other')!
          fileTypeMap.set('other', {
            count: current.count + 1,
            total_size: current.total_size + file.size
          })
        }
      })
      
      // Convert to array and filter out types with zero counts, then sort by count
      const analytics = Array.from(fileTypeMap.entries())
        .map(([file_type, stats]) => ({
          file_type,
          count: stats.count,
          total_size: stats.total_size
        }))
        .filter(item => item.count > 0) // Only include types that have files
        .sort((a, b) => b.count - a.count)
    
      appLogger.info("File analytics data processed", undefined, {
        total_file_types: analytics.length,
        total_files: allFiles.length,
        target_types_found: analytics.filter(a => targetTypes.includes(a.file_type)).length,
        pages_fetched: page - 1
      })
      
      return analytics
    } catch (error) {
      appLogger.error("Failed to fetch file analytics", error instanceof Error ? error.message : "Unknown error")
      throw error
    }
  }

  async getSharesAnalytics(token: string): Promise<{ share_id: string; share_name: string; share_path: string; count: number; total_size: number }[]> {
    appLogger.debug("Fetching shares analytics data")
    
    try {
      // Get all files across all shares by fetching all pages
      const allFiles: FileEntry[] = []
      let page = 1
      let hasNextPage = true
      
      while (hasNextPage) {
        appLogger.debug(`Fetching files page ${page} for shares analytics`)
        const response = await this.fetchWithToken<FileSearchResponse>(`/files?page=${page}&page_size=1000`, token)
        
        allFiles.push(...response.files)
        
        // Check if there are more pages
        hasNextPage = response.has_next
        page += 1
        
        appLogger.debug(`Fetched page ${page - 1}: ${response.files.length} files, has_next: ${response.has_next}`)
      }
    
      appLogger.info(`Fetched all files for shares analytics: ${allFiles.length} total files across ${page - 1} pages`)
    
      // Group files by share and calculate statistics
      const shareFileMap = new Map<string, { share_name: string; share_path: string; count: number; total_size: number }>()
    
      allFiles.forEach(file => {
        const shareId = file.share_id || 'unknown'
        const shareName = file.share_name || 'Unknown Share'
        const sharePath = file.share_path || 'Unknown Path'
        
        const current = shareFileMap.get(shareId) || { 
          share_name: shareName, 
          share_path: sharePath, 
          count: 0, 
          total_size: 0 
        }
        
        shareFileMap.set(shareId, {
          share_name: shareName,
          share_path: sharePath,
          count: current.count + 1,
          total_size: current.total_size + file.size
        })
      })
      
      // Convert to array and sort by count
      const analytics = Array.from(shareFileMap.entries())
        .map(([share_id, stats]) => ({
          share_id,
          share_name: stats.share_name,
          share_path: stats.share_path,
          count: stats.count,
          total_size: stats.total_size
        }))
        .filter(item => item.count > 0) // Only include shares that have files
        .sort((a, b) => b.count - a.count)

      appLogger.info("Shares analytics data processed", undefined, {
        total_shares_with_files: analytics.length,
        total_files: allFiles.length,
        shares_breakdown: analytics.map(a => `${a.share_name}: ${a.count}`),
        pages_fetched: page - 1
      })

      return analytics
    } catch (error) {
      appLogger.error("Failed to fetch shares analytics", error instanceof Error ? error.message : "Unknown error")
      throw error
    }
  }

  async fetchMonitoringData(token: string) {
    appLogger.info("Fetching monitoring data")

    try {
      const [overview, workers, enumeration, graphRateLimit, failedItems, tasks, taskStats, fileAnalytics, sharesAnalytics] = await Promise.all([
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

      return { overview, workers, enumeration, graphRateLimit, failedItems, tasks, taskStats, fileAnalytics, sharesAnalytics }
    } catch (error) {
      appLogger.error(
        "Failed to fetch monitoring data",
        error instanceof Error ? error.message : "Unknown error"
      )
      throw error
    }
  }

  async getDatabaseSize(token: string): Promise<DatabaseSizeResponse> {
    appLogger.debug("Fetching database size information")
    return this.fetchWithToken<DatabaseSizeResponse>("/database/size", token)
  }
}