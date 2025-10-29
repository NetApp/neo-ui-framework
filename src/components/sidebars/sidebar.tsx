"use client"

import {
  Sidebar,
} from "../ui/sidebar"

// internal components
import { AppSidebarHeader } from "../sidebars/sidebarheader"
import { AppSidebarContent } from "../sidebars/sidebar-content"
// working on user integration with oauth2
// import { AppSidebarFooter } from "../sidebar/sidebarfooter"


export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <AppSidebarHeader />
      <AppSidebarContent />
      {/* <AppSidebarFooter /> */}
    </Sidebar>
  )
}
