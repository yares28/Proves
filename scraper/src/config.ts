/** Central configuration and safety thresholds for the exam sync. */

export const API_BASE =
  process.env.SCRAPER_API_BASE || 'https://apps4.etsinf.upv.es/api/v1/horarios';

/** Every exam served by this API belongs to ETSINF; the column is a constant. */
export const SCHOOL = 'ETSINF';

export const USER_AGENT =
  'UPV-Cal-sync/1.0 (+https://github.com/yares28/Proves; student exam calendar; contact via GitHub issues)';

/**
 * Network behaviour. The upstream is known to have outages, so retries are patient.
 * The env overrides exist so tests can exercise the retry ladder without waiting minutes.
 */
const parseDelays = (raw: string | undefined): number[] | null => {
  if (!raw) return null;
  const parts = raw.split(',').map((s) => Number(s.trim()));
  return parts.every((n) => Number.isFinite(n) && n >= 0) ? parts : null;
};

export const HTTP = {
  timeoutMs: Number(process.env.SCRAPER_TIMEOUT_MS) || 60_000,
  /** Backoff before retry 1/2/3. Total worst case ~6 min per endpoint. */
  retryDelaysMs: parseDelays(process.env.SCRAPER_RETRY_DELAYS_MS) ?? [30_000, 90_000, 240_000],
  /** Guards against a runaway/garbage body. Real payloads are ~0.5 MB. */
  maxBodyBytes: 20 * 1024 * 1024,
  /** Politeness gap between requests in a single run. */
  spacingMs: 2_000,
} as const;

/**
 * Safety gates. Any breach aborts the run *before* writing, leaving prod data
 * untouched (stale data beats corrupted data).
 */
export const GATES = {
  /** Abort if the payload has fewer rows than this absolute floor. */
  minRowsAbsolute: 200,
  /** Abort if the payload has < this fraction of the rows we already have synced. */
  minRowsFraction: 0.4,
  /** Abort if a run would delete more than this fraction of synced rows. */
  maxDeleteFraction: 0.3,
  /** Abort if more than this fraction of rows fail field-level validation. */
  maxQuarantineFraction: 0.05,
} as const;

/** Rows are written in chunks to stay inside PostgREST request limits. */
export const CHUNK_SIZE = 500;

/**
 * Every academic year lives in one table, distinguished by `academic_year`.
 * A new course is rows, not DDL — so the scraper no longer creates tables and
 * production no longer needs an env var flipped to serve them.
 */
export const EXAMS_TABLE = 'exams';

export interface Env {
  supabaseUrl: string;
  serviceRoleKey: string;
  /** Optional: purge the site's cached exam data after a successful write. */
  revalidateUrl?: string;
  revalidateSecret?: string;
}

export function loadEnv(): Env {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const missing: string[] = [];
  if (!supabaseUrl) missing.push('SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)');
  if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        `Set them as GitHub secrets (CI) or in .env.local (local runs).`
    );
  }
  return {
    supabaseUrl,
    serviceRoleKey,
    revalidateUrl: process.env.REVALIDATE_URL || undefined,
    revalidateSecret: process.env.REVALIDATE_SECRET || undefined,
  };
}

/** Human label used in logs and sync_runs (2026 -> "2026-2027"). */
export function yearLabel(startYear: number): string {
  return `${startYear}-${startYear + 1}`;
}
