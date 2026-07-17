/**
 * Sync orchestrator: fetch → validate → normalize → gate → diff → apply → audit.
 *
 * Safety model: every write is preceded by gates that abort the run rather than
 * risk corrupting production data. Stale data is always better than wrong data,
 * because the next scheduled run heals it automatically.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { CHUNK_SIZE, EXAMS_TABLE, GATES, yearLabel, type Env } from './config.js';
import { log } from './log.js';
import { fetchExams } from './api.js';
import { fingerprintFields, unknownFields } from './schema.js';
import { COMPARED_FIELDS, normalizeExams, type ExamRecord } from './normalize.js';

export class AbortRun extends Error {}

export interface SyncOptions {
  env: Env;
  year: number | 'current';
  dryRun: boolean;
  tableOverride?: string;
  force: boolean;
  trigger: string;
  /** One-off supervised cleanup of stale pre-sync rows. Never used by the schedule. */
  pruneLegacy?: boolean;
}

export interface SyncCounters {
  fetched: number;
  matched: number;
  inserted: number;
  updated: number;
  /** Live exams that vanished from upstream and were soft-deleted this run. */
  deleted: number;
  /** Previously soft-deleted exams that reappeared upstream and were revived. */
  restored: number;
  merged_duplicates: number;
  quarantined: number;
  unmatched_legacy: number;
}

/** A row as it exists in the DB: legacy rows have no source_key yet. */
export type ExistingRow = Omit<Partial<ExamRecord>, 'source_key'> & {
  id: number;
  source_key: string | null;
  /** Set once the row has been soft-deleted; null/absent while live. */
  deleted_at?: string | null;
};

export interface ChangePlan {
  toInsert: ExamRecord[];
  toUpdate: Array<{ id: number; record: ExamRecord }>;
  /** Live rows no longer in the payload: stamped deleted_at, not removed. */
  toDelete: ExistingRow[];
  matched: number;
  /** Of toUpdate, how many were reviving a soft-deleted row. */
  restored: number;
  unmatchedLegacy: number;
  /** Legacy rows a supervised --prune-legacy run would remove. */
  prunable: ExistingRow[];
}

const chunk = <T>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

/** Normalizes for comparison so null/undefined/'' don't cause phantom updates. */
const cmp = (v: unknown): string => (v === null || v === undefined ? '' : String(v));

function rowsDiffer(a: ExistingRow, b: ExamRecord): boolean {
  return COMPARED_FIELDS.some((f) => cmp(a[f]) !== cmp(b[f]));
}

/**
 * Every row for one academic year. The year scope is what keeps a sync of
 * 2026-2027 from ever seeing — or deleting — 2025-2026's rows now that both
 * live in the same table.
 */
async function fetchAllExisting(
  db: SupabaseClient,
  table: string,
  academicYear: number
): Promise<ExistingRow[]> {
  const rows: ExistingRow[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await db
      .from(table)
      .select('*')
      .eq('academic_year', academicYear)
      .range(from, from + page - 1);
    if (error) throw new Error(`Reading ${table} (${academicYear}) failed: ${error.message}`);
    if (!data?.length) break;
    rows.push(...(data as ExistingRow[]));
    if (data.length < page) break;
  }
  return rows;
}

/**
 * One-time bridge for tables loaded before this pipeline existed: their rows have
 * no source_key, so match them to API rows on natural keys and adopt them instead
 * of inserting duplicates. Rows that never match (e.g. degrees this API doesn't
 * serve) are left completely alone.
 */
