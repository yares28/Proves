import type { Metadata } from 'next'
import Link from 'next/link'
import { fromSlug } from '@/lib/slug'
import { ExamListView } from '@/components/exam-list-view'

type Props = { params: { faculty: string; degree: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const facultyName = fromSlug(params.faculty)
  const degreeName = fromSlug(params.degree)
  const title = `Calendarios de exámenes UPV ${facultyName} · ${degreeName}`
  const description = `Exámenes de ${degreeName} en ${facultyName} (UPV). Filtra por semestre, año y asignaturas y exporta a tu calendario.`

  return {
    title,
    description,
    alternates: {
      canonical: `/${params.faculty}/${params.degree}/calendarios`,
    },
    openGraph: {
      title,
      description,
      url: `/${params.faculty}/${params.degree}/calendarios`,
      type: 'website',
    },
  }
}

export default function DegreeCalendarsPage({ params }: Props) {
  const facultyName = fromSlug(params.faculty)
  const degreeName = fromSlug(params.degree)

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `¿Dónde ver el calendario de exámenes del grado ${degreeName} (${facultyName})?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Aquí puedes consultar el calendario de exámenes del grado ${degreeName} en ${facultyName}, y exportarlo a Google Calendar.`,
        },
      },
      {
        '@type': 'Question',
        name: '¿Cómo filtrar por semestre y asignaturas?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Usa los filtros laterales para seleccionar semestre, año y asignaturas específicas antes de exportar.',
        },
      },
    ],
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: '/' },
      { '@type': 'ListItem', position: 2, name: facultyName, item: `/${params.faculty}/calendarios` },
      { '@type': 'ListItem', position: 3, name: degreeName, item: `/${params.faculty}/${params.degree}/calendarios` },
    ],
  }

  return (
    <div className="container mx-auto px-4 py-10 md:px-6 md:py-16">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      </head>

      <h1 className="mb-4 text-3xl font-bold md:text-4xl">
        Exámenes {degreeName} · {facultyName} (UPV)
      </h1>
      <p className="mb-8 text-muted-foreground">
        Visualiza y exporta los calendarios de exámenes. Filtra por semestre, año y asignaturas.
      </p>

      <div className="mb-6 text-sm">
        <Link href="/">Inicio</Link> {"/"}
        <Link href={`/${params.faculty}/calendarios`}>{facultyName}</Link> {"/"}
        <span>{degreeName}</span>
      </div>

      <ExamListView activeFilters={{ school: [facultyName], degree: [degreeName] }} />
    </div>
  )
}


