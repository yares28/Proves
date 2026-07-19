"use server"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createClient as createServerAnonClient } from "@/lib/supabase/server"
import { currentAcademicYear } from "@/lib/academic-year"
import pkg from "@/package.json"

/**
 * Data-audit report for the app owner.
 *
 * This is admin-only tooling: it reads the whole `exams` table plus the
 * service-role-only `sync_runs` / `sync_snapshots` bookkeeping to answer three
 * questions an audit page should answer —
 *
 *   1. Is the data correct?   → integrity checks (missing fields, duplicates,
 *      implausible dates, unmanaged rows).
 *   2. What versions exist?   → one row per academic year, plus the sync-run
 *      history (each run is a version of the dataset) and raw snapshots.
 *   3. How do versions differ? → each sync run records inserted/updated/deleted/
 *      restored counts, i.e. the diff it applied.
 *
 * Access is gated twice: the caller's session tokens are re-validated against
 * the Supabase auth server, and the resulting email must be in ADMIN_EMAILS.
 * Only then are the service-role queries run.
 */

export type Severity = "ok" | "info" | "warn" | "fail"

export interface AuditCheck {
  id: string
  label: string
  description: string
  severity: Severity
  count: number
  /** A few example values, for checks where seeing the offenders helps. */
  sample?: string[]
}

export interface AuditYear {
  year: number
  label: string
  live: number
  deleted: number
  schools: number
  degrees: number
  subjects: number
  minDate: string | null
  maxDate: string | null
}

export interface AuditSyncRun {
  id: string
  startedAt: string | null
  finishedAt: string | null
  trigger: string | null
  yearLabel: string | null
  status: string | null
  fetched: number
  inserted: number
  updated: number
  deleted: number
  restored: number
  quarantined: number
  durationMs: number | null
  error: string | null
}

export interface AuditSnapshot {
  id: string
  capturedAt: string | null
  academicYear: number | null
  rowCount: number
}

export type AuditResult =
  | { ok: true; report: AuditReport }
  | { ok: false; reason: "unauthorized" | "not_configured" | "error"; message?: string }

export interface AuditReport {
  generatedAt: string
  environment: {
    appVersion: string
    nextVersion: string
    nodeEnv: string
    siteUrl: string
    supabaseProject: string
  }
  overview: {
    totalExams: number
    liveExams: number
    deletedExams: number
    academicYears: number[]
    currentAcademicYear: number
    schools: number
    degrees: number
    subjects: number
    userCalendars: number | null
    calendarTokens: number | null
    expiredTokens: number | null
    lastSync: { at: string | null; status: string | null; trigger: string | null } | null
  }
  years: AuditYear[]
  checks: AuditCheck[]
  syncRuns: AuditSyncRun[]
  snapshots: AuditSnapshot[]
  notes: string[]
}

interface ExamRow {
  id: number
  academic_year: number
  school: string | null
  degree: string | null
  subject: string | null
  subject_va: string | null
  subject_en: string | null
  acronym: string | null
  exam_date: string | null
  exam_time: string | null
  duration_minutes: number | null
  duration_day: string | null
  year: number | null
  semester: string | null
  code: number | null
  source_key: string | null
  synced_at: string | null
  deleted_at: string | null
}

const EXAM_AUDIT_COLUMNS =
  "id, academic_year, school, degree, subject, subject_va, subject_en, acronym, " +
  "exam_date, exam_time, duration_minutes, duration_day, year, semester, code, " +
  "source_key, synced_at, deleted_at"

/** A service-role client. Bypasses RLS, so it can read soft-deleted rows and the sync tables. */
function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Audit is not configured: SUPABASE_SERVICE_ROLE_KEY is missing.")
  }
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * Re-validates the caller's tokens against the Supabase auth server and checks
 * the email against the allowlist. Returns the email on success; throws a
 * sentinel `UNAUTHORIZED` / `NOT_CONFIGURED` otherwise (the UI maps these to a
 * denied / misconfigured state without leaking anything else).
 */