function reconcileLegacy(
  existing: ExistingRow[],
  records: ExamRecord[]
): Map<string, ExistingRow> {
  const adopted = new Map<string, ExistingRow>();
  const legacy = existing.filter((r) => !r.source_key);
  if (!legacy.length) return adopted;

  // A record already matched to a real synced row must never be reconsidered
  // here: two sittings of the same exam on the same day (a resit, a second
  // group) share code+degree+date and only differ by time, so the loose match
  // below can land on a *different* row than the one this record already owns.
  // Redirecting it would try to stamp that row's source_key onto the legacy
  // row too, and fail the unique constraint on write — this is what happened
  // with FPR/GIAR/2026-01-09 (08:00, matched) colliding with a stale 11:00
  // sitting (id 218, unmatched) sharing the same code.
  const alreadyMatched = new Set(
    existing.filter((r) => r.source_key).map((r) => r.source_key as string)
  );

  const index = new Map<string, ExistingRow[]>();
  const add = (k: string, r: ExistingRow) => {
    const list = index.get(k);
    if (list) list.push(r);
    else index.set(k, [r]);
  };
  for (const r of legacy) {
    add(`${r.code}|${r.degree}|${r.exam_date}|${cmp(r.exam_time)}`, r);
    add(`${r.code}|${r.degree}|${r.exam_date}`, r);
  }

  const claimed = new Set<number>();
  for (const rec of records) {
    if (alreadyMatched.has(rec.source_key)) continue;

    const precise = index.get(`${rec.code}|${rec.degree}|${rec.exam_date}|${cmp(rec.exam_time)}`);
    let candidates = precise?.filter((r) => !claimed.has(r.id)) ?? [];

    if (candidates.length !== 1) {
      const loose = index.get(`${rec.code}|${rec.degree}|${rec.exam_date}`);
      candidates = loose?.filter((r) => !claimed.has(r.id)) ?? [];
    }

    if (candidates.length === 1 && candidates[0]) {
      claimed.add(candidates[0].id);
      adopted.set(rec.source_key, candidates[0]);
    } else if (candidates.length > 1) {
      log.warn(
        'legacy_ambiguous',
        'Multiple legacy rows match one API exam; leaving them untouched and inserting fresh',
        { code: rec.code, degree: rec.degree, exam_date: rec.exam_date }
      );
    }
  }

  log.info('reconcile', 'Adopted legacy rows into the sync', {
    legacy_rows: legacy.length,
    adopted: adopted.size,
    left_alone: legacy.length - adopted.size,
  });
  return adopted;
}

/**
 * Pre-write safety gates. These decide whether the payload is trustworthy at all;
 * every breach aborts before a single row is touched.
 */
export function assertPayloadSane(args: {
  rawCount: number;
  usableCount: number;
  quarantined: number;
  syncedExistingCount: number;
  label: string;
  table: string;
}): void {
  const { rawCount, usableCount, quarantined, syncedExistingCount, label, table } = args;

  if (rawCount === 0) {
    throw new AbortRun(
      `Upstream returned zero exams for ${label}. Treating it as an upstream glitch and leaving ${table} untouched.`
    );
  }
  if (quarantined / Math.max(rawCount, 1) > GATES.maxQuarantineFraction) {
    throw new AbortRun(
      `${quarantined}/${rawCount} rows failed validation (> ${GATES.maxQuarantineFraction * 100}%). Aborting: the upstream format likely changed.`
    );
  }
  if (syncedExistingCount > 0 && usableCount < GATES.minRowsAbsolute) {
    throw new AbortRun(
      `Only ${usableCount} usable rows (< floor ${GATES.minRowsAbsolute}) while ${table} already holds ${syncedExistingCount} synced rows. Aborting.`
    );
  }
  if (syncedExistingCount > 0 && usableCount < syncedExistingCount * GATES.minRowsFraction) {
    throw new AbortRun(
      `Payload shrank suspiciously: ${usableCount} rows vs ${syncedExistingCount} synced (< ${GATES.minRowsFraction * 100}%). Aborting.`
    );
  }
}

/**
 * Pure diff: decides inserts/updates/deletes from the normalized payload and the
 * current table contents. Rows without a source_key (loaded before this pipeline
 * existed, or belonging to degrees this API doesn't serve) are adopted when they
 * clearly match an upstream exam, and otherwise left strictly alone.
 */
