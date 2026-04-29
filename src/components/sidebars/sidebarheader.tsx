// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebarHeader() {
  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            className="data-[slot=sidebar-menu-button]:!p-1.5 data-[slot=sidebar-menu-button]:!items-center"
            variant="default"
          >
            <a href="#">
              <img
                src="/netapp.svg"
                alt="NetApp"
                className="block h-5 w-auto"
              />
              <span className="text-base font-semibold">Neo Console</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  )
}
