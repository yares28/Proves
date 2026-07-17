"use client"

import { motion } from "framer-motion"

/** The animated heading of the statistics section. */
export function SectionHeading() {
  return (
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
        Únete a cientos de estudiantes que usan el Calendario de Exámenes UPV para mantenerse organizados.
      </motion.p>
    </div>
  )
}
