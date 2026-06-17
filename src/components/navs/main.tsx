// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import {
  type Icon
} from "@tabler/icons-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useTranslation } from "react-i18next"

type NavItem = {
  name?: string
  nameKey?: string
  nameNamespace?: "common" | "nav" | "settings"
  url: string
  icon: Icon
}

export function NavMain({
  items,
  label,
  labelKey,
  labelNamespace,
  ...props
}: {
  items: NavItem[]
  label?: string
  labelKey?: string
  labelNamespace?: "common" | "nav" | "settings"
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const { t } = useTranslation()
  const resolvedLabel = labelKey ? t(labelKey, { ns: labelNamespace ?? "nav" }) : label

  return (
    <SidebarGroup {...props}>
      {resolvedLabel && <SidebarGroupLabel>{resolvedLabel}</SidebarGroupLabel>}
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={`${item.url}-${item.nameKey ?? item.name ?? "item"}`}>
              <SidebarMenuButton asChild>
                <a href={item.url}>
                  <item.icon />
                  <span>{item.nameKey ? t(item.nameKey, { ns: item.nameNamespace ?? "nav" }) : item.name ?? ""}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
