import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import type { ExamFilters } from "@/types/exam"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, MapPin, School, BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getExams } from "@/actions/exam-actions"
import { ExportButton } from "@/components/export-button"
import Link from "next/link"

/**
 * A school-level filter matches well over a thousand exams, and rendering a card
 * for each produced a ~10 MB HTML document that dominated this page's load time.
 * Results are paginated server-side instead: the query is unchanged (the export
 * button still receives the full set), only the markup is bounded.
 */
const PAGE_SIZE = 60

export default async function ExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const filters: ExamFilters = {
    acronym: typeof resolvedSearchParams.acronym === "string" ? resolvedSearchParams.acronym : undefined,
    school: typeof resolvedSearchParams.school === "string" && resolvedSearchParams.school !== "all" ? resolvedSearchParams.school : undefined,
    degree: typeof resolvedSearchParams.degree === "string" && resolvedSearchParams.degree !== "all" ? resolvedSearchParams.degree : undefined,
    year: typeof resolvedSearchParams.year === "string" ? resolvedSearchParams.year : undefined,
    semester: typeof resolvedSearchParams.semester === "string" ? resolvedSearchParams.semester : undefined,
  }

  const exams = await getExams(filters)

  const requestedPage = Number(
    typeof resolvedSearchParams.page === "string" ? resolvedSearchParams.page : "1"
  )
  const totalPages = Math.max(1, Math.ceil(exams.length / PAGE_SIZE))
  // Clamp rather than 404: a stale link to page 9 of a term that now has fewer
  // exams should still show results.
  const page = Number.isFinite(requestedPage)
    ? Math.min(Math.max(Math.trunc(requestedPage), 1), totalPages)
    : 1
  const pageExams = exams.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const pageHref = (target: number) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(resolvedSearchParams)) {
      if (key === "page" || value == null) continue
      for (const v of Array.isArray(value) ? value : [value]) params.append(key, v)
    }
    if (target > 1) params.set("page", String(target))
    const qs = params.toString()
    return qs ? `/exams?${qs}` : "/exams"
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main id="main-content" className="flex-1 py-16">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="mb-8 text-3xl font-bold tracking-tight md:text-4xl">Resultados de la búsqueda</h1>

          <div className="mb-6 flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {filters.acronym && (
                <Badge variant="secondary" className="text-sm">
                  Acrónimo: {filters.acronym}
                </Badge>
              )}
              {filters.school && (
                <Badge variant="secondary" className="text-sm">
                  Escuela: {filters.school}
                </Badge>
              )}
              {filters.degree && (
                <Badge variant="secondary" className="text-sm">
                  Titulación: {filters.degree}
                </Badge>
              )}
              {filters.year && (
                <Badge variant="secondary" className="text-sm">
                  Curso: {filters.year}
                </Badge>
              )}
              {filters.semester && (
                <Badge variant="secondary" className="text-sm">
                  Semestre: {filters.semester}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {exams.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {exams.length} {exams.length === 1 ? "examen" : "exámenes"}
                  {totalPages > 1 && ` · página ${page} de ${totalPages}`}
                </span>
              )}
              {exams.length > 0 && (
                <ExportButton exams={exams} filters={filters} />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {exams.length > 0 ? (
              pageExams.map((exam) => (
                <Card key={exam.id} className="overflow-hidden transition-all hover:shadow-md">
                  <CardHeader className="bg-primary/5 pb-4 pt-6">
                    <CardTitle className="flex items-center justify-between">
                      <span>{exam.subject}</span>
                      <Badge variant="outline">{exam.code}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>
                          {new Date(exam.date).toLocaleDateString("es-ES", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span>{exam.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{exam.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <School className="h-4 w-4 text-primary" />
                        <span>
                          {exam.school} - {exam.degree}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span>
                          {exam.year} - {exam.semester}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-12 text-center">
                <h2 className="mb-2 text-xl font-semibold">No se han encontrado exámenes</h2>
                <p className="mb-6 text-muted-foreground">
                  Ningún examen coincide con los filtros seleccionados. Prueba a quitar alguno.
                </p>
                <Link
                  href="/"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Volver a la búsqueda
                </Link>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <nav
              aria-label="Paginación de resultados"
              className="mt-10 flex items-center justify-center gap-4"
            >
              {page > 1 ? (
                <Link
                  href={pageHref(page - 1)}
                  rel="prev"
                  className="inline-flex h-10 items-center rounded-md border border-input px-4 text-sm font-medium ring-offset-background transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Anterior
                </Link>
              ) : (
                <span className="inline-flex h-10 items-center rounded-md border border-input px-4 text-sm font-medium text-muted-foreground">
                  Anterior
                </span>
              )}

              <span aria-current="page" className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>

              {page < totalPages ? (
                <Link
                  href={pageHref(page + 1)}
                  rel="next"
                  className="inline-flex h-10 items-center rounded-md border border-input px-4 text-sm font-medium ring-offset-background transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Siguiente
                </Link>
              ) : (
                <span className="inline-flex h-10 items-center rounded-md border border-input px-4 text-sm font-medium text-muted-foreground">
                  Siguiente
                </span>
              )}
            </nav>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
