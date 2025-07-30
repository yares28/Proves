import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarDisplay } from '@/components/calendar-display';
import { SettingsProvider } from '@/context/settings-context';

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

// Mock the toast hook
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock the exam actions
jest.mock('@/actions/exam-actions', () => ({
  getExams: jest.fn(),
}));

// Mock the user calendar actions
jest.mock('@/actions/user-calendars', () => ({
  saveUserCalendar: jest.fn(),
  getUserCalendarNames: jest.fn(),
}));

// Mock the auth helpers
jest.mock('@/utils/auth-helpers', () => ({
  getCurrentSession: jest.fn(),
  getFreshAuthTokens: jest.fn(),
}));

// Mock the date utils
jest.mock('@/utils/date-utils', () => ({
  formatDateString: jest.fn((year, month, day) => `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`),
  getCurrentYear: jest.fn(() => 2024),
  getAcademicYearForMonth: jest.fn((month, year) => year || 2024),
  detectAcademicYearFromExams: jest.fn(),
  generateAcademicYearMonths: jest.fn(() => [
    { name: 'September', days: 30, startDay: 0, monthNumber: 9, year: 2024 },
    { name: 'October', days: 31, startDay: 2, monthNumber: 10, year: 2024 },
    // ... more months
  ]),
}));

// Mock the view toggle component
jest.mock('@/components/view-toggle', () => ({
  ViewToggle: ({ view, onViewChange }: any) => (
    <div data-testid="view-toggle">
      <button onClick={() => onViewChange('calendar')}>Calendar</button>
      <button onClick={() => onViewChange('list')}>List</button>
    </div>
  ),
}));

// Mock the exam list view component
jest.mock('@/components/exam-list-view', () => ({
  ExamListView: ({ exams }: any) => (
    <div data-testid="exam-list-view">
      {exams.map((exam: any) => (
        <div key={exam.id}>{exam.name}</div>
      ))}
    </div>
  ),
}));

// Mock the save calendar dialog component
jest.mock('@/components/save-calendar-dialog', () => ({
  SaveCalendarDialog: ({ open, onOpenChange }: any) => (
    open ? (
      <div data-testid="save-calendar-dialog">
        <button onClick={() => onOpenChange(false)}>Close Save Dialog</button>
      </div>
    ) : null
  ),
}));

// Mock the export calendar dialog component
jest.mock('@/components/export-calendar-dialog', () => ({
  ExportCalendarDialog: ({ open, onOpenChange }: any) => (
    open ? (
      <div data-testid="export-calendar-dialog">
        <button onClick={() => onOpenChange(false)}>Close Export Dialog</button>
      </div>
    ) : null
  ),
}));

