// Copyright 2025 NetApp, Inc. All Rights Reserved.
"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { appLogger } from "@/services/app-logger"
import type { LogLevel } from "@/services/app-logger"
import i18n, { type AppLocale, normalizeLocale } from "@/i18n"

interface SettingsContextType {
    monitoringTtl: number
    filesTtl: number
    cacheMaxSize: number
    logLevel: LogLevel
    locale: AppLocale
    updateSettings: (settings: Partial<SettingsState>) => void
}

interface SettingsState {
    monitoringTtl: number
    filesTtl: number
    cacheMaxSize: number
    logLevel: LogLevel
    locale: AppLocale
}

const DEFAULT_SETTINGS: SettingsState = {
    monitoringTtl: 10, // minutes
    filesTtl: 10, // minutes
    cacheMaxSize: 100, // MB
    logLevel: "INFO",
    locale: "en",
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS)

    // Load settings from localStorage on mount
    useEffect(() => {
        const savedSettings = localStorage.getItem("neo-settings")
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings)
                const merged = {
                    ...DEFAULT_SETTINGS,
                    ...parsed,
                    locale: normalizeLocale(parsed?.locale),
                }
                setSettings(merged)
                // Apply log level immediately
                appLogger.setLevel(merged.logLevel)
                void i18n.changeLanguage(merged.locale)
            } catch (e) {
                appLogger.warn("Failed to parse saved settings", e instanceof Error ? e.message : "Unknown error")
                // Apply default log level
                appLogger.setLevel(DEFAULT_SETTINGS.logLevel)
                void i18n.changeLanguage(DEFAULT_SETTINGS.locale)
            }
        } else {
            // Apply default log level
            appLogger.setLevel(DEFAULT_SETTINGS.logLevel)
            void i18n.changeLanguage(DEFAULT_SETTINGS.locale)
        }
    }, [])

    const updateSettings = (newSettings: Partial<SettingsState>) => {
        setSettings((prev) => {
            const updated = {
                ...prev,
                ...newSettings,
                locale: normalizeLocale(newSettings.locale ?? prev.locale),
            }
            localStorage.setItem("neo-settings", JSON.stringify(updated))

            // Apply side effects
            if (newSettings.logLevel) {
                appLogger.setLevel(newSettings.logLevel)
            }
            if (newSettings.locale) {
                void i18n.changeLanguage(updated.locale)
            }

            return updated
        })
        appLogger.info("Settings updated", undefined, newSettings)
    }

    return (
        <SettingsContext.Provider
            value={{
                monitoringTtl: settings.monitoringTtl,
                filesTtl: settings.filesTtl,
                cacheMaxSize: settings.cacheMaxSize,
                logLevel: settings.logLevel,
                locale: settings.locale,
                updateSettings,
            }}
        >
            {children}
        </SettingsContext.Provider>
    )
}

export function useSettings() {
    const context = useContext(SettingsContext)
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider")
    }
    return context
}
