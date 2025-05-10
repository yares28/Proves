"use client"

import { Calendar, Filter, Clock, MapPin, Download, Bell } from "lucide-react"
import { motion } from "framer-motion"

const features = [
  {
    icon: Calendar,
    title: "Interactive Calendar",
    description: "View your exams in a visual calendar with interactive day selection and exam details.",
  },
  {
    icon: Filter,
    title: "Advanced Filtering",
    description: "Filter exams by school, degree, semester, year, and subject to find exactly what you need.",
  },
  {
    icon: Clock,
    title: "Time Management",
    description: "Get a clear overview of your exam schedule to better manage your study time.",
  },
  {
    icon: MapPin,
    title: "Location Tracking",
    description: "Never get lost with detailed exam location information for each of your exams.",
  },
  {
    icon: Download,
    title: "Export Options",
    description: "Export your exam schedule to Google Calendar or download as iCal for offline access.",
  },
  {
    icon: Bell,
    title: "Exam Reminders",
    description: "Set up notifications to remind you about upcoming exams and never miss a deadline.",
  },
]

export function FeatureShowcase() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-16 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl"
          >
            Premium <span className="text-primary">Features</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto max-w-2xl text-lg text-muted-foreground"
          >
            Everything you need to manage your exam schedule efficiently and stay organized throughout the semester.
          </motion.p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="group relative overflow-hidden rounded-xl border bg-card p-8 shadow-md transition-all duration-300 hover:shadow-xl"
            >
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 transition-all duration-300 group-hover:bg-primary/10"></div>
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