async function assertAdmin(accessToken?: string, refreshToken?: string): Promise<string> {
  const allow = adminEmails()
  if (allow.length === 0) throw new Error("NOT_CONFIGURED")

  const supabase = await createServerAnonClient()
  if (accessToken && refreshToken) {
    await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const email = user?.email?.toLowerCase()
  if (!email || !allow.includes(email)) throw new Error("UNAUTHORIZED")
  return email
}

/** Fetches every `exams` row (all academic years, incl. soft-deleted) in pages. */
async function fetchAllExams(db: ReturnType<typeof serviceClient>): Promise<ExamRow[]> {
  const pageSize = 1000
  let from = 0
  const rows: ExamRow[] = []
  // Bounded so a runaway never loops forever.
  for (let page = 0; page < 100; page++) {
    const { data, error } = await db
      .from("exams")
      .select(EXAM_AUDIT_COLUMNS)
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1)
    if (error) throw new Error(`Failed to read exams: ${error.message}`)
    const batch = (data ?? []) as unknown as ExamRow[]
    rows.push(...batch)
    if (batch.length < pageSize) break
    from += pageSize
  }
  return rows
}

const blank = (v: string | null | undefined) => !v || v.trim() === ""
const isLive = (e: ExamRow) => e.deleted_at === null

function severityRank(s: Severity): number {
  return { fail: 3, warn: 2, info: 1, ok: 0 }[s]
}

function buildChecks(exams: ExamRow[], lastSyncAt: string | null): AuditCheck[] {
  const live = exams.filter(isLive)
  const checks: AuditCheck[] = []

  const push = (
    id: string,
    label: string,
    description: string,
    offenders: ExamRow[],
    severityIfAny: Severity,
    describe: (e: ExamRow) => string = (e) => `${e.subject ?? "?"} · ${e.exam_date ?? "?"}`,
  ) => {
    const count = offenders.length
    checks.push({
      id,
      label,
      description,
      severity: count === 0 ? "ok" : severityIfAny,
      count,
      sample: count > 0 ? offenders.slice(0, 5).map(describe) : undefined,
    })
  }

  // Correctness — things that should never happen.
  push(
    "blank_subject",
    "Blank subject",
    "Live exams whose subject name is empty. Subject is the canonical identity of a row.",
    live.filter((e) => blank(e.subject)),
    "fail",
  )
  push(
    "blank_acronym",
    "Blank acronym",
    "Live exams with no acronym. Acronym is required to disambiguate subjects across degrees.",
    live.filter((e) => blank(e.acronym)),
    "warn",
  )

  // Duplicate upstream identity — the DB has a unique index, so this should be 0.
  const bySourceKey = new Map<string, ExamRow[]>()
  for (const e of live) {
    if (!e.source_key) continue
    const arr = bySourceKey.get(e.source_key) ?? []
    arr.push(e)
    bySourceKey.set(e.source_key, arr)
  }
  const dupSourceKey = [...bySourceKey.values()].filter((g) => g.length > 1).flat()
  push(
    "duplicate_source_key",
    "Duplicate source key",
    "Live exams sharing an upstream source_key. Enforced unique in the DB — any hit is a real anomaly.",
    dupSourceKey,
    "fail",
    (e) => `${e.source_key} · ${e.subject ?? "?"}`,
  )

  // Probable duplicate rows (same course, same slot).
  const bySlot = new Map<string, ExamRow[]>()
  for (const e of live) {
    const k = [e.academic_year, e.school, e.degree, e.acronym, e.subject, e.exam_date, e.exam_time]
      .map((x) => x ?? "")
      .join("|")
    const arr = bySlot.get(k) ?? []
    arr.push(e)
    bySlot.set(k, arr)
  }
  const dupSlots = [...bySlot.values()].filter((g) => g.length > 1).flat()
  push(
    "duplicate_exam",
    "Possible duplicate exams",
    "Live exams identical in year, school, degree, subject, date and time. Usually a double-load.",
    dupSlots,
    "warn",
  )

  // Implausible dates: the exam's calendar year should be the academic year or the next.
  push(
    "date_out_of_range",
    "Date outside academic year",
    "Live exams whose date falls outside [academic_year, academic_year+1]. Points to a bad date.",
    live.filter((e) => {
      if (!e.exam_date) return false
      const y = Number(e.exam_date.slice(0, 4))
      return Number.isFinite(y) && (y < e.academic_year || y > e.academic_year + 1)
    }),
    "warn",
  )

  // Completeness — informational, not necessarily wrong.
  push(
    "missing_time",
    "Missing exam time",
    "Live exams with no start time. They render as all-day events.",
    live.filter((e) => blank(e.exam_time)),
    "info",
  )
  push(
    "missing_duration",
    "Missing duration",
    "Live exams with neither a duration in minutes nor a multi-day marker. Defaults to 2h in the feed.",
    live.filter((e) => e.duration_minutes == null && blank(e.duration_day)),
    "info",
  )
  push(
    "missing_va",
    "Missing Valencià translation",
    "Live exams with no subject_va. The trilingual UI falls back to Castellano.",
    live.filter((e) => blank(e.subject_va)),
    "info",
  )
  push(
    "missing_en",
    "Missing English translation",
    "Live exams with no subject_en. The trilingual UI falls back to Castellano.",
    live.filter((e) => blank(e.subject_en)),
    "info",
  )

  // Sync provenance.
  push(
    "unmanaged_rows",
    "Manually-loaded rows",
    "Live rows with no source_key: not managed by the scraper (e.g. the ETSA set). Syncs never touch these.",
    live.filter((e) => e.source_key == null),
    "info",
    (e) => `${e.school ?? "?"} · ${e.subject ?? "?"}`,
  )
  push(
    "managed_unsynced",
    "Managed but never synced",
    "Live rows that have a source_key but no synced_at timestamp. Expected empty after a healthy sync.",
    live.filter((e) => e.source_key != null && e.synced_at == null),
    "warn",
  )

  // Soft-deleted history (informational).
  const deleted = exams.filter((e) => e.deleted_at !== null)
  checks.push({
    id: "soft_deleted",
    label: "Soft-deleted exams",
    description:
      "Exams stamped deleted_at because they vanished upstream. Kept for history; hidden from the app.",
    severity: deleted.length === 0 ? "ok" : "info",
    count: deleted.length,
    sample:
      deleted.length > 0
        ? deleted.slice(0, 5).map((e) => `${e.subject ?? "?"} · ${e.exam_date ?? "?"}`)
        : undefined,
  })

  // Freshness of the sync itself.
  const STALE_DAYS = 8
  let staleSeverity: Severity = "ok"
  let staleCount = 0
  let staleNote = "Last sync is recent."
  if (!lastSyncAt) {
    staleSeverity = "warn"
    staleCount = 1
    staleNote = "No sync run on record."
  } else {
    const ageDays = (Date.now() - new Date(lastSyncAt).getTime()) / (1000 * 60 * 60 * 24)
    if (ageDays > STALE_DAYS) {
      staleSeverity = "warn"
      staleCount = 1
      staleNote = `Last sync was ${Math.floor(ageDays)} days ago.`
    }
  }
  checks.push({
    id: "stale_sync",
    label: "Sync freshness",
    description: `Warns when the most recent sync run is older than ${STALE_DAYS} days.`,
    severity: staleSeverity,
    count: staleCount,
    sample: staleSeverity === "ok" ? undefined : [staleNote],
  })

  return checks.sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
}

