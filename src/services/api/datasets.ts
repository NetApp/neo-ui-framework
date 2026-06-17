// Copyright 2025 NetApp, Inc. All Rights Reserved.
import { appLogger } from "@/services/app-logger"
import { BaseApiClient } from "./base"
import type {
  CreateSubsetRequest,
  DatasetExpirationResponse,
  DatasetItemsResponse,
  DatasetListResponse,
  DatasetNerSearchRequest,
  DatasetNerSearchResponse,
  DatasetResponse,
  DatasetSearchRequest,
  DatasetSearchResponse,
  DatasetShareResponse,
  ShareDatasetRequest,
  UpdateDatasetRequest,
} from "@/services/models"

export class DatasetsApiClient extends BaseApiClient {
  getDatasets(
    token: string,
    page: number = 1,
    pageSize: number = 50,
    ownedOnly: boolean = false
  ) {
    const params = new URLSearchParams()
    params.append("page", page.toString())
    params.append("page_size", pageSize.toString())
    params.append("owned_only", ownedOnly.toString())

    appLogger.debug("Fetching datasets", undefined, { page, pageSize, ownedOnly })
    return this.requestWithToken<DatasetListResponse>(this.buildApiV1Path(`/datasets?${params}`), token)
  }

  getDatasetItems(
    token: string,
    datasetId: string,
    page: number = 1,
    pageSize: number = 50
  ) {
    const params = new URLSearchParams()
    params.append("page", page.toString())
    params.append("page_size", pageSize.toString())

    appLogger.debug("Fetching dataset items", undefined, { datasetId, page, pageSize })
    return this.requestWithToken<DatasetItemsResponse>(this.buildApiV1Path(`/datasets/${datasetId}/items?${params}`), token)
  }

  getDataset(token: string, datasetId: string) {
    appLogger.debug("Fetching dataset", undefined, { datasetId })
    return this.requestWithToken<DatasetResponse>(this.buildApiV1Path(`/datasets/${datasetId}`), token)
  }

  updateDataset(token: string, datasetId: string, payload: UpdateDatasetRequest) {
    appLogger.debug("Updating dataset", undefined, { datasetId })
    return this.requestWithToken<DatasetResponse>(this.buildApiV1Path(`/datasets/${datasetId}`), token, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  }

  getExpiringDatasets(token: string) {
    appLogger.debug("Fetching expiring datasets")
    return this.requestWithToken<DatasetExpirationResponse>(this.buildApiV1Path("/datasets/expiring"), token)
  }

  deleteDataset(token: string, datasetId: string) {
    appLogger.debug("Deleting dataset", undefined, { datasetId })
    return this.requestWithToken<void>(this.buildApiV1Path(`/datasets/${datasetId}`), token, {
      method: "DELETE",
    })
  }

  deleteDatasetItems(token: string, datasetId: string, fileIds: string[]) {
    appLogger.debug("Deleting dataset items", undefined, { datasetId, fileIds })
    return this.requestWithToken<void>(this.buildApiV1Path(`/datasets/${datasetId}/items`), token, {
      method: "DELETE",
      body: JSON.stringify({ file_ids: fileIds }),
    })
  }

  addDatasetItems(token: string, datasetId: string, fileIds: string[], notes?: string) {
    appLogger.debug("Adding items to dataset", undefined, { datasetId, fileCount: fileIds.length })
    return this.requestWithToken<void>(this.buildApiV1Path(`/datasets/${datasetId}/items`), token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_ids: fileIds, ...(notes ? { notes } : {}) }),
    })
  }

  searchDataset(token: string, datasetId: string, payload: DatasetSearchRequest) {
    appLogger.debug("Searching dataset", undefined, { datasetId, query: payload.query })
    return this.requestWithToken<DatasetSearchResponse>(this.buildApiV1Path(`/datasets/${datasetId}/search`), token, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  nerSearchDataset(token: string, datasetId: string, payload: DatasetNerSearchRequest) {
    const params = new URLSearchParams()
    params.append("q", payload.q)
    if (payload.entity_type) params.append("entity_type", payload.entity_type)
    if (payload.match_mode) params.append("match_mode", payload.match_mode)
    if (typeof payload.limit === "number") params.append("limit", payload.limit.toString())
    if (payload.cursor) params.append("cursor", payload.cursor)

    appLogger.debug("NER searching dataset", undefined, {
      datasetId,
      q: payload.q,
      entity_type: payload.entity_type,
      match_mode: payload.match_mode,
      limit: payload.limit,
      cursor: payload.cursor,
    })

    return this.requestWithToken<DatasetNerSearchResponse>(
      this.buildApiV1Path(`/datasets/${datasetId}/ner-search?${params}`),
      token,
      { method: "POST" }
    )
  }

  createSubset(token: string, datasetId: string, payload: CreateSubsetRequest) {
    appLogger.debug("Creating dataset subset", undefined, { datasetId, name: payload.name })
    return this.requestWithToken<DatasetResponse>(this.buildApiV1Path(`/datasets/${datasetId}/subset`), token, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  shareDataset(token: string, datasetId: string, payload: ShareDatasetRequest) {
    appLogger.debug("Sharing dataset", undefined, { datasetId, permission: payload.permission })
    return this.requestWithToken<DatasetShareResponse>(this.buildApiV1Path(`/datasets/${datasetId}/shares`), token, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  listDatasetShares(token: string, datasetId: string) {
    appLogger.debug("Listing dataset shares", undefined, { datasetId })
    return this.requestWithToken<DatasetShareResponse[]>(this.buildApiV1Path(`/datasets/${datasetId}/shares`), token)
  }

  updateDatasetShare(token: string, datasetId: string, shareId: string, permission?: string | null, expiresAt?: string | null) {
    const params = new URLSearchParams()
    if (permission) params.append("permission", permission)
    if (typeof expiresAt !== "undefined") {
      params.append("expires_at", expiresAt ?? "")
    }
    const query = params.toString()

    appLogger.debug("Updating dataset share", undefined, { datasetId, shareId, permission, expiresAt })
    return this.requestWithToken<DatasetShareResponse>(
      this.buildApiV1Path(`/datasets/${datasetId}/shares/${shareId}${query ? `?${query}` : ""}`),
      token,
      { method: "PATCH" }
    )
  }

  revokeDatasetShare(token: string, datasetId: string, shareId: string) {
    appLogger.debug("Revoking dataset share", undefined, { datasetId, shareId })
    return this.requestWithToken<void>(this.buildApiV1Path(`/datasets/${datasetId}/shares/${shareId}`), token, {
      method: "DELETE",
    })
  }
}
