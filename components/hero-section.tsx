"use client"

import { ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { FindExamCard } from "@/components/find-exam-card"

export function HeroSection() {
  const scrollToFilters = () => {
    const filtersSection = document.querySelector("#filters-section")
    if (filtersSection) {
      filtersSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 px-4 py-32 dark:from-emerald-950 dark:to-emerald-900 md:py-40 lg:py-52">
      {/* Enhanced background pattern */}
      <div className="absolute inset-0 -z-10">
        <svg
          className="absolute inset-0 h-full w-full opacity-30 dark:opacity-10"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
        >
          <defs>
            <pattern
              id="grid-pattern"
              patternUnits="userSpaceOnUse"
              width="100"
              height="100"
              patternTransform="scale(0.5) rotate(0)"
            >
              <rect x="0" y="0" width="100%" height="100%" fill="none" />
              <path
                d="M100,0 L100,100 L0,100"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                strokeOpacity="0.3"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>

      {/* Animated background elements */}
      <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl"></div>
      <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-primary/10 blur-3xl"></div>

      {/* Animated particles */}
      <div className="absolute inset-0 -z-5">
        <div className="absolute left-1/4 top-1/4 h-2 w-2 animate-float rounded-full bg-primary/30 blur-sm"></div>
        <div
          className="absolute left-3/4 top-1/3 h-3 w-3 animate-float rounded-full bg-primary/20 blur-sm"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute left-1/3 top-2/3 h-2 w-2 animate-float rounded-full bg-primary/30 blur-sm"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute left-2/3 top-1/2 h-4 w-4 animate-float rounded-full bg-primary/20 blur-sm"
          style={{ animationDelay: "3s" }}
        ></div>
      </div>

      <div className="container relative mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center lg:text-left"
          >
            <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              Find Your{" "}
              <span className="relative inline-block">
                <span className="relative z-10">Exam Schedule</span>
                <span className="absolute bottom-2 left-0 z-0 h-4 w-full bg-primary/20"></span>
              </span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-emerald-800/80 dark:text-emerald-100/80 md:text-xl lg:mx-0">
              Elegantly discover, filter, and organize your university exam timetable in one sophisticated platform.
              Never miss an important exam date again.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
              <Button
                size="lg"
                className="h-12 rounded-md bg-primary px-8 text-primary-foreground shadow-lg transition-all hover:shadow-xl"
                onClick={scrollToFilters}
              >
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-md border-primary/30 bg-white/50 text-primary backdrop-blur-sm transition-all hover:bg-white/70 dark:bg-emerald-950/50 dark:text-emerald-100 dark:hover:bg-emerald-950/70"
              >
                Learn More
              </Button>
            </div>
          </motion.div>

          {/* Find Your Exam Card */}
          <FindExamCard />
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ArrowDown className="h-6 w-6 text-primary/70" />
      </div>
    </section>
  )
}
