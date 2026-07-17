"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, School, BookOpen } from "lucide-react"
import CountUp from "./ui/countup"
import type { ExamStats } from "@/actions/exam-actions"

/**
 * The animated half of the statistics section. The numbers are counted on the
 * server and passed in — they were hardcoded ("2,000+", "350+") and drifted from
 * the truth, which is a bad look on a product whose whole value is accurate data.
 */
export function StatisticsCards({ stats }: { stats: ExamStats }) {
  const cards = [
    {
      icon: Calendar,
      value: stats.exams,
      label: "Exámenes Registrados",
      description: "Disponibles en nuestra base de datos",
    },
    {
      icon: School,
      value: stats.schools,
      label: "Escuelas (Por ahora😁)",
      description: "Conectadas a nuestra plataforma",
    },
    {
      icon: BookOpen,
      value: stats.subjects,
      label: "Asignaturas",
      description: "De todas las escuelas",
    },
  ]

  return (
    <div className="flex flex-wrap justify-center gap-8">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 * index }}
          className="group w-64 h-64"
        >
          <Card className="overflow-hidden border-none bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:bg-emerald-900/50 h-full">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center h-full">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 transition-all duration-300 group-hover:bg-primary/20">
                <card.icon className="h-8 w-8 text-primary" />
              </div>
              <div className="mb-2 text-4xl font-bold tracking-tight">
                <CountUp
                  from={0}
                  to={card.value}
                  separator=","
                  direction="up"
                  duration={2}
                  delay={0.5 + index * 0.2}
                  className="count-up-text"
                />
              </div>
              <div className="mb-1 font-medium text-center">{card.label}</div>
              <div className="text-sm text-muted-foreground text-center">{card.description}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
