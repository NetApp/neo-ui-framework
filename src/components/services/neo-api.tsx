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
  status: string
  expires_on?: string
  license_type?: string
}

export interface VersionResponse {
  version: string
  build?: string
  latest?: string
}

interface TokenResponse {
  access_token: string
  token_type: string
}

export class NeoApiService {
  private baseUrl: string

  constructor(host: string) {
    const trimmedHost = host.trim()
    
    // Check if host already has a protocol
    if (trimmedHost.startsWith("http://") || trimmedHost.startsWith("https://")) {
      this.baseUrl = trimmedHost
    } else {
      // Default to http:// for localhost, https:// for everything else
      const protocol = trimmedHost.includes("localhost") || trimmedHost.startsWith("127.0.0.1") 
        ? "http://" 
        : "https://"
      this.baseUrl = `${protocol}${trimmedHost}`
    }
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
        console.error('Auth response error:', response.status, errorText)
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

  async fetchSystemData(token: string) {
    const [health, license, version] = await Promise.all([
      this.getHealth(token),
      this.getLicenseStatus(token),
      this.getVersion(token),
    ])

    return { health, license, version }
  }
}