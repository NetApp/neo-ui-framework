// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import {
  useCallback,
  useEffect,
  useState
} from "react"

import {
  IconDatabaseExport,
  IconEdit,
  IconTrash
} from "@tabler/icons-react"

import {
  CheckCircle2Icon,
  AlertCircleIcon,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react"

import type {
  ShareDetailsResponse,
  SharesResponse,
  MonitoringOverviewResponse
} from "@/services/neo-api"
import { AuthenticationError } from "@/services/neo-api"
import { OverviewCard } from "@/components/cards/overview-card"

import {
  SharesTable
} from "@/components/data-tables/sharesT"

import {
  Button
} from "@/components/ui/button"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetClose,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet"

import {
  Badge
} from "@/components/ui/badge"

import {
  Input
} from "@/components/ui/input"

import {
  Label
} from "@/components/ui/label"

import {
  Textarea
} from "@/components/ui/textarea"

import {
  Alert,
  AlertDescription,
  AlertTitle
} from "@/components/ui/alert"


import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import { Spinner } from "@/components/ui/spinner"
import { Separator } from "@/components/ui/separator"

interface ShareFormValues {
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
    enable_copilot_upload: boolean
  }
  realm: string
  use_kerberos: string
  workgroup: string
  resolve_order: string
}

interface SharesProps {
  shares: SharesResponse[] | null
  onDeleteShare: (shareId: string) => Promise<void>
  onAddShare: (share: ShareFormValues) => Promise<void>
  onUpdateShare: (
    shareId: string,
    share: {
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
  ) => Promise<void>
  onStartCrawl: (shareId: string) => Promise<boolean>
  onFetchShareDetails: (shareId: string) => Promise<ShareDetailsResponse>
  onRefresh: () => Promise<void>
  monitoringOverview: MonitoringOverviewResponse | null
  isAdmin: boolean
}

const DEFAULT_RULES_JSON = `{
  "max_file_size": 1000000000,
  "min_file_size": 0,
  "exclude_patterns": [],
  "include_patterns": [],
  "persist_file_content": true,
  "enable_copilot_upload": false
}`

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "active":
    case "ready":
      return <CheckCircle2 className="size-4 text-green-600" />
    case "error":
    case "failed":
      return <XCircle className="size-4 text-red-600" />
    case "crawling":
    case "processing":
      return <Loader2 className="size-4 text-blue-600 animate-spin" />
    case "pending":
    case "scheduled":
      return <Clock className="size-4 text-yellow-600" />
    case "warning":
      return <AlertCircle className="size-4 text-orange-600" />
    default:
      return null
  }
}

function getStatusBadge(status: string) {
  const statusLower = status.toLowerCase()

  const colors: Record<string, string> = {
    active: "text-green-600 border-green-200 dark:text-green-400 dark:border-green-800",
    ready: "text-green-600 border-green-200 dark:text-green-400 dark:border-green-800",
    error: "text-destructive border-destructive/50",
    failed: "text-destructive border-destructive/50",
    crawling: "text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800",
    processing: "text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800",
    pending: "text-yellow-600 border-yellow-200 dark:text-yellow-400 dark:border-yellow-800",
    scheduled: "text-yellow-600 border-yellow-200 dark:text-yellow-400 dark:border-yellow-800",
    warning: "text-orange-600 border-orange-200 dark:text-orange-400 dark:border-orange-800",
  }

  return (
    <Badge
      variant="outline"
      className={`gap-1 ${colors[statusLower] || ""}`}
    >
      {getStatusIcon(status)}
      {status}
    </Badge>
  )
}

