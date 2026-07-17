"use client"

import { useSettings } from "@/context/settings-context"
import { messages, type MessageKey } from "@/lib/messages"
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n"

/**
 * Translates UI chrome (buttons, headings, labels) into the language chosen in
 * the header toggle. Reads the same `settings.language` that already drives
 * subject-name translation, so the whole interface follows one control.
 *
 * `t('some.key')` returns the string for the active locale, falling back to
 * Castellano, then to the key itself if it is missing entirely. `{name}`
 * placeholders are filled from the params object.
 */
export function useTranslations() {
  const { settings } = useSettings()
  const locale: Locale = settings.language

  return (key: MessageKey, params?: Record<string, string | number>): string => {
    const dict = messages[locale] ?? messages[DEFAULT_LOCALE]
    let str = dict[key] ?? messages[DEFAULT_LOCALE][key] ?? key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v))
      }
    }
    return str
  }
}
