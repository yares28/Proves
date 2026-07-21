/**
 * Turns raw API rows into rows shaped like the existing exams table.
 *
 * Every transformation here exists because of something observed in real
 * payloads: leading spaces in `lugar`, CRLF in `comentario`, null `lugar`,
 * plan-variant duplicates (GCD-GIOI(2023) vs GCD-GIOI(2026)), shared exams
 * across degrees, and multi-day `duracion`.
 */
import { SCHOOL } from './config.js';
import { log } from './log.js';
import type { ExamRow } from './schema.js';

export interface ExamRecord {
  exam_date: string; // YYYY-MM-DD
  exam_time: string | null; // HH:MM:00
  duration_minutes: number | null;
  duration_day: string | null; // P1D, P2D... for multi-day exams
  code: number;
  subject: string;
  subject_va: string | null;
  subject_en: string | null;
  acronym: string;
  degree: string;
  year: number;
  semester: string;
  place: string | null;
  comment: string | null;
  school: string;
  source_key: string;
  academic_year: number;
}

/** Columns compared to decide whether an existing row needs an UPDATE. */
export const COMPARED_FIELDS = [
  'exam_date',
  'exam_time',
  'duration_minutes',
  'duration_day',
  'code',
  'subject',
  'subject_va',
  'subject_en',
  'acronym',
  'degree',
  'year',
  'semester',
  'place',
  'comment',
  'school',
  'academic_year',
] as const satisfies readonly (keyof ExamRecord)[];

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
};

/**
 * Named, decimal (`&#183;`) and hex (`&#xB7;`) entities.
 *
 * The hex form matters more than it looks: upstream writes the Valencian
 * interpunct as `&#xB7;` ("Intel&#xB7;ligents"), and it is nearly the only place
 * any entity appears. Miss it and Valencià — and only Valencià — renders with
 * raw markup in the middle of subject names.
 */
