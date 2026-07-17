import { detectConflicts, worstSeverity } from '@/lib/exam-conflicts';
import type { Exam } from '@/types/exam';

let nextId = 1;

/**
 * Each call is a different course by default (distinct subject and acronym) —
 * the ordinary case, since a student's own subjects are different courses.
 * Tests that specifically need two rows of the *same* course (parallel exam
 * rooms) override both `subject` and `acronym` to match.
 */
function makeExam(overrides: Partial<Exam> & Pick<Exam, 'date'>): Exam {
  const id = nextId++;
  return {
    id,
    subject: `Test subject ${id}`,
    code: String(id),
    acronym: `TST${id}`,
    date: overrides.date,
    time: '10:00:00',
    duration_minutes: 120,
    location: 'Aula 1',
    school: 'ETSINF',
    degree: 'GIINF',
    year: '1',
    semester: 'A',
    academicYear: 2025,
    ...overrides,
  };
}

describe('detectConflicts', () => {
  it('flags nothing when exams fall on different days', () => {
    const exams = [makeExam({ date: '2026-01-10' }), makeExam({ date: '2026-01-11' })];
    expect(detectConflicts(exams)).toEqual([]);
  });

  it('flags nothing for a single exam in a day', () => {
    expect(detectConflicts([makeExam({ date: '2026-01-10' })])).toEqual([]);
  });

  it('does not flag two exams the same day with a comfortable gap', () => {
    const exams = [
      makeExam({ date: '2026-01-10', time: '09:00:00', duration_minutes: 60 }),
      // Starts a clean 2h after the first ends (10:00).
      makeExam({ date: '2026-01-10', time: '12:00:00', duration_minutes: 60 }),
    ];
    expect(detectConflicts(exams)).toEqual([]);
  });

  it('flags a genuine time overlap as the most severe case', () => {
    const a = makeExam({ date: '2026-01-10', time: '09:00:00', duration_minutes: 120 }); // 09:00-11:00
    const b = makeExam({ date: '2026-01-10', time: '10:00:00', duration_minutes: 90 }); // 10:00-11:30

    const [conflict] = detectConflicts([a, b]);
    expect(conflict?.severity).toBe('overlap');
    expect(conflict?.pairs).toHaveLength(1);
    expect(conflict?.pairs[0]?.overlapMinutes).toBe(60); // 10:00-11:00
    expect(conflict?.pairs[0]?.gapMinutes).toBeNull();
  });

  it('flags a back-to-back pair under the tight threshold', () => {
    const a = makeExam({ date: '2026-01-10', time: '09:00:00', duration_minutes: 60 }); // ends 10:00
    const b = makeExam({ date: '2026-01-10', time: '10:30:00', duration_minutes: 60 }); // starts 30 min later

    const [conflict] = detectConflicts([a, b]);
    expect(conflict?.severity).toBe('tight');
    expect(conflict?.pairs[0]?.gapMinutes).toBe(30);
    expect(conflict?.pairs[0]?.overlapMinutes).toBe(0);
  });

  it('treats exactly a one-hour gap as comfortable, not tight', () => {
    const a = makeExam({ date: '2026-01-10', time: '09:00:00', duration_minutes: 60 }); // ends 10:00
    const b = makeExam({ date: '2026-01-10', time: '11:00:00', duration_minutes: 60 }); // gap = 60

    expect(detectConflicts([a, b])).toEqual([]);
  });

  it('treats a 59-minute gap as tight', () => {
    const a = makeExam({ date: '2026-01-10', time: '09:00:00', duration_minutes: 60 }); // ends 10:00
    const b = makeExam({ date: '2026-01-10', time: '10:59:00', duration_minutes: 60 });

    const [conflict] = detectConflicts([a, b]);
    expect(conflict?.severity).toBe('tight');
  });

  it('flags three exams in one day as busy even with comfortable gaps', () => {
    const exams = [
      makeExam({ date: '2026-01-10', time: '08:00:00', duration_minutes: 60 }),
      makeExam({ date: '2026-01-10', time: '12:00:00', duration_minutes: 60 }),
      makeExam({ date: '2026-01-10', time: '17:00:00', duration_minutes: 60 }),
    ];

    const [conflict] = detectConflicts(exams);
    expect(conflict?.severity).toBe('busy');
    expect(conflict?.exams).toHaveLength(3);
    expect(conflict?.pairs).toEqual([]);
  });

  it('reports overlap severity even when a third, unrelated exam that day is comfortably spaced', () => {
    const exams = [
      makeExam({ date: '2026-01-10', time: '09:00:00', duration_minutes: 90 }), // 09:00-10:30
      makeExam({ date: '2026-01-10', time: '10:00:00', duration_minutes: 60 }), // 10:00-11:00, overlaps the first
      makeExam({ date: '2026-01-10', time: '18:00:00', duration_minutes: 60 }), // isolated
    ];

    const [conflict] = detectConflicts(exams);
    expect(conflict?.severity).toBe('overlap');
    expect(conflict?.exams).toHaveLength(3); // every exam that day is shown, not just the pair
    expect(conflict?.pairs).toHaveLength(1);
  });

  it('does not treat an all-day exam as conflicting with a single timed exam', () => {
    const exams = [
      makeExam({ date: '2026-01-10', time: '', duration_minutes: 0 }), // no set time
      makeExam({ date: '2026-01-10', time: '10:00:00', duration_minutes: 60 }),
    ];
    expect(detectConflicts(exams)).toEqual([]);
  });

  it('does not run a multi-day item through time-overlap math', () => {
    // duration_minutes spanning 2 days (2880) even though a clock time is set —
    // this is a take-home/project window, not a sitting to be double-booked against.
    const exams = [
      makeExam({ date: '2026-01-10', time: '09:00:00', duration_minutes: 2880 }),
      makeExam({ date: '2026-01-10', time: '09:30:00', duration_minutes: 60 }),
    ];
    expect(detectConflicts(exams)).toEqual([]);
  });

  it('defaults a zero or negative duration to two hours, matching the rest of the app', () => {
    const a = makeExam({ date: '2026-01-10', time: '09:00:00', duration_minutes: 0 }); // -> treated as 120
    const b = makeExam({ date: '2026-01-10', time: '10:30:00', duration_minutes: 60 }); // starts inside a's 09:00-11:00

    const [conflict] = detectConflicts([a, b]);
    expect(conflict?.severity).toBe('overlap');
  });

  it('does not flag parallel rooms of one course at the same time', () => {
    // Real shape: one exam split across labs is several identical rows.
    const room = (place: string) =>
      makeExam({ date: '2026-01-10', time: '08:00:00', duration_minutes: 90, subject: 'Autómatas', acronym: 'TAL', location: place });

    expect(detectConflicts([room('Lab 1'), room('Lab 2'), room('Lab 3')])).toEqual([]);
  });

  it('does not flag alternate sittings of one course at different times as tight or busy', () => {
    const sitting = (time: string) =>
      makeExam({ date: '2026-01-10', time, duration_minutes: 60, subject: 'Discreta', acronym: 'MAD' });

    expect(detectConflicts([sitting('12:00:00'), sitting('15:00:00')])).toEqual([]);
  });

  it('still flags a real overlap between two different courses that happen to share an acronym', () => {
    // BDA means a different course in GCD than in GIINF; same acronym, distinct subject.
    const a = makeExam({ date: '2026-01-10', time: '09:00:00', duration_minutes: 90, subject: 'Bases de datos', acronym: 'BDA' });
    const b = makeExam({ date: '2026-01-10', time: '10:00:00', duration_minutes: 60, subject: 'Bases de datos y sistemas de información', acronym: 'BDA' });

    const [conflict] = detectConflicts([a, b]);
    expect(conflict?.severity).toBe('overlap');
  });

  it('collapses duplicate room-rows of a clash into a single reported pair', () => {
    const talRoom = (place: string) =>
      makeExam({ date: '2026-01-10', time: '08:00:00', duration_minutes: 90, subject: 'Autómatas', acronym: 'TAL', location: place });
    const dbdRoom = (place: string) =>
      makeExam({ date: '2026-01-10', time: '08:30:00', duration_minutes: 60, subject: 'Bases de datos', acronym: 'DBD', location: place });

    const [conflict] = detectConflicts([talRoom('Lab 1'), talRoom('Lab 2'), dbdRoom('Aula A'), dbdRoom('Aula B')]);
    expect(conflict?.severity).toBe('overlap');
    expect(conflict?.pairs).toHaveLength(1); // one clash between the two courses, not 2x2
  });

  it('requires three distinct courses for busy, not three duplicate rows of one', () => {
    const room = (place: string) =>
      makeExam({ date: '2026-01-10', time: '08:00:00', duration_minutes: 60, subject: 'Autómatas', acronym: 'TAL', location: place });

    expect(detectConflicts([room('Lab 1'), room('Lab 2'), room('Lab 3')])).toEqual([]);
  });

  it('ignores exams with no date', () => {
    const exams = [makeExam({ date: '' }), makeExam({ date: '' })];
    expect(detectConflicts(exams)).toEqual([]);
  });

  it('sorts results by date', () => {
    const exams = [
      makeExam({ date: '2026-02-01', time: '09:00:00' }),
      makeExam({ date: '2026-02-01', time: '09:30:00' }),
      makeExam({ date: '2026-01-05', time: '09:00:00' }),
      makeExam({ date: '2026-01-05', time: '09:15:00' }),
    ];

    const dates = detectConflicts(exams).map((c) => c.date);
    expect(dates).toEqual(['2026-01-05', '2026-02-01']);
  });
});

describe('worstSeverity', () => {
  it('returns null for no conflicts', () => {
    expect(worstSeverity([])).toBeNull();
  });

  it('ranks overlap above tight above busy', () => {
    const overlap = detectConflicts([
      makeExam({ date: '2026-01-10', time: '09:00:00', duration_minutes: 90 }),
      makeExam({ date: '2026-01-10', time: '09:30:00', duration_minutes: 60 }),
    ]);
    const busy = detectConflicts([
      makeExam({ date: '2026-01-11', time: '08:00:00', duration_minutes: 30 }),
      makeExam({ date: '2026-01-11', time: '12:00:00', duration_minutes: 30 }),
      makeExam({ date: '2026-01-11', time: '17:00:00', duration_minutes: 30 }),
    ]);

    expect(worstSeverity([...busy, ...overlap])).toBe('overlap');
    expect(worstSeverity(busy)).toBe('busy');
  });
});
