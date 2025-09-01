import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { CalendarDisplay } from '@/components/calendar-display';

// Mock the auth context
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: { full_name: 'John Doe' },
};

jest.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    user: mockUser,
    syncToken: jest.fn(),
    loading: false,
  }),
}));

// Mock the settings context
jest.mock('@/context/settings-context', () => ({
  useSettings: () => ({
    settings: {
      viewMode: 'calendar',
      theme: 'light',
    },
    updateSettings: jest.fn(),
  }),
}));

// Mock the toast hook
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock the exam actions
const mockGetExams = jest.fn();
jest.mock('@/actions/exam-actions', () => ({
  getExams: (...args: any[]) => mockGetExams(...args),
}));

// Mock the user calendars actions
jest.mock('@/actions/user-calendars', () => ({
  saveUserCalendar: jest.fn(),
  getUserCalendarNames: jest.fn().mockResolvedValue([]),
}));

// Mock the auth helpers
jest.mock('@/utils/auth-helpers', () => ({
  getCurrentSession: jest.fn(),
  getFreshAuthTokens: jest.fn(),
}));

// Mock the date utils to have predictable months
jest.mock('@/utils/date-utils', () => ({
  formatDateString: jest.fn((year: number, month: number, day: number) =>
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  ),
  getCurrentYear: jest.fn(() => 2024),
  getAcademicYearForMonth: jest.fn(() => ({ startYear: 2023, endYear: 2024 })),
  detectAcademicYearFromExams: jest.fn(() => ({ startYear: 2023, endYear: 2024 })),
  generateAcademicYearMonths: jest.fn(() => [
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
  ]),
}));

// Mock dialog components
jest.mock('@/components/save-calendar-dialog', () => ({
  SaveCalendarDialog: ({ open }: any) => (open ? <div data-testid="save-calendar-dialog" /> : null),
}));

jest.mock('@/components/export-calendar-dialog', () => ({
  ExportCalendarDialog: ({ open }: any) => (open ? <div data-testid="export-calendar-dialog" /> : null),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

// Mock window.location
Object.defineProperty(window, 'location', {
  value: { origin: 'https://upv-cal.vercel.app' },
  writable: true,
});

describe('etsa', () => {
  const etsaExams = [
    {
      id: 'a1',
      name: 'Architecture Basics (AR1)',
      subject: 'Architecture Basics (AR1)',
      date: '2024-01-20',
      time: '10:00',
      location: 'A1 0.1',
      degree: 'GIA',
      school: 'ETSA',
      year: 1,
      semester: 'A',
    },
    {
      id: 'a2',
      name: 'Design Principles (DES)',
      subject: 'Design Principles (DES)',
      date: '2024-02-05',
      time: '12:00',
      location: 'A2 2.2',
      degree: 'GIA',
      school: 'ETSA',
      year: 1,
      semester: 'A',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetExams.mockResolvedValue(etsaExams);
  });

  it('shows all ETSA exams when filtered by ETSA', async () => {
    const activeFilters = {
      school: ['ETSA'],
      subject: ['Architecture Basics (AR1)'],
    } as Record<string, string[]>;

    render(<CalendarDisplay activeFilters={activeFilters} />);

    await waitFor(() => {
      expect(mockGetExams).toHaveBeenCalledWith(activeFilters);
    });

    for (const exam of etsaExams) {
      await waitFor(() => {
        expect(screen.getByText(exam.name)).toBeInTheDocument();
      });
    }

    await waitFor(() => {
      expect(screen.getByText('Exportar')).not.toBeDisabled();
      expect(screen.getByText('Guardar')).not.toBeDisabled();
    });
  });
});


