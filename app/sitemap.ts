import type { MetadataRoute } from 'next'
import { getSchools, getDegrees } from '@/actions/exam-actions'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const staticRoutes: Array<{ path: string; changefreq: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }> = [
    { path: '/', changefreq: 'weekly', priority: 1 },
    { path: '/exams', changefreq: 'weekly', priority: 0.9 },
    { path: '/my-calendars', changefreq: 'monthly', priority: 0.6 },
    { path: '/profile', changefreq: 'monthly', priority: 0.4 },
    { path: '/lista-examenes', changefreq: 'weekly', priority: 0.7 },
  ]

  // Dynamic faculty and degree routes
  const dynamicEntries: { url: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = []

  try {
    const schools = await getSchools()
    for (const school of schools) {
      const facultySlug = school
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')

      // Faculty calendar root
      dynamicEntries.push({
        url: new URL(`/${facultySlug}/calendarios`, siteUrl).toString(),
        changeFrequency: 'weekly',
        priority: 0.8,
      })

      // Degrees for this faculty
      const degrees = await getDegrees(school)
      for (const degree of degrees) {
        const degreeSlug = degree
          .toLowerCase()
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')

        dynamicEntries.push({
          url: new URL(`/${facultySlug}/${degreeSlug}/calendarios`, siteUrl).toString(),
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      }
    }
  } catch (e) {
    console.error('Failed to build dynamic sitemap entries', e)
  }

  const staticMapped = staticRoutes.map(({ path, changefreq, priority }) => ({
    url: new URL(path, siteUrl).toString(),
    changeFrequency: changefreq,
    priority,
  }))

  return [...staticMapped, ...dynamicEntries]
}


