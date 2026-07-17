-- ============================================================================
-- UPV-Cal — schema migration 003: subject identity
--
-- Run once in the Supabase SQL editor, after 002.
--
-- Why:
--   An acronym is NOT a unique subject. It is scoped to a degree, and the same
--   acronym means different courses in different degrees:
--
--     BDA  -> "Bases de datos"                        (GCD)
--     BDA  -> "Bases de datos y sistemas de información" (GIINF)
--     ICO  -> "Introducción a la Construcción"        (GFA)
--     ICO  -> "Investigación Comercial"               (GIINF-GADE)
--     IN2  -> three different English courses         (GIINF / GCD / GIIROB)
--
--   Separately, the same course is spelled inconsistently across degrees
--   ("Análisis matemático" vs "Análisis Matemático"), which made one course
--   appear twice in the subject dropdown.
--
-- What this does:
--   Collapses case-variant spellings of the same (subject, acronym) pair into a
--   single dropdown entry, while keeping genuinely different courses that share
--   an acronym as separate entries. The underlying rows are NOT rewritten:
--   upstream would reintroduce the variants on the next sync, and rewriting
--   names would break the subject strings already stored in
--   user_calendars.filters. The app matches subject names case-insensitively.
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
    -- Grouped on (lower(subject), acronym): case variants of one course collapse
    -- to one entry; different courses sharing an acronym stay separate. The
    -- most common spelling wins, so a one-off typo cannot rename a course.
    'subjects',
      coalesce((select jsonb_agg(label order by label) from (
        select
          mode() within group (order by subject) ||
          case
            when coalesce(acronym, '') <> '' then ' (' || acronym || ')'
            else ''
          end as label
        from by_year
        group by lower(subject), acronym
      ) x), '[]'::jsonb)
  );
$$;

grant execute on function filter_options(int, text[], text[], text[], int[])
  to anon, authenticated, service_role;

-- Subject matching is `subject ilike '<exact name>'` scoped by acronym, so an
-- index that survives case folding is what the planner wants here.
create index if not exists exams_year_lower_subject_idx
  on exams (academic_year, lower(subject));

commit;

-- ============================================================================
-- Verify:
--   -- 367 before, ~355 after: the case-variant phantoms are gone.
--   select jsonb_array_length(filter_options(2025) -> 'subjects');
--
--   -- AMA appears exactly once:
--   select jsonb_path_query_array(filter_options(2025) -> 'subjects',
--                                 '$[*] ? (@ like_regex "\\(AMA\\)")');
--
--   -- BDA still appears twice — two real courses:
--   select jsonb_path_query_array(filter_options(2025) -> 'subjects',
--                                 '$[*] ? (@ like_regex "\\(BDA\\)")');
-- ============================================================================