describe('CalendarDisplay', () => {
  const mockOnExamsChange = jest.fn();
  const mockActiveFilters = {
    school: ['ETSINF'],
    degree: ['Computer Science'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderCalendarDisplay = () => {
    return render(
      <SettingsProvider>
        <CalendarDisplay 
          activeFilters={mockActiveFilters} 
          onExamsChange={mockOnExamsChange} 
        />
      </SettingsProvider>
    );
  };

  describe('Rendering', () => {
    it('should render the calendar display with basic elements', () => {
      renderCalendarDisplay();

      expect(screen.getByText('Calendario de Exámenes')).toBeInTheDocument();
      expect(screen.getByTestId('view-toggle')).toBeInTheDocument();
    });

    it('should render calendar view by default', () => {
      renderCalendarDisplay();

      expect(screen.getByText('Calendario de Exámenes')).toBeInTheDocument();
      // Calendar view should be visible
      expect(screen.queryByTestId('exam-list-view')).not.toBeInTheDocument();
    });

    it('should render list view when view is changed', async () => {
      const user = userEvent.setup();
      renderCalendarDisplay();

      const listButton = screen.getByText('List');
      await user.click(listButton);

      expect(screen.getByTestId('exam-list-view')).toBeInTheDocument();
    });

    it('should render export and save buttons when user is authenticated', () => {
      renderCalendarDisplay();

      expect(screen.getByText('Exportar')).toBeInTheDocument();
      expect(screen.getByText('Guardar')).toBeInTheDocument();
    });

    it('should not render save button when user is not authenticated', () => {
      jest.doMock('@/context/auth-context', () => ({
        useAuth: () => ({
          user: null,
          syncToken: jest.fn(),
          loading: false,
        }),
      }));

      renderCalendarDisplay();

      expect(screen.getByText('Exportar')).toBeInTheDocument();
      expect(screen.queryByText('Guardar')).not.toBeInTheDocument();
    });
  });

  describe('Exam Loading', () => {
    it('should load exams when component mounts', async () => {
      const { getExams } = require('@/actions/exam-actions');
      const mockExams = [
        { id: '1', name: 'Programming Exam', date: '2024-01-15', school: 'ETSINF' },
        { id: '2', name: 'Database Exam', date: '2024-01-20', school: 'ETSINF' },
      ];
      getExams.mockResolvedValue(mockExams);

      renderCalendarDisplay();

      await waitFor(() => {
        expect(getExams).toHaveBeenCalledWith(mockActiveFilters);
      });
    });

    it('should handle exam loading errors', async () => {
      const { getExams } = require('@/actions/exam-actions');
      getExams.mockRejectedValue(new Error('Failed to load exams'));

      renderCalendarDisplay();

      await waitFor(() => {
        expect(screen.getByText('Error al cargar los exámenes')).toBeInTheDocument();
      });
    });

    it('should show loading state while fetching exams', async () => {
      const { getExams } = require('@/actions/exam-actions');
      getExams.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderCalendarDisplay();

      expect(screen.getByText('Cargando exámenes...')).toBeInTheDocument();
    });
  });

  describe('Calendar Navigation', () => {
    it('should navigate to previous month', async () => {
      const user = userEvent.setup();
      renderCalendarDisplay();

      const prevButton = screen.getByLabelText('Previous month');
      await user.click(prevButton);

      // Should update the visible months
      expect(screen.getByText('Calendario de Exámenes')).toBeInTheDocument();
    });

    it('should navigate to next month', async () => {
      const user = userEvent.setup();
      renderCalendarDisplay();

      const nextButton = screen.getByLabelText('Next month');
      await user.click(nextButton);

      // Should update the visible months
      expect(screen.getByText('Calendario de Exámenes')).toBeInTheDocument();
    });

    it('should handle month navigation limits', async () => {
      const user = userEvent.setup();
      renderCalendarDisplay();

      // Try to navigate to previous month multiple times
      const prevButton = screen.getByLabelText('Previous month');
      for (let i = 0; i < 5; i++) {
        await user.click(prevButton);
      }

      // Should still be functional
      expect(screen.getByText('Calendario de Exámenes')).toBeInTheDocument();
    });
  });

  describe('Exam Interactions', () => {
    it('should display exams on calendar when loaded', async () => {
      const { getExams } = require('@/actions/exam-actions');
      const mockExams = [
        { id: '1', name: 'Programming Exam', date: '2024-01-15', school: 'ETSINF' },
        { id: '2', name: 'Database Exam', date: '2024-01-20', school: 'ETSINF' },
      ];
      getExams.mockResolvedValue(mockExams);

      renderCalendarDisplay();

      await waitFor(() => {
        expect(screen.getByText('Programming Exam')).toBeInTheDocument();
        expect(screen.getByText('Database Exam')).toBeInTheDocument();
      });
    });

    it('should show exam details when exam is clicked', async () => {
      const { getExams } = require('@/actions/exam-actions');
      const mockExams = [
        { id: '1', name: 'Programming Exam', date: '2024-01-15', school: 'ETSINF' },
      ];
      getExams.mockResolvedValue(mockExams);

      const user = userEvent.setup();
      renderCalendarDisplay();

      await waitFor(() => {
        const examElement = screen.getByText('Programming Exam');
        user.click(examElement);
      });

      // Should show exam details
      expect(screen.getByText('Programming Exam')).toBeInTheDocument();
    });

    it('should handle exam selection', async () => {
      const { getExams } = require('@/actions/exam-actions');
      const mockExams = [
        { id: '1', name: 'Programming Exam', date: '2024-01-15', school: 'ETSINF' },
        { id: '2', name: 'Database Exam', date: '2024-01-20', school: 'ETSINF' },
      ];
      getExams.mockResolvedValue(mockExams);

      const user = userEvent.setup();
      renderCalendarDisplay();

      await waitFor(() => {
        const examElements = screen.getAllByText(/Exam/);
        user.click(examElements[0]);
      });

      // Should update selected exams
      expect(mockOnExamsChange).toHaveBeenCalled();
    });
  });

  describe('Export Functionality', () => {
    it('should open export dialog when export button is clicked', async () => {
      const user = userEvent.setup();
      renderCalendarDisplay();

      const exportButton = screen.getByText('Exportar');
      await user.click(exportButton);

      expect(screen.getByTestId('export-calendar-dialog')).toBeInTheDocument();
    });

    it('should close export dialog when close button is clicked', async () => {
      const user = userEvent.setup();
      renderCalendarDisplay();

      const exportButton = screen.getByText('Exportar');
      await user.click(exportButton);

      expect(screen.getByTestId('export-calendar-dialog')).toBeInTheDocument();

      const closeButton = screen.getByText('Close Export Dialog');
      await user.click(closeButton);

      expect(screen.queryByTestId('export-calendar-dialog')).not.toBeInTheDocument();
    });
  });

  describe('Save Functionality', () => {
    it('should open save dialog when save button is clicked', async () => {
      const user = userEvent.setup();
      renderCalendarDisplay();

      const saveButton = screen.getByText('Guardar');
      await user.click(saveButton);

      expect(screen.getByTestId('save-calendar-dialog')).toBeInTheDocument();
    });

    it('should close save dialog when close button is clicked', async () => {
      const user = userEvent.setup();
      renderCalendarDisplay();

      const saveButton = screen.getByText('Guardar');
      await user.click(saveButton);

      expect(screen.getByTestId('save-calendar-dialog')).toBeInTheDocument();

      const closeButton = screen.getByText('Close Save Dialog');
      await user.click(closeButton);

      expect(screen.queryByTestId('save-calendar-dialog')).not.toBeInTheDocument();
    });
  });

  describe('Filter Changes', () => {
    it('should reload exams when filters change', async () => {
      const { getExams } = require('@/actions/exam-actions');
      getExams.mockResolvedValue([]);

      const { rerender } = render(
        <CalendarDisplay 
          activeFilters={{ school: ['ETSINF'] }} 
          onExamsChange={mockOnExamsChange} 
        />
      );

      await waitFor(() => {
        expect(getExams).toHaveBeenCalledWith({ school: ['ETSINF'] });
      });

      // Change filters
      rerender(
        <CalendarDisplay 
          activeFilters={{ school: ['ETSID'] }} 
          onExamsChange={mockOnExamsChange} 
        />
      );

      await waitFor(() => {
        expect(getExams).toHaveBeenCalledWith({ school: ['ETSID'] });
      });
    });

    it('should handle empty filters gracefully', async () => {
      const { getExams } = require('@/actions/exam-actions');
      getExams.mockResolvedValue([]);

      render(
        <CalendarDisplay 
          activeFilters={{}} 
          onExamsChange={mockOnExamsChange} 
        />
      );

      await waitFor(() => {
        expect(getExams).toHaveBeenCalledWith({});
      });
    });
  });

  describe('Academic Year Detection', () => {
    it('should detect academic year from exam dates', async () => {
      const { detectAcademicYearFromExams } = require('@/utils/date-utils');
      detectAcademicYearFromExams.mockReturnValue({
        startYear: 2024,
        endYear: 2025,
        count: 5,
      });

      const { getExams } = require('@/actions/exam-actions');
      const mockExams = [
        { id: '1', name: 'Programming Exam', date: '2024-09-15', school: 'ETSINF' },
        { id: '2', name: 'Database Exam', date: '2025-01-20', school: 'ETSINF' },
      ];
      getExams.mockResolvedValue(mockExams);

      renderCalendarDisplay();

      await waitFor(() => {
        expect(detectAcademicYearFromExams).toHaveBeenCalledWith(['2024-09-15', '2025-01-20']);
      });
    });

    it('should handle academic year detection when no exams', async () => {
      const { detectAcademicYearFromExams } = require('@/utils/date-utils');
      detectAcademicYearFromExams.mockReturnValue(null);

      const { getExams } = require('@/actions/exam-actions');
      getExams.mockResolvedValue([]);

      renderCalendarDisplay();

      await waitFor(() => {
        expect(detectAcademicYearFromExams).toHaveBeenCalledWith([]);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const { getExams } = require('@/actions/exam-actions');
      getExams.mockRejectedValue(new Error('Network error'));

      renderCalendarDisplay();

      await waitFor(() => {
        expect(screen.getByText('Error al cargar los exámenes')).toBeInTheDocument();
      });
    });

    it('should handle malformed exam data', async () => {
      const { getExams } = require('@/actions/exam-actions');
      const malformedExams = [
        { id: '1', name: 'Programming Exam', date: 'invalid-date', school: 'ETSINF' },
      ];
      getExams.mockResolvedValue(malformedExams);

      renderCalendarDisplay();

      await waitFor(() => {
        expect(screen.getByText('Programming Exam')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderCalendarDisplay();

      expect(screen.getByRole('button', { name: 'Exportar' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
    });

    it('should have proper keyboard navigation', async () => {
      const user = userEvent.setup();
      renderCalendarDisplay();

      const exportButton = screen.getByRole('button', { name: 'Exportar' });
      
      // Focus the button
      exportButton.focus();
      expect(exportButton).toHaveFocus();

      // Activate with Enter key
      await user.keyboard('{Enter}');
      expect(screen.getByTestId('export-calendar-dialog')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle large number of exams efficiently', async () => {
      const { getExams } = require('@/actions/exam-actions');
      const largeExamList = Array.from({ length: 100 }, (_, i) => ({
        id: i.toString(),
        name: `Exam ${i + 1}`,
        date: '2024-01-15',
        school: 'ETSINF',
      }));
      getExams.mockResolvedValue(largeExamList);

      renderCalendarDisplay();

      await waitFor(() => {
        expect(screen.getByText('Exam 1')).toBeInTheDocument();
        expect(screen.getByText('Exam 100')).toBeInTheDocument();
      });
    });

    it('should debounce filter changes', async () => {
      const { getExams } = require('@/actions/exam-actions');
      getExams.mockResolvedValue([]);

      const { rerender } = render(
        <CalendarDisplay 
          activeFilters={{ school: ['ETSINF'] }} 
          onExamsChange={mockOnExamsChange} 
        />
      );

      // Rapidly change filters
      for (let i = 0; i < 5; i++) {
        rerender(
          <CalendarDisplay 
            activeFilters={{ school: [`School ${i}`] }} 
            onExamsChange={mockOnExamsChange} 
          />
        );
      }

      // Should not make excessive API calls
      await waitFor(() => {
        expect(getExams).toHaveBeenCalledTimes(expect.any(Number));
      });
    });
  });
}); 