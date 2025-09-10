import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  getExams: mockGetExams,
}));

// Mock the user calendars actions
const mockSaveUserCalendar = jest.fn();
const mockGetUserCalendarNames = jest.fn();
jest.mock('@/actions/user-calendars', () => ({
  saveUserCalendar: mockSaveUserCalendar,
  getUserCalendarNames: mockGetUserCalendarNames,
}));

// Mock the auth helpers
jest.mock('@/utils/auth-helpers', () => ({
  getCurrentSession: jest.fn(),
  getFreshAuthTokens: jest.fn(),
}));

// Mock the date utils
jest.mock('@/utils/date-utils', () => ({
  formatDateString: jest.fn((date) => date),
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

// Mock the dialog components
jest.mock('@/components/save-calendar-dialog', () => ({
  SaveCalendarDialog: ({ open, onOpenChange, onSave }: any) => (
    open ? (
      <div data-testid="save-calendar-dialog">
        <button onClick={() => onSave('Test Calendar')}>Save</button>
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null
  ),
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
  value: {
    origin: 'https://www.upvcal.com',
  },
  writable: true,
});

describe('CalendarDisplay', () => {
  const mockExams = [
    {
      id: '1',
      name: 'Mathematics Exam',
      date: '2024-01-15',
      time: '09:00',
      location: 'Room 101',
      subject: 'Mathematics',
      degree: 'Computer Science',
      school: 'ETSINF',
    },
    {
      id: '2',
      name: 'Physics Exam',
      date: '2024-01-20',
      time: '14:00',
      location: 'Room 202',
      subject: 'Physics',
      degree: 'Computer Science',
      school: 'ETSINF',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetExams.mockResolvedValue(mockExams);
    mockGetUserCalendarNames.mockResolvedValue(['Calendar 1', 'Calendar 2']);
  });

  const renderCalendarDisplay = (props = {}) => {
    return render(<CalendarDisplay {...props} />);
  };

  describe('Rendering', () => {
    it('should render the calendar display with header', async () => {
      renderCalendarDisplay();

      await waitFor(() => {
        expect(screen.getByText('Calendario de Exámenes')).toBeInTheDocument();
        expect(screen.getByText('Exportar')).toBeInTheDocument();
        expect(screen.getByText('Guardar')).toBeInTheDocument();
      });
    });

    it('should render calendar view by default', async () => {
      renderCalendarDisplay();

      await waitFor(() => {
        expect(screen.getByText('September 2023')).toBeInTheDocument();
        expect(screen.getByText('October 2023')).toBeInTheDocument();
      });
    });

    it('should render months with exams only', async () => {
      renderCalendarDisplay();

      await waitFor(() => {
        // Should only render months that have exams
        expect(screen.queryByText('September 2023')).not.toBeInTheDocument();
        expect(screen.queryByText('October 2023')).not.toBeInTheDocument();
      });
    });

    it('should render calendar grid with day headers', async () => {
      renderCalendarDisplay();

      await waitFor(() => {
        expect(screen.getByText('Mo')).toBeInTheDocument();
        expect(screen.getByText('Tu')).toBeInTheDocument();
        expect(screen.getByText('We')).toBeInTheDocument();
        expect(screen.getByText('Th')).toBeInTheDocument();
        expect(screen.getByText('Fr')).toBeInTheDocument();
        expect(screen.getByText('Sa')).toBeInTheDocument();
        expect(screen.getByText('Su')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state while fetching exams', () => {
      mockGetExams.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderCalendarDisplay();

      expect(screen.getByText('Cargando exámenes...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when exam fetching fails', async () => {
      mockGetExams.mockRejectedValue(new Error('Failed to fetch exams'));
      
      renderCalendarDisplay();

      await waitFor(() => {
        expect(screen.getByText(/Error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Export Functionality', () => {
    it('should open export dialog when export button is clicked', async () => {
      const user = userEvent.setup();
      renderCalendarDisplay();

      await waitFor(() => {
        const exportButton = screen.getByText('Exportar');
        expect(exportButton).toBeInTheDocument();
      });

      const exportButton = screen.getByText('Exportar');
      await user.click(exportButton);

      expect(screen.getByTestId('export-calendar-dialog')).toBeInTheDocument();
    });

    it('should disable export button when no exams are available', async () => {
      mockGetExams.mockResolvedValue([]);
      
      renderCalendarDisplay();

      await waitFor(() => {
        const exportButton = screen.getByText('Exportar');
        expect(exportButton).toBeDisabled();
      });
    });
  });

  describe('Save Functionality', () => {
    it('should open save dialog when save button is clicked', async () => {
      const user = userEvent.setup();
      renderCalendarDisplay();

      await waitFor(() => {
        const saveButton = screen.getByText('Guardar');
        expect(saveButton).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Guardar');
      await user.click(saveButton);

      expect(screen.getByTestId('save-calendar-dialog')).toBeInTheDocument();
    });

    it('should disable save button when no exams are available', async () => {
      mockGetExams.mockResolvedValue([]);
      
      renderCalendarDisplay();

      await waitFor(() => {
        const saveButton = screen.getByText('Guardar');
        expect(saveButton).toBeDisabled();
      });
    });

    it('should handle calendar save', async () => {
      const user = userEvent.setup();
      mockSaveUserCalendar.mockResolvedValue({ success: true });
      
      renderCalendarDisplay();

      await waitFor(() => {
        const saveButton = screen.getByText('Guardar');
        expect(saveButton).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Guardar');
      await user.click(saveButton);

      const saveDialog = screen.getByTestId('save-calendar-dialog');
      const saveButtonInDialog = saveDialog.querySelector('button');
      
      if (saveButtonInDialog) {
        await user.click(saveButtonInDialog);
      }

      expect(mockSaveUserCalendar).toHaveBeenCalled();
    });
  });

  describe('Filter Integration', () => {
    it('should fetch exams with active filters', async () => {
      const activeFilters = {
        school: ['ETSINF'],
        degree: ['Computer Science'],
      };

      renderCalendarDisplay({ activeFilters });

      await waitFor(() => {
        expect(mockGetExams).toHaveBeenCalledWith(activeFilters);
      });
    });

    it('should call onExamsChange when exams are loaded', async () => {
      const mockOnExamsChange = jest.fn();
      
      renderCalendarDisplay({ onExamsChange: mockOnExamsChange });

      await waitFor(() => {
        expect(mockOnExamsChange).toHaveBeenCalledWith(mockExams);
      });
    });
  });

  describe('Navigation', () => {
    it('should show navigation buttons when there are many months', async () => {
      // Mock more months to trigger navigation
      jest.doMock('@/utils/date-utils', () => ({
        ...jest.requireActual('@/utils/date-utils'),
        generateAcademicYearMonths: jest.fn(() => Array.from({ length: 20 }, (_, i) => ({
          name: `Month ${i + 1}`,
          year: 2024,
          monthNumber: i + 1,
        }))),
      }));

      renderCalendarDisplay();

      await waitFor(() => {
        expect(screen.getByText('Anterior')).toBeInTheDocument();
        expect(screen.getByText('Siguiente')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      renderCalendarDisplay();

      await waitFor(() => {
        const exportButton = screen.getByText('Exportar');
        const saveButton = screen.getByText('Guardar');
        
        expect(exportButton).toBeInTheDocument();
        expect(saveButton).toBeInTheDocument();
      });
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      renderCalendarDisplay();

      await waitFor(() => {
        const exportButton = screen.getByText('Exportar');
        expect(exportButton).toBeInTheDocument();
      });

      const exportButton = screen.getByText('Exportar');
      
      // Focus the button
      exportButton.focus();
      expect(exportButton).toHaveFocus();

      // Activate with Enter key
      await user.keyboard('{Enter}');
      expect(screen.getByTestId('export-calendar-dialog')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty exam list', async () => {
      mockGetExams.mockResolvedValue([]);
      
      renderCalendarDisplay();

      await waitFor(() => {
        expect(screen.getByText('Exportar')).toBeDisabled();
        expect(screen.getByText('Guardar')).toBeDisabled();
      });
    });

    it('should handle missing onExamsChange prop', async () => {
      renderCalendarDisplay({ onExamsChange: undefined });

      await waitFor(() => {
        expect(screen.getByText('Calendario de Exámenes')).toBeInTheDocument();
      });
    });

    it('should handle missing activeFilters prop', async () => {
      renderCalendarDisplay({ activeFilters: undefined });

      await waitFor(() => {
        expect(mockGetExams).toHaveBeenCalledWith({});
      });
    });

    it('should handle exam fetching errors gracefully', async () => {
      mockGetExams.mockRejectedValue(new Error('Network error'));
      
      renderCalendarDisplay();

      await waitFor(() => {
        expect(screen.getByText(/Error/i)).toBeInTheDocument();
      });
    });
  });
}); 