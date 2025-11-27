import { useState, useCallback, useRef, useEffect } from "react"

import { toast } from "sonner"

import { appLogger } from "@/services/app-logger"

import {
  NeoApiService,
  type HealthResponse,
  type LicenseResponse,
  type VersionResponse,
  type HelmChartVersionResponse,  // Add this import
  type DatabaseSizeResponse,
  type OperationResponse,
  type UserResponse,
  type MeResponse,
  type SharesResponse,
  type FilesResponse,
  type ShareDetailsResponse,
  type FileMetadataResponse,
  type FileSearchParams,
  type FileSearchResponse,
  type MonitoringOverviewResponse,
  type MonitoringWorkersResponse,
  type MonitoringEnumerationResponse,
  type MonitoringGraphRateLimitResponse,
  type MonitoringFailedItemsResponse,
  type TasksResponse,
  type TaskStatisticsResponse,
  AuthenticationError,
} from "@/services/neo-api"


import type {
  ConnectionCredentials,
  // FileEntry
} from "@/services/models"

export function useNeoApi() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [license, setLicense] = useState<LicenseResponse | null>(null)
  const [version, setVersion] = useState<VersionResponse | null>(null)
  const [helmChartVersion, setHelmChartVersion] = useState<HelmChartVersionResponse | null>(null)

  // Fetch public data on mount
  useEffect(() => {
    const fetchPublicData = async () => {
      const api = apiRef.current
      try {
        appLogger.debug("Fetching public system data")
        const [licenseData, versionData, helmData] = await Promise.all([
          api.getLicenseStatus(),
          api.getVersion(),
          api.getLatestHelmVersion()
        ])

        setLicense(licenseData)
        setVersion(versionData)
        setHelmChartVersion(helmData)
        appLogger.info("Public system data fetched successfully")
      } catch (error) {
        appLogger.warn("Failed to fetch public system data", error instanceof Error ? error.message : "Unknown error")
      }
    }

    fetchPublicData()
  }, [])  // Add this state
  const [databaseSize, setDatabaseSize] = useState<DatabaseSizeResponse | null>(null)
  const [users, setUsers] = useState<UserResponse[] | null>(null)
  const [me, setMe] = useState<MeResponse | null>(null)
  const [operations, setOperations] = useState<OperationResponse[] | null>(null)
  const [shares, setShares] = useState<SharesResponse[] | null>(null)
  const [files, setFiles] = useState<FilesResponse | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const apiRef = useRef(new NeoApiService())

  const [monitoring, setMonitoring] = useState<{
    overview: MonitoringOverviewResponse | null
    workers: MonitoringWorkersResponse | null
    enumeration: MonitoringEnumerationResponse | null
    graphRateLimit: MonitoringGraphRateLimitResponse | null
    failedItems: MonitoringFailedItemsResponse | null
    tasks: TasksResponse[] | null
    taskStats: TaskStatisticsResponse | null
    fileAnalytics: { file_type: string; count: number; total_size: number }[] | null
    sharesAnalytics: { share_id: string; share_name: string; share_path: string; count: number; total_size: number }[] | null
  }>({
    overview: null,
    workers: null,
    enumeration: null,
    graphRateLimit: null,
    failedItems: null,
    tasks: null,
    taskStats: null,
    fileAnalytics: null,
    sharesAnalytics: null,
  })

  const [currentShareId, setCurrentShareId] = useState<string | "all" | null>(null)

  const applySystemData = useCallback(
    (data: {
      health: HealthResponse
      license: LicenseResponse
      version: VersionResponse
      helmChartVersion: HelmChartVersionResponse  // Add this
      databaseSize: DatabaseSizeResponse
      users: UserResponse[]
      me: MeResponse
      operations: OperationResponse[]
      shares: SharesResponse[]
      files: FilesResponse | null
    }) => {
      setHealth(data.health)
      setLicense(data.license)
      setVersion(data.version)
      setHelmChartVersion(data.helmChartVersion)  // Add this
      setDatabaseSize(data.databaseSize)
      setUsers(data.users)
      setMe(data.me)
      setOperations(data.operations)
      setShares(data.shares)
      setFiles(data.files)
    },
    []
  )

  const clearSystemData = useCallback(() => {
    setHealth(null)
    setLicense(null)
    setVersion(null)
    setHelmChartVersion(null)  // Add this
    setDatabaseSize(null)
    setUsers(null)
    setMe(null)
    setOperations(null)
    setShares(null)
    setFiles(null)
    setMonitoring({
      overview: null,
      workers: null,
      enumeration: null,
      graphRateLimit: null,
      failedItems: null,
      tasks: null,
      taskStats: null,
      fileAnalytics: null,
      sharesAnalytics: null,
    })
  }, [])

  const handleConnect = useCallback(
    async (credentials: ConnectionCredentials) => {
      appLogger.info("Connecting to NetApp Neo API endpoint", undefined, {
        username: credentials.username,
      })

      // Clear any existing state before attempting new connection
      clearSystemData()
      apiRef.current.clearCache()
      setToken(null)

      try {
        const api = apiRef.current
        const newToken = await api.authenticate(credentials.username, credentials.password)
        const data = await api.fetchSystemData(newToken)

        applySystemData(data)
        setToken(newToken)
        toast.success(`Welcome, ${data.me?.username} !`)
        appLogger.info("Successfully connected to NetApp Neo", undefined, {
          userId: data.me?.id,
          username: data.me?.username,
        })
      } catch (error) {
        clearSystemData()
        setToken(null)

        // Provide user-friendly error messages
        if (error instanceof AuthenticationError) {
          toast.error(error.message)
        } else if (error instanceof Error) {
          toast.error(`Connection failed: ${error.message} `)
        } else {
          toast.error("Connection failed. Please try again.")
        }

        appLogger.error(
          "Connection to NetApp Neo failed",
          error instanceof Error ? error.message : "Unknown error"
        )
        throw error
      }
    },
    [applySystemData, clearSystemData]
  )

  const handleRefresh = useCallback(async () => {
    if (!token) {
      appLogger.warn("Refresh attempted without active token")
      throw new AuthenticationError()
    }

    const api = apiRef.current

    try {
      appLogger.debug("Refreshing system data from Neo API")
      api.clearCache()
      const data = await api.fetchSystemData(token)
      applySystemData(data)
      appLogger.info("System data refreshed successfully")
    } catch (error) {
      if (error instanceof AuthenticationError) {
        clearSystemData()
        setToken(null)
        appLogger.warn("Token expired during refresh")
      }
      appLogger.error(
        "Failed to refresh system data",
        error instanceof Error ? error.message : "Unknown error"
      )
      throw error
    }
  }, [applySystemData, clearSystemData, token])

  const handleDeleteShare = useCallback(
    async (shareId: string) => {
      if (!token) {
        appLogger.warn("Share deletion attempted without active token")
        throw new AuthenticationError()
      }

      const api = apiRef.current

      try {
        appLogger.info("Deleting share", undefined, { shareId })
        await api.deleteShare(token, shareId)
        api.clearCache()
        const data = await api.fetchSystemData(token)
        applySystemData(data)
        toast.success("Share deleted!")
        appLogger.info("Share deleted successfully", undefined, { shareId })
      } catch (error) {
        if (error instanceof AuthenticationError) {
          clearSystemData()
          setToken(null)
        }
        toast.error("Share deletion failed!")
        appLogger.error(
          "Share deletion failed",
          error instanceof Error ? error.message : "Unknown error",
          { shareId }
        )
        throw error
      }
    },
    [applySystemData, clearSystemData, token]
  )

  const handleAddShare = useCallback(
    async (share: {
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
    }) => {
      if (!token) {
        appLogger.warn("Share creation attempted without active token")
        throw new AuthenticationError()
      }

      const api = apiRef.current

      try {
        appLogger.info("Creating new share", undefined, { share_path: share.share_path })
        await api.createShare(token, share)
        api.clearCache()
        const data = await api.fetchSystemData(token)
        applySystemData(data)
        toast.success("Share added!")
        appLogger.info("Share created successfully", undefined, { share_path: share.share_path })
      } catch (error) {
        if (error instanceof AuthenticationError) {
          clearSystemData()
          setToken(null)
        }
        toast.error("Share creation failed!")
        appLogger.error(
          "Share creation failed",
          error instanceof Error ? error.message : "Unknown error",
          { share_path: share.share_path }
        )
        throw error
      }
    },
    [applySystemData, clearSystemData, token]
  )

  const handleUpdateShare = useCallback(
    async (
      shareId: string,
      share: {
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
    ) => {
      if (!token) {
        appLogger.warn("Share update attempted without active token")
        throw new AuthenticationError()
      }

      const api = apiRef.current

      try {
        appLogger.info("Updating share", undefined, { shareId, share_path: share.share_path })
        await api.updateShare(token, shareId, share)
        api.clearCache()
        const data = await api.fetchSystemData(token)
        applySystemData(data)
        toast.success("Share updated!")
        appLogger.info("Share updated successfully", undefined, {
          shareId,
          share_path: share.share_path,
        })
      } catch (error) {
        if (error instanceof AuthenticationError) {
          clearSystemData()
          setToken(null)
        }
        toast.error("Share update failed!")
        appLogger.error(
          "Share update failed",
          error instanceof Error ? error.message : "Unknown error",
          { shareId }
        )
        throw error
      }
    },
    [applySystemData, clearSystemData, token]
  )

  const handleStartCrawl = useCallback(
    async (shareId: string) => {
      if (!token) {
        appLogger.warn("Crawl started attempted without active token")
        throw new AuthenticationError()
      }

      const api = apiRef.current

      try {
        appLogger.info("Starting share crawl", undefined, { shareId })
        await api.startShareCrawl(token, shareId)
        api.clearCache()
        const data = await api.fetchSystemData(token)
        applySystemData(data)
        appLogger.info("Share crawl started successfully", undefined, { shareId })
        return true
      } catch (error) {
        if (error instanceof AuthenticationError) {
          clearSystemData()
          setToken(null)
        }
        appLogger.error(
          "Failed to start share crawl",
          error instanceof Error ? error.message : "Unknown error",
          { shareId }
        )
        return false
      }
    },
    [applySystemData, clearSystemData, token]
  )

  const handleFetchShareDetails = useCallback(
    async (shareId: string): Promise<ShareDetailsResponse> => {
      if (!token) {
        appLogger.warn("Fetch share details attempted without active token")
        throw new AuthenticationError()
      }

      const api = apiRef.current
      appLogger.debug("Fetching share details", undefined, { shareId })
      return api.getShareDetails(token, shareId)
    },
    [token]
  )

  const handleAddUser = useCallback(
    async (user: {
      id: number
      username: string
      password: string
      email?: string
      is_active: boolean
      is_admin: boolean
    }) => {
      if (!token) {
        appLogger.warn("User creation attempted without active token")
        throw new AuthenticationError()
      }

      const api = apiRef.current

      try {
        appLogger.info("Creating new user", undefined, { username: user.username })
        await api.createUser(token, user)
        api.clearCache()
        const data = await api.fetchSystemData(token)
        applySystemData(data)
        toast.success("User created!")
        appLogger.info("User created successfully", undefined, { username: user.username })
      } catch (error) {
        if (error instanceof AuthenticationError) {
          clearSystemData()
          setToken(null)
        }
        toast.error("User creation failed!")
        appLogger.error(
          "User creation failed",
          error instanceof Error ? error.message : "Unknown error",
          { username: user.username }
        )
        throw error
      }
    },
    [applySystemData, clearSystemData, token]
  )

  const handleChangePassword = useCallback(
    async (payload: { current_password: string; new_password: string }) => {
      if (!token) {
        appLogger.warn("Password change attempted without active token")
        throw new AuthenticationError()
      }

      const api = apiRef.current

      try {
        appLogger.info("Changing user password")
        await api.changeMyPassword(token, payload)
        toast.success("Password updated!")
        appLogger.info("Password changed successfully")
      } catch (error) {
        if (error instanceof AuthenticationError) {
          clearSystemData()
          setToken(null)
        }
        toast.error("Password update failed!")
        appLogger.error(
          "Password change failed",
          error instanceof Error ? error.message : "Unknown error"
        )
        throw error
      }
    },
    [clearSystemData, token]
  )

  const handleFetchFileMetadata = useCallback(
    async (shareId: string, fileId: string): Promise<FileMetadataResponse> => {
      if (!token) {
        appLogger.warn("Fetch file metadata attempted without active token")
        throw new AuthenticationError()
      }

      const api = apiRef.current
      appLogger.debug("Fetching file metadata", undefined, { shareId, fileId })
      return api.getFileMetadata(token, shareId, fileId)
    },
    [token]
  )

  const handleSearchFiles = useCallback(
    async (params: FileSearchParams): Promise<FileSearchResponse> => {
      if (!token) {
        appLogger.warn("Search files attempted without active token")
        throw new AuthenticationError()
      }

      const api = apiRef.current
      appLogger.debug("Searching files", undefined, { query: params.query, share_id: params.share_id })
      return api.searchFiles(token, params)
    },
    [token]
  )

  const handleSelectFilesShare = useCallback(
    async (shareKey: string | "all" | null, page?: number) => {
      if (!token) {
        appLogger.warn("Select files share attempted without active token")
        toast.error("Connect first to load files.")
        return
      }

      const api = apiRef.current

      if (shareKey === null) {
        appLogger.debug("Clearing files selection")
        setFiles(null)
        setCurrentShareId(null)
        return
      }

      // Store current share ID for pagination
      setCurrentShareId(shareKey)
      setFiles(null)

      try {
        appLogger.info("Loading files", undefined, { shareKey, page })
        if (shareKey === "all") {
          // Use the /files endpoint to get ALL files across all shares with pagination
          const searchParams: FileSearchParams = {
            page: page || 1,
            page_size: 100
          }
          const response = await api.searchFiles(token, searchParams)

          const aggregated: FilesResponse = {
            share_id: "all",
            path: "All shares",
            files: response.files,
            total_count: response.total_count,
            total_size: response.total_size,
            page: response.page,
            page_size: response.page_size,
            total_pages: response.total_pages,
            has_next: response.has_next,
            has_previous: response.has_previous,
          }

          setFiles(aggregated)
          appLogger.info("Files loaded from all shares via /files endpoint", undefined, {
            total_files: response.files.length,
            page: response.page,
            total_pages: response.total_pages
          })
        } else {
          // Use the /shares/{shareId}/files endpoint for specific shares
          const response = await api.getFiles(token, shareKey, page || 1, 100)
          setFiles(response)
          appLogger.info("Files loaded from specific share", undefined, {
            shareKey,
            total_files: response.files.length,
            page: response.page,
            total_pages: response.total_pages
          })
        }
      } catch (error) {
        if (error instanceof AuthenticationError) {
          clearSystemData()
          setToken(null)
        }
        appLogger.error(
          "Failed to load files",
          error instanceof Error ? error.message : "Unknown error",
          { shareKey, page }
        )
        toast.error("Failed to load files.")
      }
    },
    [token, clearSystemData]
  )

  const handleFilesPageChange = useCallback(
    async (page: number) => {
      if (currentShareId !== null) {
        await handleSelectFilesShare(currentShareId, page)
      }
    },
    [currentShareId, handleSelectFilesShare]
  )

  const handleFetchMonitoring = useCallback(async (force?: boolean) => {
    if (!token) {
      appLogger.warn("Fetch monitoring attempted without active token")
      throw new AuthenticationError()
    }

    const api = apiRef.current

    try {
      appLogger.debug("Fetching monitoring data", undefined, { force })
      if (force) {
        api.clearCache()
      }
      const data = await api.fetchMonitoringData(token)
      setMonitoring(data)
      appLogger.info("Monitoring data fetched successfully")
    } catch (error) {
      if (error instanceof AuthenticationError) {
        clearSystemData()
        setToken(null)
        appLogger.warn("Token expired during monitoring fetch")
      }
      appLogger.error(
        "Failed to fetch monitoring data",
        error instanceof Error ? error.message : "Unknown error"
      )
      throw error
    }
  }, [token, clearSystemData])

  const handleFetchTasks = useCallback(async (force?: boolean) => {
    if (!token) {
      appLogger.warn("Fetch tasks attempted without active token")
      throw new AuthenticationError()
    }

    const api = apiRef.current

    try {
      appLogger.debug("Fetching tasks data", undefined, { force })
      if (force) {
        api.clearCache()
      }
      const [tasks, taskStats] = await Promise.all([
        api.getTasks(token),
        api.getTaskStatistics(token),
      ])

      setMonitoring(prev => ({
        ...prev,
        tasks,
        taskStats,
      }))

      appLogger.info("Tasks data fetched successfully", undefined, {
        total_tasks: taskStats.total_tasks,
        running_tasks: taskStats.by_status.running,
      })
    } catch (error) {
      if (error instanceof AuthenticationError) {
        clearSystemData()
        setToken(null)
        appLogger.warn("Token expired during tasks fetch")
      }
      appLogger.error(
        "Failed to fetch tasks data",
        error instanceof Error ? error.message : "Unknown error"
      )
      throw error
    }
  }, [token, clearSystemData])

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      if (!token) {
        appLogger.warn("Task deletion attempted without active token")
        throw new AuthenticationError()
      }

      const api = apiRef.current

      try {
        appLogger.info("Cancelling task", undefined, { taskId })
        const response = await api.deleteTask(token, taskId)

        // Refresh tasks after cancellation attempt
        api.clearCache()
        const [tasks, taskStats] = await Promise.all([
          api.getTasks(token),
          api.getTaskStatistics(token),
        ])

        setMonitoring(prev => ({
          ...prev,
          tasks,
          taskStats,
        }))

        if (response.status === "cancelled") {
          toast.success(`Task cancelled: ${response.message} `)
        } else {
          toast.warning(`Task cancellation: ${response.message} `)
        }

        appLogger.info("Task cancellation response received", undefined, {
          taskId,
          status: response.status,
          graceful: response.graceful
        })
      } catch (error) {
        if (error instanceof AuthenticationError) {
          clearSystemData()
          setToken(null)
        }
        toast.error("Task cancellation failed!")
        appLogger.error(
          "Task cancellation failed",
          error instanceof Error ? error.message : "Unknown error",
          { taskId }
        )
        throw error
      }
    },
    [token, clearSystemData]
  )

  const handleLogout = useCallback(async () => {
    appLogger.info("User logging out", undefined, { username: me?.username })

    // If we have a token, try to invalidate it on the server first
    if (token) {
      const api = apiRef.current
      try {
        await api.logout(token)
      } catch (error) {
        // Log the error but continue with logout
        appLogger.warn(
          "Server logout failed, continuing with client-side logout",
          error instanceof Error ? error.message : "Unknown error"
        )
      }
    }

    // Always clear local state regardless of server response
    clearSystemData()
    apiRef.current.clearCache()
    setToken(null)
    toast.success("Logged out successfully")
    appLogger.info("User logged out successfully")
  }, [clearSystemData, me?.username, token])

  return {
    state: {
      health,
      license,
      version,
      helmChartVersion,
      databaseSize,
      users,
      me,
      operations,
      shares,
      files,
      monitoring,
      token,
    },
    handlers: {
      handleConnect,
      handleRefresh,
      handleDeleteShare,
      handleAddShare,
      handleUpdateShare,
      handleStartCrawl,
      handleFetchShareDetails,
      handleAddUser,
      handleChangePassword,
      handleFetchFileMetadata,
      handleSelectFilesShare,
      handleSearchFiles,
      handleFetchMonitoring,
      handleFetchTasks,
      handleDeleteTask,
      handleLogout,
      handleFilesPageChange,
    },
  }
}