function buildYears(exams: ExamRow[]): AuditYear[] {
  const byYear = new Map<number, ExamRow[]>()
  for (const e of exams) {
    const arr = byYear.get(e.academic_year) ?? []
    arr.push(e)
    byYear.set(e.academic_year, arr)
  }
  return [...byYear.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, rows]) => {
      const live = rows.filter(isLive)
      const dates = live.map((e) => e.exam_date).filter((d): d is string => !!d).sort()
      return {
        year,
        label: `${year}-${year + 1}`,
        live: live.length,
        deleted: rows.length - live.length,
        schools: new Set(live.map((e) => e.school)).size,
        degrees: new Set(live.map((e) => e.degree)).size,
        subjects: new Set(live.map((e) => `${e.subject}|${e.acronym}`)).size,
        minDate: dates[0] ?? null,
        maxDate: dates[dates.length - 1] ?? null,
      }
    })
}

export async function getAuditReport(params: {
  accessToken?: string
  refreshToken?: string
}): Promise<AuditResult> {
  try {
    await assertAdmin(params.accessToken, params.refreshToken)
  } catch (e) {
    const msg = e instanceof Error ? e.message : ""
    if (msg === "NOT_CONFIGURED") return { ok: false, reason: "not_configured" }
    return { ok: false, reason: "unauthorized" }
  }

  try {
    const report = await buildReport()
    return { ok: true, report }
  } catch (e) {
    return { ok: false, reason: "error", message: e instanceof Error ? e.message : "Unknown error" }
  }
}

