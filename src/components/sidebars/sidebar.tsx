"use client"

import {
  Sidebar,
} from "@/components/ui/sidebar"

// internal components
import { AppSidebarHeader } from "@/components/sidebars/sidebarheader"
import { AppSidebarContent } from "@/components/sidebars/sidebar-content"
// working on user integration with oauth2
// import { AppSidebarFooter } from "@/components/sidebar/sidebarfooter"


export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <AppSidebarHeader />
      <AppSidebarContent />
      {/* <AppSidebarFooter /> */}
    </Sidebar>
  )
}
