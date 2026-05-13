// Copyright 2025 NetApp, Inc. All Rights Reserved.
import { appLogger } from "@/services/app-logger"
import { BaseApiClient } from "./base"
import type {
  GraphSyncActionResponse,
  GraphSyncStatusResponse,
  ShareConfigRequest,
  ShareDetailsResponse,
  SharesResponse,
  ShareUpdateRequest,
} from "@/services/models"

export class SharesApiClient extends BaseApiClient {
  getShares(token: string) {
    appLogger.debug("Fetching shares list")
    return this.requestApiV1WithToken<SharesResponse[]>("/shares", token)
  }

  getShareDetails(token: string, shareId: string) {
    appLogger.debug("Fetching share details", undefined, { shareId })
    return this.requestApiV1WithToken<ShareDetailsResponse>(`/shares/${shareId}`, token)
  }

  deleteShare(token: string, shareId: string) {
    appLogger.debug("Sending DELETE request to share", undefined, { shareId })

    return this.requestWithToken<void>(
      this.buildApiV1Path(`/shares/${shareId}`),
      token,
      { method: "DELETE" },
      { parseJson: false }
    )
  }

  createShare(
    token: string,
    payload: ShareConfigRequest
  ) {
    appLogger.debug("Sending POST request to create share", undefined, {
      share_path: payload.share_path,
    })

    return this.requestWithToken<void>(
      this.buildApiV1Path("/shares"),
      token,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      { parseJson: false }
    )
  }

  updateShare(
    token: string,
    shareId: string,
    payload: ShareUpdateRequest
  ) {
    appLogger.debug("Sending PATCH request to update share", undefined, {
      shareId,
      share_path: payload.share_path,
    })

    return this.requestWithToken<void>(
      this.buildApiV1Path(`/shares/${shareId}`),
      token,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      { parseJson: false }
    )
  }

  startShareCrawl(token: string, shareId: string) {
    appLogger.debug("Sending POST request to start share crawl", undefined, { shareId })

    return this.requestWithToken<void>(
      this.buildApiV1Path(`/shares/${shareId}/crawl`),
      token,
      { method: "POST" },
      { parseJson: false }
    )
  }

  getGraphSyncStatus(token: string, shareId: string) {
    appLogger.debug("Fetching Graph sync status", undefined, { shareId })
    return this.requestApiV1WithToken<GraphSyncStatusResponse>(`/shares/${shareId}/graph/status`, token)
  }

  triggerGraphBackfill(token: string, shareId: string) {
    appLogger.debug("Triggering Graph backfill", undefined, { shareId })
    return this.requestApiV1WithToken<GraphSyncActionResponse>(
      `/shares/${shareId}/graph/backfill`,
      token,
      { method: "POST" }
    )
  }

  triggerGraphRetryFailed(token: string, shareId: string) {
    appLogger.debug("Triggering Graph retry failed", undefined, { shareId })
    return this.requestApiV1WithToken<GraphSyncActionResponse>(
      `/shares/${shareId}/graph/retry-failed`,
      token,
      { method: "POST" }
    )
  }

  triggerGraphForceReupload(token: string, shareId: string) {
    appLogger.debug("Triggering Graph force reupload", undefined, { shareId })
    return this.requestApiV1WithToken<GraphSyncActionResponse>(
      `/shares/${shareId}/graph/force-reupload`,
      token,
      { method: "POST" }
    )
  }

  triggerGraphCleanup(token: string, shareId: string) {
    appLogger.debug("Triggering Graph cleanup", undefined, { shareId })
    return this.requestApiV1WithToken<GraphSyncActionResponse>(
      `/shares/${shareId}/graph/cleanup`,
      token,
      { method: "POST" }
    )
  }
}