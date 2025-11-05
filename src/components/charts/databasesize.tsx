"use client"

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
}

export function DatabaseSizeCard({ databaseSize }: DatabaseSizeCardProps) {
  if (!databaseSize) {
    return (
      <Card className="lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Database Statistics</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Database information not available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Statistics
        </CardTitle>
        <CardDescription>
          Database size and content breakdown
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Database Size Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Database Size</span>
            </div>
            <div className="text-2xl font-bold">{databaseSize.database_size_info}</div>
            <p className="text-xs text-muted-foreground">
              {databaseSize.database_file_size_bytes.toLocaleString()} bytes
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Files Tracked</span>
            </div>
            <div className="text-2xl font-bold">{databaseSize.total_files_tracked.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total: {databaseSize.total_original_file_size_mb.toFixed(2)} MB
            </p>
          </div>
        </div>

        <Separator />

        {/* Table Statistics */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Table Statistics
          </h4>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            {/* Shares */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Shares:</span>
              <Badge variant="outline">
                {databaseSize.table_statistics.shares.row_count}
              </Badge>
            </div>

            {/* Users */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Users:</span>
              <Badge variant="outline">
                {databaseSize.table_statistics.users.row_count}
              </Badge>
            </div>

            {/* File Metadata */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">File Metadata:</span>
              <Badge variant="outline">
                {databaseSize.table_statistics.file_metadata.row_count}
              </Badge>
            </div>

            {/* Operations Log */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Operations Log:</span>
              <Badge variant="outline">
                {databaseSize.table_statistics.operations_log.row_count}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Content Size Breakdown */}
        <div>
          <h4 className="text-sm font-medium mb-3">Content Size Breakdown</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Original Files:</span>
              <span className="font-mono">{databaseSize.total_original_file_size_mb.toFixed(2)} MB</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Extracted Content:</span>
              <span className="font-mono">{databaseSize.total_file_content_size_mb.toFixed(2)} MB</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Operations Log:</span>
              <span className="font-mono">{databaseSize.table_statistics.operations_log.total_content_size_mb} MB</span>
            </div>
          </div>
        </div>

        {/* Timestamp */}
        <div className="pt-2">
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date(databaseSize.timestamp).toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}