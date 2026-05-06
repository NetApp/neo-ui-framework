// Copyright 2025 NetApp, Inc. All Rights Reserved.
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

interface AppSidebarProps {
  me?: MeResponse | null
  isConnected?: boolean
  onConnect?: (credentials: ConnectionCredentials) => Promise<void>
  onLogout?: () => void
}

export function AppSidebar({ me, isConnected = false, onConnect, onLogout }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <AppSidebarHeader />
      <AppSidebarContent />
      <AppSidebarFooter
        me={me}
        isConnected={isConnected}
        onConnect={onConnect}
        onLogout={onLogout}
      />
    </Sidebar>
  )
}
