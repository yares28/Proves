"use client"

import { useState } from "react"
import { AlertTriangle, ChevronDown, ChevronUp, Clock } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useSettings } from "@/context/settings-context"
import { examSubject } from "@/lib/i18n"
import type { DayConflict } from "@/lib/exam-conflicts"

const SEVERITY_COPY: Record<DayConflict["severity"], { label: string; hint: string }> = {
  overlap: { label: "Solapan", hint: "Coinciden en horario — no puedes estar en los dos." },
  tight: { label: "Muy seguidos", hint: "Menos de una hora entre ellos." },
  busy: { label: "Día cargado", hint: "Varios exámenes el mismo día." },
}

function formatTime(time: string): string {
  return time ? time.slice(0, 5) : "Sin hora"
}

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

/**
 * Flags exam days a student cannot realistically get through cleanly. Only
 * appears once a selection is narrow enough to represent a real set of exams a
 * single student would sit — the calendar's own filter gate already ensures
 * that by the time this renders.
 */
export function ExamConflictsBanner({ conflicts }: { conflicts: DayConflict[] }) {
  const [expanded, setExpanded] = useState(false)
  const { settings } = useSettings()

  if (conflicts.length === 0) return null

  const worstSeverity = conflicts.some((c) => c.severity === "overlap")
    ? "overlap"
    : conflicts.some((c) => c.severity === "tight")
      ? "tight"
      : "busy"

  return (
    <Alert
      variant={worstSeverity === "overlap" ? "destructive" : "default"}
      className={
        worstSeverity !== "overlap"
          ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400"
          : undefined
      }
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between gap-2">
        <span>
          {conflicts.length === 1
            ? "1 día con conflicto de horario"
            : `${conflicts.length} días con conflictos de horario`}
        </span>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="inline-flex items-center gap-1 text-xs font-normal underline-offset-2 hover:underline"
        >
          {expanded ? "Ocultar" : "Ver detalle"}
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </AlertTitle>
      <AlertDescription>
        {!expanded ? (
          <span>Revisa tus asignaturas seleccionadas antes de confirmar tu horario.</span>
        ) : (
          <div className="mt-3 space-y-3">
            {conflicts.map((conflict) => (
              <div key={conflict.date} className="rounded-md border border-current/20 bg-background/40 p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium capitalize">{formatDate(conflict.date)}</span>
                  <Badge
                    variant="outline"
                    className={
                      conflict.severity === "overlap"
                        ? "border-destructive text-destructive"
                        : "border-current"
                    }
                  >
                    {SEVERITY_COPY[conflict.severity].label}
                  </Badge>
                </div>
                <p className="mb-2 text-xs opacity-80">{SEVERITY_COPY[conflict.severity].hint}</p>
                <ul className="space-y-1 text-sm">
                  {conflict.exams
                    .slice()
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((exam) => (
                      <li key={exam.id} className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 shrink-0 opacity-60" />
                        <span className="tabular-nums">{formatTime(exam.time)}</span>
                        <span className="truncate">{examSubject(exam, settings.language)}</span>
                        <span className="shrink-0 text-xs opacity-60">{exam.degree}</span>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}
