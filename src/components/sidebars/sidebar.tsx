"use client"

import type { MeResponse } from "@/services/neo-api"
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
  onLogout?: () => void
}

export function AppSidebar({ me, onLogout }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <AppSidebarHeader />
      <AppSidebarContent />
      <AppSidebarFooter me={me} onLogout={onLogout} />
    </Sidebar>
  )
}
