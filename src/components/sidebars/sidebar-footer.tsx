"use client"

import * as React from "react"
import { IconUser, IconUserShield } from "@tabler/icons-react"

import {
  Sidebar,
  SidebarFooter,
} from "@/components/ui/sidebar"

import { 
  NavUser 
} from "@/components/navs/users"

interface AppSidebarFooterProps extends React.ComponentProps<typeof Sidebar> {
  me?: {
    username: string
    is_admin: boolean
  } | null
  onLogout?: () => void
}

export function AppSidebarFooter({ me, onLogout, ...props }: AppSidebarFooterProps) {
  const userData = me ? {
    name: me.username,
    email: me.is_admin ? "Administrator" : "User",
    avatar: me.is_admin ? <IconUserShield className="h-8 w-8" /> : <IconUser className="h-8 w-8" />,
    onLogout,
  } : {
    name: "Guest",
    email: "Not connected",
    avatar: <IconUser className="h-8 w-8" />,
  }

  return (
    <SidebarFooter {...props}>
      <NavUser user={userData} />
    </SidebarFooter>
  )
}
