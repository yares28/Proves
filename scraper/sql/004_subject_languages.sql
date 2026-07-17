-- ============================================================================
-- UPV-Cal — schema migration 004: trilingual subject labels
--
-- Run once in the Supabase SQL editor, after 003.
--
-- Upstream serves every subject in three languages and the sync now stores them
-- (subject / subject_va / subject_en). filter_options returned only Castellano,
-- so the sidebar could not offer the other two.
--
-- Shape of each subject entry:
--
--   { "value": "Bases de datos (BDA)",      <- identity: always Castellano
--     "va":    "Bases de dades (BDA)",      <- display only, absent if unknown
--     "en":    "Databases (BDA)" }          <- display only, absent if unknown
--
-- `value` stays Castellano on purpose. It is what the URL carries and what
-- user_calendars.filters already contains; localising it would silently break
-- every saved calendar the moment a student switched language. Labels are for
-- reading, `value` is for matching.
--
-- All three are returned together rather than the caller passing a language, so
-- the cached read is the same for every visitor instead of one copy per locale.
-- ============================================================================

begin;

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
  ),
  -- One row per real course. Grouping on (lower(subject), acronym) folds the
  -- case variants of a single course together while keeping distinct courses
  -- that share an acronym apart. mode() picks the most common spelling of each
  -- language, so a lone typo cannot rename a course; it ignores NULLs, so a
  -- course upstream has not translated simply has no label for that language.
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
          -- `va`/`en` concatenate to NULL when untranslated; strip_nulls drops
          -- the key entirely so the client falls back to `value`.
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

commit;

-- ============================================================================
-- Verify:
--   -- Every subject has a Castellano value; ~1167/1533 rows carry translations.
--   select jsonb_array_length(filter_options(2025) -> 'subjects');
--
--   -- A translated course shows all three:
--   select jsonb_path_query(filter_options(2025) -> 'subjects',
--                           '$[*] ? (@.value like_regex "\\(MNE\\)")');
--
--   -- ETSA has no upstream translations, so those entries are value-only:
--   select jsonb_path_query_first(filter_options(2025, array['ETSA']) -> 'subjects', '$[0]');
-- ============================================================================
