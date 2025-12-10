"use client"

import {
  useCallback,
  useState,
  useEffect
} from "react"

import {
  IconPlus
} from "@tabler/icons-react"

import {
  Alert,
  AlertDescription,
  AlertTitle
} from "@/components/ui/alert"

import {
  CheckCircle2Icon,
  AlertCircleIcon
} from "lucide-react"

import type {
  UserResponse,
  MeResponse,
  MonitoringOverviewResponse
} from "@/services/neo-api"
import { AuthenticationError } from "@/services/neo-api"
import { OverviewCard } from "@/components/cards/overview-card"

import {
  UsersTable
} from "@/components/data-tables/usersT"

import {
  Button
} from "@/components/ui/button"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  Input
} from "@/components/ui/input"

import {
  Label
} from "@/components/ui/label"

interface UsersProps {
  users: UserResponse[] | null
  me: MeResponse | null
  onAddUser: (user: {
    id: number
    username: string
    password: string
    email?: string
    is_active: boolean
    is_admin: boolean
  }) => Promise<void>
  onChangePassword: (payload: { current_password: string; new_password: string }) => Promise<void>
  onRefresh: () => Promise<void>
  monitoringOverview: MonitoringOverviewResponse | null
}

export default function Users({ users, me, onAddUser, onChangePassword, onRefresh, monitoringOverview }: UsersProps) {
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [alertVariant, setAlertVariant] = useState<"success" | "error">("success")
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newUsername, setNewUsername] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newIsActive, setNewIsActive] = useState(true)
  const [newIsAdmin, setNewIsAdmin] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [addSubmitting, setAddSubmitting] = useState(false)

  const openPasswordDialog = useCallback(() => {
    setPasswordDialogOpen(true)
    setPasswordError(null)
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }, [])

  const handlePasswordSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (newPassword !== confirmPassword) {
        setPasswordError("Passwords do not match.")
        return
      }

      setPasswordSubmitting(true)
      setPasswordError(null)

      try {
        await onChangePassword({
          current_password: currentPassword,
          new_password: newPassword,
        })
        setPasswordDialogOpen(false)
      } catch (err) {
        setPasswordError(err instanceof Error ? err.message : "Password update failed.")
      } finally {
        setPasswordSubmitting(false)
      }
    },
    [confirmPassword, currentPassword, newPassword, onChangePassword]
  )

  const resetAddForm = useCallback(() => {
    setNewUsername("")
    setNewUserPassword("")
    setNewEmail("")
    setNewIsActive(true)
    setNewIsAdmin(false)
    setAddError(null)
  }, [])

  const handleAddSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setAddSubmitting(true)
      setAddError(null)

      try {
        await onAddUser({
          id: 0,
          username: newUsername,
          password: newUserPassword,
          email: newEmail || "",
          is_active: newIsActive,
          is_admin: newIsAdmin,
        })
        setAddDialogOpen(false)
        resetAddForm()
      } catch (err) {
        setAddError(err instanceof Error ? err.message : "User creation failed.")
      } finally {
        setAddSubmitting(false)
      }
    },
    [newEmail, newIsActive, newIsAdmin, newUserPassword, newUsername, onAddUser, resetAddForm]
  )


  useEffect(() => {
    if (users === null) {
      onRefresh().catch((error) => {
        // Suppress alert for authentication errors
        if (error instanceof AuthenticationError) return

        setAlertVariant("error")
        setAlertMessage(error instanceof Error ? error.message : "Failed to refresh users")
      })
    }
  }, [onRefresh, users])

  useEffect(() => {
    if (!alertMessage) return

    const timer = window.setTimeout(() => {
      setAlertMessage(null)
    }, 5_000)

    return () => window.clearTimeout(timer)
  }, [alertMessage])
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="mb-4">
              <OverviewCard
                overview={monitoringOverview}
                title="Users Overview"
                description="Overview of system users and their roles."
                showCacheStats={false}
              />
            </div>
            <div className="mb-4 flex justify-end items-center">
              <Button onClick={() => setAddDialogOpen(true)} disabled={!me?.is_admin}>
                <IconPlus className="mr-2 size-4" />
                Add user
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
            <UsersTable users={users} me={me} onRequestPasswordChange={openPasswordDialog} />
          </div>
        </div>
      </div>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update password</DialogTitle>
            <DialogDescription>Provide your current password and choose a new one.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handlePasswordSubmit}>
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
            {passwordError ? <p className="text-sm text-destructive">{passwordError}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(false)} disabled={passwordSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={passwordSubmitting}>
                {passwordSubmitting ? "Updating…" : "Update password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open)
          if (!open) {
            resetAddForm()
            setAddSubmitting(false)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a user</DialogTitle>
            <DialogDescription>Create a new user account for NetApp Neo.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleAddSubmit}>
            <div className="space-y-2">
              <Label htmlFor="new-username">Username</Label>
              <Input
                id="new-username"
                value={newUsername}
                onChange={(event) => setNewUsername(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-password">Password</Label>
              <Input
                id="new-user-password"
                type="password"
                value={newUserPassword}
                onChange={(event) => setNewUserPassword(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">E-mail (optional)</Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  id="new-active"
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={newIsActive}
                  onChange={(event) => setNewIsActive(event.target.checked)}
                />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  id="new-admin"
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={newIsAdmin}
                  onChange={(event) => setNewIsAdmin(event.target.checked)}
                />
                Admin
              </label>
            </div>
            {addError ? <p className="text-sm text-destructive">{addError}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)} disabled={addSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={addSubmitting}>
                {addSubmitting ? "Creating…" : "Create user"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
