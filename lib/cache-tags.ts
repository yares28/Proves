/**
 * Cache tags shared between the data layer and the revalidation endpoint.
 *
 * Lives outside `actions/` because files marked "use server" may only export
 * async functions — a plain constant there is a build error.
 */

/**
 * Everything derived from the `exams` table: exam lists, filter options,
 * academic years, statistics. Exam data only changes when the scraper applies a
 * diff, so the scraper calls /api/revalidate to purge this tag rather than us
 * guessing a TTL.
 */
export const EXAMS_CACHE_TAG = 'exams'
