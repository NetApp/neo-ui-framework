// Copyright 2025 NetApp, Inc. All Rights Reserved.
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
      nameKey: "monitoring",
      url: "#/monitoring",
      icon: IconActivity,
    },
    {
      nameKey: "tasks",
      url: "#/tasks",
      icon: IconListCheck,
    },
  ],
  navDataEstate: [
    {
      nameKey: "sources",
      url: "#/shares",
      icon: IconFolderShare,
    },
    {
      nameKey: "dataCorpus",
      url: "#/my-datasets/data-corpus",
      icon: IconFiles,
    },
  ],
  navDiscovery: [
    {
      nameKey: "contentSearch",
      url: "#/my-datasets/content-search",
      icon: IconFileSearch,
    },
  ],
  navDatasets: [
    {
      nameKey: "myDatasets",
      url: "#/my-datasets/my-datasets",
      icon: IconFolders,
    },
  ],
  navSecondary: [
    {
      nameKey: "users",
      url: "#/users",
      icon: IconUsers,
    },
    {
      nameKey: "settings",
      url: "#/settings",
      icon: IconSettings,
    },
    {
      nameKey: "logs",
      url: "#/logs",
      icon: IconFileText,
    },
    {
      nameKey: "help",
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
      <NavMain items={data.navDataEstate} labelKey="dataEstate" labelNamespace="nav" />
      <NavMain items={data.navDiscovery} labelKey="discovery" labelNamespace="nav" />
      <NavMain items={navDatasets} labelKey="datasets" labelNamespace="nav" />
      <NavMain items={data.navSecondary} className="mt-auto" />
    </SidebarContent>
  )
}
