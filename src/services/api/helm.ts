// Copyright 2025 NetApp, Inc. All Rights Reserved.
import { appLogger } from "@/services/app-logger"
import yaml from "js-yaml"
import type { HelmChartVersionResponse } from "@/services/models"

const FALLBACK_VERSION: HelmChartVersionResponse = {
  chart_name: "netapp-neo",
  app_version: "Unknown",
  chart_version: "Unknown",
}

export class HelmApiClient {
  async getLatestHelmVersion(): Promise<HelmChartVersionResponse> {
    appLogger.debug("Fetching latest Helm chart version from index.yaml")

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch("https://netapp.github.io/Innovation-Labs/index.yaml", {
        headers: {
          Accept: "application/x-yaml, text/yaml, */*",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        appLogger.warn("Failed to fetch Helm index.yaml", `Status: ${response.status}`)
        return FALLBACK_VERSION
      }

      const yamlText = await response.text()
      const indexData = yaml.load(yamlText) as {
        entries?: {
          [chartName: string]: Array<{
            apiVersion?: string
            appVersion?: string
            version?: string
            name?: string
          }>
        }
      }

      const netappConnectorEntries = indexData.entries?.["netapp-neo"]

      if (!netappConnectorEntries || netappConnectorEntries.length === 0) {
        appLogger.warn("No netapp-connector entries found in index.yaml")
        return FALLBACK_VERSION
      }

      const latestEntry = netappConnectorEntries[0]
      const appVersion = latestEntry.appVersion || "Unknown"
      const chartVersion = latestEntry.version || "Unknown"

      if (appVersion !== "Unknown" && chartVersion !== "Unknown") {
        appLogger.info("Latest Helm versions fetched successfully", undefined, {
          appVersion,
          chartVersion,
          source: "index.yaml",
          chart_name: latestEntry.name ?? "netapp-neo",
        })
        return {
          chart_name: latestEntry.name || "netapp-neo",
          app_version: appVersion,
          chart_version: chartVersion,
        }
      }

      appLogger.warn("Could not extract versions from netapp-neo entry", undefined, {
        entry: latestEntry,
      })
      return {
        chart_name: latestEntry.name || "netapp-neo",
        app_version: appVersion,
        chart_version: chartVersion,
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        appLogger.warn("Helm version fetch timed out after 5 seconds")
        return FALLBACK_VERSION
      }

      appLogger.error(
        "Failed to fetch or parse latest Helm version",
        error instanceof Error ? error.message : "Unknown error"
      )
      return FALLBACK_VERSION
    }
  }
}