export interface HealthResponse {
  status: string
  version: string
  timestamp: string
  components: {
    database: { status: string; error: string | null }
    filesystem: { status: string; error: string | null }
    shares: { active_count: number; errors: string[] }
  }
  metrics: {
    cpu_percent: number
    memory_percent: number
    disk_percent: number
  }
}

export interface LicenseResponse {
  message: string
  details: {
    connection_id: string
    days_remaining: number
  }
}

export interface VersionResponse {
  version: string
  build_date?: string
  latest?: string
}

export interface UserResponse {
  id: number
  username: string
  email: string
  is_active: boolean
  is_admin: boolean
  created_at: string
  last_login: string
}

export interface OperationResponse {
  id: number
  operation_type: string
  status: string
  details: string
  timestamp: string
  username: string
}

export interface SharesResponse {
  id: number
  share_path: string
  username: string
  status: string
  last_crawled: string
  last_crawl_file_count: number
}

export interface FilesResponse {
  id: number
  filename: string
  unc_path: string
  size: number
  type: string
  modified_time: string
  indexed: boolean
}

interface TokenResponse {
  access_token: string
  token_type: string
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
    // const trimmedHost = host.trim()
    this.baseUrl = '/api'
    
    // Check if host already has a protocol
    // if (trimmedHost.startsWith("http://") || trimmedHost.startsWith("https://")) {
    //   this.baseUrl = trimmedHost
    // } else {
    //   // Default to http:// for localhost, https:// for everything else
    //   const protocol = trimmedHost.includes("localhost") || trimmedHost.startsWith("127.0.0.1") 
    //     ? "http://" 
    //     : "https://"
    //   this.baseUrl = `${protocol}${trimmedHost}`
    // }
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

  async getOperations(token: string): Promise<OperationResponse[]> {
    return this.fetchWithToken<OperationResponse[]>("/operations/", token)
  }

  async getShares(token: string): Promise<SharesResponse[]> {
    return this.fetchWithToken<SharesResponse[]>("/shares", token)
  }

  async getFiles(token: string): Promise<FilesResponse[]> {
    return this.fetchWithToken<FilesResponse[]>("/files", token)
  }

  async fetchSystemData(token: string) {
    const [health, license, version, users, operations, shares, files] = await Promise.all([
      this.getHealth(token),
      this.getLicenseStatus(token),
      this.getVersion(token),
      this.getUsers(token),
      this.getOperations(token),
      this.getShares(token),
      this.getFiles(token),
    ])

    return { health, license, version, users, operations, shares, files }
  }
}