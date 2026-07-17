-- ============================================================================
-- UPV-Cal — schema migration 005: soft delete + sync snapshots
--
-- Run once in the Supabase SQL editor, after 004.
--
-- Two capabilities:
--
--   1. Soft delete. An exam that vanishes from upstream is stamped
--      `deleted_at` instead of being removed. This is what "detect when old
--      dates are deleted or hidden" needs: the history is preserved, the exam
--      recovers on its own if upstream brings it back, and a disappearance can
--      be reviewed rather than silently erased. The app reads only live rows
--      (deleted_at is null); the scraper reads all of them so it can restore.
--
--   2. sync_snapshots. Each run's raw upstream payload is kept as JSONB, so any
--      past state can be re-applied without re-fetching, and "what did upstream
--      say last month vs now" is answerable. Pruned to a bounded history.
-- ============================================================================

begin;

-- 1. Soft-delete column ------------------------------------------------------

alter table exams add column if not exists deleted_at timestamptz;

-- The app filters on it constantly; index the live rows for one academic year.
create index if not exists exams_year_live_idx
  on exams (academic_year) where deleted_at is null;

-- Restore bookkeeping: how many times a run had to un-delete a reappeared exam.
alter table sync_runs add column if not exists restored int default 0;

-- 2. Every read helper now hides soft-deleted rows ---------------------------

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
    select * from exams
    where academic_year = p_academic_year
      and deleted_at is null
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
  ),
  subjects_grouped as (
    select
      case when coalesce(acronym, '') <> '' then ' (' || acronym || ')' else '' end as sfx,
      mode() within group (order by subject)    as es,
      mode() within group (order by subject_va) as va,
      mode() within group (order by subject_en) as en
    from by_year
    group by lower(subject), acronym
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
      coalesce((
        select jsonb_agg(
          jsonb_strip_nulls(jsonb_build_object(
            'value', es || sfx,
            'va',    va || sfx,
            'en',    en || sfx
          ))
          order by es || sfx
        )
        from subjects_grouped
      ), '[]'::jsonb)
  );
$$;

grant execute on function filter_options(int, text[], text[], text[], int[])
  to anon, authenticated, service_role;

create or replace function academic_years()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(jsonb_agg(y order by y desc), '[]'::jsonb)
  from (select distinct academic_year as y from exams where deleted_at is null) x;
$$;

grant execute on function academic_years() to anon, authenticated, service_role;

-- 3. Snapshot store ----------------------------------------------------------

create table if not exists sync_snapshots (
  id            uuid primary key default gen_random_uuid(),
  run_id        uuid references sync_runs(id) on delete set null,
  academic_year int not null,
  captured_at   timestamptz not null default now(),
  row_count     int not null,
  -- The exact upstream payload, before any normalization. Re-applying this
  -- reproduces the run deterministically.
  payload       jsonb not null
);

create index if not exists sync_snapshots_year_time_idx
  on sync_snapshots (academic_year, captured_at desc);

alter table sync_snapshots enable row level security;
-- Service-role only, like sync_runs: raw upstream data is not public surface.

commit;

-- ============================================================================
-- Verify:
--   -- Column exists and everything is currently live:
--   select count(*) filter (where deleted_at is null) as live,
--          count(*) filter (where deleted_at is not null) as deleted
--   from exams where academic_year = 2025;
--
--   -- filter_options still returns the same subject count as before (nothing
--   -- is deleted yet):
--   select jsonb_array_length(filter_options(2025) -> 'subjects');
-- ============================================================================
