// Copyright 2025 NetApp, Inc. All Rights Reserved.
import { useCallback, useRef, useState, useEffect } from "react"

import { toast } from "sonner"

import { appLogger } from "@/services/app-logger"

import {
  NeoApiService,
  type HealthResponse,
  type LicenseResponse,
  type VersionResponse,
  type HelmChartVersionResponse,
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
  type ContentSearchRequest,
  type ContentSearchResponse,
  type SetupLicenseRequest,
  type MonitoringOverviewResponse,
  type MonitoringWorkersResponse,
  type MonitoringEnumerationResponse,
  type MonitoringGraphRateLimitResponse,
  type MonitoringFailedItemsResponse,
  type TasksResponse,
  type TaskStatisticsResponse,
  type AclCacheStatisticsResponse,
  type SetupStatusResponse,
  AuthenticationError,
  type SetupGraphRequest,
  type SetupGraphConfigResponse,
  type SetupGraphResponse,
  type SetupProxyRequest,
  type SetupProxyResponse,  
  type SetupProxyConfigResponse,
  type SetupSslConfigResponse,
  type SetupFactoryResetRequest,
  type Body_configure_oauth_api_v1_setup_oauth_post,
} from "@/services/neo-api"


import type {
  ConnectionCredentials,
  FileEntry,
  Dataset,
  CreateDatasetRequest,
  DatasetItemsResponse,
  ShareConfigRequest,
  ShareUpdateRequest,
} from "@/services/models"

import { useSettings } from "@/context/settings-context"

// Create singleton instance outside the hook
const neoApiService = new NeoApiService()

