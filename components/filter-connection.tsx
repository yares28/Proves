"use client"

import { useCallback, useTransition } from "react"
import { usePathname, useRouter } from "next/navigation"
import { FilterSidebar } from "@/components/filter-sidebar"
import { CalendarDisplay } from "@/components/calendar-display"
import { filtersToSearchParams, type ActiveFilters } from "@/lib/filter-params"
import type { Exam, FilterOptions } from "@/types/exam"

/**
 * Connects the sidebar to the calendar through the URL.
 *
 * Nothing is fetched here. A filter change rewrites the query string; the server
 * re-renders the page with the matching exams and hands them back down. That
 * keeps one copy of the selection (the URL) and makes every filtered view
 * shareable and bookmarkable.
 */
export function FilterConnection({
  filters,
  options,
  exams,
}: {
  filters: ActiveFilters
  options: FilterOptions
  exams: Exam[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const handleFiltersChange = useCallback(
    (next: ActiveFilters) => {
      const query = filtersToSearchParams(next).toString()
      // replace, not push: refining filters is adjusting one view, not
      // navigating — otherwise Back would have to walk back through every
      // checkbox the user ticked.
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
      })
    },
    [pathname, router]
  )

  return (
    <div className="grid grid-cols-1 gap-10 md:grid-cols-[350px_1fr]">
      <div className="hidden md:block">
        <FilterSidebar
          filters={filters}
          options={options}
          onFiltersChange={handleFiltersChange}
        />
      </div>
      <CalendarDisplay activeFilters={filters} exams={exams} loading={isPending} />
    </div>
  )
}
