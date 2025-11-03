"use client"

import {
  IconChartBar,
  IconDashboard,
  IconFileText,
  IconFolder,
  IconHelp,
  IconListDetails,
  IconUsers,
} from "@tabler/icons-react"

import {
  SidebarContent,
} from "@/components/ui/sidebar"

// internal components
import { 
  NavMain 
} from "@/components/navs/main"

const data = {
  navMain: [
    {
      name: "Dashboard",
      url: "#/dashboard",
      icon: IconDashboard,
    },
    {
      name: "Shares",
      url: "#/shares",
      icon: IconListDetails,
    },
    {
      name: "Files",
      url: "#/files",
      icon: IconChartBar,
    },
    {
      name: "Operations",
      url: "#/operations",
      icon: IconFolder,
    },
  ],
  navSecondary: [
    {
      name: "Users",
      url: "#/users",
      icon: IconUsers,
    },
    {
      name: "Logs",
      url: "#/logs",
      icon: IconFileText,
    },
    {
      name: "Help",
      url: "#/help",
      icon: IconHelp,
    },
  ],
}

export function AppSidebarContent({...props}: React.ComponentProps<typeof SidebarContent>) {
  return (
      <SidebarContent {...props}>
        <NavMain items={data.navMain} />
        <NavMain items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
  )
}
