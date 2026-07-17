"use client"

import { Calendar, List } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslations } from "@/hooks/use-translations"

interface ViewToggleProps {
  view: "calendar" | "list"
  onChange: (view: "calendar" | "list") => void
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  const t = useTranslations()
  return (
    <Tabs value={view} onValueChange={(value) => onChange(value as "calendar" | "list")} className="w-full sm:w-auto">
      <TabsList className="grid w-full grid-cols-2 sm:w-[240px]">
        <TabsTrigger value="calendar" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{t("calendar.viewCalendar")}</span>
        </TabsTrigger>
        <TabsTrigger value="list" className="flex items-center gap-2">
          <List className="h-4 w-4" />
          <span>{t("calendar.viewList")}</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
