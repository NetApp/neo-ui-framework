"use client"

import type { MeResponse } from "@/services/neo-api"
import type { ConnectionCredentials } from "@/services/models"
import {
  Sidebar,
} from "@/components/ui/sidebar"

import {
  AppSidebarHeader
} from "@/components/sidebars/sidebarheader"

import {
  AppSidebarContent
} from "@/components/sidebars/sidebar-content"

import {
  AppSidebarFooter
} from "@/components/sidebars/sidebar-footer"

import type { Dataset } from "@/services/models"

interface AppSidebarProps {
  me?: MeResponse | null
  isConnected?: boolean
  onConnect?: (credentials: ConnectionCredentials) => Promise<void>
  onLogout?: () => void
  datasets?: Dataset[]
}

export function AppSidebar({ me, isConnected = false, onConnect, onLogout, datasets }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <AppSidebarHeader />
      <AppSidebarContent datasets={datasets} />
      <AppSidebarFooter
        me={me}
        isConnected={isConnected}
        onConnect={onConnect}
        onLogout={onLogout}
      />
    </Sidebar>
  )
}
