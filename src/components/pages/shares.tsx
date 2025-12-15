// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import {
  useCallback,
  useEffect,
  useState
} from "react"

import {
  IconPlus,
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

import {
  Switch
} from "@/components/ui/switch"

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
      share_path: string
      username: string
      password: string
      crawl_schedule: string
      rules: Record<string, unknown>
      realm: string
      use_kerberos: string
      workgroup: string
      resolve_order: string
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
  "enable_copilot_upload": true
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
  const [sheetMode, setSheetMode] = useState<'details' | 'edit' | 'create' | null>(null)

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
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [editingShareId, setEditingShareId] = useState<string | null>(null)

  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [selectedShareDetails, setSelectedShareDetails] = useState<ShareDetailsResponse | null>(null)

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
    setShowAdvanced(false)
    setEditingShareId(null)
    setError(null)
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
        const parsedRules = parseRules(rulesJson)

        if (editingShareId != null) {
          await onUpdateShare(editingShareId, {
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
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to create share.")
      } finally {
        setSubmitting(false)
      }
    },
    [onAddShare, onUpdateShare, password, resetForm, sharePath, username, crawlSchedule, rulesJson, realm, useKerberos, workgroup, resolveOrder, editingShareId, parseRules, onFetchShareDetails]
  )

  const handleCrawl = useCallback(
    async (shareId: string) => {
      const ok = await onStartCrawl(shareId)
      if (ok) {
        setAlertVariant("success")
        setAlertMessage("Crawl job started!")
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
    } catch (error) {
      setRulesJson(DEFAULT_RULES_JSON)
    }

    setRealm(details.realm ?? "")
    setUseKerberos(details.use_kerberos ?? "required")
    setWorkgroup(details.workgroup ?? "")
    setResolveOrder(details.resolve_order ?? "host")
    setShowAdvanced(true)
  }, [])

  const handleShareClick = useCallback(async (shareId: string) => {
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
  }, [onFetchShareDetails])

  const handleAddClick = useCallback(() => {
    setSheetMode('create')
    setEditingShareId(null)
    resetForm()
    setSheetOpen(true)
  }, [resetForm])

  const handleModifyClick = useCallback(() => {
    if (selectedShareDetails) {
      populateForm(selectedShareDetails)
      setSheetMode('edit')
    }
  }, [selectedShareDetails, populateForm])

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

  const handleEditShare = useCallback(async (shareId: string) => {
    // This is called from the dropdown menu, so we go directly to edit mode
    // But we need to fetch details first to populate the form
    setEditingShareId(shareId)
    setSheetMode('edit')
    setSheetOpen(true)
    setDetailsLoading(true)

    try {
      const details = await onFetchShareDetails(shareId)
      populateForm(details)
    } catch (err) {
      setAlertVariant("error")
      setAlertMessage(err instanceof Error ? err.message : "Unable to load share details.")
    } finally {
      setDetailsLoading(false)
    }
  }, [onFetchShareDetails, populateForm])

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
            <div className="mb-4 flex justify-end">
              <Button onClick={handleAddClick} disabled={!isAdmin}>
                <IconPlus className="mr-2 size-4" />
                Add share
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
              onDeleteShare={onDeleteShare}
              onStartCrawl={handleCrawl}
              onShareClick={handleShareClick}
              onEditShare={handleEditShare}
              isAdmin={isAdmin}
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
                    {sheetMode === 'create' ? "Add a share" : sheetMode === 'edit' ? "Edit share" : "Share Details"}
                  </SheetTitle>
                  <SheetDescription>
                    {sheetMode === 'details' && selectedShareDetails?.share_path}
                    {sheetMode === 'create' && "Configure a new SMB share"}
                    {sheetMode === 'edit' && "Edit share configuration"}
                  </SheetDescription>
                </div>
                {sheetMode === 'details' && (
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
                )}
              </div>
            </SheetHeader>

            <Separator className="mb-6" />

            {sheetMode === 'details' && (
              <div className="space-y-4">
                {detailsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Spinner className="size-6" />
                  </div>
                ) : detailsError ? (
                  <p className="text-sm text-destructive">{detailsError}</p>
                ) : selectedShareDetails ? (
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
                ) : (
                  <p className="text-sm text-muted-foreground">No details available.</p>
                )}
              </div>
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
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password*</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <span className="text-sm text-muted-foreground">Basic</span>
                  <Switch checked={showAdvanced} onCheckedChange={setShowAdvanced} />
                  <span className="text-sm text-muted-foreground">Advanced</span>
                </div>
                {showAdvanced && (
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
                )}
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
          </div>
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
