import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export const metadata: Metadata = {
  title: 'Página no encontrada',
  robots: { index: false, follow: false },
}

/**
 * Replaces the framework's default 404, which was flagged by the heuristic
 * evaluation: it rendered in English on a Spanish site, without the header or
 * footer, and offered no way back — leaving a dead end at the exact moment the
 * user most needs a route out.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main id="main-content" className="flex flex-1 items-center justify-center px-4 py-20">
        <div className="mx-auto max-w-md text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Error 404
          </p>
          <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Esta página no existe
          </h1>
          <p className="mb-8 text-muted-foreground">
            La dirección que has abierto no corresponde a ninguna página de UPV-Cal. Puede que el
            enlace esté desactualizado o que haya un error en la dirección.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto"
            >
              Ir al calendario
            </Link>
            <Link
              href="/lista-examenes"
              className="inline-flex h-10 w-full items-center justify-center rounded-md border border-input px-6 text-sm font-medium ring-offset-background transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto"
            >
              Ver la lista de exámenes
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
