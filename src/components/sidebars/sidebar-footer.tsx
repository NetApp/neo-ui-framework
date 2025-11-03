"use client"

import * as React from "react"

import {
  Sidebar,
  SidebarFooter,
} from "@/components/ui/sidebar"

import { 
  NavUser 
} from "@/components/navs/users"

const data = {
  user: {
    name: "Rom Adams",
    email: "me@romdams.com",
    avatar: "/avatars/shadcn.jpg",
  },
}

export function AppSidebarFooter({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
      <SidebarFooter {...props}>
        <NavUser user={data.user} />
      </SidebarFooter>
  )
}
