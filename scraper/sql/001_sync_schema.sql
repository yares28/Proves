-- ============================================================================
-- UPV-Cal exam sync — schema migration 001 (additive only, safe for prod)
-- Run once in the Supabase SQL editor with the project owner role.
--
-- What it does:
--   1. Adds sync-related columns to the existing "25-26" exams table.
--      Existing rows/columns are untouched; the app ignores unknown columns.
--   2. Creates the sync_runs audit table (service-role only, RLS locked).
--   3. Creates ensure_exam_year_table(start_year) so the scraper can create
--      future year tables ("26-27", ...) that clone the "25-26" structure.
-- ============================================================================

-- 1. Additive columns on the current exams table -----------------------------

alter table "25-26" add column if not exists subject_va    text;
alter table "25-26" add column if not exists subject_en    text;
alter table "25-26" add column if not exists source_key    text;
alter table "25-26" add column if not exists academic_year int;
alter table "25-26" add column if not exists synced_at     timestamptz;

-- Partial unique index: legacy rows keep NULL source_key (multiple NULLs OK).
create unique index if not exists "25-26_source_key_uidx"
  on "25-26" (source_key) where source_key is not null;

-- 2. Audit table for every sync run ------------------------------------------

create table if not exists sync_runs (
  id                 uuid primary key default gen_random_uuid(),
  started_at         timestamptz not null default now(),
  finished_at        timestamptz,
  trigger            text,                -- cron-daily | cron-weekly | manual | local
  academic_year      int,                 -- e.g. 2026
  year_label         text,                -- e.g. "2026-2027"
  table_name         text,                -- e.g. "26-27"
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
  api_fingerprint    text,                -- hash of sorted payload field names (drift detection)
  duration_ms        int
);

alter table sync_runs enable row level security;
-- No anon/authenticated policies on purpose: only the service role
-- (which bypasses RLS) can read/write sync_runs.

-- 3. Year-table factory -------------------------------------------------------
-- Creates "26-27"-style tables cloning "25-26" structure, with the same
-- public-read behaviour the app relies on. SECURITY DEFINER so the scraper can
-- call it via RPC with the service key.

create or replace function ensure_exam_year_table(start_year int)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  tbl text := lpad((start_year % 100)::text, 2, '0') || '-' ||
              lpad(((start_year + 1) % 100)::text, 2, '0');
  seq text := 'exams_' || lpad((start_year % 100)::text, 2, '0') ||
              lpad(((start_year + 1) % 100)::text, 2, '0') || '_id_seq';
begin
  if start_year < 2000 or start_year > 2100 then
    raise exception 'ensure_exam_year_table: implausible start_year %', start_year;
  end if;

  if to_regclass(format('public.%I', tbl)) is not null then
    return tbl; -- already exists
  end if;

  execute format('create sequence if not exists %I', seq);

  execute format($ddl$
    create table %I (
      exam_instance_id bigint primary key default nextval('%I'),
      exam_date        date not null,
      exam_time        time without time zone,
      duration_minutes integer,
      code             integer,
      subject          text not null,
      acronym          character varying not null,
      degree           text not null,
      year             smallint not null,
      semester         character not null,
      place            text,
      comment          text,
      school           text not null,
      duration_day     text,
      subject_va       text,
      subject_en       text,
      source_key       text,
      academic_year    int,
      synced_at        timestamptz
    )
  $ddl$, tbl, seq);

  execute format('alter sequence %I owned by %I.exam_instance_id', seq, tbl);

  execute format('create unique index %I on %I (source_key) where source_key is not null',
                 tbl || '_source_key_uidx', tbl);

  -- Same access model as "25-26": RLS on, public read-only.
  execute format('alter table %I enable row level security', tbl);
  execute format('create policy %I on %I for select using (true)',
                 tbl || '_public_read', tbl);

  return tbl;
end;
$$;

-- Allow the scraper (service role) to call it via PostgREST RPC.
revoke all on function ensure_exam_year_table(int) from public;
grant execute on function ensure_exam_year_table(int) to service_role;
