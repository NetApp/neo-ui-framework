"use client"

import {
  IconFileText,
  IconHelp,
  IconUsers,
  IconListCheck,
  IconActivity,
  IconSettings,
  IconFileSearch,
  IconFolders,
  IconFolderCode,
  // IconArrowsJoin,
  IconFolderShare,
  IconFiles,
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
    // {
    //   name: "Connector",
    //   url: "#/connector",
    //   icon: IconArrowsJoin,
    // },
    {
      name: "Monitoring",
      url: "#/monitoring",
      icon: IconActivity,
    },
    {
      name: "Tasks",
      url: "#/tasks",
      icon: IconListCheck,
    },
  ],
  navDataEstate: [
    {
      name: "Sources",
      url: "#/shares",
      icon: IconFolderShare,
    },
    {
      name: "Data Corpus",
      url: "#/my-datasets/data-corpus",
      icon: IconFiles,
    },
  ],
  navDiscovery: [
    {
      name: "Content Search",
      url: "#/my-datasets/content-search",
      icon: IconFileSearch,
    },
  ],
  navDatasets: [
    {
      name: "My Datasets",
      url: "#/my-datasets/my-datasets",
      icon: IconFolders,
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
    icon: IconFolderCode,
  }))

  const navDatasets = [
    ...data.navDatasets,
    ...datasetItems
  ]

  return (
    <SidebarContent {...props}>
      <NavMain items={data.navMain} />
      <NavMain items={data.navDataEstate} label="Data Estate" />
      <NavMain items={data.navDiscovery} label="Discovery" />
      <NavMain items={navDatasets} label="Datasets" />
      <NavMain items={data.navSecondary} className="mt-auto" />
    </SidebarContent>
  )
}
