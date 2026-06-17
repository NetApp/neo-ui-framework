// Copyright 2025 NetApp, Inc. All Rights Reserved.
import { appLogger } from "@/services/app-logger"
import { BaseApiClient } from "./base"
import type {
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
}