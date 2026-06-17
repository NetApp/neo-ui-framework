import i18n from "i18next"
import ICU from "i18next-icu"
import { initReactI18next } from "react-i18next"

import { resources, SUPPORTED_LOCALES, type AppLocale } from "./resources"

const DEFAULT_LOCALE: AppLocale = "en"

export function normalizeLocale(locale?: string | null): AppLocale {
  if (!locale) {
    return DEFAULT_LOCALE
  }

  const normalized = locale.toLowerCase().trim()
  const baseLocale = normalized.split("-")[0] as AppLocale

  if (SUPPORTED_LOCALES.includes(baseLocale)) {
    return baseLocale
  }

  return DEFAULT_LOCALE
}

function getLocaleFromSettingsStorage(): AppLocale | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const rawSettings = localStorage.getItem("neo-settings")
    if (!rawSettings) {
      return null
    }

    const parsed = JSON.parse(rawSettings) as { locale?: string }
    return normalizeLocale(parsed.locale)
  } catch {
    return null
  }
}

function getLocaleFromNavigator(): AppLocale {
  if (typeof navigator === "undefined") {
    return DEFAULT_LOCALE
  }

  if (Array.isArray(navigator.languages)) {
    for (const locale of navigator.languages) {
      const normalized = normalizeLocale(locale)
      if (SUPPORTED_LOCALES.includes(normalized)) {
        return normalized
      }
    }
  }

  return normalizeLocale(navigator.language)
}

function detectInitialLocale(): AppLocale {
  return getLocaleFromSettingsStorage() ?? getLocaleFromNavigator() ?? DEFAULT_LOCALE
}

void i18n
  .use(ICU)
  .use(initReactI18next)
  .init({
    resources,
    lng: detectInitialLocale(),
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: [...SUPPORTED_LOCALES],
    ns: ["common", "nav", "settings", "monitoring", "tasks"],
    defaultNS: "common",
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  })

export type { AppLocale }
export { DEFAULT_LOCALE, SUPPORTED_LOCALES }
export default i18n
