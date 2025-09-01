"use client"

import { Suspense, useState } from "react"
import { CalendarDisplay } from "@/components/calendar-display"
import { FilterSidebar } from "@/components/filter-sidebar"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { StatisticsSection } from "@/components/statistics-section"
import { FilterConnection } from "@/components/filter-connection"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { useAuth } from "@/context/auth-context"
import { AuthRequiredCheck } from "@/components/auth-required-check"
import { AuthStatusIndicator } from "@/components/auth-status-indicator"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"

export default function Home() {
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const { user } = useAuth()
  
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <div className="container mx-auto px-4">
        <AuthStatusIndicator />
      </div>
      <main className="flex-1">
        <HeroSection />
        <Suspense fallback={null}>
          <AuthRequiredCheck />
        </Suspense>
        
        <section className="container mx-auto px-4 py-16 md:px-6 md:py-24 lg:py-32">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Encuentra tus <span className="text-primary">Exámenes</span>
          </h2>
          <FilterConnection />
        </section>
        
        {/* Statistics Section */}
        <StatisticsSection />
        {/* FAQ Section under Confianza de Estudiantes */}
        <section className="container mx-auto px-4 py-16 md:px-6 md:py-24 lg:py-32">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight md:text-4xl">Preguntas frecuentes</h2>
          <div className="mx-auto max-w-3xl">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="q1">
                <AccordionTrigger>
                  ¿Cómo encuentro mis exámenes más rápido?
                </AccordionTrigger>
                <AccordionContent>
                  Usa los filtros por escuela, asignatura y convocatoria en el panel lateral. Los resultados se actualizan al instante en el calendario.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q2">
                <AccordionTrigger>
                  ¿Puedo guardar o exportar mi calendario?
                </AccordionTrigger>
                <AccordionContent>
                  Sí. Haz clic en "Guardar" para crear tu propio calendario y en "Exportar" para descargarlo en formato compatible con Google Calendar o Apple Calendar.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q3">
                <AccordionTrigger>
                  ¿Necesito cuenta para usar la app?
                </AccordionTrigger>
                <AccordionContent>
                  Puedes explorar sin registrarte, pero para guardar calendarios personales o sincronizar en varios dispositivos, necesitas iniciar sesión.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q4">
                <AccordionTrigger>
                  ¿Cómo me aseguro de que las fechas estén actualizadas?
                </AccordionTrigger>
                <AccordionContent>
                  Las fechas se sincronizan con nuestras fuentes oficiales. Si ves algo incorrecto, usa el botón de reporte o vuelve a sincronizar los datos.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q5">
                <AccordionTrigger>
                  ¿Puedo ver solo mis asignaturas?
                </AccordionTrigger>
                <AccordionContent>
                  Sí. Añade tus asignaturas favoritas y aplica el filtro correspondiente para ver únicamente los exámenes relevantes.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q6">
                <AccordionTrigger>
                  ¿Cómo cambio el tema claro/oscuro?
                </AccordionTrigger>
                <AccordionContent>
                  Usa el interruptor de tema en el encabezado. La preferencia se guarda automáticamente en tu dispositivo.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>
      </main>
      <Footer />
      
      {/* Authentication Dialog */}
      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </div>
  )
}
