"use client"

import { Calendar, List } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/hooks/use-translations"

interface ViewToggleProps {
  view: "calendar" | "list"
  onChange: (view: "calendar" | "list") => void
}

const OPTIONS = [
  { value: "calendar", icon: Calendar, labelKey: "calendar.viewCalendar" },
  { value: "list", icon: List, labelKey: "calendar.viewList" },
] as const

/**
 * Switches the results between the month grid and the date-ordered list.
 *
 * This was previously built on Radix Tabs, but the panels it nominally
 * controlled are rendered by CalendarDisplay, not here — so every trigger
 * carried an `aria-controls` pointing at an element that never existed, which
 * the accessibility audit flagged (invalid ARIA reference) and which makes a
 * screen reader announce a tab and then fail to find its panel. Two pressed-state
 * buttons describe what this control actually is, keep native keyboard support,
 * and reference nothing that is not on the page.
 */
export function ViewToggle({ view, onChange }: ViewToggleProps) {
  const t = useTranslations()

  return (
    <div
      role="group"
      aria-label={t("calendar.viewToggle")}
      className="inline-flex h-10 w-full items-center justify-center rounded-md bg-muted p-1 text-muted-foreground sm:w-auto"
    >
      {OPTIONS.map(({ value, icon: Icon, labelKey }) => {
        const active = view === value
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            data-state={active ? "active" : "inactive"}
            // Re-selecting the active view is a no-op, matching the behaviour of the
            // Radix Tabs control this replaced and avoiding a redundant re-render.
            onClick={() => !active && onChange(value)}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-[120px] sm:flex-none",
              active && "bg-background text-foreground shadow-sm"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{t(labelKey)}</span>
          </button>
        )
      })}
    </div>
  )
}
