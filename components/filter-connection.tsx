"use client"

import { useState, useCallback } from "react"
import { FilterSidebar } from "@/components/filter-sidebar"
import { CalendarDisplay } from "@/components/calendar-display"

export function FilterConnection() {
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})

  // Use useCallback to prevent unnecessary re-renders
  const handleFiltersChange = useCallback((filters: Record<string, string[]>) => {
    setActiveFilters(filters)
  }, [])



  return (
    <div className="grid grid-cols-1 gap-10 md:grid-cols-[350px_1fr]">
      <FilterSidebar onFiltersChange={handleFiltersChange} />
      <CalendarDisplay activeFilters={activeFilters} />
    </div>
  )
} 