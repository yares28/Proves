import { Suspense } from "react"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { StatisticsSection } from "@/components/statistics-section"
import { FAQSection } from "@/components/faq-section"
import { FilterConnection } from "@/components/filter-connection"
import { HomeHeading } from "@/components/home-heading"
import { AuthRequiredCheck } from "@/components/auth-required-check"
import { AuthStatusIndicator } from "@/components/auth-status-indicator"
import { getExams, getFilterOptions } from "@/actions/exam-actions"
import { hasMeaningfulFilters, parseFilterParams, toExamFilters } from "@/lib/filter-params"

/**
 * The homepage renders its exams on the server, from the filters in the URL.
 *
 * It used to be a client component that fetched everything after hydration,
 * which meant crawlers saw an empty shell and students watched a spinner. The
 * only thing forcing "use client" was an unused useAuth() call and a dialog
 * that was never opened.
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const filters = parseFilterParams(await searchParams)

  // The sidebar needs its options either way; exams only once the selection is
  // narrow enough to be worth showing.
  const [options, exams] = await Promise.all([
    getFilterOptions({
      schools: filters.school,
      degrees: filters.degree,
      semesters: filters.semester,
      years: filters.year,
    }),
    hasMeaningfulFilters(filters) ? getExams(toExamFilters(filters)) : Promise.resolve([]),
  ])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <div className="container mx-auto px-4">
        <AuthStatusIndicator />
      </div>
      <main id="main-content" className="flex-1">
        <HeroSection />
        <Suspense fallback={null}>
          <AuthRequiredCheck />
        </Suspense>

        <section className="container mx-auto px-4 py-16 md:px-6 md:py-24 lg:py-32">
          <HomeHeading />
          <Suspense fallback={null}>
            <FilterConnection filters={filters} options={options} exams={exams} />
          </Suspense>
        </section>

        {/* Statistics Section */}
        <StatisticsSection />

        {/* FAQ Section */}
        <FAQSection />
      </main>
      <Footer />
    </div>
  )
}
