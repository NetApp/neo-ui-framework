"use client"

import type { ReactNode } from "react"
import { IconLogout } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

export interface NavUser {
  name: string
  email: string
  avatar: string | ReactNode
  onLogout?: () => void
}

export function NavUser({ user }: { user: NavUser }) {
  return (
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
      {user.onLogout && (
        <Button
          variant="ghost"
          size="sm"
          onClick={user.onLogout}
          title="Logout"
          className="h-8 w-8 p-0"
        >
          <IconLogout className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
