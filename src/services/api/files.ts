import { appLogger } from "@/services/app-logger"
import { BaseApiClient } from "./base"
import type {
  FilesResponse,
  FileMetadataResponse,
  FileSearchParams,
  FileSearchResponse,
} from "@/services/models"

export class FilesApiClient extends BaseApiClient {
  getFiles(token: string, shareId: string, page?: number, pageSize?: number) {
    const params = new URLSearchParams()
    if (page !== undefined) params.append("page", page.toString())
    if (pageSize !== undefined) params.append("page_size", pageSize.toString())
    const endpoint = `/shares/${shareId}/files${params.size ? `?${params}` : ""}`

    appLogger.debug("Fetching files for share", undefined, { shareId, page, pageSize })
    return this.requestWithToken<FilesResponse>(endpoint, token)
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
}