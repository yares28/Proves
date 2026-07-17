/**
 * The safety-critical layer: gates that refuse bad payloads, and the diff that
 * decides what is written. Pure functions, no database involved.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AbortRun, assertPayloadSane, planChanges, type ExistingRow } from '../src/sync.js';
import { normalizeExams, sourceKeyFor, type ExamRecord } from '../src/normalize.js';
import { log } from '../src/log.js';
import { row } from './fixtures.js';
import type { ExamRow } from '../src/schema.js';

const recordsFrom = (rows: unknown[], year = 2025) => normalizeExams(rows as ExamRow[], year).records;

/** Builds a DB row equivalent to a normalized record (i.e. already in sync). */
const asExisting = (rec: ExamRecord, id: number): ExistingRow => ({ ...rec, id: id });

const sane = {
  rawCount: 1000,
  usableCount: 1000,
  quarantined: 0,
  syncedExistingCount: 1000,
  label: '2025-2026',
  table: '25-26',
};

test('a healthy payload passes the gates', () => {
  assert.doesNotThrow(() => assertPayloadSane(sane));
});

test('an empty payload aborts rather than wiping the table', () => {
  assert.throws(
    () => assertPayloadSane({ ...sane, rawCount: 0, usableCount: 0 }),
    (e: Error) => e instanceof AbortRun && /zero exams/.test(e.message)
  );
});

test('a suspiciously shrunken payload aborts', () => {
  // 300 rows vs 1000 synced = 30% < the 40% floor.
  assert.throws(
    () => assertPayloadSane({ ...sane, rawCount: 300, usableCount: 300 }),
    (e: Error) => e instanceof AbortRun && /shrank suspiciously/.test(e.message)
  );
});

test('too many invalid rows aborts (format probably changed)', () => {
  assert.throws(
    () => assertPayloadSane({ ...sane, quarantined: 100 }), // 10% > 5%
    (e: Error) => e instanceof AbortRun && /failed validation/.test(e.message)
  );
});

test('a tiny payload is allowed when the table is empty (first run of a new year)', () => {
  assert.doesNotThrow(() =>
    assertPayloadSane({ ...sane, rawCount: 5, usableCount: 5, syncedExistingCount: 0 })
  );
});

test('a payload below the absolute floor aborts when data already exists', () => {
  assert.throws(
    () => assertPayloadSane({ ...sane, rawCount: 50, usableCount: 50, syncedExistingCount: 100 }),
    (e: Error) => e instanceof AbortRun && /floor/.test(e.message)
  );
});

test('first run against an empty table inserts everything and deletes nothing', () => {
  const records = recordsFrom([row({ idExamen: 1 }), row({ idExamen: 2 })]);
  const plan = planChanges(records, []);
  assert.equal(plan.toInsert.length, 2);
  assert.equal(plan.toUpdate.length, 0);
  assert.equal(plan.toDelete.length, 0);
});

test('an unchanged payload produces no writes at all (idempotent)', () => {
  const records = recordsFrom([row({ idExamen: 1 }), row({ idExamen: 2 })]);
  const existing = records.map(asExisting);
  const plan = planChanges(records, existing);
  assert.equal(plan.matched, 2);
  assert.deepEqual([plan.toInsert.length, plan.toUpdate.length, plan.toDelete.length], [0, 0, 0]);
});

test('a changed field produces exactly one update', () => {
  const records = recordsFrom([row({ idExamen: 1, lugar: ' 1G 1.4' })]);
  const stale = asExisting({ ...records[0]!, place: '1G 1.7' }, 10); // the real drift seen in prod
  const plan = planChanges(records, [stale]);
  assert.equal(plan.toUpdate.length, 1);
  assert.equal(plan.toUpdate[0]?.record.place, '1G 1.4');
  assert.equal(plan.toUpdate[0]?.id, 10);
});

test('a cancelled exam is deleted when the batch is a normal size', () => {
  // 10 exams exist upstream; one is withdrawn -> 1/10 deletions, under the cap.
  const all = recordsFrom(Array.from({ length: 10 }, (_, i) => row({ idExamen: i + 1 })));
  const existing = all.map(asExisting);
  const remaining = all.slice(0, 9);

  const plan = planChanges(remaining, existing);
  assert.equal(plan.toDelete.length, 1);
  assert.equal(plan.toDelete[0]?.source_key, all[9]?.source_key);
  assert.deepEqual([plan.toInsert.length, plan.toUpdate.length], [0, 0]);
});

