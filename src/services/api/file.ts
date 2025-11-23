import type {
  FileMetadataResponse,
  FilesResponse,
  FileSearchParams,
  FileSearchResponse,
} from "@/services/models"
import type { BaseApiClient } from "./base"

export function getFiles(client: BaseApiClient, token: string, shareId: string, page?: number, pageSize?: number) {
  const params = new URLSearchParams()
  if (page) params.append("page", page.toString())
  if (pageSize) params.append("page_size", pageSize.toString())
  return client.requestWithToken<FilesResponse>(
    `/shares/${shareId}/files${params.size ? `?${params}` : ""}`,
    token
  )
}

export function getFileMetadata(client: BaseApiClient, token: string, shareId: string, fileId: string) {
  return client.requestWithToken<FileMetadataResponse>(
    `/shares/${shareId}/files/metadata?file_id=${encodeURIComponent(fileId)}`,
    token
  )
}

export function searchFiles(client: BaseApiClient, token: string, params: FileSearchParams) {
  const qp = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      qp.append(key, typeof value === "number" ? value.toString() : value)
    }
  })
  return client.requestWithToken<FileSearchResponse>(
    `/files${qp.size ? `?${qp}` : ""}`,
    token
  )
}