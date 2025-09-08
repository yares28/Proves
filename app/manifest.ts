import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  const name = 'UPV Exam Calendar'
  const short_name = 'UPV-Cal'
  const start_url = '/'
  const theme_color = '#000000'
  const background_color = '#000000'

  return {
    name,
    short_name,
    start_url,
    display: 'standalone',
    theme_color,
    background_color,
    icons: [
      {
        src: '/faviconlight-small.PNG',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo-icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}