test('a row already soft-deleted is not re-deleted (no churn)', () => {
  const all = recordsFrom(Array.from({ length: 10 }, (_, i) => row({ idExamen: i + 1 })));
  const existing = all.map((rec, i) =>
    i === 9 ? { ...asExisting(rec, i), deleted_at: '2026-01-01T00:00:00Z' } : asExisting(rec, i)
  );
  const remaining = all.slice(0, 9); // #10 still absent upstream, but already gone

  const plan = planChanges(remaining, existing);
  assert.equal(plan.toDelete.length, 0, 'already-deleted rows must not be stamped again');
});

test('a reappeared exam is restored, not inserted as a duplicate', () => {
  const all = recordsFrom(Array.from({ length: 3 }, (_, i) => row({ idExamen: i + 1 })));
  // #1 was soft-deleted in a prior run; upstream now lists it again, unchanged.
  const existing = all.map((rec, i) =>
    i === 0 ? { ...asExisting(rec, i), deleted_at: '2026-01-01T00:00:00Z' } : asExisting(rec, i)
  );

  const plan = planChanges(all, existing);
  assert.equal(plan.toInsert.length, 0, 'must revive the existing row, not insert a new one');
  assert.equal(plan.restored, 1);
  assert.equal(plan.toUpdate.length, 1);
  assert.equal(plan.toUpdate[0]?.id, 0);
  assert.equal(plan.toDelete.length, 0);
});

test('the delete-fraction gate ignores rows that are already soft-deleted', () => {
  // 10 synced rows, 6 already soft-deleted. Only 4 are live. One more vanishes:
  // 1/4 live deletions is fine and must not be measured against the full 10.
  const all = recordsFrom(Array.from({ length: 10 }, (_, i) => row({ idExamen: i + 1 })));
  const existing = all.map((rec, i) =>
    i < 6 ? { ...asExisting(rec, i), deleted_at: '2026-01-01T00:00:00Z' } : asExisting(rec, i)
  );
  const remaining = all.slice(0, 9); // #10 (live) disappears

  assert.doesNotThrow(() => planChanges(remaining, existing));
  const plan = planChanges(remaining, existing);
  assert.equal(plan.toDelete.length, 1);
});

test('a mass deletion is blocked unless forced', () => {
  const existing = recordsFrom(
    Array.from({ length: 10 }, (_, i) => row({ idExamen: i + 1 }))
  ).map(asExisting);
  const remaining = recordsFrom([row({ idExamen: 1 }), row({ idExamen: 2 })]); // would drop 8/10

  assert.throws(
    () => planChanges(remaining, existing),
    (e: Error) => e instanceof AbortRun && /Would delete 8\/10/.test(e.message)
  );
  assert.doesNotThrow(() => planChanges(remaining, existing, true), 'force must override');
});

test('legacy rows are adopted rather than duplicated', () => {
  const records = recordsFrom([row({ idExamen: 1, lugar: ' 1G 1.4' })]);
  // A pre-pipeline row: same natural key, stale place, no source_key.
  const legacy: ExistingRow = {
    id: 500,
    source_key: null,
    code: records[0]!.code,
    degree: records[0]!.degree,
    exam_date: records[0]!.exam_date,
    exam_time: records[0]!.exam_time,
    place: '1G 1.7',
  };

  const plan = planChanges(records, [legacy]);
  assert.equal(plan.toInsert.length, 0, 'must not duplicate the legacy row');
  assert.equal(plan.toUpdate.length, 1, 'must adopt it and stamp source_key');
  assert.equal(plan.toUpdate[0]?.id, 500);
  assert.equal(plan.toUpdate[0]?.record.source_key, sourceKeyFor(1, 'GIINF'));
});

