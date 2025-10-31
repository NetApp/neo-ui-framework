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
    
    this.baseUrl = '/api'
    console.log(`API base URL set to: ${this.baseUrl}`)
  }

  async authenticate(username: string, password: string): Promise<string> {
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
        console.error("Auth response error:", response.status, errorText)
        if (response.status === 401 || response.status === 403) {
          throw new AuthenticationError("Invalid username or password.")
        }
        throw new Error(
          `Authentication failed (${response.status} ${response.statusText})`
        )
      }

      const data = (await response.json()) as TokenResponse
      
      if (!data.access_token) {
        throw new Error("Token response missing access_token")
      }

      return data.access_token
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Cannot connect to server. Check if the API is running and CORS is enabled.')
      }
      throw error
    }
  }

  private async fetchWithToken<T>(endpoint: string, token: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`${endpoint} error:`, response.status, errorText)
        if (response.status === 401 || response.status === 403) {
          throw new AuthenticationError()
        }
        throw new Error(
          `${endpoint} failed (${response.status} ${response.statusText})`
        )
      }

      return response.json() as Promise<T>
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error(`Cannot connect to ${endpoint}. Check if the API is running and CORS is enabled.`)
      }
      throw error
    }
  }

  async getHealth(token: string): Promise<HealthResponse> {
    return this.fetchWithToken<HealthResponse>("/health", token)
  }

  async getLicenseStatus(token: string): Promise<LicenseResponse> {
    return this.fetchWithToken<LicenseResponse>("/license/status", token)
  }

  async getVersion(token: string): Promise<VersionResponse> {
    return this.fetchWithToken<VersionResponse>("/version", token)
  }

  async getUsers(token: string): Promise<UserResponse[]> {
    return this.fetchWithToken<UserResponse[]>("/users/", token)
  }

  async getMeUsers(token: string): Promise<MeResponse> {
    return this.fetchWithToken<MeResponse>("/users/me", token)
  }

  async getOperations(token: string): Promise<OperationResponse[]> {
    return this.fetchWithToken<OperationResponse[]>("/operations/", token)
  }

  async getShares(token: string): Promise<SharesResponse[]> {
    return this.fetchWithToken<SharesResponse[]>("/shares", token)
  }

  async deleteShare(token: string, shareId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/shares/${shareId}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`DELETE /shares/${shareId} error:`, response.status, errorText)
      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError()
      }
      throw new Error(
        `Share deletion failed (${response.status} ${response.statusText})`
      )
    }
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
      console.error("POST /shares error:", response.status, errorText)
      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError()
      }
      throw new Error(
        `Share creation failed (${response.status} ${response.statusText})`
      )
    }
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
      console.error(`PATCH /shares/${shareId} error:`, response.status, errorText)
      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError()
      }
      throw new Error(
        `Share update failed (${response.status} ${response.statusText})`
      )
    }
  }

  async startShareCrawl(token: string, shareId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/shares/${shareId}/crawl`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`POST /shares/${shareId}/crawl error:`, response.status, errorText)
      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError()
      }
      throw new Error(
        `Share crawl failed (${response.status} ${response.statusText})`
      )
    }
  }

  async getShareDetails(token: string, shareId: string): Promise<ShareDetailsResponse> {
    return this.fetchWithToken<ShareDetailsResponse>(`/shares/${shareId}`, token)
  }

  async getFiles(token: string, shareId: string): Promise<FilesResponse> {
    return this.fetchWithToken<FilesResponse>(`/shares/${shareId}/files`, token)
  }

  async getFileMetadata(token: string, shareId: string, fileId: string): Promise<FileMetadataResponse> {
    return this.fetchWithToken<FileMetadataResponse>(
      `/shares/${shareId}/files/metadata?file_id=${encodeURIComponent(fileId)}`,
      token
    )
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
      console.error("POST /users/ error:", response.status, errorText)
      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError()
      }
      throw new Error(`User creation failed (${response.status} ${response.statusText})`)
    }
  }

  async fetchSystemData(token: string) {
    const [health, license, version, users, me, operations, shares] = await Promise.all([
      this.getHealth(token),
      this.getLicenseStatus(token),
      this.getVersion(token),
      this.getUsers(token),
      this.getMeUsers(token),
      this.getOperations(token),
      this.getShares(token),
    ])

    return { health, license, version, users, me, operations, shares, files: null }
  }

  async changeMyPassword(
    token: string,
    payload: { current_password: string; new_password: string }
  ): Promise<void> {
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
      console.error("PATCH /users/me/password error:", response.status, errorText)
      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError()
      }
      throw new Error(
        `Password change failed (${response.status} ${response.statusText})`
      )
    }
  }
}