import { CalendarDisplay } from "@/components/calendar-display"
import { FilterSidebar } from "@/components/filter-sidebar"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { ThemeProvider } from "@/components/theme-provider"
import { FilterConnection } from "@/components/filter-connection"

export default async function Home() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="upv-theme">
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1">
          <HeroSection />
          <section className="container mx-auto px-4 py-16 md:px-6 md:py-24 lg:py-32">
            <h2 className="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              Find Your <span className="text-primary">Exams</span>
            </h2>
            <FilterConnection />
          </section>
          <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 to-emerald-950 py-24 text-white">
            <div className="absolute inset-0 -z-10 opacity-10">
              <svg
                className="absolute inset-0 h-full w-full"
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="100%"
              >
                <defs>
                  <pattern
                    id="dotPattern"
                    patternUnits="userSpaceOnUse"
                    width="40"
                    height="40"
                    patternTransform="scale(2) rotate(0)"
                  >
                    <rect x="0" y="0" width="100%" height="100%" fill="none" />
                    <circle cx="20" cy="20" r="1" fill="currentColor" />
                  </pattern>
                </defs>
                <rect width="800%" height="800%" transform="translate(0,0)" fill="url(#dotPattern)" />
              </svg>
            </div>
            <div className="container mx-auto px-4 text-center md:px-6">
              <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                Ready to Elevate Your Academic Experience?
              </h2>
              <p className="mx-auto mb-10 max-w-2xl text-lg text-emerald-100/80">
                Join thousands of students who use UPV Exam Calendar to organize their academic schedule and never miss
                an important exam.
              </p>
              <button className="inline-flex h-12 items-center justify-center rounded-md bg-white px-10 text-sm font-medium text-emerald-900 shadow-lg transition-all hover:bg-white/90 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                Create Your Calendar
              </button>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  )
}
