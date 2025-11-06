"use client"

import type { ReactNode } from "react"
import { IconLogout, IconLogin } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { ConnectDialog } from "@/components/dialogs/connect-dialog"
import type { ConnectionCredentials } from "@/services/models"

export interface NavUser {
  name: string
  email: string
  avatar: string | ReactNode
  onLogout?: () => void
}

interface NavUserProps {
  user: NavUser
  isConnected?: boolean
  onConnect?: (credentials: ConnectionCredentials) => Promise<void>
}

export function NavUser({ user, isConnected = false, onConnect }: NavUserProps) {
  // Check if user is a guest (not connected)
  const isGuest = !isConnected || user.name === "Guest"

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
            {typeof user.avatar === "string" ? (
              <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full" />
            ) : (
              user.avatar
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
        
        {/* Show Connect button for guests, Logout button for connected users */}
        {isGuest && onConnect ? (
          <ConnectDialog 
            onConnect={onConnect}
            isConnected={isConnected}
          >
            <Button
              variant="outline"
              title="Connect"
            >
              <IconLogin />
            </Button>
          </ConnectDialog>
        ) : user.onLogout ? (
          <Button
            variant="outline"
            onClick={user.onLogout}
            title="Logout"
          >
            <IconLogout />
          </Button>
        ) : null}
      </div>
    </>
  )
}
