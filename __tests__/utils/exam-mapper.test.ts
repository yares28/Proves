import { mapExamData } from '@/utils/exam-mapper';

describe('Exam Mapper', () => {
  describe('mapExamData', () => {
    it('should map exam data correctly', () => {
      const rawExamData = {
        id: '1',
        name: 'Programming Exam',
        date: '2024-01-15',
        school: 'ETSINF',
        degree: 'Computer Science',
        semester: '1st Semester',
        year: 2024,
        subject: 'Programming',
        description: 'Final programming exam',
        duration: 120,
        location: 'Room 101',
        type: 'Final',
      };

      const mappedData = mapExamData(rawExamData);

      expect(mappedData).toEqual({
        id: '1',
        name: 'Programming Exam',
        date: '2024-01-15',
        school: 'ETSINF',
        degree: 'Computer Science',
        semester: '1st Semester',
        year: 2024,
        subject: 'Programming',
        description: 'Final programming exam',
        duration: 120,
        location: 'Room 101',
        type: 'Final',
      });
    });

    it('should handle missing optional fields', () => {
      const rawExamData = {
        id: '1',
        name: 'Programming Exam',
        date: '2024-01-15',
        school: 'ETSINF',
      };

      const mappedData = mapExamData(rawExamData);

      expect(mappedData).toEqual({
        id: '1',
        name: 'Programming Exam',
        date: '2024-01-15',
        school: 'ETSINF',
        degree: undefined,
        semester: undefined,
        year: undefined,
        subject: undefined,
        description: undefined,
        duration: undefined,
        location: undefined,
        type: undefined,
      });
    });

    it('should handle null values', () => {
      const rawExamData = {
        id: '1',
        name: 'Programming Exam',
        date: '2024-01-15',
        school: 'ETSINF',
        degree: null,
        semester: null,
        year: null,
        subject: null,
        description: null,
        duration: null,
        location: null,
        type: null,
      };

      const mappedData = mapExamData(rawExamData);

      expect(mappedData).toEqual({
        id: '1',
        name: 'Programming Exam',
        date: '2024-01-15',
        school: 'ETSINF',
        degree: null,
        semester: null,
        year: null,
        subject: null,
        description: null,
        duration: null,
        location: null,
        type: null,
      });
    });

    it('should handle empty string values', () => {
      const rawExamData = {
        id: '1',
        name: 'Programming Exam',
        date: '2024-01-15',
        school: 'ETSINF',
        degree: '',
        semester: '',
        year: '',
        subject: '',
        description: '',
        duration: '',
        location: '',
        type: '',
      };

      const mappedData = mapExamData(rawExamData);

      expect(mappedData).toEqual({
        id: '1',
        name: 'Programming Exam',
        date: '2024-01-15',
        school: 'ETSINF',
        degree: '',
        semester: '',
        year: '',
        subject: '',
        description: '',
        duration: '',
        location: '',
        type: '',
      });
    });

    it('should handle undefined values', () => {
      const rawExamData = {
        id: '1',
        name: 'Programming Exam',
        date: '2024-01-15',
        school: 'ETSINF',
        degree: undefined,
        semester: undefined,
        year: undefined,
        subject: undefined,
        description: undefined,
        duration: undefined,
        location: undefined,
        type: undefined,
      };

      const mappedData = mapExamData(rawExamData);

      expect(mappedData).toEqual({
        id: '1',
        name: 'Programming Exam',
        date: '2024-01-15',
        school: 'ETSINF',
        degree: undefined,
        semester: undefined,
        year: undefined,
        subject: undefined,
        description: undefined,
        duration: undefined,
        location: undefined,
        type: undefined,
      });
    });

    it('should handle different data types correctly', () => {
      const rawExamData = {
        id: 1, // number instead of string
        name: 'Programming Exam',
        date: '2024-01-15',
        school: 'ETSINF',
        degree: 'Computer Science',
        semester: '1st Semester',
        year: '2024', // string instead of number
        subject: 'Programming',
        description: 'Final programming exam',
        duration: '120', // string instead of number
        location: 'Room 101',
        type: 'Final',
      };

      const mappedData = mapExamData(rawExamData);

      expect(mappedData).toEqual({
        id: 1,
        name: 'Programming Exam',
        date: '2024-01-15',
        school: 'ETSINF',
        degree: 'Computer Science',
        semester: '1st Semester',
        year: '2024',
        subject: 'Programming',
        description: 'Final programming exam',
        duration: '120',
        location: 'Room 101',
        type: 'Final',
      });
    });

    it('should handle special characters in text fields', () => {
      const rawExamData = {
        id: '1',
        name: 'Programming & Algorithms Exam',
        date: '2024-01-15',
        school: 'ETSINF',
        degree: 'Computer Science & Engineering',
        semester: '1st Semester',
        year: 2024,
        subject: 'Programming & Algorithms',
        description: 'Final programming exam with special characters: áéíóú',
        duration: 120,
        location: 'Room 101-A',
        type: 'Final',
      };

      const mappedData = mapExamData(rawExamData);

      expect(mappedData).toEqual({
        id: '1',
        name: 'Programming & Algorithms Exam',
        date: '2024-01-15',
        school: 'ETSINF',
        degree: 'Computer Science & Engineering',
        semester: '1st Semester',
        year: 2024,
        subject: 'Programming & Algorithms',
        description: 'Final programming exam with special characters: áéíóú',
        duration: 120,
        location: 'Room 101-A',
        type: 'Final',
      });
    });

    it('should handle very long text fields', () => {
      const longDescription = 'A'.repeat(1000);
      const rawExamData = {
        id: '1',
        name: 'Programming Exam',
        date: '2024-01-15',
        school: 'ETSINF',
        degree: 'Computer Science',
        semester: '1st Semester',
        year: 2024,
        subject: 'Programming',
        description: longDescription,
        duration: 120,
        location: 'Room 101',
        type: 'Final',
      };

      const mappedData = mapExamData(rawExamData);

      expect(mappedData.description).toBe(longDescription);
      expect(mappedData.description.length).toBe(1000);
    });

    it('should handle edge cases for numeric fields', () => {
      const rawExamData = {
        id: '1',
        name: 'Programming Exam',
        date: '2024-01-15',
        school: 'ETSINF',
        degree: 'Computer Science',
        semester: '1st Semester',
        year: 0, // edge case
        subject: 'Programming',
        description: 'Final programming exam',
        duration: 0, // edge case
        location: 'Room 101',
        type: 'Final',
      };

      const mappedData = mapExamData(rawExamData);

      expect(mappedData.year).toBe(0);
      expect(mappedData.duration).toBe(0);
    });

    it('should handle malformed date strings', () => {
      const rawExamData = {
        id: '1',
        name: 'Programming Exam',
        date: 'invalid-date',
        school: 'ETSINF',
        degree: 'Computer Science',
        semester: '1st Semester',
        year: 2024,
        subject: 'Programming',
        description: 'Final programming exam',
        duration: 120,
        location: 'Room 101',
        type: 'Final',
      };

      const mappedData = mapExamData(rawExamData);

      expect(mappedData.date).toBe('invalid-date');
    });

    it('should handle array of exam data', () => {
      const rawExamDataArray = [
        {
          id: '1',
          name: 'Programming Exam',
          date: '2024-01-15',
          school: 'ETSINF',
        },
        {
          id: '2',
          name: 'Database Exam',
          date: '2024-01-20',
          school: 'ETSINF',
        },
      ];

      const mappedDataArray = rawExamDataArray.map(mapExamData);

      expect(mappedDataArray).toHaveLength(2);
      expect(mappedDataArray[0]).toEqual({
        id: '1',
        name: 'Programming Exam',
        date: '2024-01-15',
        school: 'ETSINF',
        degree: undefined,
        semester: undefined,
        year: undefined,
        subject: undefined,
        description: undefined,
        duration: undefined,
        location: undefined,
        type: undefined,
      });
      expect(mappedDataArray[1]).toEqual({
        id: '2',
        name: 'Database Exam',
        date: '2024-01-20',
        school: 'ETSINF',
        degree: undefined,
        semester: undefined,
        year: undefined,
        subject: undefined,
        description: undefined,
        duration: undefined,
        location: undefined,
        type: undefined,
      });
    });

    it('should preserve original object structure', () => {
      const rawExamData = {
        id: '1',
        name: 'Programming Exam',
        date: '2024-01-15',
        school: 'ETSINF',
        degree: 'Computer Science',
        semester: '1st Semester',
        year: 2024,
        subject: 'Programming',
        description: 'Final programming exam',
        duration: 120,
        location: 'Room 101',
        type: 'Final',
        extraField: 'This should be preserved',
        nestedObject: { key: 'value' },
      };

      const mappedData = mapExamData(rawExamData);

      // Should include all original fields
      expect(mappedData).toHaveProperty('extraField', 'This should be preserved');
      expect(mappedData).toHaveProperty('nestedObject', { key: 'value' });
    });
  });
}); 