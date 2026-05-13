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
  CreateDatasetRequest,
  DatasetResponse,
} from "@/services/models"

export class FilesApiClient extends BaseApiClient {
  /**
   * Get files from a share or all shares
   * Supports both offset pagination and keyset (cursor-based) pagination
   */
  async getFiles(
    token: string,
    shareId: string,
    page?: number,
    pageSize?: number,
    includeContent: boolean = false,
    afterModifiedTime?: string
  ) {
    const params = new URLSearchParams()
    
    // Pagination: use keyset if cursor provided, otherwise offset
    if (afterModifiedTime) {
      params.append("after_modified_time", afterModifiedTime)
    } else if (page !== undefined) {
      params.append("page", page.toString())
    }
    
    if (pageSize !== undefined) {
      params.append("page_size", pageSize.toString())
    }
    
    params.append("include_content", includeContent ? "true" : "false")
    
    // Optimize for large datasets: always request compact fields and skip expensive aggregates by default.
    params.append("include_counts", "false")
    params.append("field_set", "standard")

    let endpoint = this.buildApiV1Path(`/files?${params}`)

    // If specific share is selected, use the share-specific endpoint
    if (shareId && shareId !== "all" && shareId !== "__none__" && shareId !== "__all__") {
      endpoint = this.buildApiV1Path(`/shares/${shareId}/files?${params}`)
    }

    appLogger.debug("Fetching files", undefined, { 
      shareId, 
      endpoint,
      paginationMode: afterModifiedTime ? "keyset" : "offset"
    })

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
      next_cursor: response.next_cursor,
      content_truncated: response.content_truncated,
      truncated_file_count: response.truncated_file_count,
      max_content_length_applied: response.max_content_length_applied,
      response_size_warning: response.response_size_warning,
    } as FilesResponse
  }

  getFileMetadata(token: string, shareId: string, fileId: string, includeContent: boolean = false) {
    appLogger.debug("Fetching file metadata", undefined, { shareId, fileId })
    const params = new URLSearchParams()
    params.append("file_id", fileId)
    params.append("include_content", includeContent ? "true" : "false")

    return this.requestWithToken<FileMetadataResponse>(
      this.buildApiV1Path(`/shares/${shareId}/files/metadata?${params.toString()}`),
      token
    )
  }

  /**
   * Full-text search across file content using POST /api/v1/search
   * Provides relevance scoring and advanced search capabilities
   */
  async fullTextSearch(token: string, params: FileSearchParams) {
    appLogger.debug("Performing full-text search", undefined, {
      query: params.query,
      share_ids: params.share_ids,
      sort_by: params.sort_by,
    })

    const payload: Record<string, unknown> = {
      query: params.query || "",
    }

    if (params.share_ids?.length) {
      payload.share_ids = params.share_ids
    }
    if (params.file_type) {
      payload.file_types = params.file_type.split(",").map(t => t.trim())
    }
    if (params.modified_after) {
      payload.modified_after = params.modified_after
    }
    if (params.modified_before) {
      payload.modified_before = params.modified_before
    }
    if (params.page !== undefined) {
      payload.page = params.page
    } else {
      payload.page = 1
    }
    if (params.page_size !== undefined) {
      payload.page_size = params.page_size
    } else {
      payload.page_size = 100
    }
    if (params.sort_by) {
      payload.sort_by = params.sort_by
    } else {
      payload.sort_by = "relevance"
    }
    if (params.sort_order) {
      payload.sort_order = params.sort_order
    } else {
      payload.sort_order = "desc"
    }
    if (params.search_mode) {
      payload.search_mode = params.search_mode
    }

    const response = await this.requestApiV1WithToken<FileSearchResponse>("/search", token, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    // Map to FilesResponse structure
    const mappedFiles = response.files.map(file => ({
      ...file,
      unc_path: file.unc_path || file.share_path || "",
    }))

    return {
      share_id: "__search__",
      path: "Search results",
      files: mappedFiles,
      total_count: response.total_count,
      total_size: response.total_size,
      page: response.page,
      page_size: response.page_size,
      total_pages: response.total_pages,
      has_next: response.has_next,
      has_previous: response.has_previous,
      next_cursor: response.next_cursor,
      content_truncated: response.content_truncated,
      truncated_file_count: response.truncated_file_count,
      max_content_length_applied: response.max_content_length_applied,
      response_size_warning: response.response_size_warning,
    } as FilesResponse
  }

  /**
   * Search files using simple filters (GET /api/v1/files)
   * Falls back to simple filtering when full-text search is not needed
   */
  async searchFiles(token: string, params: FileSearchParams) {
    // If full-text search query is provided, use full-text search endpoint
    if (params.query) {
      return this.fullTextSearch(token, params)
    }

    appLogger.debug("Searching files (filter-based)", undefined, {
      filename: params.filename,
      file_type: params.file_type,
      field_set: params.field_set,
    })

    const searchParams = new URLSearchParams()
    
    // Add standard filter parameters
    if (params.filename) searchParams.append("filename", params.filename)
    if (params.file_type) searchParams.append("file_type", params.file_type)
    if (params.fields) searchParams.append("fields", params.fields)
    searchParams.append("field_set", params.field_set ?? "standard")
    
    // Add optimization parameters
    searchParams.append("include_content", (params.include_content ?? false).toString())
    searchParams.append("include_counts", (params.include_counts ?? false).toString())
    
    // Add pagination - support both offset and keyset
    if (params.after_modified_time) {
      searchParams.append("after_modified_time", params.after_modified_time)
      if (params.page_size) searchParams.append("page_size", params.page_size.toString())
    } else {
      if (params.page) searchParams.append("page", params.page.toString())
      if (params.page_size) searchParams.append("page_size", params.page_size.toString())
    }

    const query = searchParams.toString()
    const response = await this.requestWithToken<FileSearchResponse>(
      this.buildApiV1Path(`/files${query ? `?${query}` : ""}`),
      token
    )

    // Map to FilesResponse
    const mappedFiles = response.files.map(file => ({
      ...file,
      unc_path: file.unc_path || file.share_path || "",
    }))

    return {
      share_id: "__search__",
      path: "Search results",
      files: mappedFiles,
      total_count: response.total_count,
      total_size: response.total_size,
      page: response.page,
      page_size: response.page_size,
      total_pages: response.total_pages,
      has_next: response.has_next,
      has_previous: response.has_previous,
      next_cursor: response.next_cursor,
      content_truncated: response.content_truncated,
      truncated_file_count: response.truncated_file_count,
      max_content_length_applied: response.max_content_length_applied,
      response_size_warning: response.response_size_warning,
    } as FilesResponse
  }

  /**
   * Get file by ID (direct lookup without share_id)
   * Useful for cross-share search results and dataset operations
   */
  async getFileById(token: string, fileId: string, includeContent: boolean = false, fieldSet?: string) {
    appLogger.debug("Fetching file by ID", undefined, { fileId, includeContent })
    
    const params = new URLSearchParams()
    params.append("include_content", includeContent.toString())
    if (fieldSet) params.append("field_set", fieldSet)

    return this.requestWithToken<FileMetadataResponse>(
      this.buildApiV1Path(`/files/${fileId}?${params.toString()}`),
      token
    )
  }

  /**
   * Get file with fallback: try direct lookup if share_id unavailable
   * Falls back to share-scoped lookup if file_id lookup fails
   */
  async getFileMetadataWithFallback(token: string, fileId: string, shareId?: string, includeContent: boolean = false) {
    appLogger.debug("Fetching file metadata with fallback", undefined, { fileId, shareId, includeContent })

    // Try direct file lookup first (no share_id required)
    if (!shareId) {
      try {
        return await this.getFileById(token, fileId, includeContent, "full")
      } catch (error) {
        appLogger.error(
          "Direct file lookup failed, requires share_id",
          error instanceof Error ? error.message : "Unknown error",
          { fileId }
        )
        throw new Error("Share information required to fetch file metadata")
      }
    }

    // If share_id is available, use share-scoped endpoint (legacy compatibility)
    return this.getFileMetadata(token, shareId, fileId, includeContent)
  }

  getMyDocuments(token: string, page: number = 1, pageSize: number = 100, includeContent: boolean = false) {
    const params = new URLSearchParams()
    params.append("page", page.toString())
    params.append("page_size", pageSize.toString())
    params.append("include_content", includeContent ? "true" : "false")
    params.append("field_set", "standard")
    params.append("include_counts", "false")

    appLogger.debug("Fetching my documents", undefined, { page, pageSize })
    // Using /files endpoint which returns files accessible to the user
    return this.requestWithToken<FileSearchResponse>(this.buildApiV1Path(`/files?${params}`), token)
  }

  searchContent(token: string, payload: ContentSearchRequest) {
    appLogger.debug("Performing content search", undefined, { query: payload.query })
    return this.requestApiV1WithToken<ContentSearchResponse>("/search", token, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
  }

  createDataset(token: string, payload: CreateDatasetRequest) {
    appLogger.debug("Creating dataset", undefined, { name: payload.name, file_count: payload.file_ids.length })
    return this.requestApiV1WithToken<DatasetResponse>("/datasets", token, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
  }
}