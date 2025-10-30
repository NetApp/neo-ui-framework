"use client"

import { useCallback, useEffect, useState } from "react"
import { IconPlus } from "@tabler/icons-react"
import { CheckCircle2Icon, AlertCircleIcon } from "lucide-react"
import type { SharesResponse } from "../services/neo-api"
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

interface SharesProps {
  shares: SharesResponse[] | null
  onDeleteShare: (shareId: number) => Promise<void>
  onAddShare: (share: { share_path: string; username: string; password: string }) => Promise<void>
  onStartCrawl: (shareId: number) => Promise<boolean>
}

export default function Shares({ shares, onDeleteShare, onAddShare, onStartCrawl }: SharesProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sharePath, setSharePath] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [alertVariant, setAlertVariant] = useState<"success" | "error">("success")

  const resetForm = useCallback(() => {
    setSharePath("")
    setUsername("")
    setPassword("")
    setError(null)
  }, [])

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setSubmitting(true)
      setError(null)

      try {
        await onAddShare({
          share_path: sharePath,
          username,
          password,
        })
        setDialogOpen(false)
        resetForm()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to create share.")
      } finally {
        setSubmitting(false)
      }
    },
    [onAddShare, password, resetForm, sharePath, username]
  )

  const handleCrawl = useCallback(
    async (shareId: number) => {
      const ok = await onStartCrawl(shareId)
      if (ok) {
        setAlertVariant("success")
        setAlertMessage("Crawl job started!")
      } else {
        setAlertVariant("error")
        setAlertMessage("Crawl job failed to start!")
      }
    },
    [onStartCrawl]
  )

  useEffect(() => {
    if (!alertMessage) return

    const timer = window.setTimeout(() => {
      setAlertMessage(null)
    }, 10_000)

    return () => window.clearTimeout(timer)
  }, [alertMessage])

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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a share</DialogTitle>
            <DialogDescription>
              Provide the SMB share path and credentials. The share will be scheduled for indexing.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="share-path">Share path</Label>
              <Input
                id="share-path"
                placeholder="\\mysmbserver\myshare"
                value={sharePath}
                onChange={(event) => setSharePath(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="domain\user"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
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
                {submitting ? "Creating…" : "Create share"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
