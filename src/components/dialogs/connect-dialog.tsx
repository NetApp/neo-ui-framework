import {
  cloneElement,
  useCallback,
  useState,
} from "react"
import type { 
  MouseEvent, 
  ReactElement 
} from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { type ConnectionCredentials } from "@/services/models"

type TriggerElementProps = {
  onClick?: (event: MouseEvent<HTMLElement>) => void
  disabled?: boolean
  "aria-busy"?: boolean
  [key: string]: unknown
}

interface ConnectDialogProps {
  onConnect: (credentials: ConnectionCredentials) => Promise<void>
  onRefresh?: () => Promise<void>
  isConnected: boolean
  children?: ReactElement<TriggerElementProps>
}

// export interface ConnectionCredentials {
//   endpoint?: string
//   username: string
//   password: string
// }

export function ConnectDialog({ onConnect, onRefresh, isConnected, children }: ConnectDialogProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const handleTriggerClick = useCallback(
    async (event: MouseEvent<HTMLElement>) => {
      if (!isConnected || !onRefresh) {
        return
      }

      event.preventDefault()
      setError(null)
      setRefreshing(true)

      try {
        await onRefresh()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to refresh data."
        setError(message)
        setDialogOpen(true)
      } finally {
        setRefreshing(false)
      }
    },
    [isConnected, onRefresh]
  )

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      setLoading(true)
      setError(null)

      try {
        await onConnect({ username, password })
        setDialogOpen(false)
        setPassword("")
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Connection failed")
      } finally {
        setLoading(false)
      }
    },
    [username, password, onConnect]
  )

  const triggerChild = (() => {
    if (children) {
      return cloneElement(children, {
        onClick: async (event: MouseEvent<HTMLElement>) => {
          await handleTriggerClick(event)
          children.props.onClick?.(event)
        },
        disabled: refreshing || loading || Boolean(children.props.disabled),
        "aria-busy": refreshing || Boolean(children.props["aria-busy"]),
      })
    }

    return (
      <Button
        variant="outline"
        onClick={handleTriggerClick}
        disabled={refreshing || loading}
        aria-busy={refreshing}
      >
        {isConnected ? "Refresh" : "Connect"}
      </Button>
    )
  })()

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) {
          setError(null)
          setLoading(false)
        }
      }}
    >
      <DialogTrigger asChild>{triggerChild}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect to Neo</DialogTitle>
          <DialogDescription>
            Provide the NetApp Neo API host and credentials
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              autoComplete="username"
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
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Connecting…" : "Connect"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}