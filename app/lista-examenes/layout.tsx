import type { Metadata } from 'next'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

/**
 * The page itself is a client component (it drives the three-column drill-down
 * from local state) and so cannot export metadata; this layout is a server
 * component purely so the route can carry its own title and description.
 * Header and Footer are client components, which a server layout may render.
 */
export const metadata: Metadata = {
  title: 'Lista de exámenes por asignatura',
  description:
    'Consulta el listado de exámenes de la UPV por escuela y asignatura: fecha, hora y aula de cada convocatoria, con búsqueda rápida por nombre o acrónimo.',
  alternates: { canonical: '/lista-examenes' },
}

export default function ListaExamenesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
