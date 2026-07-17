-- ============================================================================
-- UPV-Cal — schema migration 002: unified exams table
--
-- Run once in the Supabase SQL editor with the project owner role.
--
-- SUPERSEDES 001_sync_schema.sql. Do NOT run 001 — it builds the per-year
-- table model ("25-26", "26-27", ...) that this migration exists to remove.
-- 001 was never applied to production; 002 is self-contained.
--
-- What it does:
--   1. Creates a single `exams` table keyed by `academic_year`, replacing the
--      one-table-per-year model. New academic years become rows, not DDL.
--   2. Copies all rows from "25-26" as academic_year = 2025. The "25-26" table
--      is left completely untouched and remains a rollback target.
--   3. Adds indexes matching how the app actually filters
--      (academic_year -> school -> degree -> semester -> year -> subject).
--   4. Creates filter_options(), which returns the whole cascading filter tree
--      in one round trip instead of five full-column scans.
--   5. Creates the sync_runs audit table used by the scraper.
--
-- Safe to run more than once: every step is guarded.
-- ============================================================================

begin;

-- 1. The unified exams table -------------------------------------------------

create table if not exists exams (
  id                     bigint generated always as identity primary key,

  -- Academic year START year: 2025 means the 2025-2026 course ("25-26").
  academic_year          int not null,

  exam_date              date not null,
  exam_time              time without time zone,
  duration_minutes       integer,
  duration_day           text,                   -- P1D, P2D, ... for multi-day exams

  code                   integer,
  subject                text not null,          -- Castellano (canonical)
  subject_va             text,                   -- Valencià
  subject_en             text,                   -- English
  acronym                varchar not null,

  degree                 text not null,
  year                   smallint not null,      -- course year (1..N), not a date
  semester               char not null,
  place                  text,
  comment                text,
  school                 text not null,

  -- Sync bookkeeping. Rows that predate the scraper (e.g. the ETSA set, which
  -- has no upstream API) keep these NULL and are never touched by a sync.
  source_key             text,
  synced_at              timestamptz,

  -- Traceability back to the legacy per-year tables.
  legacy_exam_instance_id bigint,

  created_at             timestamptz not null default now()
);

comment on table exams is
  'All exams for every academic year. Partitioned logically by academic_year; '
  'superseded the per-year tables ("25-26", ...) in migration 002.';
comment on column exams.academic_year is
  'Academic year START year: 2025 = course 2025-2026 = legacy table "25-26".';
comment on column exams.source_key is
  'Stable upstream identity for scraper-managed rows. NULL = manually loaded '
  'row (e.g. ETSA); syncs must never delete these.';

-- 2. Backfill from "25-26" ---------------------------------------------------
-- Guarded on academic_year 2025 being empty, so re-running is a no-op rather
-- than a duplicate load.

insert into exams (
  academic_year, exam_date, exam_time, duration_minutes, duration_day,
  code, subject, acronym, degree, year, semester, place, comment, school,
  legacy_exam_instance_id
)
select
  2025, exam_date, exam_time, duration_minutes, duration_day,
  code, subject, acronym, degree, year, semester, place, comment, school,
  exam_instance_id
from "25-26"
where not exists (select 1 from exams where academic_year = 2025);

-- 3. Indexes -----------------------------------------------------------------
-- Ordered to match the filter cascade; the leading academic_year column means
-- every query is scoped to one course before anything else is considered.

create index if not exists exams_year_school_idx
  on exams (academic_year, school);
create index if not exists exams_year_school_degree_idx
  on exams (academic_year, school, degree);
create index if not exists exams_year_school_degree_sem_year_idx
  on exams (academic_year, school, degree, semester, year);
create index if not exists exams_year_date_idx
  on exams (academic_year, exam_date);
create index if not exists exams_year_acronym_idx
  on exams (academic_year, acronym);

-- Scraper identity: one row per upstream exam. Legacy rows keep NULL.
create unique index if not exists exams_source_key_uidx
  on exams (source_key) where source_key is not null;

-- Subject search is `ilike '%foo%'`, which no b-tree index can serve.
create extension if not exists pg_trgm;
create index if not exists exams_subject_trgm_idx
  on exams using gin (subject gin_trgm_ops);

-- 4. Access model: public read, writes only via service role -----------------

