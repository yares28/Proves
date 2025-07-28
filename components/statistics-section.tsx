"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Calendar, School, BookOpen } from "lucide-react"
import CountUp from './ui/countup'

const stats = [
  {
    icon: Calendar,
    value: 2000,
    displayValue: "2,000+",
    label: "Exámenes Registrados",
    description: "Disponibles en nuestra base de datos",
  },
  {
    icon: School,
    value: 14,
    displayValue: "14",
    label: "Escuelas",
    description: "Conectadas a nuestra plataforma",
  },
  {
    icon: BookOpen,
    value: 200,
    displayValue: "200+",
    label: "Asignaturas",
    description: "De todas las escuelas",
  },
]

export function StatisticsSection() {
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
        <div className="mb-16 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl"
          >
            Confianza de <span className="text-primary">Estudiantes</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto max-w-2xl text-lg text-muted-foreground"
          >
            Únete a cientos de estudiantes que usan el Calendario de Exámenes UPV para mantenerse organizados y nunca perderse un examen importante.
          </motion.p>
        </div>

        <div className="flex flex-wrap justify-center gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="group w-64 h-64"
            >
              <Card className="overflow-hidden border-none bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:bg-emerald-900/50 h-full">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center h-full">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 transition-all duration-300 group-hover:bg-primary/20">
                    <stat.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="mb-2 text-4xl font-bold tracking-tight">
                    <CountUp
                      from={0}
                      to={stat.value}
                      separator=","
                      direction="up"
                      duration={2}
                      delay={0.5 + (index * 0.2)}
                      className="count-up-text"
                    />
                    {stat.displayValue.includes('+') && '+'}
                  </div>
                  <div className="mb-1 font-medium text-center">{stat.label}</div>
                  <div className="text-sm text-muted-foreground text-center">{stat.description}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
