// Copyright 2025 NetApp, Inc. All Rights Reserved.
import { appLogger } from "@/services/app-logger"
import { BaseApiClient } from "./base"
import type { FileEntry, FileSearchResponse } from "@/services/models"

export class AnalyticsApiClient extends BaseApiClient {
  async getFileAnalytics(token: string) {
    appLogger.debug("Fetching file analytics data")

    const allFiles: FileEntry[] = []
    let page = 1
    let hasNextPage = true

    while (hasNextPage) {
      appLogger.debug(`Fetching files page ${page}`)
      const response = await this.requestWithToken<FileSearchResponse>(
        `/files?page=${page}&page_size=100`,
        token
      )

      allFiles.push(...response.files)
      hasNextPage = response.has_next
      page += 1

      appLogger.debug(
        `Fetched page ${page - 1}: ${response.files.length} files, has_next: ${response.has_next}`
      )
    }

    appLogger.info(`Fetched all files: ${allFiles.length} total files across ${page - 1} pages`)

    const targetTypes = ["pdf", "doc", "docx", "ppt", "pptx", "txt"]
    const fileTypeMap = new Map<string, { count: number; total_size: number }>()

    targetTypes.forEach((type) => {
      fileTypeMap.set(type, { count: 0, total_size: 0 })
    })
    fileTypeMap.set("other", { count: 0, total_size: 0 })

    allFiles.forEach((file) => {
      const fileType = file.file_type?.toLowerCase() || "unknown"
      const key = targetTypes.includes(fileType) ? fileType : "other"
      const current = fileTypeMap.get(key)!
      fileTypeMap.set(key, {
        count: current.count + 1,
        total_size: current.total_size + file.size,
      })
    })

    const analytics = Array.from(fileTypeMap.entries())
      .map(([file_type, stats]) => ({
        file_type,
        count: stats.count,
        total_size: stats.total_size,
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)

    appLogger.info("File analytics data processed", undefined, {
      total_file_types: analytics.length,
      total_files: allFiles.length,
      target_types_found: analytics.filter((a) => targetTypes.includes(a.file_type)).length,
      pages_fetched: page - 1,
    })

    return analytics
  }

  async getSharesAnalytics(token: string) {
    appLogger.debug("Fetching shares analytics data")

    const allFiles: FileEntry[] = []
    let page = 1
    let hasNextPage = true

    while (hasNextPage) {
      appLogger.debug(`Fetching files page ${page} for shares analytics`)
      const response = await this.requestWithToken<FileSearchResponse>(
        `/files?page=${page}&page_size=1000`,
        token
      )

      allFiles.push(...response.files)
      hasNextPage = response.has_next
      page += 1

      appLogger.debug(
        `Fetched page ${page - 1}: ${response.files.length} files, has_next: ${response.has_next}`
      )
    }

    appLogger.info(
      `Fetched all files for shares analytics: ${allFiles.length} total files across ${page - 1} pages`
    )

    const shareFileMap = new Map<
      string,
      { share_name: string; share_path: string; count: number; total_size: number }
    >()

    allFiles.forEach((file) => {
      const shareId = file.share_id || "unknown"
      const shareName = file.share_name || "Unknown Share"
      const sharePath = file.share_path || "Unknown Path"
      const current = shareFileMap.get(shareId) || {
        share_name: shareName,
        share_path: sharePath,
        count: 0,
        total_size: 0,
      }

      shareFileMap.set(shareId, {
        share_name: shareName,
        share_path: sharePath,
        count: current.count + 1,
        total_size: current.total_size + file.size,
      })
    })

    const analytics = Array.from(shareFileMap.entries())
      .map(([share_id, stats]) => ({
        share_id,
        share_name: stats.share_name,
        share_path: stats.share_path,
        count: stats.count,
        total_size: stats.total_size,
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)

    appLogger.info("Shares analytics data processed", undefined, {
      total_shares_with_files: analytics.length,
      total_files: allFiles.length,
      shares_breakdown: analytics.map((a) => `${a.share_name}: ${a.count}`),
      pages_fetched: page - 1,
    })

    return analytics
  }
}