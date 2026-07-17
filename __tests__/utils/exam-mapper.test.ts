import { mapExamData } from '@/utils/exam-mapper';

/**
 * mapExamData converts a raw Supabase exam row (DB column names) into the
 * `Exam` shape the UI consumes.
 */
describe('Exam Mapper', () => {
  describe('mapExamData', () => {
    it('maps a full DB row to the Exam shape', () => {
      const row = {
        exam_instance_id: 42,
        exam_date: '2026-01-15',
        exam_time: '09:00',
        duration_minutes: 90,
        duration_day: 'P1D',
        subject: 'Programación',
        code: 11604,
        acronym: 'PRG',
        place: 'Aula 1G 1.7',
        comment: 'Examen parcial',
        year: 2,
        semester: 'A',
        school: 'ETSINF',
        degree: 'GIINF',
      };

      expect(mapExamData(row)).toEqual({
        id: 42,
        date: '2026-01-15',
        time: '09:00',
        duration_minutes: 90,
        duration_day: 'P1D',
        subject: 'Programación',
        code: '11604',
        acronym: 'PRG',
        location: 'Aula 1G 1.7',
        comment: 'Examen parcial',
        year: '2',
        semester: 'A',
        school: 'ETSINF',
        degree: 'GIINF',
      });
    });

    it('defaults duration_minutes to 120 when missing or null', () => {
      expect(mapExamData({ exam_instance_id: 1 }).duration_minutes).toBe(120);
      expect(mapExamData({ exam_instance_id: 1, duration_minutes: null }).duration_minutes).toBe(120);
    });

    it('preserves an explicit zero duration (does not fall back to 120)', () => {
      expect(mapExamData({ exam_instance_id: 1, duration_minutes: 0 }).duration_minutes).toBe(0);
    });

    it('normalizes code and year to strings', () => {
      const mapped = mapExamData({ exam_instance_id: 1, code: 11566, year: 4 });
      expect(mapped.code).toBe('11566');
      expect(mapped.year).toBe('4');
    });

    it('coerces missing optional text fields to empty strings', () => {
      const mapped = mapExamData({ exam_instance_id: 7, subject: 'X' });
      expect(mapped).toMatchObject({
        id: 7,
        subject: 'X',
        time: '',
        duration_day: '',
        code: '',
        location: '',
        comment: '',
        year: '',
        semester: '',
        school: '',
        degree: '',
        acronym: '',
      });
    });

    it('maps the place column to location', () => {
      expect(mapExamData({ exam_instance_id: 1, place: 'Aula 2.1' }).location).toBe('Aula 2.1');
    });

    it('can be used to map an array of rows', () => {
      const rows = [
        { exam_instance_id: 1, subject: 'A', exam_date: '2026-01-10' },
        { exam_instance_id: 2, subject: 'B', exam_date: '2026-01-11' },
      ];
      const mapped = rows.map(mapExamData);
      expect(mapped).toHaveLength(2);
      expect(mapped[0]).toMatchObject({ id: 1, subject: 'A', date: '2026-01-10' });
      expect(mapped[1]).toMatchObject({ id: 2, subject: 'B', date: '2026-01-11' });
    });
  });
});