async function buildReport(): Promise<AuditReport> {
  const db = serviceClient()
  const notes: string[] = []

  const exams = await fetchAllExams(db)
  const live = exams.filter(isLive)

  // Sync bookkeeping tables are service-role only and may be empty / absent if
  // the scraper migrations haven't been applied. Degrade gracefully.
  let syncRuns: AuditSyncRun[] = []
  try {
    const { data, error } = await db
      .from("sync_runs")
      .select(
        "id, started_at, finished_at, trigger, year_label, status, fetched, inserted, updated, deleted, restored, quarantined, duration_ms, error",
      )
      .order("started_at", { ascending: false })
      .limit(50)
    if (error) throw error
    syncRuns = (data ?? []).map((r: any) => ({
      id: r.id,
      startedAt: r.started_at ?? null,
      finishedAt: r.finished_at ?? null,
      trigger: r.trigger ?? null,
      yearLabel: r.year_label ?? null,
      status: r.status ?? null,
      fetched: r.fetched ?? 0,
      inserted: r.inserted ?? 0,
      updated: r.updated ?? 0,
      deleted: r.deleted ?? 0,
      restored: r.restored ?? 0,
      quarantined: r.quarantined ?? 0,
      durationMs: r.duration_ms ?? null,
      error: r.error ?? null,
    }))
  } catch {
    notes.push("sync_runs is unavailable (table missing or empty) — no sync history to show.")
  }

  let snapshots: AuditSnapshot[] = []
  try {
    const { data, error } = await db
      .from("sync_snapshots")
      .select("id, captured_at, academic_year, row_count")
      .order("captured_at", { ascending: false })
      .limit(50)
    if (error) throw error
    snapshots = (data ?? []).map((s: any) => ({
      id: s.id,
      capturedAt: s.captured_at ?? null,
      academicYear: s.academic_year ?? null,
      rowCount: s.row_count ?? 0,
    }))
  } catch {
    notes.push("sync_snapshots is unavailable (table missing or empty) — no raw snapshots to show.")
  }

  // User-data bookkeeping (best-effort).
  let userCalendars: number | null = null
  let calendarTokens: number | null = null
  let expiredTokens: number | null = null
  try {
    const { count } = await db.from("user_calendars").select("id", { count: "exact", head: true })
    userCalendars = count ?? 0
  } catch {
    /* ignore */
  }
  try {
    const { count } = await db.from("calendar_tokens").select("id", { count: "exact", head: true })
    calendarTokens = count ?? 0
    const { count: expired } = await db
      .from("calendar_tokens")
      .select("id", { count: "exact", head: true })
      .lt("expires_at", new Date().toISOString())
    expiredTokens = expired ?? 0
  } catch {
    /* ignore */
  }

  const lastSync = syncRuns[0] ?? null
  const checks = buildChecks(exams, lastSync?.startedAt ?? null)
  const years = buildYears(exams)

  const supabaseHost = (() => {
    try {
      return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").host
    } catch {
      return "unknown"
    }
  })()

  const appVersion = pkg.version ?? "unknown"
  const nextVersion =
    (pkg.dependencies as Record<string, string> | undefined)?.next?.replace(/^[^\d]*/, "") ??
    "unknown"

  return {
    generatedAt: new Date().toISOString(),
    environment: {
      appVersion,
      nextVersion,
      nodeEnv: process.env.NODE_ENV ?? "unknown",
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "unknown",
      supabaseProject: supabaseHost,
    },
    overview: {
      totalExams: exams.length,
      liveExams: live.length,
      deletedExams: exams.length - live.length,
      academicYears: [...new Set(exams.map((e) => e.academic_year))].sort((a, b) => b - a),
      currentAcademicYear: currentAcademicYear(),
      schools: new Set(live.map((e) => e.school)).size,
      degrees: new Set(live.map((e) => e.degree)).size,
      subjects: new Set(live.map((e) => `${e.subject}|${e.acronym}`)).size,
      userCalendars,
      calendarTokens,
      expiredTokens,
      lastSync: lastSync
        ? { at: lastSync.startedAt, status: lastSync.status, trigger: lastSync.trigger }
        : null,
    },
    years,
    checks,
    syncRuns,
    snapshots,
    notes,
  }
}
