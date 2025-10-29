"use client"

import * as React from "react"

import {
  Sidebar,
  SidebarFooter,
} from "../ui/sidebar"

import { NavUser } from "../navs/users"

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
