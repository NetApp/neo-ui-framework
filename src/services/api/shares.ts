// Copyright 2025 NetApp, Inc. All Rights Reserved.
import { appLogger } from "@/services/app-logger"
import { BaseApiClient } from "./base"
import type { SharesResponse, ShareDetailsResponse } from "@/services/models"

export class SharesApiClient extends BaseApiClient {
  getShares(token: string) {
    appLogger.debug("Fetching shares list")
    return this.requestWithToken<SharesResponse[]>("/shares", token)
  }

  getShareDetails(token: string, shareId: string) {
    appLogger.debug("Fetching share details", undefined, { shareId })
    return this.requestWithToken<ShareDetailsResponse>(`/shares/${shareId}`, token)
  }

  deleteShare(token: string, shareId: string) {
    appLogger.debug("Sending DELETE request to share", undefined, { shareId })

    return this.requestWithToken<void>(
      `/shares/${shareId}`,
      token,
      { method: "DELETE" },
      { parseJson: false }
    )
  }

  createShare(
    token: string,
    payload: {
      share_path: string
      username: string
      password: string
      crawl_schedule: string
      rules: {
        exclude_patterns: string[]
        include_patterns: string[]
        max_file_size: number
        min_file_size: number
        persist_file_content: boolean
      }
      realm: string
      use_kerberos: string
      workgroup: string
      resolve_order: string
    }
  ) {
    appLogger.debug("Sending POST request to create share", undefined, {
      share_path: payload.share_path,
    })

    return this.requestWithToken<void>(
      "/shares",
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
    payload: {
      share_path?: string
      username?: string
      password?: string
      crawl_schedule?: string
      rules?: Record<string, unknown>
      realm?: string
      use_kerberos?: string
      workgroup?: string
      resolve_order?: string
    }
  ) {
    appLogger.debug("Sending PATCH request to update share", undefined, {
      shareId,
      share_path: payload.share_path,
    })

    return this.requestWithToken<void>(
      `/shares/${shareId}`,
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
      `/shares/${shareId}/crawl`,
      token,
      { method: "POST" },
      { parseJson: false }
    )
  }
}