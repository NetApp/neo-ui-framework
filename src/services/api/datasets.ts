// Copyright 2025 NetApp, Inc. All Rights Reserved.
import { appLogger } from "@/services/app-logger"
import { BaseApiClient } from "./base"
import type { DatasetListResponse } from "@/services/models"

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

  deleteDataset(token: string, datasetId: string) {
    appLogger.debug("Deleting dataset", undefined, { datasetId })
    return this.requestWithToken<void>(`/datasets/${datasetId}`, token, {
      method: "DELETE",
    })
  }
}