test('legacy rows the API does not serve are never touched', () => {
  const records = recordsFrom([row({ idExamen: 1 })]);
  // A degree that exists in prod but not in this API (e.g. GDAI/GFA).
  const foreign: ExistingRow = {
    id: 700,
    source_key: null,
    code: 99999,
    degree: 'GDAI',
    exam_date: '2025-01-01',
    exam_time: '09:00:00',
  };

  const plan = planChanges(records, [foreign]);
  assert.equal(plan.toDelete.length, 0, 'legacy rows must never be deleted');
  assert.ok(!plan.toUpdate.some((u) => u.id === 700), 'and never updated');
  assert.equal(plan.unmatchedLegacy, 1);
});

test('a record already matched by source_key is never re-adopted onto a legacy row', () => {
  // Two sittings of one exam, same code/degree/date, different times: an 08:00
  // group already synced (real source_key) and an 11:00 group upstream no
  // longer reports, left over from before this pipeline existed (legacy,
  // source_key null). Reproduces FPR/GIAR/2026-01-09 in production, where the
  // loose match (code+degree+date, ignoring time) paired the *matched* record
  // with the legacy row instead of leaving the legacy row alone, and the write
  // then tried to stamp one source_key onto two different rows.
  const records = recordsFrom([row({ idExamen: 42, hora: 8, minuto: 0 })]);
  const matched = asExisting(records[0]!, 1);
  const legacySecondSitting: ExistingRow = {
    id: 218,
    source_key: null,
    code: records[0]!.code,
    degree: records[0]!.degree,
    exam_date: records[0]!.exam_date,
    exam_time: '11:00:00',
  };

  const plan = planChanges(records, [matched, legacySecondSitting]);

  assert.ok(!plan.toUpdate.some((u) => u.id === 218), 'the legacy row must not be touched');
  assert.equal(plan.toInsert.length, 0, 'the matched record must not be duplicated either');
  assert.equal(plan.unmatchedLegacy, 1, 'the legacy sitting stays reported as unmatched');
});

test('ambiguous legacy matches are left alone and reported', () => {
  log.reset();
  const records = recordsFrom([row({ idExamen: 1, hora: null, minuto: null })]);
  const twin = (id: number): ExistingRow => ({
    id: id,
    source_key: null,
    code: records[0]!.code,
    degree: records[0]!.degree,
    exam_date: records[0]!.exam_date,
    exam_time: null,
  });

  const plan = planChanges(records, [twin(1), twin(2)]);
  // One is adopted only if unambiguous; two identical candidates must not be guessed at.
  assert.equal(plan.toInsert.length, 1, 'insert fresh rather than guess');
  assert.ok(log.collected().some((w) => w.code === 'legacy_ambiguous'));
  log.reset();
});

test('--prune-legacy removes stale rows only in degrees the API serves', () => {
  const records = recordsFrom(Array.from({ length: 10 }, (_, i) => row({ idExamen: i + 1 })));
  const staleServed: ExistingRow = {
    id: 800,
    source_key: null,
    code: 42,
    degree: 'GIINF', // served by the API -> prunable
    exam_date: '2025-11-11',
    exam_time: '08:00:00',
  };
  const foreign: ExistingRow = {
    id: 900,
    source_key: null,
    code: 43,
    degree: 'GFA', // never served by this API -> must survive
    exam_date: '2025-11-11',
    exam_time: '08:00:00',
  };
  const existing = [...records.map(asExisting), staleServed, foreign];

  const off = planChanges(records, existing, false, false);
  assert.deepEqual(off.prunable.map((r) => r.id), [800], 'GFA must never be prunable');
  assert.equal(off.toDelete.length, 0, 'nothing is pruned unless asked');

  const on = planChanges(records, existing, false, true);
  assert.deepEqual(on.toDelete.map((r) => r.id), [800]);
  assert.ok(!on.toDelete.some((r) => r.id === 900), 'GFA row must survive a prune');
});

test('deleting from a table with only legacy rows is impossible', () => {
  const records = recordsFrom([row({ idExamen: 1 })]);
  const legacyOnly: ExistingRow[] = [
    { id: 1, source_key: null, code: 1, degree: 'GFA', exam_date: '2025-01-01' },
  ];
  const plan = planChanges(records, legacyOnly);
  assert.equal(plan.toDelete.length, 0);
});
