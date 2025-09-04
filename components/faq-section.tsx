"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { HelpCircle } from "lucide-react"

const faqs = [
  {
    question: "¿Cómo puedo encontrar mis exámenes?",
    answer: "Puedes usar los filtros en la barra lateral para seleccionar tu escuela, carrera, semestre y año. Una vez seleccionados, verás todos los exámenes disponibles que coincidan con tus criterios."
  },
  {
    question: "¿Puedo guardar mi calendario personalizado?",
    answer: "Sí, una vez que hayas aplicado los filtros que necesitas, puedes hacer clic en 'Guardar Calendario' para crear una versión personalizada que podrás acceder fácilmente en el futuro."
  },
  {
    question: "¿Los datos están actualizados?",
    answer: "Nuestra base de datos se actualiza regularmente con la información más reciente de la UPV. Trabajamos directamente con las escuelas para asegurar que tengas acceso a las fechas de examen más actuales."
  },
  {
    question: "¿Puedo exportar mi calendario?",
    answer: "Sí, puedes exportar tu calendario filtrado en formato ICS para importarlo en Google Calendar, Apple Calendar, Outlook u otras aplicaciones de calendario."
  },
  {
    question: "¿Es gratuito usar esta plataforma?",
    answer: "Absolutamente. El Calendario de Exámenes UPV es completamente gratuito para todos los estudiantes. No hay costos ocultos ni suscripciones premium."
  },
  {
    question: "¿Qué hago si no encuentro mi escuela o carrera?",
    answer: "Si no encuentras tu escuela o carrera en la lista, por favor contáctanos. Estamos constantemente agregando nuevas escuelas y carreras a nuestra plataforma."
  }
]

export function FAQSection() {
  return (
    <section className="border-t bg-background py-24 md:py-32">

      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-16 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl"
          >
            Preguntas <span className="text-primary">Frecuentes</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto max-w-2xl text-lg text-muted-foreground"
          >
            Encuentra respuestas a las preguntas más comunes sobre el Calendario de Exámenes UPV.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mx-auto max-w-4xl"
        >
          <Card className="rounded-xl border bg-card shadow-lg">
            <CardContent className="p-8">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 * index }}
                  >
                    <AccordionItem value={`item-${index}`} className="border-b border-border/50 last:border-b-0">
                      <AccordionTrigger className="text-left font-medium hover:no-underline py-6">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-6">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
