// Copyright 2025 NetApp, Inc. All Rights Reserved.
import { appLogger } from "@/services/app-logger"

const DEFAULT_PROXY_PREFIX = "/api"
const API_V1_PREFIX = "/api/v1"

function joinPath(prefix: string, endpoint: string): string {
  const normalizedPrefix = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`

  if (!normalizedPrefix) {
    return normalizedEndpoint
  }

  return `${normalizedPrefix}${normalizedEndpoint}`
}

interface RequestOptions {
  expectAuth?: boolean
  parseJson?: boolean
}

export class AuthenticationError extends Error {
  constructor(message = "Authentication failed. Please log in again.") {
    super(message)
    this.name = "AuthenticationError"
  }
}

export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to access this resource.") {
    super(message)
    this.name = "AuthorizationError"
  }
}

export class BaseApiClient {
  protected baseUrl: string

  constructor(baseUrl: string = DEFAULT_PROXY_PREFIX) {
    this.baseUrl = baseUrl
  }

  protected buildProxyUrl(endpoint: string): string {
    return joinPath(this.baseUrl, endpoint)
  }

  protected buildBackendPath(endpoint: string): string {
    return joinPath("", endpoint)
  }

  protected buildApiV1Path(endpoint: string): string {
    return joinPath(API_V1_PREFIX, endpoint)
  }

  protected async request<T>(
    endpoint: string,
    init: RequestInit = {},
    options: RequestOptions = {}
  ): Promise<T> {
    const { expectAuth = false, parseJson = true } = options
    const url = this.buildProxyUrl(endpoint)
    appLogger.debug(`Requesting ${url}`)

    try {
      const response = await fetch(url, init)

      if (!response.ok) {
        const body = await response.text()
        appLogger.error(
          `Request failed: ${url}`,
          `Status: ${response.status}, Body: ${body}`
        )

        if (expectAuth) {
          if (response.status === 401) {
            throw new AuthenticationError()
          }
          if (response.status === 403) {
            throw new AuthorizationError()
          }
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
      "Content-Type": "application/json",
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

  protected requestBackend<T>(
    endpoint: string,
    init: RequestInit = {},
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>(this.buildBackendPath(endpoint), init, options)
  }

  protected requestBackendWithToken<T>(
    endpoint: string,
    token: string,
    init: RequestInit = {},
    options: RequestOptions = {}
  ): Promise<T> {
    return this.requestWithToken<T>(this.buildBackendPath(endpoint), token, init, options)
  }

  protected requestApiV1<T>(
    endpoint: string,
    init: RequestInit = {},
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>(this.buildApiV1Path(endpoint), init, options)
  }

  protected requestApiV1WithToken<T>(
    endpoint: string,
    token: string,
    init: RequestInit = {},
    options: RequestOptions = {}
  ): Promise<T> {
    return this.requestWithToken<T>(this.buildApiV1Path(endpoint), token, init, options)
  }
}