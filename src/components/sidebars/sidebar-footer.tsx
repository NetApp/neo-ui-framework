"use client"

import * as React from "react"
import { IconUser, IconUserShield } from "@tabler/icons-react"

import {
  Sidebar,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"

import { 
  NavUser 
} from "@/components/navs/users"

import type { ConnectionCredentials } from "@/services/models"

interface AppSidebarFooterProps extends React.ComponentProps<typeof Sidebar> {
  me?: {
    username: string
    is_admin: boolean
  } | null
  isConnected?: boolean
  onConnect?: (credentials: ConnectionCredentials) => Promise<void>
  onLogout?: () => void
}

export function AppSidebarFooter({ me, isConnected = false, onConnect, onLogout, ...props }: AppSidebarFooterProps) {
  const userData = me && isConnected ? {
    name: me.username,
    email: me.is_admin ? "Administrator" : "User",
    avatar: me.is_admin ? <IconUserShield /> : <IconUser />,
    onLogout,
  } : {
    name: "Guest",
    email: "Not connected",
    avatar: <IconUser />,
  }

  const { state } = useSidebar()
  const collapsed = state === "collapsed"

  return (
    <SidebarFooter {...props}>
      <NavUser
        user={userData}
        isConnected={isConnected}
        onConnect={onConnect}
        collapsed={collapsed}
      />
    </SidebarFooter>
  )
}
