import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/react'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/context/auth-context'
import { SettingsProvider } from '@/context/settings-context'
import { ErrorBoundary } from '@/components/error-boundary'
import { Toaster } from "@/components/ui/toaster"
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Calendario de Exámenes UPV',
    template: '%s | Calendario de Exámenes UPV',
  },
  description: 'Gestiona y organiza tus exámenes universitarios',
  applicationName: 'UPV Exam Calendar',
  keywords: [
    'calendario exámenes',
    'UPV',
    'universidad',
    'exportar calendario',
    'Google Calendar',
  ],
  authors: [{ name: 'UPV-Cal' }],
  creator: 'UPV-Cal',
  publisher: 'UPV-Cal',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: 'Calendario de Exámenes UPV',
    description: 'Gestiona y organiza tus exámenes universitarios',
    siteName: 'UPV-Cal',
    images: [
      {
        url: '/logoYdark.png',
      },
    ],
    locale: 'es_ES',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calendario de Exámenes UPV',
    description: 'Gestiona y organiza tus exámenes universitarios',
    images: ['/logoYdark.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/faviconlight-small.PNG',
    shortcut: '/faviconlight-small.PNG',
    apple: '/faviconlight-small.PNG',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Structured Data for richer AI/search understanding */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'UPVCal',
              url: siteUrl,
              logo: new URL('/logoYdark.png', siteUrl).toString(),
            }),
          }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Calendario de Exámenes UPV',
              url: siteUrl,
              potentialAction: {
                '@type': 'SearchAction',
                target: `${siteUrl}/?q={search_term_string}`,
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'UPV Exam Calendar',
              applicationCategory: 'EducationApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'EUR',
              },
              url: siteUrl,
            }),
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            storageKey="upv-theme"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <SettingsProvider>
                {children}
                <Toaster />
              </SettingsProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}
