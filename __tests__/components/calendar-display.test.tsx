import React from 'react';
import { render, screen } from '@testing-library/react';
import { CalendarDisplay } from '@/components/calendar-display';
import type { Exam } from '@/types/exam';

// --- Context + hooks -------------------------------------------------------
jest.mock('@/context/auth-context', () => ({
  useAuth: () => ({ user: null, syncToken: jest.fn(), loading: false }),
}));
jest.mock('@/context/settings-context', () => ({
  // Real useTranslations reads settings.language; 'es' → Castellano labels.
  useSettings: () => ({ settings: { language: 'es', viewMode: 'calendar' }, updateSettings: jest.fn() }),
}));
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: jest.fn() }) }));

// --- Server actions / helpers (self-contained → no TDZ) --------------------
jest.mock('@/actions/exam-actions', () => ({ getExams: jest.fn().mockResolvedValue([]) }));
jest.mock('@/actions/user-calendars', () => ({
  saveUserCalendar: jest.fn().mockResolvedValue({}),
  getUserCalendarNames: jest.fn().mockResolvedValue([]),
}));
jest.mock('@/utils/auth-helpers', () => ({
  getCurrentSession: jest.fn().mockResolvedValue(null),
  getFreshAuthTokens: jest.fn().mockResolvedValue(null),
}));
jest.mock('@/lib/calendar-export', () => ({
  openInGoogleCalendar: jest.fn(),
  remindersToIso: jest.fn(() => []),
}));

// --- date-utils ------------------------------------------------------------
jest.mock('@/utils/date-utils', () => ({
  formatDateString: (date: string) => date,
  getCurrentYear: () => 2024,
  getAcademicYearForMonth: () => ({ startYear: 2023, endYear: 2024 }),
  detectAcademicYearFromExams: () => ({ startYear: 2023, endYear: 2024 }),
  generateAcademicYearMonths: () => [
    { name: 'September', year: 2023, monthNumber: 9 },
    { name: 'October', year: 2023, monthNumber: 10 },
    { name: 'November', year: 2023, monthNumber: 11 },
    { name: 'December', year: 2023, monthNumber: 12 },
    { name: 'January', year: 2024, monthNumber: 1 },
    { name: 'February', year: 2024, monthNumber: 2 },
    { name: 'March', year: 2024, monthNumber: 3 },
    { name: 'April', year: 2024, monthNumber: 4 },
    { name: 'May', year: 2024, monthNumber: 5 },
    { name: 'June', year: 2024, monthNumber: 6 },
    { name: 'July', year: 2024, monthNumber: 7 },
    { name: 'August', year: 2024, monthNumber: 8 },
  ],
}));

// --- Child components (stubbed to keep the surface small) ------------------
jest.mock('@/components/save-calendar-dialog', () => ({
  SaveCalendarDialog: ({ open }: any) => (open ? <div data-testid="save-dialog" /> : null),
}));
jest.mock('@/components/exam-conflicts-banner', () => ({
  ExamConflictsBanner: () => null,
}));
jest.mock('@/components/exam-list-view', () => ({
  ExamListView: ({ exams }: { exams: Exam[] }) => (
    <div data-testid="exam-list-view">{exams.length} exams</div>
  ),
}));

const exam: Exam = {
  id: '1',
  date: '2024-01-15',
  time: '09:00',
  subject: 'Cálculo',
  acronym: 'CAL',
  degree: 'GIINF',
  year: '1',
  semester: 'A',
  location: 'Aula 1',
  code: '11500',
  comment: '',
} as unknown as Exam;

describe('CalendarDisplay', () => {
  it('renders the calendar heading and export/save actions when there are exams', () => {
    render(<CalendarDisplay activeFilters={{ subject: ['Cálculo'] }} exams={[exam]} />);

    expect(screen.getByText('Calendario de Exámenes')).toBeInTheDocument();
    expect(screen.getByText('Exportar')).toBeInTheDocument();
    expect(screen.getByText('Guardar')).toBeInTheDocument();
  });

  it('shows the upcoming-exams section', () => {
    render(<CalendarDisplay activeFilters={{ subject: ['Cálculo'] }} exams={[exam]} />);

    expect(screen.getByText('Próximos exámenes')).toBeInTheDocument();
  });

  it('prompts the user to select criteria when there are no exams or filters', () => {
    render(<CalendarDisplay activeFilters={{}} exams={[]} />);

    expect(
      screen.getByText('Selecciona tus criterios para ver el calendario')
    ).toBeInTheDocument();
  });
});
