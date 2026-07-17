import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanText,
  normalizeExams,
  planYear,
  sourceKeyFor,
  stripPlanSuffix,
  toDurationDay,
  toExamDate,
  toExamTime,
} from '../src/normalize.js';
import { log } from '../src/log.js';
import { baseRow, planVariantRows, quirkyRows, row, sharedExamRows } from './fixtures.js';
import type { ExamRow } from '../src/schema.js';

const norm = (rows: unknown[], year = 2025) => normalizeExams(rows as ExamRow[], year);

test('cleanText trims, collapses CRLF and maps empty to null', () => {
  assert.equal(cleanText(' 1G 1.4'), '1G 1.4');
  assert.equal(cleanText('Primer parcial teoría\r\n'), 'Primer parcial teoría');
  assert.equal(cleanText('a\r\nb'), 'a b');
  assert.equal(cleanText('   '), null);
  assert.equal(cleanText(''), null);
  assert.equal(cleanText(null), null);
  assert.equal(cleanText(undefined), null);
});

test('cleanText decodes entities and strips stray tags', () => {
  assert.equal(cleanText('Teor&iacute;a &amp; pr&aacute;ctica'.replace(/&iacute;/g, 'í').replace(/&aacute;/g, 'á')), 'Teoría & práctica');
  assert.equal(cleanText('<b>Aula</b> 1.4'), 'Aula 1.4');
});

test('cleanText decodes hex and decimal numeric entities', () => {
  // Upstream writes the Valencià interpunct this way: "Intel·ligents".
  assert.equal(cleanText('Agents Intel&#xB7;ligents'), 'Agents Intel·ligents');
  assert.equal(cleanText('Agents Intel&#183;ligents'), 'Agents Intel·ligents');
  assert.equal(cleanText('Agents Intel&#XB7;ligents'), 'Agents Intel·ligents');
});

test('cleanText leaves an unparseable entity-like string untouched', () => {
  assert.equal(cleanText('a &notreal; b'), 'a &notreal; b');
});

test('stripPlanSuffix and planYear handle both suffixed and bare siglas', () => {
  assert.equal(stripPlanSuffix('GIINF(2009)'), 'GIINF');
  assert.equal(stripPlanSuffix('GCD-GIOI(2026)'), 'GCD-GIOI');
  assert.equal(stripPlanSuffix('IDIOMES'), 'IDIOMES');
  assert.equal(planYear('GCD-GIOI(2026)'), 2026);
  assert.equal(planYear('IDIOMES'), 0);
});

test('toExamDate takes the literal date part without timezone shifting', () => {
  // Parsing to a local Date would yield 2025-09-24 in Europe/Madrid.
  assert.equal(toExamDate('2025-09-25T00:00:00.000+00:00'), '2025-09-25');
  assert.equal(toExamDate('bogus'), null);
});

test('toExamTime composes HH:MM:00 and preserves timeless exams', () => {
  assert.equal(toExamTime(8, 0), '08:00:00');
  assert.equal(toExamTime(17, 30), '17:30:00');
  assert.equal(toExamTime(null, null), null);
  assert.equal(toExamTime(9, null), '09:00:00');
});

test('toDurationDay only marks exams of a day or longer', () => {
  assert.equal(toDurationDay(120), null);
  assert.equal(toDurationDay(1440), 'P1D');
  assert.equal(toDurationDay(2880), 'P2D');
  assert.equal(toDurationDay(null), null);
});

test('normalizes a real-shaped row into the prod column layout', () => {
  const { records } = norm([baseRow]);
  assert.equal(records.length, 1);
  assert.deepEqual(records[0], {
    exam_date: '2025-09-25',
    exam_time: '08:00:00',
    duration_minutes: 30,
    duration_day: null,
    code: 11604,
    subject: 'Modelos de negocio y áreas funcionales de la organización',
    subject_va: "Models de Negoci i Àrees Funcionals de l'Organització",
    subject_en: 'Business models and company functional areas',
    acronym: 'MNE',
    degree: 'GIINF',
    year: 4,
    semester: 'A',
    place: 'ETS DE INGENIERÍA INFORMÁTICA',
    comment: '1 parcial online',
    school: 'ETSINF',
    source_key: sourceKeyFor(1948313, 'GIINF'),
    academic_year: 2025,
  });
});

test('cleans the real-world quirks (leading space, CRLF, nulls)', () => {
  const { records } = norm(quirkyRows);
  assert.equal(records[0]?.place, '1G 1.4');
  assert.equal(records[0]?.comment, 'Primer parcial teoría');
  assert.equal(records[1]?.place, null);
  assert.equal(records[1]?.comment, null);
});

test('merges plan variants of one degree into a single row, keeping the newest plan', () => {
  const { records, mergedDuplicates } = norm(planVariantRows);
  assert.equal(records.length, 1, 'GCD-GIOI(2023) and (2026) must collapse');
  assert.equal(mergedDuplicates, 1);
  assert.equal(records[0]?.degree, 'GCD-GIOI');
});

test('keeps one row per degree when an exam is shared across degrees', () => {
  const { records } = norm(sharedExamRows);
  assert.equal(records.length, 2);
  assert.deepEqual(records.map((r) => r.degree).sort(), ['GCD', 'GCD-GIOI']);
});

test('source_key is stable when the winning plan variant changes', () => {
  // A later run where the 2023 variant has been retired upstream.
  const first = norm(planVariantRows).records[0]!;
  const second = norm([row({ idExamen: 2050487, idTitulacion: 243, siglasTitulacion: 'GCD-GIOI(2026)' })]).records[0]!;
  assert.equal(first.source_key, second.source_key, 'key must not churn between runs');
});

test('quarantines rows with impossible values instead of writing them', () => {
  const { records, quarantined } = norm([
    row({ idExamen: 1, hora: 99 }),
    row({ idExamen: 2, minuto: 99 }),
    row({ idExamen: 3, duracion: -5 }),
    row({ idExamen: 4, curso: 9 }),
    row({ idExamen: 5, cuatrimestre: 'Z' }),
    row({ idExamen: 6, dia: 'not-a-date' }),
    row({ idExamen: 7, nombreConvocatoriaCastellano: '   ' }),
  ]);
  assert.equal(records.length, 0);
  assert.equal(quarantined, 7);
});

test('falls back to the Spanish name when a translation is missing', () => {
  const { records } = norm([row({ nombreConvocatoriaValenciano: null, nombreConvocatoriaIngles: '' })]);
  assert.equal(records[0]?.subject_va, records[0]?.subject);
  assert.equal(records[0]?.subject_en, records[0]?.subject);
});

test('a multi-day exam gets both minutes and an ISO day duration', () => {
  const { records } = norm([row({ duracion: 2880 })]);
  assert.equal(records[0]?.duration_minutes, 2880);
  assert.equal(records[0]?.duration_day, 'P2D');
});

test('warnings are aggregated by code rather than emitted per row', () => {
  log.reset();
  norm([row({ idExamen: 1, hora: 99 }), row({ idExamen: 2, hora: 98 })]);
  const w = log.collected().find((x) => x.code === 'row_quarantined');
  assert.equal(w?.count, 2);
  log.reset();
});