alter table exams enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'exams' and policyname = 'exams_public_read'
  ) then
    create policy exams_public_read on exams for select using (true);
  end if;
end $$;

-- 5. filter_options() — the whole cascade in one round trip -------------------
-- Replaces getSchools/getDegrees/getSemesters/getYears/getSubjects, each of
-- which previously selected an entire column and de-duplicated in JavaScript.
--
-- Each level is narrowed by the levels above it, mirroring the sidebar:
--   School -> Degree -> Semester -> Year -> Subject
-- `schools` is always the unnarrowed list, so the top of the cascade never
-- disappears once a selection is made.
--
-- Subjects are returned as "Name (ACR)" — the exact format already persisted
-- in user_calendars.filters, so existing saved calendars keep resolving.

create or replace function filter_options(
  p_academic_year int,
  p_schools       text[] default null,
  p_degrees       text[] default null,
  p_semesters     text[] default null,
  p_years         int[]  default null
) returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with base as (
    select * from exams where academic_year = p_academic_year
  ),
  by_school as (
    select * from base
    where p_schools is null or cardinality(p_schools) = 0 or school = any(p_schools)
  ),
  by_degree as (
    select * from by_school
    where p_degrees is null or cardinality(p_degrees) = 0 or degree = any(p_degrees)
  ),
  by_semester as (
    select * from by_degree
    where p_semesters is null or cardinality(p_semesters) = 0 or semester = any(p_semesters)
  ),
  by_year as (
    select * from by_semester
    where p_years is null or cardinality(p_years) = 0 or year = any(p_years)
  )
  select jsonb_build_object(
    'schools',
      coalesce((select jsonb_agg(s order by s) from (select distinct school as s from base) x), '[]'::jsonb),
    'degrees',
      coalesce((select jsonb_agg(d order by d) from (select distinct degree as d from by_school) x), '[]'::jsonb),
    'semesters',
      coalesce((select jsonb_agg(sem order by sem) from (select distinct semester as sem from by_degree) x), '[]'::jsonb),
    'years',
      coalesce((select jsonb_agg(y order by y) from (select distinct year as y from by_semester) x), '[]'::jsonb),
    'subjects',
      coalesce((select jsonb_agg(label order by label) from (
        select distinct
          subject || case
            when acronym is not null and acronym <> '' then ' (' || acronym || ')'
            else ''
          end as label
        from by_year
      ) x), '[]'::jsonb)
  );
$$;

grant execute on function filter_options(int, text[], text[], text[], int[])
  to anon, authenticated, service_role;

-- 6. academic_years() — which courses exist, for the year picker -------------

create or replace function academic_years()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(jsonb_agg(y order by y desc), '[]'::jsonb)
  from (select distinct academic_year as y from exams) x;
$$;

grant execute on function academic_years() to anon, authenticated, service_role;

-- 7. sync_runs audit table ---------------------------------------------------

create table if not exists sync_runs (
  id                 uuid primary key default gen_random_uuid(),
  started_at         timestamptz not null default now(),
  finished_at        timestamptz,
  trigger            text,                -- cron-daily | cron-weekly | manual | local
  academic_year      int,
  year_label         text,                -- e.g. "2025-2026"
  status             text not null,       -- success | failed | aborted | dry-run
  fetched            int default 0,
  matched            int default 0,
  inserted           int default 0,
  updated            int default 0,
  deleted            int default 0,
  merged_duplicates  int default 0,
  quarantined        int default 0,
  unmatched_legacy   int default 0,
  warnings           jsonb default '[]'::jsonb,
  error              text,
  api_fingerprint    text,                -- hash of sorted payload field names
  duration_ms        int
);

alter table sync_runs enable row level security;
-- No anon/authenticated policies on purpose: only the service role
-- (which bypasses RLS) can read/write sync_runs.

commit;

-- ============================================================================
-- Verify (run separately after the migration):
--
--   select academic_year, school, count(*) from exams group by 1,2 order by 1,2;
--   -- expect: 2025 | ETSA | 330  and  2025 | ETSINF | 1149
--
--   select jsonb_pretty(filter_options(2025, array['ETSINF'], array['GIINF']));
--
-- Rollback: drop table exams cascade; drop function filter_options(int, text[],
-- text[], text[], int[]); drop function academic_years();
-- The legacy "25-26" table is untouched throughout.
-- ============================================================================
