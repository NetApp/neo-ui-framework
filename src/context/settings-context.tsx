"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { appLogger } from "@/services/app-logger"

interface SettingsContextType {
    monitoringTtl: number
    filesTtl: number
    cacheMaxSize: number
    updateSettings: (settings: Partial<SettingsState>) => void
}

interface SettingsState {
    monitoringTtl: number
    filesTtl: number
    cacheMaxSize: number
}

const DEFAULT_SETTINGS: SettingsState = {
    monitoringTtl: 10, // minutes
    filesTtl: 10, // minutes
    cacheMaxSize: 100, // MB
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
                setSettings({ ...DEFAULT_SETTINGS, ...parsed })
            } catch (e) {
                appLogger.warn("Failed to parse saved settings", e instanceof Error ? e.message : "Unknown error")
            }
        }
    }, [])

    const updateSettings = (newSettings: Partial<SettingsState>) => {
        setSettings((prev) => {
            const updated = { ...prev, ...newSettings }
            localStorage.setItem("neo-settings", JSON.stringify(updated))
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
