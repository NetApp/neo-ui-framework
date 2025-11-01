import { appLogger } from "@/services/app-logger"
import type {
  HealthResponse,
  LicenseResponse,
  VersionResponse,
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
} from "./models"

export type {
  HealthResponse,
  LicenseResponse,
  VersionResponse,
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
      const [health, license, version, users, me, operations, shares] = await Promise.all([
        this.getHealth(token),
        this.getLicenseStatus(token),
        this.getVersion(token),
        this.getUsers(token),
        this.getMeUsers(token),
        this.getOperations(token),
        this.getShares(token),
      ])

      appLogger.info("System data fetched successfully", undefined, {
        users_count: users.length,
        shares_count: shares.length,
        operations_count: operations.length,
      })

      return { health, license, version, users, me, operations, shares, files: null }
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
}