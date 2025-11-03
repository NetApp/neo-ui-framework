"use client"

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

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <AppSidebarHeader />
      <AppSidebarContent />
      <AppSidebarFooter />
    </Sidebar>
  )
}
