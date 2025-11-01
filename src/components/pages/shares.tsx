"use client"

import { useCallback, useEffect, useState } from "react"
import { IconPlus } from "@tabler/icons-react"
import { CheckCircle2Icon, AlertCircleIcon } from "lucide-react"
import type { ShareDetailsResponse, SharesResponse } from "../services/neo-api"
import { SharesTable } from "../data-tables/shares"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"
import { Switch } from "../ui/switch"

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
}

export default function Shares({ shares, onDeleteShare, onAddShare, onUpdateShare, onStartCrawl, onFetchShareDetails }: SharesProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sharePath, setSharePath] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [alertVariant, setAlertVariant] = useState<"success" | "error">("success")
  const [crawlSchedule, setCrawlSchedule] = useState("0 0 * * *")
  const [excludePatterns, setExcludePatterns] = useState("")
  const [includePatterns, setIncludePatterns] = useState("")
  const [maxFileSize, setMaxFileSize] = useState("1000000000")
  const [minFileSize, setMinFileSize] = useState("0")
  const [persistFileContent, setPersistFileContent] = useState(true)
  const [realm, setRealm] = useState("")
  const [useKerberos, setUseKerberos] = useState("required")
  const [workgroup, setWorkgroup] = useState("")
  const [resolveOrder, setResolveOrder] = useState("host")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [editingShareId, setEditingShareId] = useState<string | null>(null)

  const resetForm = useCallback(() => {
    setSharePath("")
    setUsername("")
    setPassword("")
    setCrawlSchedule("0 0 * * *")
    setExcludePatterns("")
    setIncludePatterns("")
    setMaxFileSize("1000000000")
    setMinFileSize("0")
    setPersistFileContent(true)
    setRealm("")
    setUseKerberos("required")
    setWorkgroup("")
    setResolveOrder("host")
    setShowAdvanced(false)
    setEditingShareId(null)
    setError(null)
  }, [])

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setSubmitting(true)
      setError(null)

      try {
        if (editingShareId != null) {
          await onUpdateShare(editingShareId, {
            share_path: sharePath,
            username,
            password,
            crawl_schedule: crawlSchedule,
            rules: {
              exclude_patterns: excludePatterns
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
              include_patterns: includePatterns
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
              max_file_size: Number.parseInt(maxFileSize, 10) || 0,
              min_file_size: Number.parseInt(minFileSize, 10) || 0,
              persist_file_content: persistFileContent,
            },
            realm,
            use_kerberos: useKerberos,
            workgroup,
            resolve_order: resolveOrder,
          })
        } else {
          await onAddShare({
            share_path: sharePath,
            username,
            password,
            crawl_schedule: crawlSchedule,
            rules: {
              exclude_patterns: excludePatterns
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
              include_patterns: includePatterns
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
              max_file_size: Number.parseInt(maxFileSize, 10) || 0,
              min_file_size: Number.parseInt(minFileSize, 10) || 0,
              persist_file_content: persistFileContent,
            },
            realm,
            use_kerberos: useKerberos,
            workgroup,
            resolve_order: resolveOrder,
          })
        }
        setDialogOpen(false)
        resetForm()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to create share.")
      } finally {
        setSubmitting(false)
      }
    },
    [onAddShare, onUpdateShare, password, resetForm, sharePath, username, crawlSchedule, excludePatterns, includePatterns, maxFileSize, minFileSize, persistFileContent, realm, useKerberos, workgroup, resolveOrder, editingShareId]
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
    const rules = (details.rules ?? {}) as Record<string, unknown>
    setExcludePatterns(Array.isArray(rules.exclude_patterns) ? rules.exclude_patterns.join(", ") : "")
    setIncludePatterns(Array.isArray(rules.include_patterns) ? rules.include_patterns.join(", ") : "")
    setMaxFileSize(
      typeof rules.max_file_size === "number" ? String(rules.max_file_size) : "1000000000"
    )
    setMinFileSize(
      typeof rules.min_file_size === "number" ? String(rules.min_file_size) : "0"
    )
    setPersistFileContent(
      typeof rules.persist_file_content === "boolean" ? rules.persist_file_content : true
    )
    setRealm(details.realm ?? "")
    setUseKerberos(details.use_kerberos ?? "required")
    setWorkgroup(details.workgroup ?? "")
    setResolveOrder(details.resolve_order ?? "host")
    setShowAdvanced(true)
  }, [])

  const handleEditShare = useCallback(
    async (shareId: string) => {
      try {
        const details = await onFetchShareDetails(shareId)
        populateForm(details)
        setEditingShareId(shareId)
        setDialogOpen(true)
      } catch (err) {
        setAlertVariant("error")
        setAlertMessage(err instanceof Error ? err.message : "Unable to load share details.")
      }
    },
    [onFetchShareDetails, populateForm]
  )

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="mb-4 flex justify-end">
              <Button onClick={() => setDialogOpen(true)}>
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
              onFetchShareDetails={onFetchShareDetails}
              onEditShare={handleEditShare}
            />
          </div>
        </div>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            resetForm()
            setSubmitting(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-[90vw] lg:max-w-[vw] overflow-x-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">{editingShareId != null ? "Edit share" : "Add a share"}</DialogTitle>
            <DialogDescription className="text-center mb-4">
              Configure a SMB share path
            </DialogDescription>
          </DialogHeader>
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
                  placeholder="domain\user"
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exclude-patterns">Exclude patterns (comma separated)</Label>
                  <Input
                    id="exclude-patterns"
                    value={excludePatterns}
                    onChange={(event) => setExcludePatterns(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="include-patterns">Include patterns (comma separated)</Label>
                  <Input
                    id="include-patterns"
                    value={includePatterns}
                    onChange={(event) => setIncludePatterns(event.target.value)}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="max-file-size">Max file size (bytes)</Label>
                    <Input
                      id="max-file-size"
                      type="number"
                      min={0}
                      value={maxFileSize}
                      onChange={(event) => setMaxFileSize(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min-file-size">Min file size (bytes)</Label>
                    <Input
                      id="min-file-size"
                      type="number"
                      min={0}
                      value={minFileSize}
                      onChange={(event) => setMinFileSize(event.target.value)}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={persistFileContent}
                    onChange={(event) => setPersistFileContent(event.target.checked)}
                  />
                  Persist file content
                </label>
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
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (editingShareId != null ? "Saving…" : "Creating…") : editingShareId != null ? "Save changes" : "Create share"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
