import type { Metadata } from 'next'
import Link from 'next/link'
import { fromSlug } from '@/lib/slug'
import { ExamListView } from '@/components/exam-list-view'

type Props = { params: { faculty: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const facultyName = fromSlug(params.faculty)
  const title = `Calendarios de exámenes UPV ${facultyName}`
  const description = `Consulta y exporta los calendarios de exámenes de ${facultyName} (UPV). Filtra por grado, semestre y asignaturas.`

  return {
    title,
    description,
    alternates: {
      canonical: `/${params.faculty}/calendarios`,
    },
    openGraph: {
      title,
      description,
      url: `/${params.faculty}/calendarios`,
      type: 'website',
    },
  }
}

export default function FacultyCalendarsPage({ params }: Props) {
  const facultyName = fromSlug(params.faculty)
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `¿Dónde ver el calendario de exámenes de ${facultyName} en la UPV?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `En esta página puedes ver los calendarios de exámenes de ${facultyName}, filtrarlos y exportarlos a Google Calendar o Apple Calendar.`,
        },
      },
      {
        '@type': 'Question',
        name: '¿Cómo exportar mi calendario a Google Calendar?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Aplica tus filtros y usa la opción de exportación para descargar el archivo ICS compatible con Google Calendar.',
        },
      },
    ],
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: '/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: facultyName,
        item: `/${params.faculty}/calendarios`,
      },
    ],
  }

  return (
    <div className="container mx-auto px-4 py-10 md:px-6 md:py-16">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      </head>

      <h1 className="mb-4 text-3xl font-bold md:text-4xl">
        Calendarios de exámenes UPV {facultyName}
      </h1>
      <p className="mb-8 text-muted-foreground">
        Filtra por grado, semestre, año y asignaturas. Exporta a Google Calendar en un clic.
      </p>

      <div className="mb-6 text-sm">
        <Link href="/">Inicio</Link> {"/"} <span>{facultyName}</span>
      </div>

      <ExamListView activeFilters={{ school: [facultyName] }} />
    </div>
  )
}


