"use client"

import { useEffect, useMemo, useState } from 'react'
import { getSchools, getSubjects, getExams } from '@/actions/exam-actions'
import { cn } from '@/lib/utils'
import { AVAILABLE_EXAMS_TABLES } from '@/lib/supabase'

type ColumnItem = { label: string; value: string }

export default function ListaExamenesAnterioresPage() {
  const [schools, setSchools] = useState<string[]>([])
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null)
  const [subjects, setSubjects] = useState<string[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [subjectQuery, setSubjectQuery] = useState('')
  const [exams, setExams] = useState<any[]>([])
  const [selectedTable, setSelectedTable] = useState<string>(AVAILABLE_EXAMS_TABLES[0] || '25-26')

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      const s = await getSchools(selectedTable)
      setSchools(s)
      setIsLoading(false)
    }
    load()
  }, [selectedTable])

  useEffect(() => {
    const loadSubjects = async () => {
      if (!selectedSchool) {
        setSubjects([])
        setExams([])
        return
      }
      setIsLoading(true)
      const subj = await getSubjects([selectedSchool], undefined, undefined, undefined, selectedTable)
      setSubjects([...subj].sort((a, b) => a.localeCompare(b, 'es')))
      setIsLoading(false)
    }
    loadSubjects()
  }, [selectedSchool, selectedTable])

  useEffect(() => {
    const loadExams = async () => {
      if (!selectedSchool || !selectedSubject) {
        setExams([])
        return
      }
      setIsLoading(true)
      const results = await getExams({ school: [selectedSchool], subject: [selectedSubject] }, undefined as any, selectedTable)
      setExams(results || [])
      setIsLoading(false)
    }
    loadExams()
  }, [selectedSchool, selectedSubject, selectedTable])

  const schoolItems: ColumnItem[] = useMemo(
    () => schools.map((s) => ({ label: s, value: s })),
    [schools]
  )

  const subjectItems: ColumnItem[] = useMemo(
    () => {
      const base = subjects.map((s) => ({ label: s, value: s }))
      if (!subjectQuery.trim()) return base
      const q = subjectQuery.toLowerCase()
      return base.filter((it) => it.label.toLowerCase().includes(q))
    },
    [subjects, subjectQuery]
  )

  return (
    <div className="container mx-auto px-4 py-10 md:px-6 md:py-16">
      <h1 className="mb-2 text-3xl font-bold md:text-4xl">Lista de exámenes de años anteriores</h1>
      <p className="mb-8 text-muted-foreground">Explora por curso académico, escuelas y asignaturas.</p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Column 1: Academic year (table) selector */}
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-lg font-semibold">Curso académico</h2>
          <div className="space-y-2">
            {AVAILABLE_EXAMS_TABLES.map(t => (
              <button
                key={t}
                className={cn(
                  'w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent',
                  selectedTable === t && 'bg-accent'
                )}
                onClick={() => {
                  setSelectedTable(t)
                  setSelectedSchool(null)
                  setSelectedSubject(null)
                }}
              >
                {t.replace('-', '/')}
              </button>
            ))}
          </div>
        </div>

        {/* Column 2: Schools */}
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-lg font-semibold">Escuelas</h2>
          <div className="max-h-[60vh] overflow-auto space-y-2 scroll-custom">
            {isLoading && schools.length === 0 ? (
              <div className="text-sm text-muted-foreground">Cargando escuelas…</div>
            ) : schoolItems.length === 0 ? (
              <div className="text-sm text-muted-foreground">No hay escuelas disponibles</div>
            ) : (
              schoolItems.map((item) => (
                <button
                  key={item.value}
                  className={cn(
                    'w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent',
                    selectedSchool === item.value && 'bg-accent'
                  )}
                  onClick={() => {
                    setSelectedSchool(item.value)
                    setSelectedSubject(null)
                  }}
                >
                  {item.label}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Subjects */}
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-lg font-semibold">Asignaturas</h2>
          <div className="mb-3">
            <input
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              placeholder="Buscar asignatura…"
              value={subjectQuery}
              onChange={(e) => setSubjectQuery(e.target.value)}
            />
          </div>
          {!selectedSchool ? (
            <div className="text-sm text-muted-foreground">Selecciona una escuela</div>
          ) : isLoading && subjects.length === 0 ? (
            <div className="text-sm text-muted-foreground">Cargando asignaturas…</div>
          ) : subjectItems.length === 0 ? (
            <div className="text-sm text-muted-foreground">No hay asignaturas disponibles</div>
          ) : (
            <div className="max-h-[60vh] overflow-auto space-y-2 scroll-custom">
              {subjectItems.map((item) => (
                <button
                  key={item.value}
                  className={cn(
                    'w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent',
                    selectedSubject === item.value && 'bg-accent'
                  )}
                  onClick={() => setSelectedSubject(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Column 4: Exams */}
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-lg font-semibold">Exámenes</h2>
          {(!selectedSchool || !selectedSubject) ? (
            <div className="text-sm text-muted-foreground">Selecciona escuela y asignatura</div>
          ) : isLoading && exams.length === 0 ? (
            <div className="text-sm text-muted-foreground">Cargando exámenes…</div>
          ) : exams.length === 0 ? (
            <div className="text-sm text-muted-foreground">No hay exámenes para esta asignatura</div>
          ) : (
            <div className="max-h-[60vh] overflow-auto space-y-3 text-sm scroll-custom">
              {exams.map((exam) => (
                <div key={exam.id} className="rounded-md border p-3">
                  <div className="font-medium">{exam.subject}</div>
                  <div className="text-muted-foreground">
                    {new Date(exam.date).toLocaleDateString('es-ES')} · {exam.time || 'Hora por confirmar'} · {exam.location || 'Ubicación por confirmar'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}




