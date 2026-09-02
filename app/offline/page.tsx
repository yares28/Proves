import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sin conexión | Calendario de Exámenes UPV',
  description: 'No hay conexión a internet en este momento.',
  robots: { index: false, follow: false },
}

/**
 * Shown by the service worker when a navigation fails and nothing usable is
 * cached. Deliberately static and dependency-free: it has to render with no
 * network and no data.
 */
export default function OfflinePage() {
  return (
    <main id="main-content" className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex justify-center" aria-hidden="true">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-emerald-700 dark:text-emerald-300"
            >
              <path d="M2 2 22 22" />
              <path d="M8.5 16.5a5 5 0 0 1 7 0" />
              <path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
              <path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76" />
              <path d="M16.85 11.25a10 10 0 0 1 2.22 1.68" />
              <path d="M5 13a10 10 0 0 1 5.24-2.76" />
              <line x1="12" x2="12.01" y1="20" y2="20" />
            </svg>
          </div>
        </div>

        <h1 className="mb-3 text-2xl font-bold tracking-tight">Sin conexión</h1>

        <p className="mb-8 text-muted-foreground">
          No se ha podido cargar esta página porque no hay conexión a internet. Los calendarios que
          hayas consultado antes siguen disponibles sin conexión.
        </p>

        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  )
}
