import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import type { ExamFilters } from "@/types/exam"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, MapPin, School, BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getExams } from "@/actions/exam-actions"

export default async function ExamsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const filters: ExamFilters = {
    acronym: typeof searchParams.acronym === "string" ? searchParams.acronym : undefined,
    school: typeof searchParams.school === "string" && searchParams.school !== "all" ? searchParams.school : undefined,
    degree: typeof searchParams.degree === "string" && searchParams.degree !== "all" ? searchParams.degree : undefined,
    year: typeof searchParams.year === "string" ? searchParams.year : undefined,
    semester: typeof searchParams.semester === "string" ? searchParams.semester : undefined,
  }

  console.log("Applied filters:", filters);
  const exams = await getExams(filters)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-16">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="mb-8 text-3xl font-bold tracking-tight md:text-4xl">Exam Results</h1>

          <div className="mb-6 flex flex-wrap gap-2">
            {filters.acronym && (
              <Badge variant="secondary" className="text-sm">
                Acronym: {filters.acronym}
              </Badge>
            )}
            {filters.school && (
              <Badge variant="secondary" className="text-sm">
                School: {filters.school}
              </Badge>
            )}
            {filters.degree && (
              <Badge variant="secondary" className="text-sm">
                Degree: {filters.degree}
              </Badge>
            )}
            {filters.year && (
              <Badge variant="secondary" className="text-sm">
                Year: {filters.year}
              </Badge>
            )}
            {filters.semester && (
              <Badge variant="secondary" className="text-sm">
                Semester: {filters.semester}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {exams.length > 0 ? (
              exams.map((exam) => (
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
                          {new Date(exam.date).toLocaleDateString("en-US", {
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
                <h3 className="mb-2 text-xl font-semibold">No exams found</h3>
                <p className="text-muted-foreground">Try adjusting your search criteria to find more results.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
