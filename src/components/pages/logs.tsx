"use client"

import {
  useState
} from "react"

import {
  IconTrash,
  IconDownload
} from "@tabler/icons-react"

import {
  useAppLogs
} from "@/hooks/useAppLogs"

import {
  LogsTable
} from "@/components/data-tables/logsT"

import {
  Button
} from "@/components/ui/button"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type {
  LogLevel
} from "@/services/app-logger"
import type { OperationResponse, MonitoringOverviewResponse } from "@/services/neo-api"
import { OverviewCard } from "@/components/cards/overview-card"

const LEVEL_OPTIONS = ["all", "ERROR", "WARN", "INFO", "DEBUG", "OPERATION"] as const

export default function Logs({ operations, monitoringOverview }: { operations: OperationResponse[] | null; monitoringOverview: MonitoringOverviewResponse | null }) {
  const [selectedLevel, setSelectedLevel] = useState<(typeof LEVEL_OPTIONS)[number]>("all")
  const { logs, currentPage, totalPages, totalCount, onPageChange, onClearLogs, onDownloadLogs } = useAppLogs(
    selectedLevel === "all" ? undefined : (selectedLevel as LogLevel),
    50,
    operations
  )

  const handleLevelChange = (value: (typeof LEVEL_OPTIONS)[number]) => {
    setSelectedLevel(value)
    onPageChange(0)
  }



  const handlePageChange = (nextPage: number) => {
    if (nextPage < 0 || nextPage >= totalPages) {
      return
    }
    onPageChange(nextPage)
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="mb-4">
              <OverviewCard
                overview={monitoringOverview}
                title="System Logs"
                showCacheStats={false}
              />
            </div>
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <Select value={selectedLevel} onValueChange={handleLevelChange}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVEL_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option === "all" ? "All levels" : option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Showing page {currentPage + 1} of {totalPages || 1} · {totalCount} logs
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="default" size="sm" onClick={onDownloadLogs}>
                  <IconDownload className="mr-2 size-4" />
                  Download
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearLogs}
                  className="text-destructive hover:text-destructive"
                >
                  <IconTrash className="mr-2 size-4" />
                  Clear
                </Button>
              </div>
            </div>

            <LogsTable logs={logs} />

            {totalPages > 1 ? (
              <div className="mt-4 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                >
                  Next
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}