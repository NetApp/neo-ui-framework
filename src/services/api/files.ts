// Copyright 2025 NetApp, Inc. All Rights Reserved.
import { appLogger } from "@/services/app-logger"
import { BaseApiClient } from "./base"
import type {
  FilesResponse,
  FileMetadataResponse,
  FileSearchParams,
  FileSearchResponse,
  ContentSearchRequest,
  ContentSearchResponse,
} from "@/services/models"

export class FilesApiClient extends BaseApiClient {
  async getFiles(token: string, shareId: string, page?: number, pageSize?: number) {
    const params = new URLSearchParams()
    if (page !== undefined) params.append("page", page.toString())
    if (pageSize !== undefined) params.append("page_size", pageSize.toString())

    let endpoint = `/files?${params}`

    // If specific share is selected, use the share-specific endpoint
    if (shareId && shareId !== "all" && shareId !== "__none__" && shareId !== "__all__") {
      endpoint = `/shares/${shareId}/files?${params}`
    }

    appLogger.debug("Fetching files", undefined, { shareId, endpoint })

    // The endpoints return a structure similar to FileSearchResponse
    const response = await this.requestWithToken<FileSearchResponse>(endpoint, token)

    // Map to FilesResponse with UNC path fallback and share_path fallback
    const mappedFiles = response.files.map(file => ({
      ...file,
      // Ensure unc_path is populated, falling back to share_path if available
      unc_path: file.unc_path || file.share_path || "",
      // Ensure share_id is populated if missing (useful when viewing "all" shares)
      share_id: file.share_id || (shareId !== "all" && shareId !== "__all__" ? shareId : undefined)
    }))

    return {
      share_id: shareId,
      path: "", // This endpoint doesn't return the share path, UI handles fallbacks or it comes from share details
      files: mappedFiles,
      total_count: response.total_count,
      total_size: response.total_size,
      page: response.page,
      page_size: response.page_size,
      total_pages: response.total_pages,
      has_next: response.has_next,
      has_previous: response.has_previous,
    } as FilesResponse
  }

  getFileMetadata(token: string, shareId: string, fileId: string) {
    appLogger.debug("Fetching file metadata", undefined, { shareId, fileId })
    return this.requestWithToken<FileMetadataResponse>(
      `/shares/${shareId}/files/metadata?file_id=${encodeURIComponent(fileId)}`,
      token
    )
  }

  searchFiles(token: string, params: FileSearchParams) {
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
      } else {
        searchParams.append(key, value)
      }
    })

    const query = searchParams.toString()
    return this.requestWithToken<FileSearchResponse>(`/files${query ? `?${query}` : ""}`, token)
  }

  getMyDocuments(token: string, page: number = 1, pageSize: number = 100) {
    const params = new URLSearchParams()
    params.append("page", page.toString())
    params.append("page_size", pageSize.toString())

    appLogger.debug("Fetching my documents", undefined, { page, pageSize })
    // Using /files endpoint which returns files accessible to the user
    return this.requestWithToken<FileSearchResponse>(`/files?${params}`, token)
  }

  searchContent(token: string, payload: ContentSearchRequest) {
    appLogger.debug("Performing content search", undefined, { query: payload.query })
    return this.requestWithToken<ContentSearchResponse>("/search", token, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
  }
}