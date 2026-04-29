// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import { useTranslation } from "react-i18next"
import {
  Database,
  HardDrive,
  FileText,
  // Users, 
  Activity
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { DatabaseSizeResponse } from "@/services/neo-api"

interface DatabaseSizeCardProps {
  databaseSize: DatabaseSizeResponse | null
  className?: string
}

export function DatabaseSizeCard({ databaseSize, className }: DatabaseSizeCardProps) {
  const { t } = useTranslation()
  if (!databaseSize) {
    return (
      <Card className={`lg:col-span-2 ${className || ""}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("databaseStatistics", { ns: "monitoring" })}</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">{t("databaseInformationUnavailable", { ns: "monitoring" })}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`lg:col-span-2 ${className || ""}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          {t("databaseStatistics", { ns: "monitoring" })}
        </CardTitle>
        <CardDescription>
          {t("contentSizeBreakdown", { ns: "monitoring" })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Database Size Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t("databaseSize", { ns: "monitoring" })}</span>
            </div>
            <div className="text-2xl font-bold">{databaseSize.database_size_info}</div>
            <p className="text-xs text-muted-foreground">
              {databaseSize.database_file_size_bytes.toLocaleString()} {t("bytesSuffix", { ns: "monitoring" })}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t("filesTracked", { ns: "monitoring" })}</span>
            </div>
            <div className="text-2xl font-bold">{databaseSize.total_files_tracked.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {t("totalValue", { ns: "monitoring" })}: {databaseSize.total_original_file_size_mb.toFixed(2)} {t("mbSuffix", { ns: "monitoring" })}
            </p>
          </div>
        </div>

        <Separator />

        {/* Table Statistics */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {t("tableStatistics", { ns: "monitoring" })}
          </h4>

          <div className="grid grid-cols-2 gap-4 text-sm">
            {/* Shares */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("sharesLabel", { ns: "monitoring" })}:</span>
              <Badge variant="outline">
                {databaseSize.table_statistics?.shares?.row_count ?? 0}
              </Badge>
            </div>

            {/* Users */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("usersLabel", { ns: "monitoring" })}:</span>
              <Badge variant="outline">
                {databaseSize.table_statistics?.users?.row_count ?? 0}
              </Badge>
            </div>

            {/* File Metadata */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("fileMetadata", { ns: "monitoring" })}:</span>
              <Badge variant="outline">
                {databaseSize.table_statistics?.file_metadata?.row_count ?? 0}
              </Badge>
            </div>

            {/* Operations Log */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Operations Log:</span>
              <Badge variant="outline">
                {databaseSize.table_statistics?.operations_log?.row_count ?? 0}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Content Size Breakdown */}
        <div>
          <h4 className="text-sm font-medium mb-3">{t("contentSizeBreakdown", { ns: "monitoring" })}</h4>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("originalFiles", { ns: "monitoring" })}:</span>
              <span className="font-mono">{databaseSize.total_original_file_size_mb.toFixed(2)} {t("mbSuffix", { ns: "monitoring" })}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("extractedContent", { ns: "monitoring" })}:</span>
              <span className="font-mono">{databaseSize.total_file_content_size_mb.toFixed(2)} {t("mbSuffix", { ns: "monitoring" })}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("operationsLog", { ns: "monitoring" })}:</span>
              <span className="font-mono">{databaseSize.table_statistics?.operations_log?.total_content_size_mb ?? "0.00"} {t("mbSuffix", { ns: "monitoring" })}</span>
            </div>
          </div>
        </div>

        {/* Timestamp */}
        <div className="pt-2">
          <p className="text-xs text-muted-foreground">
            {t("lastUpdated", { ns: "monitoring" })}: {new Date(databaseSize.timestamp).toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}