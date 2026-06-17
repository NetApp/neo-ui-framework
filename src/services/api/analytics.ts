// Copyright 2025 NetApp, Inc. All Rights Reserved.
import { appLogger } from "@/services/app-logger"
import { BaseApiClient } from "./base"
import type { FileSearchResponse } from "@/services/models"

const ANALYTICS_MAX_PAGES = 500
const ANALYTICS_MAX_FILES = 500_000

function resolveFileType(fileType: string | undefined, filename: string | undefined) {
  const mimeToExtension: Record<string, string> = {
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "text/plain": "txt",
  }

  const normalized = fileType?.trim().toLowerCase()
  if (normalized) {
    const mimeCandidate = normalized.split(";")[0].trim()
    if (mimeToExtension[mimeCandidate]) {
      return mimeToExtension[mimeCandidate]
    }

    const extCandidate = mimeCandidate.startsWith(".")
      ? mimeCandidate.slice(1)
      : mimeCandidate.includes("/")
        ? mimeCandidate.split("/").pop() ?? mimeCandidate
        : mimeCandidate

    if (extCandidate) {
      return extCandidate
    }
  }

  const filenameExt = filename?.split(".").pop()?.trim().toLowerCase()
  return filenameExt || "unknown"
}

export class AnalyticsApiClient extends BaseApiClient {
  async getFileAnalytics(token: string) {
    appLogger.debug("Fetching file analytics data")

    const targetTypes = ["pdf", "doc", "docx", "ppt", "pptx", "txt"]
    const fileTypeMap = new Map<string, { count: number; total_size: number }>()

    targetTypes.forEach((type) => {
      fileTypeMap.set(type, { count: 0, total_size: 0 })
    })
    fileTypeMap.set("other", { count: 0, total_size: 0 })

    let totalFiles = 0
    let page = 1
    let hasNextPage = true
    let truncated = false

    while (hasNextPage) {
      if (page > ANALYTICS_MAX_PAGES) {
        truncated = true
        appLogger.warn(
          `[Analytics] File analytics page cap reached (${ANALYTICS_MAX_PAGES}). Returning partial aggregation.`
        )
        break
      }

      appLogger.debug(`Fetching files page ${page}`)
      const response = await this.requestWithToken<FileSearchResponse>(
        this.buildApiV1Path(`/files?page=${page}&page_size=100&include_counts=false`),
        token
      )

      for (const file of response.files) {
        const fileType = resolveFileType(file.file_type, file.filename)
        const key = targetTypes.includes(fileType) ? fileType : "other"
        const current = fileTypeMap.get(key)!

        fileTypeMap.set(key, {
          count: current.count + 1,
          total_size: current.total_size + file.size,
        })
      }

      totalFiles += response.files.length

      if (totalFiles >= ANALYTICS_MAX_FILES && response.has_next) {
        truncated = true
        appLogger.warn(
          `[Analytics] File analytics file cap reached (${ANALYTICS_MAX_FILES}). Returning partial aggregation.`
        )
        break
      }

      hasNextPage = response.has_next
      page += 1

      appLogger.debug(
        `Fetched page ${page - 1}: ${response.files.length} files, has_next: ${response.has_next}`
      )
    }

    appLogger.info(`Processed files incrementally: ${totalFiles} total files across ${page - 1} pages`)

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
      total_files: totalFiles,
      target_types_found: analytics.filter((a) => targetTypes.includes(a.file_type)).length,
      pages_fetched: page - 1,
      truncated,
    })

    return analytics
  }

  async getSharesAnalytics(token: string) {
    appLogger.debug("Fetching shares analytics data")

    const shareFileMap = new Map<
      string,
      { share_name: string; share_path: string; count: number; total_size: number }
    >()

    let totalFiles = 0
    let page = 1
    let hasNextPage = true
    let truncated = false

    while (hasNextPage) {
      if (page > ANALYTICS_MAX_PAGES) {
        truncated = true
        appLogger.warn(
          `[Analytics] Shares analytics page cap reached (${ANALYTICS_MAX_PAGES}). Returning partial aggregation.`
        )
        break
      }

      appLogger.debug(`Fetching files page ${page} for shares analytics`)
      const response = await this.requestWithToken<FileSearchResponse>(
        this.buildApiV1Path(`/files?page=${page}&page_size=1000&include_counts=false`),
        token
      )

      for (const file of response.files) {
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
      }

      totalFiles += response.files.length

      if (totalFiles >= ANALYTICS_MAX_FILES && response.has_next) {
        truncated = true
        appLogger.warn(
          `[Analytics] Shares analytics file cap reached (${ANALYTICS_MAX_FILES}). Returning partial aggregation.`
        )
        break
      }

      hasNextPage = response.has_next
      page += 1

      appLogger.debug(
        `Fetched page ${page - 1}: ${response.files.length} files, has_next: ${response.has_next}`
      )
    }

    appLogger.info(
      `Processed files incrementally for shares analytics: ${totalFiles} total files across ${page - 1} pages`
    )

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
      total_files: totalFiles,
      shares_breakdown: analytics.map((a) => `${a.share_name}: ${a.count}`),
      pages_fetched: page - 1,
      truncated,
    })

    return analytics
  }
}