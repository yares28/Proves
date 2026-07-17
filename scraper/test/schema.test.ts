import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  examsEnvelopeSchema,
  errorEnvelopeSchema,
  fingerprintFields,
  unknownFields,
} from '../src/schema.js';
import { baseRow, envelope, errorEnvelope, row } from './fixtures.js';

test('accepts a well-formed payload', () => {
  const parsed = examsEnvelopeSchema.safeParse(envelope([baseRow]));
  assert.equal(parsed.success, true);
});

test('accepts an empty exam list (unpublished year) — the caller decides what it means', () => {
  const parsed = examsEnvelopeSchema.safeParse(envelope([], 2027));
  assert.equal(parsed.success, true);
  assert.equal(parsed.success && parsed.data.data.examenes.length, 0);
});

test('rejects the upstream 500 error envelope, naming the missing contract', () => {
  const parsed = examsEnvelopeSchema.safeParse(errorEnvelope);
  assert.equal(parsed.success, false);
  assert.ok(parsed.success === false && parsed.error.issues.some((i) => i.path.includes('data')));
});

test('recognises the upstream error envelope for what it is', () => {
  const parsed = errorEnvelopeSchema.safeParse(errorEnvelope);
  assert.equal(parsed.success, true);
  assert.match(parsed.success ? parsed.data.message : '', /JDBC Connection/);
});

test('rejects an HTML maintenance page parsed as JSON', () => {
  assert.equal(examsEnvelopeSchema.safeParse('<html>maintenance</html>').success, false);
});

test('fails loudly when a field we depend on is renamed, and names it', () => {
  const { dia, ...rest } = baseRow;
  const parsed = examsEnvelopeSchema.safeParse(envelope([{ ...rest, fecha: dia }]));
  assert.equal(parsed.success, false);
  const paths = parsed.success === false ? parsed.error.issues.map((i) => i.path.join('.')) : [];
  assert.ok(paths.some((p) => p.endsWith('dia')), `expected an issue naming "dia", got ${paths.join(', ')}`);
});

test('fails when a field changes type', () => {
  const parsed = examsEnvelopeSchema.safeParse(envelope([row({ duracion: '30' as unknown as number })]));
  assert.equal(parsed.success, false);
});

test('fails when examenes is not an array', () => {
  assert.equal(
    examsEnvelopeSchema.safeParse({ data: { cursoAcademico: 2025, examenes: {} } }).success,
    false
  );
});

test('tolerates new upstream fields but reports them as drift', () => {
  const withExtra = envelope([row({ nuevoCampo: 'x' })]);
  assert.equal(examsEnvelopeSchema.safeParse(withExtra).success, true, 'must not break on additions');
  assert.deepEqual(unknownFields([row({ nuevoCampo: 'x' })] as Array<Record<string, unknown>>), ['nuevoCampo']);
});

test('fingerprint is stable across rows and changes when the field set changes', () => {
  const a = fingerprintFields([baseRow, baseRow] as unknown as Array<Record<string, unknown>>);
  const b = fingerprintFields([baseRow] as unknown as Array<Record<string, unknown>>);
  assert.equal(a, b, 'same field set -> same fingerprint');

  const c = fingerprintFields([row({ nuevoCampo: 1 })] as Array<Record<string, unknown>>);
  assert.notEqual(a, c, 'new field -> different fingerprint');
});

test('nullable fields accept null (lugar/comentario/hora are null in real data)', () => {
  const parsed = examsEnvelopeSchema.safeParse(
    envelope([row({ lugar: null, comentario: null, hora: null, minuto: null, duracion: null })])
  );
  assert.equal(parsed.success, true);
});