export function planChanges(
  records: ExamRecord[],
  existing: ExistingRow[],
  force = false,
  pruneLegacy = false
): ChangePlan {
  const adopted = reconcileLegacy(existing, records);
  const bySourceKey = new Map<string, ExistingRow>();
  for (const r of existing) if (r.source_key) bySourceKey.set(r.source_key, r);
  for (const [key, row] of adopted) bySourceKey.set(key, row);

  const toInsert: ExamRecord[] = [];
  const toUpdate: Array<{ id: number; record: ExamRecord }> = [];
  const seen = new Set<string>();
  let matched = 0;
  let restored = 0;

  for (const rec of records) {
    seen.add(rec.source_key);
    const match = bySourceKey.get(rec.source_key);
    if (!match) {
      toInsert.push(rec);
      continue;
    }
    matched++;
    // A reappeared exam (deleted_at set) must be revived even if nothing else
    // changed, so the deleted-but-identical case cannot be skipped. The apply
    // step clears deleted_at on every update, so it is enough to enqueue one.
    const reappeared = Boolean(match.deleted_at);
    if (rowsDiffer(match, rec) || !match.source_key || reappeared) {
      toUpdate.push({ id: match.id, record: rec });
      if (reappeared) restored++;
    }
  }

  const syncedExisting = existing.filter((r) => r.source_key);
  // Only live rows can disappear; a row already soft-deleted must not be
  // re-stamped every run (it would churn deleted_at and the delete count).
  const toDelete = syncedExisting.filter(
    (r) => r.source_key && !seen.has(r.source_key) && !r.deleted_at
  );

  /**
   * Legacy rows left over in degrees this API *does* serve are stale or duplicated
   * (a cancelled exam, or a second row that lost an ambiguous match). Degrees the
   * API never serves — GDAI, GFA — come from elsewhere and are never prunable.
   */
  const servedDegrees = new Set(records.map((r) => r.degree));
  const adoptedIds = new Set([...adopted.values()].map((r) => r.id));
  const prunable = existing.filter(
    (r) => !r.source_key && !adoptedIds.has(r.id) && r.degree && servedDegrees.has(r.degree)
  );

  if (pruneLegacy && prunable.length) {
    log.warn(
      'pruning_legacy',
      `--prune-legacy: removing ${prunable.length} stale pre-sync rows in degrees the API serves`,
      prunable.slice(0, 3).map((r) => ({ id: r.id, degree: r.degree, date: r.exam_date }))
    );
    toDelete.push(...prunable);
  }

  // Guard against a mass disappearance. The denominator is live synced rows —
  // already-deleted rows are not at risk, and prunable legacy rows only when a
  // supervised --prune-legacy run is actually removing them.
  const liveSynced = syncedExisting.filter((r) => !r.deleted_at).length;
  const deletable = pruneLegacy ? liveSynced + prunable.length : liveSynced;
  if (deletable > 0 && toDelete.length > deletable * GATES.maxDeleteFraction && !force) {
    throw new AbortRun(
      `Would delete ${toDelete.length}/${deletable} rows (> ${GATES.maxDeleteFraction * 100}%). Aborting; re-run with --force if this is genuinely correct.`
    );
  }

  return {
    toInsert,
    toUpdate,
    toDelete,
    matched,
    restored,
    unmatchedLegacy: existing.filter((r) => !r.source_key).length - adopted.size,
    prunable,
  };
}

