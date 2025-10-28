import { useLocation } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/navs/theme-toggle"
import { IconBrandGithub, IconKey, IconRefresh } from "@tabler/icons-react"
import { ConnectDialog, type ConnectionCredentials } from "@/components/dialogs/connect-dialog"

interface SiteHeaderProps {
  onConnect: (credentials: ConnectionCredentials) => Promise<void>
  isConnected: boolean
}

export function SiteHeader({ onConnect, isConnected }: SiteHeaderProps) {
  const location = useLocation()

  let title = "Welcome"
  if (location.pathname.startsWith("/dashboard")) {
    title = "Dashboard"
  } else if (location.pathname.startsWith("/shares")) {
    title = "Shares"
  } else if (location.pathname.startsWith("/files")) {
    title = "Files"
  } else if (location.pathname.startsWith("/operations")) {
    title = "Operations"
  } else if (location.pathname.startsWith("/users")) {
    title = "Users"
  } else if (location.pathname.startsWith("/search")) {
    title = "Search"
  } else if (location.pathname.startsWith("/datasets")) {
    title = "Datasets"
  } else if (location.pathname.startsWith("/settings")) {
    title = "Settings"
  } else if (location.pathname.startsWith("/help")) {
    title = "Help"
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
            size="icon"
            className="hidden sm:flex"
          >
            <a
              href="https://github.com/NetApp/Innovation-Labs"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
              <IconBrandGithub />
            </a>
          </Button>
          <ConnectDialog onConnect={onConnect} isConnected={isConnected}>
            <Button variant="outline" size="icon" className="hidden sm:flex">
              {isConnected ? <IconRefresh /> : <IconKey />}
              <span className="sr-only">
                {isConnected ? "Reconnect" : "Connect"}
              </span>
            </Button>
          </ConnectDialog>
        </div>
      </div>
    </header>
  )
}
