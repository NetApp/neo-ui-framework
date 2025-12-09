import {
  useLocation
} from "react-router-dom"

import {
  Button
} from "@/components/ui/button"

import {
  Separator
} from "@/components/ui/separator"

import {
  SidebarTrigger
} from "@/components/ui/sidebar"

import {
  ModeToggle
} from "@/components/navs/theme-toggle"

import {
  IconBrandGithub,
  IconLogin,
  IconRefresh
} from "@tabler/icons-react"

import type {
  ConnectionCredentials
} from "@/services/models"

import {
  ConnectDialog
} from "@/components/dialogs/connect-dialog"



interface SiteHeaderProps {
  onConnect: (credentials: ConnectionCredentials) => Promise<void>
  onRefresh: () => Promise<void>
  isConnected: boolean
}

export function SiteHeader({ onConnect, onRefresh, isConnected }: SiteHeaderProps) {
  const location = useLocation()

  let title = "Connector"
  if (location.pathname.startsWith("/connector")) {
    title = "Connector"
  } else if (location.pathname.startsWith("/monitoring")) {
    title = "Monitoring"
  } else if (location.pathname.startsWith("/shares")) {
    title = "Shares"
  } else if (location.pathname.startsWith("/my-datasets/data-corpus")) {
    title = "Data Corpus"
  } else if (location.pathname.startsWith("/my-datasets/content-search")) {
    title = "Content Search"
  } else if (location.pathname.startsWith("/my-datasets")) {
    title = "My Datasets"
  } else if (location.pathname.startsWith("/logs")) {
    title = "Logs"
  } else if (location.pathname.startsWith("/users")) {
    title = "Users"
  } else if (location.pathname.startsWith("/settings")) {
    title = "Settings"
  } else if (location.pathname.startsWith("/help")) {
    title = "Help"
  } else if (location.pathname.startsWith("/tasks")) {
    title = "Tasks"
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx- data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
          <Button
            variant="outline"
            asChild
            size="default"
            className="hidden sm:flex"
          >
            <a
              href="https://github.com/NetApp/Innovation-Labs"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
              <IconBrandGithub /> GitHub
            </a>
          </Button>
          <ConnectDialog onConnect={onConnect} onRefresh={onRefresh} isConnected={isConnected}>
            <Button
              variant="default"
              size="default"
              className="hidden sm:flex">
              {isConnected ? <><IconRefresh /> Refresh</> : <><IconLogin /> Connect</>}
              <span className="sr-only">
                {isConnected ? "Refresh data" : "Connect"}
              </span>
            </Button>
          </ConnectDialog>
        </div>
      </div>
    </header>
  )
}
