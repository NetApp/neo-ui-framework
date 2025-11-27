"use client"

import {
  IconChartBar,
  IconServer,
  IconFileText,
  IconHelp,
  IconListDetails,
  IconUsers,
  IconListCheck,
  IconActivity,
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
      name: "Connector",
      url: "#/connector",
      icon: IconServer,
    },
    {
      name: "Monitoring",
      url: "#/monitoring",
      icon: IconActivity,
    },
    {
      name: "Shares",
      url: "#/shares",
      icon: IconListDetails,
    },
    {
      name: "Tasks",
      url: "#/tasks",
      icon: IconListCheck,
    },
    {
      name: "Files",
      url: "#/files",
      icon: IconChartBar,
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

export function AppSidebarContent({ ...props }: React.ComponentProps<typeof SidebarContent>) {
  return (
    <SidebarContent {...props}>
      <NavMain items={data.navMain} />
      <NavMain items={data.navSecondary} className="mt-auto" />
    </SidebarContent>
  )
}
