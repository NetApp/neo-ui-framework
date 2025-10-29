import { useCallback, useState } from "react"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import { Input } from "../ui/input"
import { Label } from "../ui/label"

interface ConnectDialogProps {
  onConnect: (credentials: ConnectionCredentials) => Promise<void>
  isConnected: boolean
  children?: React.ReactNode
}

export interface ConnectionCredentials {
  username: string
  password: string
}

export function ConnectDialog({ onConnect, isConnected, children }: ConnectDialogProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      setLoading(true)
      setError(null)

      try {
        await onConnect({ username, password })
        setDialogOpen(false)
        // Clear password for security
        setPassword("")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Connection failed")
      } finally {
        setLoading(false)
      }
    },
    [username, password, onConnect]
  )

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="outline">
            {isConnected ? "Reconnect" : "Connect"}
          </Button>
        )}
      </DialogTrigger>
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