const ENTITY = /&(?:#x[0-9a-f]+|#\d+|\w+);/gi;

/**
 * Trims, collapses embedded newlines/whitespace, decodes entities and strips
 * stray tags. Empty results become null so the DB has one representation for
 * "no value" (upstream mixes null and "").
 */
export function cleanText(value: string | null | undefined, field?: string): string | null {
  if (value == null) return null;
  let s = String(value);

  if (/<[a-z][^>]*>/i.test(s)) {
    log.warn('html_in_text', `HTML tags found in ${field ?? 'text'}; stripping`, s.slice(0, 80));
    s = s.replace(/<[^>]+>/g, ' ');
  }
  s = s.replace(ENTITY, (match) => {
    const named = ENTITIES[match.toLowerCase()] ?? ENTITIES[match];
    if (named) return named;

    const numeric = match.match(/^&#(x)?([0-9a-f]+);$/i);
    if (numeric) {
      const code = parseInt(numeric[2]!, numeric[1] ? 16 : 10);
      // fromCodePoint, not fromCharCode: the latter mangles anything above the
      // basic plane. Leave anything unparseable exactly as it arrived.
      if (Number.isFinite(code) && code > 0 && code <= 0x10ffff) {
        return String.fromCodePoint(code);
      }
    }
    return match;
  });

  s = s.replace(/\s+/g, ' ').trim(); // collapses \r\n and runs of spaces
  return s === '' ? null : s;
}

/** "GIINF(2009)" -> "GIINF"; "IDIOMES" (no suffix) -> "IDIOMES". */
export function stripPlanSuffix(siglas: string): string {
  return siglas.replace(/\s*\(\d{4}\)\s*$/, '').trim();
}

/** Plan year embedded in the sigla, used to prefer the newest variant. */
export function planYear(siglas: string): number {
  const m = /\((\d{4})\)\s*$/.exec(siglas);
  return m?.[1] ? Number(m[1]) : 0;
}

/**
 * Takes the literal date part. The API sends midnight UTC (2025-09-25T00:00:00.000+00:00);
 * parsing it into a Date and formatting locally would shift it a day in Europe/Madrid.
 */
export function toExamDate(dia: string | null | undefined): string | null {
  const s = dia ?? '';
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(s);
  if (!m?.[1]) return null;
  if (!/^\d{4}-\d{2}-\d{2}T00:00:00(\.000)?\+00:00$/.test(s)) {
    log.warn('unexpected_date_format', 'dia is not midnight-UTC; using the date part literally', s);
  }
  return m[1];
}

export function toExamTime(hora: number | null, minuto: number | null): string | null {
  if (hora == null) return null; // exams without a set time are legitimate
  const h = String(hora).padStart(2, '0');
  const m = String(minuto ?? 0).padStart(2, '0');
  return `${h}:${m}:00`;
}

/** Exams lasting a day or more also get an ISO-8601 day duration, as prod does. */
export function toDurationDay(duracion: number | null): string | null {
  if (duracion == null || duracion < 1440) return null;
  return `P${Math.floor(duracion / 1440)}D`;
}

/**
 * Stable identity of a synced row: the exam plus the *normalized* degree.
 *
 * Deliberately not keyed on idTitulacion: the same exam appears under several
 * plan variants of one degree (GCD-GIOI(2023) and GCD-GIOI(2026)), which we
 * merge. Keying on idTitulacion would make the key flip to whichever variant
 * won that run, churning delete+insert instead of a stable no-op.
 */
export const sourceKeyFor = (idExamen: number, degree: string) => `${idExamen}:${degree}`;

export interface NormalizeResult {
  records: ExamRecord[];
  quarantined: number;
  mergedDuplicates: number;
}

function isValid(row: ExamRow, examDate: string | null): string | null {
  if (!examDate) return 'unparseable dia';
  if (row.hora != null && (row.hora < 0 || row.hora > 23)) return `hora out of range (${row.hora})`;
  if (row.minuto != null && (row.minuto < 0 || row.minuto > 59)) return `minuto out of range (${row.minuto})`;
  if (row.duracion != null && row.duracion <= 0) return `duracion not positive (${row.duracion})`;
  if (row.curso < 1 || row.curso > 6) return `curso out of range (${row.curso})`;
  if (!/^[AB]$/i.test(row.cuatrimestre)) return `cuatrimestre not A/B (${row.cuatrimestre})`;
  if (!stripPlanSuffix(row.siglasTitulacion)) return 'empty degree';
  return null;
}

/**
 * Normalizes and de-duplicates a payload.
 *
 * Two distinct duplicate shapes exist upstream:
 *  - the same exam under several *degrees* (shared exam) — legitimate, kept;
 *  - the same exam under several *plan variants of one degree* — collapses to
 *    the same row after stripping the suffix, so we keep the newest plan.
 */
export function normalizeExams(rows: ExamRow[], academicYear: number): NormalizeResult {
  const byKey = new Map<string, { record: ExamRecord; plan: number }>();
  let quarantined = 0;
  let mergedDuplicates = 0;

  for (const row of rows) {
    const exam_date = toExamDate(row.dia);
    const reason = isValid(row, exam_date);
    if (reason || !exam_date) {
      quarantined++;
      log.warn('row_quarantined', `Row excluded: ${reason}`, { idExamen: row.idExamen, reason });
      continue;
    }

    const degree = stripPlanSuffix(row.siglasTitulacion);
    const subject = cleanText(row.nombreConvocatoriaCastellano, 'subject');
    const subject_va = cleanText(row.nombreConvocatoriaValenciano, 'subject_va');
    const subject_en = cleanText(row.nombreConvocatoriaIngles, 'subject_en');

    if (!subject) {
      // The app's primary display field; without it the row is unusable.
      quarantined++;
      log.warn('row_quarantined', 'Row excluded: empty Spanish subject name', { idExamen: row.idExamen });
      continue;
    }
    if (!subject_va || !subject_en) {
      log.warn('missing_translation', 'Missing VA/EN subject name; falling back to Spanish', {
        idExamen: row.idExamen,
      });
    }

    const place = cleanText(row.lugar, 'place');
    if (place && place.length > 500) {
      log.warn('long_place', `place is unusually long (${place.length} chars)`, row.idExamen);
    }

    const record: ExamRecord = {
      exam_date,
      exam_time: toExamTime(row.hora, row.minuto),
      duration_minutes: row.duracion ?? null,
      duration_day: toDurationDay(row.duracion),
      code: row.idAsignatura,
      subject,
      subject_va: subject_va ?? subject,
      subject_en: subject_en ?? subject,
      acronym: cleanText(row.siglasAsignatura, 'acronym') ?? '',
      degree,
      year: row.curso,
      semester: row.cuatrimestre.toUpperCase(),
      place,
      comment: cleanText(row.comentario, 'comment'),
      school: SCHOOL,
      source_key: sourceKeyFor(row.idExamen, degree),
      academic_year: academicYear,
    };

    // Same identity as source_key: plan variants of one degree merge here.
    const dedupeKey = record.source_key;
    const existing = byKey.get(dedupeKey);
    const plan = planYear(row.siglasTitulacion);

    if (!existing) {
      byKey.set(dedupeKey, { record, plan });
      continue;
    }

    mergedDuplicates++;
    const differs = COMPARED_FIELDS.some((f) => existing.record[f] !== record[f]);
    if (differs) {
      log.warn(
        'plan_variant_conflict',
        'Same exam under multiple plan variants with differing data; keeping the newest plan',
        { idExamen: row.idExamen, degree }
      );
    }
    if (plan > existing.plan) byKey.set(dedupeKey, { record, plan });
  }

  const dateSanity = (r: ExamRecord) => {
    const y = Number(r.exam_date.slice(0, 4));
    const m = Number(r.exam_date.slice(5, 7));
    const withinWindow = (y === academicYear && m >= 8) || (y === academicYear + 1 && m <= 9);
    if (!withinWindow) {
      log.warn('date_outside_year', 'Exam date falls outside the expected academic year window', {
        exam_date: r.exam_date,
        academic_year: academicYear,
      });
    }
  };

  const records = [...byKey.values()].map((v) => v.record);
  records.forEach(dateSanity);

  return { records, quarantined, mergedDuplicates };
}