export async function runSync(opts: SyncOptions): Promise<{ counters: SyncCounters; status: string }> {
  const startedAt = Date.now();
  const db = createClient(opts.env.supabaseUrl, opts.env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // "current" defers to the API's own notion of the active year (endpoint /0).
  const requested = opts.year === 'current' ? 0 : opts.year;
  const envelope = await fetchExams(requested);
  const academicYear = envelope.data.cursoAcademico;
  const rawRows = envelope.data.examenes;

  if (opts.year !== 'current' && academicYear !== opts.year) {
    throw new Error(
      `Requested year ${opts.year} but the API returned ${academicYear}; the year parameter's meaning may have changed.`
    );
  }

  // One table for every year; --table-override exists so a run can be pointed at
  // a scratch copy without touching production.
  const table = opts.tableOverride ?? EXAMS_TABLE;
  const label = yearLabel(academicYear);
  log.info('sync', 'Starting sync', { year: academicYear, label, table, dryRun: opts.dryRun });

  // Contract drift that still parses: new fields upstream.
  const extra = unknownFields(rawRows as unknown as Array<Record<string, unknown>>);
  if (extra.length) {
    log.warn('unknown_fields', `Upstream added fields we ignore: ${extra.join(', ')}`, extra);
  }
  const fingerprint = fingerprintFields(rawRows as unknown as Array<Record<string, unknown>>);

  const { records, quarantined, mergedDuplicates } = normalizeExams(rawRows, academicYear);

  const counters: SyncCounters = {
    fetched: rawRows.length,
    matched: 0,
    inserted: 0,
    updated: 0,
    deleted: 0,
    restored: 0,
    merged_duplicates: mergedDuplicates,
    quarantined,
    unmatched_legacy: 0,
  };

  // ---- Gates + diff: refuse to write anything that looks like bad upstream data ----

  const existing = await fetchAllExisting(db, table, academicYear);
  const syncedExisting = existing.filter((r) => r.source_key);

  assertPayloadSane({
    rawCount: rawRows.length,
    usableCount: records.length,
    quarantined,
    syncedExistingCount: syncedExisting.length,
    label,
    table,
  });

  const { toInsert, toUpdate, toDelete, matched, restored, unmatchedLegacy, prunable } = planChanges(
    records,
    existing,
    opts.force,
    opts.pruneLegacy
  );

  counters.matched = matched;
  counters.restored = restored;
  counters.unmatched_legacy = unmatchedLegacy;

  if (prunable.length && !opts.pruneLegacy) {
    log.info('reconcile', 'Stale pre-sync rows found in degrees the API serves', {
      prunable: prunable.length,
      hint: 'Review them, then run once with --prune-legacy to remove them. Rows in degrees the API does not serve are never prunable.',
    });
  }
  counters.inserted = toInsert.length;
  counters.updated = toUpdate.length;
  counters.deleted = toDelete.length;

  log.info('diff', 'Diff computed', {
    ...counters,
    unchanged: counters.matched - counters.updated,
  });

  if (opts.dryRun) {
    log.info('dry-run', 'No changes written (dry run)', {
      sample_insert: toInsert[0] ?? null,
      sample_update: toUpdate[0]?.record ?? null,
      sample_delete: toDelete[0]?.source_key ?? null,
    });
    await recordRun(db, opts, { academicYear, label, table, counters, status: 'dry-run', fingerprint, startedAt });
    return { counters, status: 'dry-run' };
  }

  // ---- Apply: writes before deletes, so a crash can only leave extra rows ----

  const now = new Date().toISOString();

  for (const part of chunk(toUpdate, CHUNK_SIZE)) {
    for (const { id, record } of part) {
      const { error } = await db
        .from(table)
        // deleted_at: null revives a reappeared exam; a no-op for live rows.
        .update({ ...record, synced_at: now, deleted_at: null })
        .eq('id', id);
      if (error) throw new Error(`Update of exams.id=${id} failed: ${error.message}`);
    }
  }

  for (const part of chunk(toInsert, CHUNK_SIZE)) {
    const { error } = await db.from(table).insert(part.map((r) => ({ ...r, synced_at: now })));
    if (error) throw new Error(`Insert of ${part.length} rows failed: ${error.message}`);
  }

  // Soft delete: an exam gone from upstream is stamped, not removed, so the
  // history survives and it revives on its own if upstream brings it back.
  for (const part of chunk(toDelete, CHUNK_SIZE)) {
    const { error } = await db
      .from(table)
      .update({ deleted_at: now })
      .in('id', part.map((r) => r.id));
    if (error) throw new Error(`Soft delete of ${part.length} rows failed: ${error.message}`);
  }

  await storeSnapshot(db, { academicYear, runId: null, rawRows });

  log.info('apply', 'Changes written', counters);
  await recordRun(db, opts, { academicYear, label, table, counters, status: 'success', fingerprint, startedAt });

  // The site caches exam reads until told otherwise, so a write that nobody
  // announces stays invisible for up to an hour.
  if (counters.inserted || counters.updated || counters.deleted || counters.restored) {
    await revalidateSite(opts.env);
  }

  return { counters, status: 'success' };
}

/** Keep this many raw snapshots per academic year; older ones are pruned. */
const SNAPSHOT_HISTORY = 24;

/**
 * Stores the run's raw upstream payload so a past state can be replayed without
 * re-fetching, and prunes the oldest beyond SNAPSHOT_HISTORY. Best-effort: the
 * exam data is already written and correct, so a snapshot failure is a warning,
 * never a failed sync.
 */
export async function storeSnapshot(
  db: SupabaseClient,
  args: { academicYear: number; runId: string | null; rawRows: unknown[] }
): Promise<void> {
  try {
    const { error } = await db.from('sync_snapshots').insert({
      run_id: args.runId,
      academic_year: args.academicYear,
      row_count: args.rawRows.length,
      payload: args.rawRows,
    });
    if (error) {
      log.warn('snapshot_failed', `Could not store the raw snapshot: ${error.message}`);
      return;
    }

    const { data: old } = await db
      .from('sync_snapshots')
      .select('id')
      .eq('academic_year', args.academicYear)
      .order('captured_at', { ascending: false })
      .range(SNAPSHOT_HISTORY, SNAPSHOT_HISTORY + 999);
    const staleIds = (old ?? []).map((r: { id: string }) => r.id);
    if (staleIds.length) {
      await db.from('sync_snapshots').delete().in('id', staleIds);
    }
  } catch (err) {
    log.warn('snapshot_failed', `Snapshot step failed: ${(err as Error).message}`);
  }
}

/**
 * Purges the site's cached exam data. Best-effort: the database is already
 * correct, and the cache expires on its own, so a failure here is a warning
 * rather than a failed sync.
 */
export async function revalidateSite(env: Env): Promise<void> {
  if (!env.revalidateUrl || !env.revalidateSecret) {
    log.info('revalidate', 'Skipped: REVALIDATE_URL/REVALIDATE_SECRET not set', {
      hint: 'Without this the site serves cached exam data until the hourly backstop expires.',
    });
    return;
  }

  try {
    const response = await fetch(env.revalidateUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.revalidateSecret}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      log.warn('revalidate_failed', `Cache purge returned ${response.status}`, {
        url: env.revalidateUrl,
      });
      return;
    }
    log.info('revalidate', 'Site cache purged');
  } catch (err) {
    log.warn('revalidate_failed', `Cache purge failed: ${(err as Error).message}`);
  }
}

