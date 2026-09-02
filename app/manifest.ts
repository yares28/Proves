import type { MetadataRoute } from 'next'

/**
 * Web app manifest. Together with the service worker (public/sw.js) this makes
 * UPV-Cal installable: a student can add it to the home screen and still open
 * their saved exam calendar with no connection, which matters on a campus where
 * coverage inside some buildings is unreliable.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Calendario de Exámenes UPV',
    short_name: 'UPV-Cal',
    description:
      'Consulta, filtra y organiza los calendarios de exámenes de la Universitat Politècnica de València.',
    lang: 'es',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#059669',
    background_color: '#0a0a0a',
    categories: ['education', 'productivity'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
