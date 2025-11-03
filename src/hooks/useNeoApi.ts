import { useCallback, useRef, useState } from "react"

import { toast } from "sonner"

import { appLogger } from "@/services/app-logger"

import {
  NeoApiService,
  type HealthResponse,
  type LicenseResponse,
  type OperationResponse,
  type UserResponse,
  type MeResponse,
  type VersionResponse,
  type SharesResponse,
  type FilesResponse,
  type ShareDetailsResponse,
  type FileMetadataResponse,
  type FileSearchParams,
  type FileSearchResponse,
  AuthenticationError,
} from "@/services/neo-api"

import type { 
  ConnectionCredentials 
} from "@/services/models"

export function useNeoApi() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [license, setLicense] = useState<LicenseResponse | null>(null)
  const [version, setVersion] = useState<VersionResponse | null>(null)
  const [users, setUsers] = useState<UserResponse[] | null>(null)
  const [me, setMe] = useState<MeResponse | null>(null)
  const [operations, setOperations] = useState<OperationResponse[] | null>(null)
  const [shares, setShares] = useState<SharesResponse[] | null>(null)
  const [files, setFiles] = useState<FilesResponse | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const apiRef = useRef(new NeoApiService())

  const applySystemData = useCallback(
    (data: {
      health: HealthResponse
      license: LicenseResponse
      version: VersionResponse
      users: UserResponse[]
      me: MeResponse
      operations: OperationResponse[]
      shares: SharesResponse[]
      files: FilesResponse | null
    }) => {
      setHealth(data.health)
      setLicense(data.license)
      setVersion(data.version)
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
    setUsers(null)
    setMe(null)
    setOperations(null)
    setShares(null)
    setFiles(null)
  }, [])

  const handleConnect = useCallback(
    async (credentials: ConnectionCredentials) => {
      appLogger.info("Connecting to NetApp Neo API endpoint", undefined, {
        endpoint: credentials.endpoint,
      })

      try {
        const api = apiRef.current
        const token = await api.authenticate(credentials.username, credentials.password)
        const data = await api.fetchSystemData(token)

        applySystemData(data)
        setToken(token)
        appLogger.info("Successfully connected to NetApp Neo", undefined, {
          userId: data.me?.id,
          username: data.me?.username,
        })
      } catch (error) {
        clearSystemData()
        setToken(null)
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
    async (shareKey: string | "all" | null) => {
      if (!token) {
        appLogger.warn("Select files share attempted without active token")
        toast.error("Connect first to load files.")
        return
      }

      const api = apiRef.current

      if (shareKey === null) {
        appLogger.debug("Clearing files selection")
        setFiles(null)
        return
      }

      setFiles(null)

      try {
        appLogger.info("Loading files", undefined, { shareKey })
        if (shareKey === "all") {
          if (!shares?.length) {
            appLogger.debug("No shares available to load files from")
            setFiles(null)
            return
          }

          const responses = await Promise.all(shares.map((share) => api.getFiles(token, share.id)))

          const aggregatedFiles = responses.flatMap((response) => response.files)

          const aggregated: FilesResponse = {
            share_id: "all",
            path: "All shares",
            files: aggregatedFiles,
            total_count: responses.reduce((total, response) => total + response.total_count, 0),
            total_size: responses.reduce((total, response) => total + response.total_size, 0),
            page: 0,
            page_size: aggregatedFiles.length,
            total_pages: aggregatedFiles.length ? 1 : 0,
            has_next: false,
            has_previous: false,
          }

          setFiles(aggregated)
          appLogger.info("Files loaded from all shares", undefined, {
            total_files: aggregatedFiles.length,
          })
        } else {
          const response = await api.getFiles(token, shareKey)
          setFiles(response)
          appLogger.info("Files loaded from share", undefined, {
            shareKey,
            total_files: response.files.length,
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
          { shareKey }
        )
        toast.error("Failed to load files.")
      }
    },
    [token, shares, clearSystemData]
  )

  const handleLogout = useCallback(() => {
    appLogger.info("User logging out", undefined, { username: me?.username })
    clearSystemData()
    setToken(null)
    appLogger.info("User logged out successfully")
  }, [clearSystemData, me?.username])

  return {
    state: {
      health,
      license,
      version,
      users,
      me,
      operations,
      shares,
      files,
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
      handleLogout,
    },
  }
}