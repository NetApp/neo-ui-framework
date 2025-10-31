"use client"

import { useCallback, useState } from "react"
import type { MeResponse, UserResponse } from "../services/neo-api"
import { UsersTable } from "../data-tables/users"
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

interface UsersProps {
  users: UserResponse[] | null
  me: MeResponse | null
  onChangePassword: (payload: { current_password: string; new_password: string }) => Promise<void>
}

export default function Users({ users, me, onChangePassword }: UsersProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const openDialog = useCallback(() => {
    setDialogOpen(true)
    setError(null)
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }, [])

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (newPassword !== confirmPassword) {
        setError("Passwords do not match.")
        return
      }

      setSubmitting(true)
      setError(null)

      try {
        await onChangePassword({
          current_password: currentPassword,
          new_password: newPassword,
        })
        setDialogOpen(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Password update failed.")
      } finally {
        setSubmitting(false)
      }
    },
    [confirmPassword, currentPassword, newPassword, onChangePassword]
  )

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <UsersTable users={users} me={me} onRequestPasswordChange={openDialog} />
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update password</DialogTitle>
            <DialogDescription>
              Provide your current password and choose a new one.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Updating…" : "Update password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
