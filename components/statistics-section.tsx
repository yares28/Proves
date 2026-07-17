import { StatisticsCards } from "@/components/statistics-cards"
import { getExamStats } from "@/actions/exam-actions"
import { SectionHeading } from "@/components/section-heading"

/**
 * Counts every figure from the database rather than asserting them. Rendered on
 * the server, so the numbers are in the HTML and cached alongside the exam data
 * they describe.
 */
export async function StatisticsSection() {
  const stats = await getExamStats()

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 py-24 dark:from-emerald-950 dark:to-emerald-900 md:py-32">
      {/* Background pattern */}
      <div className="absolute inset-0 -z-10">
        <svg
          className="absolute inset-0 h-full w-full opacity-30 dark:opacity-10"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
        >
          <defs>
            <pattern
              id="dots-pattern"
              patternUnits="userSpaceOnUse"
              width="20"
              height="20"
              patternTransform="scale(1) rotate(0)"
            >
              <rect x="0" y="0" width="100%" height="100%" fill="none" />
              <circle cx="10" cy="10" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots-pattern)" />
        </svg>
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <SectionHeading />

        <StatisticsCards stats={stats} />
      </div>
    </section>
  )
}