export function useNeoApi() {
  const { monitoringTtl, filesTtl, cacheMaxSize, contentVisibilityEnabled } = useSettings()
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [license, setLicense] = useState<LicenseResponse | null>(null)
  const [version, setVersion] = useState<VersionResponse | null>(null)
  const [helmChartVersion, setHelmChartVersion] = useState<HelmChartVersionResponse | null>(null)
  const [setupStatus, setSetupStatus] = useState<SetupStatusResponse | null>(null)

  // Use singleton instance
  const apiRef = useRef(neoApiService)

  // Update API config when settings change
  useEffect(() => {
    neoApiService.updateConfig({
      monitoringTtl,
      filesTtl,
      cacheMaxSize,
    })
  }, [monitoringTtl, filesTtl, cacheMaxSize])

  // Fetch public data on mount
  useEffect(() => {
    const fetchPublicData = async () => {
      const api = apiRef.current
      try {
        appLogger.debug("Fetching public system data")
        const results = await Promise.allSettled([
          api.getHealth(),
          api.getLicenseStatus(),
          api.getVersion(),
          api.getLatestHelmVersion(),
          api.getSetupStatus(),
        ])

        const [healthResult, licenseResult, versionResult, helmResult, setupResult] = results

        if (healthResult.status === "fulfilled") setHealth(healthResult.value)
        if (licenseResult.status === "fulfilled") setLicense(licenseResult.value)
        if (versionResult.status === "fulfilled") setVersion(versionResult.value)
        if (helmResult.status === "fulfilled") setHelmChartVersion(helmResult.value)
        if (setupResult.status === "fulfilled") setSetupStatus(setupResult.value)

        appLogger.info("Public system data fetched", undefined, {
          health: healthResult.status,
          license: licenseResult.status,
          version: versionResult.status,
          helm: helmResult.status,
          setup: setupResult.status
        })
      } catch (error) {
        appLogger.warn("Unexpected error fetching public system data", error instanceof Error ? error.message : "Unknown error")
      }
    }

    fetchPublicData()
  }, [])
  const [databaseSize, setDatabaseSize] = useState<DatabaseSizeResponse | null>(null)
  const [users, setUsers] = useState<UserResponse[] | null>(null)
  const [me, setMe] = useState<MeResponse | null>(null)
  const [operations, setOperations] = useState<OperationResponse[] | null>(null)
  const [shares, setShares] = useState<SharesResponse[] | null>(null)
  const [files, setFiles] = useState<FilesResponse | null>(null)
  const [myDocuments, setMyDocuments] = useState<FilesResponse | null>(null)
  const [datasets, setDatasets] = useState<Dataset[]>([])
  /*
   * Initialize token from localStorage to support persistence across tabs/refresh.
   * This fixes the issue where opening a new tab would require re-authentication.
   */
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem("neo_token")
    } catch {
      // Handle potential localStorage access errors (e.g. private mode)
      return null
    }
  })

  const [cacheStats, setCacheStats] = useState<{ sizeBytes: number; maxSizeBytes: number; items: number }>({
    sizeBytes: 0,
    maxSizeBytes: 0,
    items: 0,
  })

  const [monitoring, setMonitoring] = useState<{
    overview: MonitoringOverviewResponse | null
    workers: MonitoringWorkersResponse | null
    enumeration: MonitoringEnumerationResponse | null
    graphRateLimit: MonitoringGraphRateLimitResponse | null
    failedItems: MonitoringFailedItemsResponse | null
    tasks: TasksResponse[] | null
    taskStats: TaskStatisticsResponse | null
    aclCacheStats: AclCacheStatisticsResponse | null
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
    aclCacheStats: null,
    fileAnalytics: null,
    sharesAnalytics: null,
  })

  const [currentShareId, setCurrentShareId] = useState<string | "all" | null>(null)

  const applySystemData = useCallback(
    (data: {
      health: HealthResponse | null
      license: LicenseResponse | null
      version: VersionResponse | null
      helmChartVersion: HelmChartVersionResponse | null
      databaseSize: DatabaseSizeResponse | null
      users: UserResponse[]
      me: MeResponse | null
      operations: OperationResponse[]
      shares: SharesResponse[]
      files: FilesResponse | null
    }) => {
      appLogger.debug("applySystemData received")
      setHealth(data.health)
      setLicense(data.license)
      setVersion(data.version)
      setHelmChartVersion(data.helmChartVersion)
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
    setHelmChartVersion(null)
    setDatabaseSize(null)
    setUsers(null)
    setMe(null)
    setOperations(null)
    setShares(null)
    setFiles(null)
    setMyDocuments(null)
    setDatasets([])
    setMonitoring({
      overview: null,
      workers: null,
      enumeration: null,
      graphRateLimit: null,
      failedItems: null,
      tasks: null,
      taskStats: null,
      aclCacheStats: null,
      fileAnalytics: null,
      sharesAnalytics: null,
    })
  }, [])

  /*
   * Sync token to localStorage whenever it changes.
   */
  useEffect(() => {
    try {
      if (token) {
        localStorage.setItem("neo_token", token)
      } else {
        localStorage.removeItem("neo_token")
      }
    } catch (e) {
      appLogger.error("Failed to sync token to localStorage", e instanceof Error ? e.message : "Unknown error")
    }
  }, [token])

  // Use refs for stable access to callbacks in effects to avoid infinite loops
  const applySystemDataRef = useRef(applySystemData)
  applySystemDataRef.current = applySystemData

  const clearSystemDataRef = useRef(clearSystemData)
  clearSystemDataRef.current = clearSystemData

  /*
   * Restore session: specific effect to fetch system data on mount if a token exists
   * but we don't have user data yet (typical reload/new tab scenario).
   */
  useEffect(() => {
    if (token && !me) {
      const restoreSession = async () => {
        try {
          appLogger.info("Restoring session from persisted token")
          const api = apiRef.current
          // We need to fetch system data to populate the state (user info, etc.)
          const data = await api.fetchSystemData(token)
          applySystemDataRef.current(data)
          setCacheStats(api.getCacheStats())
          appLogger.info("Session restored successfully")
        } catch (error) {
          appLogger.warn("Failed to restore session, invalidating token", error instanceof Error ? error.message : "Unknown error")
          // If the token is invalid (e.g. expired), clear it so the user is prompted to login
          setToken(null)
          clearSystemDataRef.current()
        }
      }
      restoreSession()
    }
  }, [token, me])

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
        setCacheStats(api.getCacheStats())
        if (data.me) {
          toast.success(`Welcome, ${data.me.username}`)
        } else {
          toast.success("Welcome")
        }
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
          toast.error(`Connection failed: ${error.message}`)
        } else {
          toast.error("Connection failed. Please try again")
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

  const handleFetchSystemData = useCallback(async () => {
    if (!token) return null
    const api = apiRef.current
    try {
      const data = await api.fetchSystemData(token)
      applySystemData(data)
      setCacheStats(api.getCacheStats())
      appLogger.info("System data refreshed successfully")
      return data
    } catch (error) {
      if (error instanceof AuthenticationError) {
        clearSystemData()
        setToken(null)
      }
      appLogger.error("Failed to fetch system data", error instanceof Error ? error.message : "Unknown error")
      throw error
    }
  }, [token, applySystemData, clearSystemData])

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

      const [monitoringData, databaseSizeData] = await Promise.all([
        api.fetchMonitoringData(token),
        api.getDatabaseSize(token)
      ])

      setMonitoring(monitoringData)
      setDatabaseSize(databaseSizeData)
      setCacheStats(api.getCacheStats())
      appLogger.info("Monitoring data fetched successfully")
    } catch (error) {
      if (error instanceof AuthenticationError) {
        clearSystemData()
        setToken(null)
      }
      appLogger.error("Failed to fetch monitoring data", error instanceof Error ? error.message : "Unknown error")
      throw error
    }
  }, [token, clearSystemData])

  const handleRefresh = useCallback(async (): Promise<void> => {
    if (!token) {
      appLogger.warn("Refresh attempted without active token")
      throw new AuthenticationError()
    }

    try {
      appLogger.debug("Refreshing system data from Neo API")
      // Sequential logic: Fetch System Data first
      await handleFetchSystemData()

      // Always fetch monitoring data now
      await handleFetchMonitoring(true)

      appLogger.info("Refresh sequence completed")
    } catch (error) {
      // handleFetchSystemData already handles auth error/logging for itself
      // handleFetchMonitoring handles its own errors
      // Top level catch just for safety or bubbling
      if (error instanceof AuthenticationError) {
        // already handled
      }
      appLogger.error(
        "Failed to complete refresh sequence",
        error instanceof Error ? error.message : "Unknown error"
      )
      throw error
    }
  }, [token, handleFetchSystemData, handleFetchMonitoring])

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
        toast.success("Share deleted")
        appLogger.info("Share deleted successfully", undefined, { shareId })
      } catch (error) {
        if (error instanceof AuthenticationError) {
          clearSystemData()
          setToken(null)
        }
        toast.error("Share deletion failed")
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
    async (share: ShareConfigRequest) => {
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
        toast.success("Share added")
        appLogger.info("Share created successfully", undefined, { share_path: share.share_path })
      } catch (error) {
        if (error instanceof AuthenticationError) {
          clearSystemData()
          setToken(null)
        }
        toast.error("Share creation failed")
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
    async (shareId: string, share: ShareUpdateRequest) => {
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
        toast.success("Share updated")
        appLogger.info("Share updated successfully", undefined, {
          shareId,
          share_path: share.share_path,
        })
      } catch (error) {
        if (error instanceof AuthenticationError) {
          clearSystemData()
          setToken(null)
        }
        toast.error("Share update failed")
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
        toast.success("User created")
        appLogger.info("User created successfully", undefined, { username: user.username })
      } catch (error) {
        if (error instanceof AuthenticationError) {
          clearSystemData()
          setToken(null)
        }
        toast.error("User creation failed")
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
        toast.success("Password updated")
        appLogger.info("Password changed successfully")
      } catch (error) {
        if (error instanceof AuthenticationError) {
          clearSystemData()
          setToken(null)
        }
        toast.error("Password update failed")
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
      const metadata = await api.getFileMetadata(token, shareId, fileId, contentVisibilityEnabled)
      setCacheStats(api.getCacheStats())
      return metadata
    },
    [token, contentVisibilityEnabled]
  )

  const handleSearchFiles = useCallback(
    async (params: FileSearchParams): Promise<FileSearchResponse> => {
      if (!token) {
        appLogger.warn("Search files attempted without active token")
        throw new AuthenticationError()
      }

      const api = apiRef.current
      appLogger.debug("Searching files", undefined, {
        filename: params.filename,
        file_type: params.file_type,
        field_set: params.field_set,
      })
      const results = await api.searchFiles(token, {
        ...params,
        include_content: contentVisibilityEnabled ? Boolean(params.include_content) : false,
      })
      setCacheStats(api.getCacheStats())
      return results
    },
    [token, contentVisibilityEnabled]
  )

  const handleContentSearch = useCallback(
    async (payload: ContentSearchRequest): Promise<ContentSearchResponse> => {
      if (!token) {
        appLogger.warn("Content search attempted without active token")
        throw new AuthenticationError()
      }

      const api = apiRef.current
      appLogger.debug("Searching content", undefined, { query: payload.query })
      const results = await api.searchContent(token, payload)
      setCacheStats(api.getCacheStats())
      return results
    },
    [token]
  )

  const handleSelectFilesShare = useCallback(
    async (shareKey: string | "all" | null, page?: number) => {
      if (!token) {
        appLogger.warn("Select files share attempted without active token")
        toast.error("Connect first to load files")
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
          // Use the standard listing endpoint for all-shares mode.
          // This avoids the search pipeline and keeps pagination behavior consistent.
          const response = await api.getFiles(token, "all", page || 1, 100, contentVisibilityEnabled)

          const allShares: FilesResponse = {
            ...response,
            share_id: "all",
            path: "All shares",
          }

          setFiles(allShares)
          appLogger.info("Files loaded from all shares", undefined, {
            total_files: response.files.length,
            page: response.page,
            total_pages: response.total_pages
          })
        } else {
          // Use the /shares/{shareId}/files endpoint for specific shares
          const response = await api.getFiles(token, shareKey, page || 1, 100, contentVisibilityEnabled)
          setFiles(response)
          appLogger.info("Files loaded from specific share", undefined, {
            shareKey,
            total_files: response.files.length,
            page: response.page,
            total_pages: response.total_pages
          })
        }
        const stats = api.getCacheStats()
        appLogger.info("Updating cache stats after file load", undefined, stats)
        setCacheStats(stats)
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
        toast.error("Failed to load files")
      }
    },
    [token, clearSystemData, contentVisibilityEnabled]
  )

  const handleFetchMyDocuments = useCallback(
    async (page: number = 1, pageSize: number = 100) => {
      if (!token) {
        appLogger.warn("Fetch my documents attempted without active token")
        throw new AuthenticationError()
      }

      const api = apiRef.current

      try {
        appLogger.info("Fetching my documents", undefined, { page })
        const response = await api.getMyDocuments(token, page, pageSize, contentVisibilityEnabled)

        // Adapt FileSearchResponse to FilesResponse for consistency if needed, 
        // or just return it. The FilesTable expects FilesResponse structure mostly.
        // Let's return it as is, but we might need to adapt it in the component or here.
        // FilesTable expects: share_id, path, files, total_count, etc.
        // FileSearchResponse has: files, total_count, etc.
        // We'll construct a pseudo-FilesResponse.

        const result: FilesResponse = {
          share_id: "my-documents",
          path: "My Documents",
          files: response.files,
          total_count: response.total_count,
          total_size: response.total_size,
          page: response.page,
          page_size: response.page_size,
          total_pages: response.total_pages,
          has_next: response.has_next,
          has_previous: response.has_previous,
        }

        setMyDocuments(result)
        return result
      } catch (error) {
        if (error instanceof AuthenticationError) {
          setToken(null)
        }
        appLogger.error(
          "Failed to fetch my documents",
          error instanceof Error ? error.message : "Unknown error"
        )
        throw error
      }
    },
    [token, contentVisibilityEnabled]
  )


  const handleCreateDataset = useCallback(async (
    payload: Omit<CreateDatasetRequest, "file_ids">,
    files: FileEntry[]
  ) => {
    if (!token) {
      appLogger.warn("Dataset creation attempted without active token")
      throw new AuthenticationError()
    }

    const api = apiRef.current
    const file_ids = files.map(f => f.id)

    try {
      appLogger.info("Creating dataset via API", undefined, { name: payload.name, file_count: file_ids.length })
      const response = await api.createDataset(token, { ...payload, file_ids })

      const newDataset: Dataset = {
        id: response.id,
        name: response.name,
        description: response.description,
        is_public: response.is_public,
        acl_override_enabled: response.acl_override_enabled,
        files,
        createdAt: response.created_at,
      }
      setDatasets((prev) => [...prev, newDataset])
      appLogger.info("Dataset created successfully", undefined, { id: response.id, name: response.name })
    } catch (error) {
      if (error instanceof AuthenticationError) {
        clearSystemData()
        setToken(null)
      }
      appLogger.error(
        "Dataset creation failed",
        error instanceof Error ? error.message : "Unknown error",
        { name: payload.name }
      )
      throw error
    }
  }, [token, clearSystemData])

  const handleFetchDatasetItems = useCallback(async (
    datasetId: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<DatasetItemsResponse> => {
    if (!token) {
      appLogger.warn("Fetch dataset items attempted without active token")
      throw new AuthenticationError()
    }

    const api = apiRef.current
    appLogger.debug("Fetching dataset items", undefined, { datasetId, page, pageSize })
    return api.getDatasetItems(token, datasetId, page, pageSize)
  }, [token])

  const handleFetchDatasets = useCallback(async (page: number = 1, pageSize: number = 50, ownedOnly: boolean = false) => {
    if (!token) {
      appLogger.warn("Fetch datasets attempted without active token")
      throw new AuthenticationError()
    }

    const api = apiRef.current
    try {
      appLogger.debug("Fetching datasets", undefined, { page, pageSize, ownedOnly })
      const response = await api.getDatasets(token, page, pageSize, ownedOnly)
      const mapped: Dataset[] = response.datasets.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        owner_id: item.owner_id,
        owner_username: item.owner_username,
        is_public: item.is_public,
        acl_override_enabled: item.acl_override_enabled,
        item_count: item.item_count,
        files: [],
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        expiresAt: item.expires_at,
        expiresInHours: item.expires_in_hours,
        userPermission: item.user_permission,
      }))
      setDatasets(mapped)
      appLogger.info("Datasets fetched", undefined, { count: mapped.length })
    } catch (error) {
      if (error instanceof AuthenticationError) {
        clearSystemData()
        setToken(null)
      }
      appLogger.error("Failed to fetch datasets", error instanceof Error ? error.message : "Unknown error")
      throw error
    }
  }, [token, clearSystemData])

  const handleDeleteDataset = useCallback(async (id: string) => {
    if (!token) {
      appLogger.warn("Dataset deletion attempted without active token")
      throw new AuthenticationError()
    }

    const api = apiRef.current
    try {
      await api.deleteDataset(token, id)
      setDatasets((prev) => prev.filter((d) => d.id !== id))
      appLogger.info("Dataset deleted", undefined, { id })
    } catch (error) {
      if (error instanceof AuthenticationError) {
        clearSystemData()
        setToken(null)
      }
      appLogger.error("Dataset deletion failed", error instanceof Error ? error.message : "Unknown error", { id })
      throw error
    }
  }, [token, clearSystemData])

  const handleAddDatasetItems = useCallback(async (datasetId: string, fileIds: string[], notes?: string) => {
    if (!token) {
      appLogger.warn("Add dataset items attempted without active token")
      throw new AuthenticationError()
    }

    if (!fileIds.length) {
      appLogger.warn("No file IDs provided for adding to dataset")
      return
    }

    const api = apiRef.current
    try {
      await api.addDatasetItems(token, datasetId, fileIds, notes)
      appLogger.info("Items added to dataset", undefined, { datasetId, fileCount: fileIds.length })
    } catch (error) {
      if (error instanceof AuthenticationError) {
        clearSystemData()
        setToken(null)
      }
      appLogger.error("Add dataset items failed", error instanceof Error ? error.message : "Unknown error", { datasetId })
      throw error
    }
  }, [token, clearSystemData])

  const handleDeleteDatasetItems = useCallback(async (datasetId: string, fileIds: string[]) => {
    if (!token) {
      appLogger.warn("Dataset items deletion attempted without active token")
      throw new AuthenticationError()
    }

    if (!fileIds.length) {
      appLogger.warn("No file IDs provided for deletion")
      return
    }

    const api = apiRef.current
    try {
      await api.deleteDatasetItems(token, datasetId, fileIds)
      appLogger.info("Dataset items deleted", undefined, { datasetId, fileIds })
    } catch (error) {
      if (error instanceof AuthenticationError) {
        clearSystemData()
        setToken(null)
      }
      appLogger.error("Dataset items deletion failed", error instanceof Error ? error.message : "Unknown error", { datasetId })
      throw error
    }
  }, [token, clearSystemData])

  const handleFilesPageChange = useCallback(
    async (page: number) => {
      if (currentShareId !== null) {
        await handleSelectFilesShare(currentShareId, page)
      }
    },
    [currentShareId, handleSelectFilesShare]
  )



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
      const [tasks, taskStats, aclCacheStats] = await Promise.all([
        api.getTasks(token),
        api.getTaskStatistics(token),
        api.getAclCacheStatistics(token),
      ])

      setMonitoring(prev => ({
        ...prev,
        tasks,
        taskStats,
        aclCacheStats,
      }))

      appLogger.info("Tasks data fetched successfully", undefined, {
        total_tasks: taskStats.total_tasks,
        running_tasks: taskStats.by_status.running,
        acl_cache_stats: true,
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

  const handleRetryWorkItems = useCallback(
    async (shareId: string, workItemIds: string[]) => {
      if (!token) {
        appLogger.warn("Retry work items attempted without active token")
        throw new AuthenticationError()
      }

      const api = apiRef.current

      try {
        appLogger.info("Retrying work items", undefined, { shareId, count: workItemIds.length })
        await api.retryWorkItems(token, shareId, workItemIds)
        toast.success("Retry initiated")
        return true
      } catch (error) {
        if (error instanceof AuthenticationError) {
          clearSystemData()
          setToken(null)
        }
        toast.error("Failed to retry items")
        appLogger.error(
          "Retry work items failed",
          error instanceof Error ? error.message : "Unknown error",
          { shareId }
        )
        return false
      }
    },
    [token, clearSystemData]
  )




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
        const wasCancelled = response.cancelled ?? response.status === "cancelled"
        const responseTaskId = response.id ?? response.task_id ?? taskId
        const responseMessage = response.message
          ?? (wasCancelled
            ? `Task ${responseTaskId} cancellation requested.`
            : `Task ${responseTaskId} was not cancelled.`)

        // Refresh tasks after cancellation attempt
        api.clearCache()
        const [tasks, taskStats, aclCacheStats] = await Promise.all([
          api.getTasks(token),
          api.getTaskStatistics(token),
          api.getAclCacheStatistics(token),
        ])

        setMonitoring(prev => ({
          ...prev,
          tasks,
          taskStats,
          aclCacheStats,
        }))

        if (wasCancelled) {
          toast.success(`Task cancelled: ${responseMessage}`)
        } else {
          toast.warning(`Task cancellation: ${responseMessage}`)
        }

        appLogger.info("Task cancellation response received", undefined, {
          taskId: responseTaskId,
          cancelled: wasCancelled,
          status: response.status,
          graceful: response.graceful
        })
        try {
          await handleFetchSystemData()
          await handleFetchMonitoring(true)
        } catch (error) {
          if (error instanceof AuthenticationError) {
            clearSystemData()
            setToken(null)
          }
          appLogger.error(
            "Failed to refresh monitoring data after task cancellation",
            error instanceof Error ? error.message : "Unknown error",
            { taskId }
          )
          // Do not re-throw, as the task cancellation itself was successful
        }
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
    [token, clearSystemData, handleFetchMonitoring, handleFetchSystemData]
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
    // Remove token from localStorage synchronously to prevent stale session
    // on browser refresh (the useEffect cleanup is async and may not run in time)
    try {
      localStorage.removeItem("neo_token")
    } catch (e) {
      appLogger.error("Failed to remove token from localStorage", e instanceof Error ? e.message : "Unknown error")
    }
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
      setupStatus,
      databaseSize,
      users,
      me,
      operations,
      shares,
      files,
      myDocuments,
      datasets,
      monitoring,
      token,
      cacheStats,
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
      handleFetchMyDocuments,
      handleCreateDataset,
      handleDeleteDataset,
      handleDeleteDatasetItems,
      handleAddDatasetItems,
      handleFetchDatasets,
      handleFetchDatasetItems,
      handleContentSearch,
      handleRetryWorkItems,
      clearCache: useCallback(() => apiRef.current.clearCache(), []),
      setupLicense: useCallback(
        async (request: SetupLicenseRequest) => {
          return apiRef.current.setupLicense(request)
        },
        []
      ),
      setupGraph: useCallback(
        async (request: SetupGraphRequest): Promise<SetupGraphResponse> => {
          return apiRef.current.setupGraph(request)
        },
        []
      ),
      getSetupGraph: useCallback(async (): Promise<SetupGraphConfigResponse> => {
        return apiRef.current.getSetupGraph()
      }, []),
      setupProxy: useCallback(async (request: SetupProxyRequest): Promise<SetupProxyResponse> => {
        return apiRef.current.setupProxy(request)
      }, []),      
      getSetupProxy: useCallback(async (): Promise<SetupProxyConfigResponse> => {
        return apiRef.current.getSetupProxy()
      }, []),   
      getSetupSsl: useCallback(async (): Promise<SetupSslConfigResponse> => {
        return apiRef.current.getSetupSsl()
      }, []),               
      setupOauth: useCallback(
        async (request: Body_configure_oauth_api_v1_setup_oauth_post) => {
          return apiRef.current.setupOauth(request)
        },
        []
      ),
      resetSetup: useCallback(async () => {
        return apiRef.current.resetSetup()
      }, []),
      factoryReset: useCallback(async (payload: SetupFactoryResetRequest) => {
        return apiRef.current.factoryReset(payload)
      }, []),
      getInitialCredentials: useCallback(async () => {
        return apiRef.current.getInitialCredentials()
      }, []),
      completeSetup: useCallback(async () => {
        return apiRef.current.completeSetup()
      }, []),
      getMcpInfo: useCallback(async () => {
        if (!token) throw new AuthenticationError()
        return apiRef.current.getMcpInfo(token)
      }, [token]),
      handleOAuthLogin: useCallback(async () => {
        await apiRef.current.handleOAuthLogin()
      }, []),
      handleLinkEntraIdentity: useCallback(async () => {
        if (!token) throw new AuthenticationError()
        if (!me?.id) throw new Error("User ID not available")
        await apiRef.current.linkEntraIdentity(token, { user_id: me.id })
      }, [token, me?.id]),
      handleUnlinkEntraIdentity: useCallback(async () => {
        if (!token) throw new AuthenticationError()
        if (!me?.id) throw new Error("User ID not available")
        await apiRef.current.unlinkEntraIdentity(token, { user_id: me.id })
      }, [token, me?.id]),
    },
  }
}