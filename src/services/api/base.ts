import { appLogger } from "@/services/app-logger"

type RequestOptions = {
  expectAuth?: boolean
  parseJson?: boolean
}

export class AuthenticationError extends Error {
  constructor(message = "Authentication failed. Please log in again.") {
    super(message)
    this.name = "AuthenticationError"
  }
}

export class BaseApiClient {
  constructor(protected baseUrl: string = "/api") {}

  protected async request<T>(
    endpoint: string,
    init: RequestInit = {},
    options: RequestOptions = {}
  ): Promise<T> {
    const { expectAuth = false, parseJson = true } = options
    const url = `${this.baseUrl}${endpoint}`
    appLogger.debug(`Requesting ${url}`)

    try {
      const response = await fetch(url, init)

      if (!response.ok) {
        const body = await response.text()
        appLogger.error(
          `Request failed: ${url}`,
          `Status: ${response.status}, Body: ${body}`
        )

        if (expectAuth && (response.status === 401 || response.status === 403)) {
          throw new AuthenticationError()
        }

        throw new Error(`${endpoint} failed (${response.status} ${response.statusText})`)
      }

      if (!parseJson || response.status === 204 || response.status === 205) {
        return undefined as T
      }

      const contentLength = response.headers.get("content-length")
      if (contentLength !== null && Number(contentLength) === 0) {
        return undefined as T
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        return text ? (text as unknown as T) : (undefined as T)
      }

      return response.json() as Promise<T>
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        appLogger.error(`Network error while calling ${url}`, "Failed to fetch")
        throw new Error(
          `Cannot connect to ${endpoint}. Check if the API is running and CORS is enabled.`
        )
      }
      throw error
    }
  }

  protected requestWithToken<T>(
    endpoint: string,
    token: string,
    init: RequestInit = {},
    options: RequestOptions = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    }

    return this.request<T>(
      endpoint,
      {
        ...init,
        headers,
      },
      {
        expectAuth: true,
        ...options,
      }
    )
  }
}