export async function recordRun(
  db: SupabaseClient,
  opts: SyncOptions,
  info: {
    academicYear: number | null;
    label: string | null;
    table: string | null;
    counters: Partial<SyncCounters>;
    status: string;
    fingerprint?: string;
    startedAt: number;
    error?: string;
  }
): Promise<void> {
  // No table_name: there is one exams table now, and academic_year identifies
  // what a run touched.
  const row = {
    finished_at: new Date().toISOString(),
    trigger: opts.trigger,
    academic_year: info.academicYear,
    year_label: info.label,
    status: info.status,
    ...info.counters,
    warnings: log.collected(),
    error: info.error ?? null,
    api_fingerprint: info.fingerprint ?? null,
    duration_ms: Date.now() - info.startedAt,
  };

  const { error } = await db.from('sync_runs').insert(row);
  if (error) {
    // Never mask the real outcome because the audit insert failed.
    // A missing table makes PostgREST answer 404 with an empty body, which
    // supabase-js surfaces as an error object with no properties at all — so an
    // empty error almost always means the migration hasn't been applied here.
    const detail = error.message || error.details || error.hint || '';
    const looksEmpty = !detail && !error.code;
    log.error(
      'audit',
      looksEmpty
        ? 'Could not write the sync_runs row: the table appears to be missing. Apply scraper/sql/002_unified_exams.sql to this Supabase project.'
        : `Could not write the sync_runs row: ${detail || JSON.stringify(error)}`,
      error.code ? { code: error.code } : undefined
    );
  }
}

export function makeClient(env: Env): SupabaseClient {
  return createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
