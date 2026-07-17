import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { EXAMS_CACHE_TAG } from '@/lib/cache-tags'

export const dynamic = 'force-dynamic'

/**
 * Purges cached exam data. Called by the scraper after it applies a diff, so
 * cached reads live until the data actually changes instead of expiring on a
 * guessed TTL.
 *
 * Auth: `Authorization: Bearer $REVALIDATE_SECRET`. Without the env var set the
 * endpoint refuses every request rather than defaulting to open — an
 * unauthenticated cache purge is a free way to hammer the database.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET

  if (!secret) {
    console.error('REVALIDATE_SECRET is not set; refusing to revalidate.')
    return NextResponse.json({ error: 'Revalidation is not configured' }, { status: 503 })
  }

  const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  revalidateTag(EXAMS_CACHE_TAG)

  return NextResponse.json({ revalidated: EXAMS_CACHE_TAG, at: new Date().toISOString() })
}
