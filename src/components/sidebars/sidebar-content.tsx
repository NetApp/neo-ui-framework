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
  IconBrandGraphql,
  IconListSearch,
  IconFolders,
  // IconArrowsJoin,
  IconFolderShare,
  // IconFiles,
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
  ],
  navDiscovery: [
    {
      nameKey: "dataCorpus",
      url: "#/my-datasets/data-corpus",
      icon: IconFileSearch,
    },
    {
      nameKey: "contentSearch",
      url: "#/my-datasets/content-search",
      icon: IconListSearch,
    },
    {
      nameKey: "entities",
      url: "#/my-datasets/entities",
      icon: IconBrandGraphql,
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

export function AppSidebarContent({ ...props }: React.ComponentProps<typeof SidebarContent>) {
  return (
    <SidebarContent {...props}>
      <NavMain items={data.navMain} />
      <NavMain items={data.navDataEstate} labelKey="dataEstate" labelNamespace="nav" />
      <NavMain items={data.navDiscovery} labelKey="discovery" labelNamespace="nav" />
      <NavMain items={data.navDatasets} labelKey="collections" labelNamespace="nav" />
      <NavMain items={data.navSecondary} className="mt-auto" />
    </SidebarContent>
  )
}
