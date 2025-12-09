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
  IconSettings,
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
  navDatasets: [
    {
      name: "My Datasets",
      url: "#/my-datasets/my-datasets",
      icon: IconFileText,
    },
    {
      name: "Content Search",
      url: "#/my-datasets/content-search",
      icon: IconFileText,
    },
  ],
  navSecondary: [
    {
      name: "Users",
      url: "#/users",
      icon: IconUsers,
    },
    {
      name: "Settings",
      url: "#/settings",
      icon: IconSettings,
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

import type { Dataset } from "@/services/models"

interface AppSidebarContentProps extends React.ComponentProps<typeof SidebarContent> {
  datasets?: Dataset[]
}

export function AppSidebarContent({ datasets = [], ...props }: AppSidebarContentProps) {
  const datasetItems = datasets.map((dataset) => ({
    name: dataset.name,
    url: `#/my-datasets/${dataset.id}`,
    icon: IconFileText,
  }))

  const navDatasets = [
    ...data.navDatasets,
    ...datasetItems
  ]

  return (
    <SidebarContent {...props}>
      <NavMain items={data.navMain} />
      <NavMain items={navDatasets} label="My Datasets" />
      <NavMain items={data.navSecondary} className="mt-auto" />
    </SidebarContent>
  )
}
