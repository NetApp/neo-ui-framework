// Copyright 2025 NetApp, Inc. All Rights Reserved.
import { appLogger } from "@/services/app-logger"
import { BaseApiClient } from "./base"
import type { DatasetListResponse, DatasetItemsResponse } from "@/services/models"

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
    return this.requestWithToken<DatasetListResponse>(`/datasets?${params}`, token)
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
    return this.requestWithToken<DatasetItemsResponse>(`/datasets/${datasetId}/items?${params}`, token)
  }

  deleteDataset(token: string, datasetId: string) {
    appLogger.debug("Deleting dataset", undefined, { datasetId })
    return this.requestWithToken<void>(`/datasets/${datasetId}`, token, {
      method: "DELETE",
    })
  }

  deleteDatasetItems(token: string, datasetId: string, fileIds: string[]) {
    appLogger.debug("Deleting dataset items", undefined, { datasetId, fileIds })
    return this.requestWithToken<void>(`/datasets/${datasetId}/items`, token, {
      method: "DELETE",
      body: JSON.stringify({ file_ids: fileIds }),
    })
  }

  addDatasetItems(token: string, datasetId: string, fileIds: string[], notes?: string) {
    appLogger.debug("Adding items to dataset", undefined, { datasetId, fileCount: fileIds.length })
    return this.requestWithToken<void>(`/datasets/${datasetId}/items`, token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_ids: fileIds, ...(notes ? { notes } : {}) }),
    })
  }
}