export default function Shares({ shares, onDeleteShare, onAddShare, onUpdateShare, onStartCrawl, onFetchShareDetails, onRefresh, monitoringOverview, isAdmin }: SharesProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetMode, setSheetMode] = useState<'details' | 'edit' | 'create' | 'create-s3' | null>(null)

  const [sharePath, setSharePath] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [alertVariant, setAlertVariant] = useState<"success" | "error">("success")
  const [crawlSchedule, setCrawlSchedule] = useState("0 0 * * *")
  const [rulesJson, setRulesJson] = useState(DEFAULT_RULES_JSON)
  const [realm, setRealm] = useState("")
  const [useKerberos, setUseKerberos] = useState("required")
  const [workgroup, setWorkgroup] = useState("")
  const [resolveOrder, setResolveOrder] = useState("host")

  // S3 fields
  const [s3SharePath, setS3SharePath] = useState("")
  const [s3Bucket, setS3Bucket] = useState("")
  const [s3EndpointUrl, setS3EndpointUrl] = useState("")
  const [s3Region, setS3Region] = useState("us-east-1")
  const [s3UseSsl, setS3UseSsl] = useState(false)
  const [s3CrawlSchedule, setS3CrawlSchedule] = useState("-")
  const [s3Username, setS3Username] = useState("")
  const [s3Password, setS3Password] = useState("")

  const [editingShareId, setEditingShareId] = useState<string | null>(null)

  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [selectedShareDetails, setSelectedShareDetails] = useState<ShareDetailsResponse | null>(null)
  const [selectedProtocol, setSelectedProtocol] = useState<"smb" | "nfs" | "s3">("smb")

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const resetForm = useCallback(() => {
    setSharePath("")
    setUsername("")
    setPassword("")
    setCrawlSchedule("0 0 * * *")
    setRulesJson(DEFAULT_RULES_JSON)
    setRealm("")
    setUseKerberos("required")
    setWorkgroup("")
    setResolveOrder("host")

    setS3SharePath("")
    setS3Bucket("")
    setS3EndpointUrl("")
    setS3Region("us-east-1")
    setS3UseSsl(false)
    setS3CrawlSchedule("-")
    setS3Username("")
    setS3Password("")

    setEditingShareId(null)
    setError(null)
    setSelectedProtocol("smb")
  }, [])

  const parseRules = useCallback((jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString)
      return parsed
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON format in rules field: ${error.message}`)
      }
      throw new Error("Invalid JSON format in rules field")
    }
  }, [])

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setSubmitting(true)
      setError(null)

      try {
        if (sheetMode === "create-s3") {
          if (editingShareId != null) {
            await onUpdateShare(editingShareId, {
              protocol: "s3",
              share_path: s3SharePath,
              username: s3Username,
              password: s3Password,
              crawl_schedule: s3CrawlSchedule,
              s3_bucket: s3Bucket,
              s3_endpoint_url: s3EndpointUrl,
              s3_region: s3Region,
              s3_use_ssl: s3UseSsl,
            } as unknown as Parameters<SharesProps["onUpdateShare"]>[1])

            const details = await onFetchShareDetails(editingShareId)
            setSelectedShareDetails(details)
            setSheetMode("details")
          } else {
            await onAddShare({
              protocol: "s3",
              share_path: s3SharePath,
              username: s3Username,
              password: s3Password,
              crawl_schedule: s3CrawlSchedule,
              rules: {},
              realm: "",
              use_kerberos: "required",
              workgroup: "",
              resolve_order: "host",
              s3_bucket: s3Bucket,
              s3_endpoint_url: s3EndpointUrl,
              s3_region: s3Region,
              s3_use_ssl: s3UseSsl,
            } as unknown as ShareFormValues)

            setSheetOpen(false)
            resetForm()
          }
        } else {
          const parsedRules = parseRules(rulesJson)

          if (editingShareId != null) {
          await onUpdateShare(editingShareId, {
            share_path: sharePath,
            crawl_schedule: crawlSchedule,
            rules: parsedRules,
            realm,
            use_kerberos: useKerberos,
            workgroup,
            resolve_order: resolveOrder,
          })

            // Refresh details if we are in edit mode
            const details = await onFetchShareDetails(editingShareId)
            setSelectedShareDetails(details)
            setSheetMode('details') // Switch back to details view
          } else {
            await onAddShare({
              share_path: sharePath,
              username,
              password,
              crawl_schedule: crawlSchedule,
              rules: parsedRules,
              realm,
              use_kerberos: useKerberos,
              workgroup,
              resolve_order: resolveOrder,
            })
            setSheetOpen(false)
            resetForm()
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to create share.")
      } finally {
        setSubmitting(false)
      }
    },
    [onAddShare, onUpdateShare, password, resetForm, sharePath, username, crawlSchedule, rulesJson, realm, useKerberos, workgroup, resolveOrder, editingShareId, parseRules, onFetchShareDetails, sheetMode, s3SharePath, s3Bucket, s3EndpointUrl, s3Region, s3UseSsl, s3CrawlSchedule, s3Username, s3Password]
  )

  const handleCrawl = useCallback(
    async (shareId: string) => {
      const ok = await onStartCrawl(shareId)
      if (ok) {
        setAlertVariant("success")
        setAlertMessage("Crawl job started!")
        setSheetOpen(false)
      } else {
        setAlertVariant("error")
        setAlertMessage("Crawl job failed to start!")
      }
      return ok
    },
    [onStartCrawl]
  )

  useEffect(() => {
    if (shares === null) {
      onRefresh().catch((error) => {
        // Suppress alert for authentication errors
        if (error instanceof AuthenticationError) return

        setAlertVariant("error")
        setAlertMessage(error instanceof Error ? error.message : "Failed to refresh shares")
      })
    }
  }, [onRefresh, shares])

  useEffect(() => {
    if (!alertMessage) return

    const timer = window.setTimeout(() => {
      setAlertMessage(null)
    }, 5_000)

    return () => window.clearTimeout(timer)
  }, [alertMessage])

  const populateForm = useCallback((details: ShareDetailsResponse) => {
    setSharePath(details.share_path ?? "")
    setUsername(details.username ?? "")
    setPassword("")
    setCrawlSchedule(details.crawl_schedule ?? "0 0 * * *")

    // Convert rules object to formatted JSON string
    const rules = details.rules ?? {}
    try {
      setRulesJson(JSON.stringify(rules, null, 2))
    } catch {
      setRulesJson(DEFAULT_RULES_JSON)
    }

    setRealm(details.realm ?? "")
    setUseKerberos(details.use_kerberos ?? "required")
    setWorkgroup(details.workgroup ?? "")
    setResolveOrder(details.resolve_order ?? "host")

  }, [])

  const populateS3Form = useCallback((details: ShareDetailsResponse) => {
    setS3SharePath(details.share_path ?? "")
    setS3Bucket((details as ShareDetailsResponse & { s3_bucket?: string }).s3_bucket ?? "")
    setS3EndpointUrl((details as ShareDetailsResponse & { s3_endpoint_url?: string }).s3_endpoint_url ?? "")
    setS3Region((details as ShareDetailsResponse & { s3_region?: string }).s3_region ?? "us-east-1")
    setS3UseSsl((details as ShareDetailsResponse & { s3_use_ssl?: boolean }).s3_use_ssl ?? false)
    setS3CrawlSchedule(details.crawl_schedule ?? "-")
    setS3Username(details.username ?? "")
    setS3Password("")
  }, [])

  const handleShareClick = useCallback(async (shareId: string) => {
    const protocol = shares?.find((share) => share.id === shareId)?.protocol ?? "smb"
    setSelectedProtocol(protocol)
    setSheetMode('details')
    setSheetOpen(true)
    setDetailsLoading(true)
    setDetailsError(null)
    setSelectedShareDetails(null)
    setEditingShareId(shareId)

    try {
      const details = await onFetchShareDetails(shareId)
      setSelectedShareDetails(details)
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : "Unable to load share details.")
    } finally {
      setDetailsLoading(false)
    }
  }, [onFetchShareDetails, shares])

  const handleAddClick = useCallback(() => {
    setSheetMode('create')
    setEditingShareId(null)
    resetForm()
    setSheetOpen(true)
  }, [resetForm])

  const handleAddS3Click = useCallback(() => {
    setSheetMode('create-s3')
    setSelectedProtocol('s3')
    setEditingShareId(null)
    resetForm()
    setSheetOpen(true)
  }, [resetForm])

  const handleModifyClick = useCallback(() => {
    if (selectedShareDetails) {
      if (selectedProtocol === "s3") {
        populateS3Form(selectedShareDetails)
        setSheetMode('create-s3')
        return
      }
      populateForm(selectedShareDetails)
      setSheetMode('edit')
    }
  }, [selectedShareDetails, selectedProtocol, populateForm, populateS3Form])

  const handleDeleteClick = useCallback(() => {
    setDeleteConfirmOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (editingShareId) {
      await onDeleteShare(editingShareId)
      setDeleteConfirmOpen(false)
      setSheetOpen(false) // Close sheet after delete
    }
  }, [editingShareId, onDeleteShare])



  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="mb-4">
              <OverviewCard
                overview={monitoringOverview}
                title="Data Sources Overview"
                cacheStats={undefined}
                showCacheStats={false}
              />
            </div>
            <div className="mb-4 flex justify-end gap-2">
              <Button onClick={handleAddClick} disabled={!isAdmin}>
                Add CIFS
              </Button>
              <Button onClick={handleAddS3Click} disabled={!isAdmin}>
                Add S3
              </Button>
            </div>
            {alertMessage ? (
              <Alert
                variant={alertVariant === "success" ? "default" : "destructive"}
                className="mb-4"
              >
                {alertVariant === "success" ? <CheckCircle2Icon /> : <AlertCircleIcon />}
                <AlertTitle>{alertMessage}</AlertTitle>
                <AlertDescription />
              </Alert>
            ) : null}
            <SharesTable
              shares={shares}
              onShareClick={handleShareClick}
            />
          </div>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={(open) => {
        setSheetOpen(open)
        if (!open) {
          resetForm()
          setSubmitting(false)
          setSheetMode(null)
        }
      }}>
        <SheetContent className="w-[90vw] sm:w-[85vw] sm:max-w-[85vw] flex flex-col p-0 gap-0">
          <div className="flex-1 overflow-y-auto p-6 flex flex-col">
            <SheetHeader className="mb-4 p-0">
              <div className="flex items-center justify-between">
                <div>
                  <SheetTitle>
                    {sheetMode === 'create' ? "Add a share" : sheetMode === 'create-s3' ? (editingShareId ? "Edit S3 bucket" : "Add S3 bucket") : sheetMode === 'edit' ? "Edit share" : "Share Details"}
                  </SheetTitle>
                  <SheetDescription>
                    {sheetMode === 'details' && selectedShareDetails?.share_path}
                    {sheetMode === 'create' && "Configure a new SMB share"}
                    {sheetMode === 'create-s3' && (editingShareId ? "Edit S3 bucket configuration" : "Configure a new S3 bucket")}
                    {sheetMode === 'edit' && "Edit share configuration"}
                  </SheetDescription>
                </div>
                {sheetMode === 'details' && (
                  <div className="pr-10">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editingShareId && handleCrawl(editingShareId)}
                      >
                        <IconDatabaseExport className="mr-2 size-4" />
                        Crawl
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleModifyClick}
                        disabled={!isAdmin}
                      >
                        <IconEdit className="mr-2 size-4" />
                        Modify
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteClick}
                        disabled={!isAdmin}
                      >
                        <IconTrash className="mr-2 size-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </SheetHeader>

            <Separator className="mb-6" />

            {sheetMode === 'details' && (
              <>
                <div className="space-y-4">
                  {detailsLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Spinner className="size-6" />
                    </div>
                  ) : detailsError ? (
                    <p className="text-sm text-destructive">{detailsError}</p>
                  ) : selectedShareDetails ? (
                    selectedProtocol === "s3" ? (
                      <dl className="grid grid-cols-1 gap-y-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-6">
                        <div>
                          <dt className="font-medium text-foreground">Bucket path</dt>
                          <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{selectedShareDetails.share_path}</pre></dd>
                        </div>
                        <div>
                          <dt className="font-medium text-foreground">Bucket name</dt>
                          <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{(selectedShareDetails as ShareDetailsResponse & { s3_bucket?: string }).s3_bucket || "N/A"}</pre></dd>
                        </div>
                        <div>
                          <dt className="font-medium text-foreground">Status</dt>
                          <dd className="p-1 font-bold">{getStatusBadge(selectedShareDetails.status)}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-foreground">Endpoint URL</dt>
                          <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{(selectedShareDetails as ShareDetailsResponse & { s3_endpoint_url?: string }).s3_endpoint_url || "N/A"}</pre></dd>
                        </div>
                        <div>
                          <dt className="font-medium text-foreground">Region</dt>
                          <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{(selectedShareDetails as ShareDetailsResponse & { s3_region?: string }).s3_region || "N/A"}</pre></dd>
                        </div>
                        <div>
                          <dt className="font-medium text-foreground">Use SSL</dt>
                          <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{String((selectedShareDetails as ShareDetailsResponse & { s3_use_ssl?: boolean }).s3_use_ssl ?? false)}</pre></dd>
                        </div>
                        <div>
                          <dt className="font-medium text-foreground">Access key</dt>
                          <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{selectedShareDetails.username || "N/A"}</pre></dd>
                        </div>
                        <div>
                          <dt className="font-medium text-foreground">Crawl schedule</dt>
                          <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{selectedShareDetails.crawl_schedule || "N/A"}</pre></dd>
                        </div>
                        <div>
                          <dt className="font-medium text-foreground">Created</dt>
                          <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{new Date(selectedShareDetails.created_at).toLocaleString()}</pre></dd>
                        </div>
                        <div>
                          <dt className="font-medium text-foreground">Last crawled</dt>
                          <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{selectedShareDetails.last_crawled ? new Date(selectedShareDetails.last_crawled).toLocaleString() : "N/A"}</pre></dd>
                        </div>
                        <div>
                          <dt className="font-medium text-foreground">Last crawl duration (ms)</dt>
                          <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{selectedShareDetails.last_crawl_duration_ms || "N/A"}</pre></dd>
                        </div>
                        <div>
                          <dt className="font-medium text-foreground">Last crawl file count</dt>
                          <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{selectedShareDetails.last_crawl_file_count || "N/A"}</pre></dd>
                        </div>
                        <div className="sm:col-span-3">
                          <dt className="font-medium text-foreground">Last connection attempt</dt>
                          <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{selectedShareDetails.last_connection_attempt ? new Date(selectedShareDetails.last_connection_attempt).toLocaleString() : "N/A"}</pre></dd>
                        </div>
                        <div className="sm:col-span-3">
                          <dt className="font-medium text-foreground">Error message</dt>
                          <dd><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{selectedShareDetails.error_message || "N/A"}</pre></dd>
                        </div>
                      </dl>
                    ) : (
                      <dl className="grid grid-cols-1 gap-y-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-6">
                        <div>
                          <dt className="font-medium text-foreground">Share path</dt>
                          <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{selectedShareDetails.share_path}</pre></dd>
                        </div>
                        <div>
                          <dt className="font-medium text-foreground">Username</dt>
                          <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{selectedShareDetails.username}</pre></dd>
                        </div>
                        <div>
                          <dt className="font-medium text-foreground">Status</dt>
                          <dd className="p-1 font-bold">{getStatusBadge(selectedShareDetails.status)}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-foreground">Created</dt>
                          <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{new Date(selectedShareDetails.created_at).toLocaleString()}</pre></dd>
                        </div>
                        <div>
                          <dt className="font-medium text-foreground">Last crawled</dt>
                          <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">
                            {selectedShareDetails.last_crawled
                              ? new Date(selectedShareDetails.last_crawled).toLocaleString()
                              : "N/A"}
                          </pre></dd>
                        </div>
                        <div>
                          <dt className="font-medium text-foreground">Last crawl duration (ms)</dt>
                          <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{selectedShareDetails.last_crawl_duration_ms || "N/A"}</pre></dd>
                        </div>
                        <div>
                          <dt className="font-medium text-foreground">Last crawl file count</dt>
                          <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{selectedShareDetails.last_crawl_file_count || "N/A"}</pre></dd>
                        </div>
                        <div>
                          <dt className="font-medium text-foreground">Crawl schedule</dt>
                          <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{selectedShareDetails.crawl_schedule || "N/A"}</pre></dd>
                        </div>
                        <div>
                          <dt className="font-medium text-foreground">Last connection attempt</dt>
                          <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">
                            {selectedShareDetails.last_connection_attempt
                              ? new Date(selectedShareDetails.last_connection_attempt).toLocaleString()
                              : "N/A"}
                          </pre></dd>
                        </div>
                        <div>
                          <dt className="font-medium text-foreground">Kerberos</dt>
                          <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{selectedShareDetails.use_kerberos || "N/A"}</pre></dd>
                        </div>
                        <div>
                          <dt className="font-medium text-foreground">Workgroup</dt>
                          <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{selectedShareDetails.workgroup || "N/A"}</pre></dd>
                        </div>
                        <div>
                          <dt className="font-medium text-foreground">Realm</dt>
                          <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{selectedShareDetails.realm || "N/A"}</pre></dd>
                        </div>
                        <div className="sm:col-span-3">
                          <dt className="font-medium text-foreground">Resolve order</dt>
                          <dd className="p-1"><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{selectedShareDetails.resolve_order || "N/A"}</pre></dd>
                        </div>
                        <div className="sm:col-span-3">
                          <dt className="font-medium text-foreground">Rules</dt>
                          <dd><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{JSON.stringify(selectedShareDetails.rules || "N/A", null, 2)}</pre></dd>
                        </div>
                        <div className="sm:col-span-3">
                          <dt className="font-medium text-foreground">Error message</dt>
                          <dd><pre className="mt-1 max-h-80 overflow-auto rounded bg-muted p-2 text-xs">{selectedShareDetails.error_message || "N/A"}</pre></dd>
                        </div>
                      </dl>
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground">No details available.</p>
                  )}
                </div>
              </>
            )}

            {(sheetMode === 'create' || sheetMode === 'edit') && (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="share-path">Share Path*</Label>
                  <Input
                    id="share-path"
                    placeholder="\\mysmbserver\myshare"
                    value={sharePath}
                    onChange={(event) => setSharePath(event.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username*</Label>
                    <Input
                      id="username"
                      placeholder="user@domain"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      required={editingShareId === null}
                      disabled={editingShareId !== null}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password*</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required={editingShareId === null}
                      disabled={editingShareId !== null}
                      placeholder={editingShareId !== null ? "(Unchanged)" : undefined}
                    />
                  </div>
                </div>


                <>
                  <div className="space-y-2">
                    <Label htmlFor="crawl-schedule">Crawl schedule</Label>
                    <Input
                      id="crawl-schedule"
                      value={crawlSchedule}
                      onChange={(event) => setCrawlSchedule(event.target.value)}
                      placeholder="0 0 * * *"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rules">Rules (JSON format)*</Label>
                    <Textarea
                      id="rules"
                      value={rulesJson}
                      onChange={(event) => setRulesJson(event.target.value)}
                      placeholder={DEFAULT_RULES_JSON}
                      className="min-h-[200px] font-mono text-sm"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter rules configuration in JSON format. Use the placeholder as a template.
                      <br />
                      <strong>Note:</strong> Ensure no trailing commas after the last property.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="realm">Realm</Label>
                      <Input
                        id="realm"
                        value={realm}
                        onChange={(event) => setRealm(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workgroup">Workgroup</Label>
                      <Input
                        id="workgroup"
                        value={workgroup}
                        onChange={(event) => setWorkgroup(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="use-kerberos">Use Kerberos</Label>
                      <Input
                        id="use-kerberos"
                        value={useKerberos}
                        onChange={(event) => setUseKerberos(event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resolve-order">Resolve order</Label>
                    <Input
                      id="resolve-order"
                      value={resolveOrder}
                      onChange={(event) => setResolveOrder(event.target.value)}
                    />
                  </div>
                </>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                <SheetFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (sheetMode === 'edit') {
                        setSheetMode('details')
                      } else {
                        setSheetOpen(false)
                      }
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (editingShareId != null ? "Saving…" : "Creating…") : editingShareId != null ? "Save changes" : "Create share"}
                  </Button>
                </SheetFooter>
              </form>
            )}

            {sheetMode === 'create-s3' && (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="s3-share-path">Share Path (S3 URI)*</Label>
                  <Input
                    id="s3-share-path"
                    placeholder="s3://bucket-name"
                    value={s3SharePath}
                    onChange={(event) => setS3SharePath(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s3-bucket">Bucket Name*</Label>
                  <Input
                    id="s3-bucket"
                    placeholder="bucket-name"
                    value={s3Bucket}
                    onChange={(event) => setS3Bucket(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s3-endpoint">Endpoint URL*</Label>
                  <Input
                    id="s3-endpoint"
                    placeholder="http://minio.example.com:9000"
                    value={s3EndpointUrl}
                    onChange={(event) => setS3EndpointUrl(event.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="s3-region">Region*</Label>
                    <Input
                      id="s3-region"
                      placeholder="us-east-1"
                      value={s3Region}
                      onChange={(event) => setS3Region(event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="s3-use-ssl">Use SSL</Label>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        id="s3-use-ssl"
                        type="checkbox"
                        checked={s3UseSsl}
                        onChange={(event) => setS3UseSsl(event.target.checked)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="s3-use-ssl" className="font-normal">Enable SSL/TLS</Label>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s3-crawl-schedule">Crawl Schedule</Label>
                  <Input
                    id="s3-crawl-schedule"
                    value={s3CrawlSchedule}
                    onChange={(event) => setS3CrawlSchedule(event.target.value)}
                    placeholder="-"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="s3-username">Username*</Label>
                    <Input
                      id="s3-username"
                      placeholder="admin"
                      value={s3Username}
                      onChange={(event) => setS3Username(event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="s3-password">Password*</Label>
                    <Input
                      id="s3-password"
                      type="password"
                      value={s3Password}
                      onChange={(event) => setS3Password(event.target.value)}
                      required={editingShareId === null}
                      placeholder={editingShareId !== null ? "(Unchanged)" : "••••••••"}
                    />
                  </div>
                </div>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                <SheetFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (editingShareId != null) {
                        setSheetMode('details')
                      } else {
                        setSheetOpen(false)
                      }
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (editingShareId != null ? "Saving…" : "Creating…") : editingShareId != null ? "Save changes" : "Create S3 bucket"}
                  </Button>
                </SheetFooter>
              </form>
            )}
          </div>
          {sheetMode === 'details' && (
            <SheetFooter className="p-4 border-t gap-2 sm:gap-0">
              <SheetClose asChild>
                <Button variant="outline">Close</Button>
              </SheetClose>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Share"
        description="Are you sure you want to delete this share? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  )
}
