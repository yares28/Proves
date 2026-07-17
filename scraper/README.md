# Exam sync

Keeps the Supabase exam tables in sync with the official ETSINF exams site
(https://apps4.etsinf.upv.es/examenes/). Standalone: it is **not** part of the
Next.js build and the web app never imports it.

## How it works

The site is an Angular SPA backed by a public JSON API, so there is no HTML
scraping and no pagination to drive — one request returns every exam of a year:

| Endpoint | Purpose |
|---|---|
| `GET /api/v1/horarios/examenesfc/{year}` | all exams for an academic year (`0` = current) |
| `GET /api/v1/horarios/titulaciones` | degree catalog |

`{year}` is the academic **start year**: `2026` is the site's "2026-2027". The
database keys every year in one `exams` table by `academic_year` (`2026`).

Each API row already carries the three languages (`nombreConvocatoriaCastellano`
/ `Valenciano` / `Ingles`), stored as `subject` / `subject_va` / `subject_en`.

Pipeline: **fetch → validate (zod) → normalize → safety gates → diff → apply → audit**.

## Setup

1. **Apply the migrations** — run `sql/002` … `sql/005` once each, in order, in
   the Supabase SQL editor. They only add columns/tables/functions; nothing
   existing is modified. (`sql/001` is superseded by `002` — do not run it.)
   Each is guarded, so re-running is a no-op.
2. **Add GitHub secrets** (Settings → Secrets → Actions):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (service role — never put this in Vercel)
   - `REVALIDATE_URL` / `REVALIDATE_SECRET` (optional; lets a successful sync
     purge the site's cached exam data immediately instead of on the hourly
     backstop — the secret must match the one set in Vercel)
   - `ALERT_WEBHOOK_URL` (optional; Discord/Slack webhook for failure pings)
3. That's it — `.github/workflows/sync-exams.yml` schedules itself.

## Local use

```bash
cd scraper
npm install
export $(grep -E 'NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY' ../.env.local | xargs)

npm run sync -- --dry-run                       # current year, report only
npm run sync -- --year 2025 --dry-run           # a specific year
npm run sync -- --year 2026                     # write
npm run sync -- --table-override sync_test_x    # write to a sandbox table
npm test                                        # unit tests, no network
```

| Flag | Meaning |
|---|---|
| `--year N \| current` | academic start year; `current` asks the API |
| `--dry-run` | compute and log the diff, write nothing |
| `--force` | permit a deletion batch above the 30% cap |
| `--no-probe` | skip the next-academic-year check |
| `--prune-legacy` | one-off cleanup of stale pre-sync rows (see below) |
| `--table-override NAME` | target a sandbox table |

Exit codes: `0` success/dry-run · `1` failure · `2` aborted by a safety gate.

## Schedule

| Trigger | When |
|---|---|
| `0 5 * 1,8,9,12 1` | **Mondays** 05:00 UTC in Jan/Aug/Sep/Dec (dates move most) |
| `0 5 1 2,3,4,5,6,7,10,11 *` | the **1st** 05:00 UTC of every other month |
| `workflow_dispatch` | manual, with `year` / `dry_run` / `force` inputs |

The two schedules cover disjoint months, so a run's cadence is unambiguous.

> GitHub disables scheduled workflows after 60 days without repository activity.
> If the sync goes quiet for a long while, check that the schedule is still enabled.

## Why production cannot break

- The scraper runs on GitHub Actions, never inside the Next.js runtime.
- `scraper` is listed in the root `tsconfig.json` `exclude` array (alongside
  `__tests__`), so `next build` never compiles it. Removing that entry **will**
  break the build: this module targets Node/ESM, not the browser bundle.
- The migrations are additive; the app's queries name their own columns.
- A new academic year appears as rows (`academic_year = 2026`) in the one
  `exams` table — no new table, no code change, no env var to flip. The site
  serves it as soon as the calendar rolls into that course.
- Rows loaded before this pipeline (`source_key IS NULL`), including degrees this
  API doesn't serve (GDAI, GFA), are never updated or deleted.
- Deletes are **soft**: a vanished exam is stamped `deleted_at`, not removed, so
  nothing is ever destroyed and a reappearing exam revives itself.
- Every write is preceded by gates. On a breach the run aborts and production
  simply keeps the previous data — the next run heals it.

## Soft delete, restore, and snapshots

An exam that disappears from upstream is **soft-deleted** (`deleted_at` set),
not removed. The app reads only live rows (`deleted_at IS NULL`); the scraper
reads all of them, so if the exam reappears in a later payload it is **restored**
(`deleted_at` cleared) rather than inserted as a duplicate. The `sync_runs` audit
records both `deleted` and `restored` counts per run.

Every successful run also stores its raw upstream payload in `sync_snapshots`
(pruned to the last 24 per year). That is the rollback material: a past state can
be replayed from a snapshot without re-fetching, and "what did upstream say last
month vs now" is a query, not a guess.

## Legacy rows and `--prune-legacy`

`25-26` was loaded by hand before this pipeline existed, so its rows have no
`source_key`. The first run adopts the ones it can match on
`(code, degree, exam_date, exam_time)` instead of duplicating them. As measured
on production (1479 rows in the table vs 1167 upstream):

| Rows | What they are | What the sync does |
|---|---|---|
| 1113 | matched an upstream exam | adopted, then kept in sync |
| 330 | degrees `GDAI` / `GFA`, which this API never serves | **never touched, ever** |
| 36 | stale/duplicated rows in degrees the API *does* serve | reported as `prunable` |

Those 36 are cancelled exams or rows that lost an ambiguous match. They are left
alone by default and simply reported. To clean them up once, after reviewing:

```bash
npm run sync -- --year 2025 --dry-run   # check the prunable count
npm run sync -- --year 2025 --prune-legacy
```

Pruning only ever considers degrees present in the current payload, so rows from
degrees this API doesn't serve can never be removed by it. The scheduled workflow
never passes this flag.

## Safety gates

| Gate | Threshold | Rationale |
|---|---|---|
| Empty payload | 0 rows | upstream glitch, not a mass cancellation |
| Payload shrink | < 40% of synced rows | partial upstream data |
| Absolute floor | < 200 rows (when data exists) | same |
| Invalid rows | > 5% quarantined | the format probably changed |
| Deletion cap | > 30% of synced rows | needs `--force` and a human |

## Observability

- Structured JSON logs, one object per line, in the Actions run.
- Every run — success, failure or abort — inserts a row into `sync_runs`
  with counters, warnings, duration and an `api_fingerprint`.
- Failures trigger GitHub's native email plus the optional webhook.

**Layout-change detection.** The zod schemas in `src/schema.ts` are the contract.
A renamed/retyped/removed field fails the run and names the field. New unknown
fields don't fail anything but are logged and change the `api_fingerprint`, so
drift shows up in `sync_runs` before it becomes a problem.

## Handled edge cases

Observed live and covered by tests: JSON 500 error envelopes ("Unable to acquire
JDBC Connection"), hung sockets, HTML maintenance pages, unpublished years
returning `[]`, leading spaces in `lugar`, CRLF in `comentario`, null
`lugar`/`comentario`/`hora`, exams shared across degrees, the same exam under two
plan variants of one degree (`GCD-GIOI(2023)` + `(2026)` → merged, newest plan
wins), multi-day exams (`duration_day`), and midnight-UTC dates (taken literally,
never through a local `Date`, so they can't shift a day in Europe/Madrid).

## Files

```
src/config.ts     env, thresholds, table-name helpers
src/schema.ts     zod contract + drift fingerprint
src/api.ts        HTTP with retry ladder and failure taxonomy
src/normalize.ts  cleaning, degree suffix strip, dedupe, source_key
src/sync.ts       gates, diff, apply, sync_runs audit
src/index.ts      CLI + next-year probe
sql/002_unified_exams.sql       one exams table keyed by academic_year
sql/003_subject_identity.sql    case-fold subject dupes in filter_options
sql/004_subject_languages.sql   trilingual subject labels
sql/005_soft_delete_and_snapshots.sql   deleted_at + sync_snapshots
```
