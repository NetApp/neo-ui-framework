// Copyright 2025 NetApp, Inc. All Rights Reserved.
import {
  useLocation
} from "react-router-dom"
import { useTranslation } from "react-i18next"

import {
  Button
} from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Separator
} from "@/components/ui/separator"

import {
  SidebarTrigger
} from "@/components/ui/sidebar"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import {
  ModeToggle
} from "@/components/navs/theme-toggle"
import { CacheStatus } from "@/components/navs/cache-status"

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
import { useSettings } from "@/context/settings-context"
import { SUPPORTED_LOCALES, type AppLocale } from "@/i18n"



interface SiteHeaderProps {
  onConnect: (credentials: ConnectionCredentials) => Promise<void>
  onRefresh: () => Promise<void>
  isConnected: boolean
  cacheStats?: {
    sizeBytes: number
    maxSizeBytes: number
    items: number
  }
}

export function SiteHeader({ onConnect, onRefresh, isConnected, cacheStats }: SiteHeaderProps) {
  const location = useLocation()
  const { t } = useTranslation()
  const { locale, updateSettings } = useSettings()

  let titleKey = "monitoring"
  if (location.pathname.startsWith("/connector")) {
    titleKey = "connector"
  } else if (location.pathname.startsWith("/monitoring")) {
    titleKey = "monitoring"
  } else if (location.pathname.startsWith("/shares")) {
    titleKey = "dataSources"
  } else if (location.pathname.startsWith("/my-datasets/data-corpus")) {
    titleKey = "dataCorpus"
  } else if (location.pathname.startsWith("/my-datasets/content-search")) {
    titleKey = "contentSearch"
  } else if (location.pathname.startsWith("/my-datasets/entities")) {
    titleKey = "nameRecognitionEntities"
  } else if (location.pathname.startsWith("/my-datasets")) {
    titleKey = "myDatasets"
  } else if (location.pathname.startsWith("/logs")) {
    titleKey = "logs"
  } else if (location.pathname.startsWith("/users")) {
    titleKey = "users"
  } else if (location.pathname.startsWith("/settings")) {
    titleKey = "settings"
  } else if (location.pathname.startsWith("/help")) {
    titleKey = "help"
  } else if (location.pathname.startsWith("/tasks")) {
    titleKey = "tasks"
  }

  const handleLocaleChange = (nextLocale: string) => {
    updateSettings({ locale: nextLocale as AppLocale })
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx- data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{t(titleKey, { ns: "nav" })}</h1>
        <div className="ml-auto flex items-center gap-2">
          {isConnected && <CacheStatus stats={cacheStats} />}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-flex">
                  <ModeToggle />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("themeToggle")}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-flex hidden sm:flex">
                  <Button
                    variant="outline"
                    asChild
                    size="default"
                    className="w-full"
                  >
                    <a
                      href="https://github.com/NetApp/Innovation-Labs"
                      rel="noopener noreferrer"
                      target="_blank"
                      className="dark:text-foreground"
                    >
                      <IconBrandGithub /> {t("github")}
                    </a>
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("viewSourceOnGithub")}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="hidden sm:flex">
                  <Select value={locale} onValueChange={handleLocaleChange}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder={t("language")} />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_LOCALES.map((localeOption) => (
                        <SelectItem key={localeOption} value={localeOption}>
                          {t(`languageOption_${localeOption}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("language")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <ConnectDialog onConnect={onConnect} onRefresh={onRefresh} isConnected={isConnected}>
            <Button
              variant="default"
              size="default"
              className="hidden sm:flex">
              {isConnected ? <><IconRefresh /> {t("refresh")}</> : <><IconLogin /> {t("connect")}</>}
              <span className="sr-only">
                {isConnected ? t("refreshData") : t("connect")}
              </span>
            </Button>
          </ConnectDialog>
        </div>
      </div>
    </header>
  )
}
