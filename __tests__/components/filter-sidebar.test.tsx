import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterSidebar } from '@/components/filter-sidebar';

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

// Mock the filter data hook
const mockUseFilterData = jest.fn();
jest.mock('@/lib/hooks/use-filter-data', () => ({
  useFilterData: mockUseFilterData,
}));

// Mock the user calendar actions
jest.mock('@/actions/user-calendars', () => ({
  saveUserCalendar: jest.fn(),
  getUserCalendarNames: jest.fn(),
}));

// Mock the auth helpers
jest.mock('@/utils/auth-helpers', () => ({
  getFreshAuthTokens: jest.fn(),
}));

describe('FilterSidebar', () => {
  const mockOnFiltersChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFilterData.mockReturnValue({
      schools: ['ETSINF', 'ETSID', 'ETSAM'],
      degrees: ['Computer Science', 'Software Engineering'],
      semesters: ['1st Semester', '2nd Semester'],
      years: [2024, 2025],
      subjects: ['Programming', 'Databases'],
      isLoading: false,
      error: null,
    });
  });

  const renderFilterSidebar = () => {
    return render(
      <FilterSidebar onFiltersChange={mockOnFiltersChange} />
    );
  };

  describe('Rendering', () => {
    it('should render the filter sidebar with all categories', () => {
      renderFilterSidebar();

      expect(screen.getByText('Filtros')).toBeInTheDocument();
      expect(screen.getByText('Escuelas')).toBeInTheDocument();
      expect(screen.getByText('Carreras')).toBeInTheDocument();
      expect(screen.getByText('Semestres')).toBeInTheDocument();
      expect(screen.getByText('Años del Curso')).toBeInTheDocument();
      expect(screen.getByText('Asignaturas')).toBeInTheDocument();
    });

    it('should render search inputs for searchable categories', () => {
      renderFilterSidebar();

      const searchInputs = screen.getAllByPlaceholderText('Buscar...');
      expect(searchInputs).toHaveLength(3); // Schools, degrees, and subjects are searchable
    });

    it('should render save calendar button when user is authenticated', () => {
      renderFilterSidebar();

      expect(screen.getByText('Guardar Calendario')).toBeInTheDocument();
    });

    it('should not render save calendar button when user is not authenticated', () => {
      jest.doMock('@/context/auth-context', () => ({
        useAuth: () => ({
          user: null,
          syncToken: jest.fn(),
          loading: false,
        }),
      }));

      renderFilterSidebar();

      expect(screen.queryByText('Guardar Calendario')).not.toBeInTheDocument();
    });
  });

  describe('Filter Interactions', () => {
    it('should handle school selection', async () => {
      const user = userEvent.setup();
      renderFilterSidebar();

      const schoolCheckbox = screen.getByLabelText('ETSINF');
      await user.click(schoolCheckbox);

      expect(schoolCheckbox).toBeChecked();
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          school: ['ETSINF'],
        })
      );
    });

    it('should handle multiple school selections', async () => {
      const user = userEvent.setup();
      renderFilterSidebar();

      const etsinfCheckbox = screen.getByLabelText('ETSINF');
      const etsidCheckbox = screen.getByLabelText('ETSID');

      await user.click(etsinfCheckbox);
      await user.click(etsidCheckbox);

      expect(etsinfCheckbox).toBeChecked();
      expect(etsidCheckbox).toBeChecked();
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          school: ['ETSINF', 'ETSID'],
        })
      );
    });

    it('should handle degree selection', async () => {
      const user = userEvent.setup();
      renderFilterSidebar();

      const degreeCheckbox = screen.getByLabelText('Computer Science');
      await user.click(degreeCheckbox);

      expect(degreeCheckbox).toBeChecked();
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          degree: ['Computer Science'],
        })
      );
    });

    it('should handle semester selection', async () => {
      const user = userEvent.setup();
      renderFilterSidebar();

      const semesterCheckbox = screen.getByLabelText('1st Semester');
      await user.click(semesterCheckbox);

      expect(semesterCheckbox).toBeChecked();
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          semester: ['1st Semester'],
        })
      );
    });

    it('should handle year selection', async () => {
      const user = userEvent.setup();
      renderFilterSidebar();

      const yearCheckbox = screen.getByLabelText('2024');
      await user.click(yearCheckbox);

      expect(yearCheckbox).toBeChecked();
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          year: ['2024'],
        })
      );
    });

    it('should handle subject selection', async () => {
      const user = userEvent.setup();
      renderFilterSidebar();

      const subjectCheckbox = screen.getByLabelText('Programming');
      await user.click(subjectCheckbox);

      expect(subjectCheckbox).toBeChecked();
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: ['Programming'],
        })
      );
    });
  });

  describe('Search Functionality', () => {
    it('should filter schools when searching', async () => {
      const user = userEvent.setup();
      renderFilterSidebar();

      const schoolSearchInput = screen.getAllByPlaceholderText('Buscar...')[0];
      await user.type(schoolSearchInput, 'ETSINF');

      expect(screen.getByText('ETSINF')).toBeInTheDocument();
      expect(screen.queryByText('ETSID')).not.toBeInTheDocument();
    });

    it('should filter degrees when searching', async () => {
      const user = userEvent.setup();
      renderFilterSidebar();

      const degreeSearchInput = screen.getAllByPlaceholderText('Buscar...')[1];
      await user.type(degreeSearchInput, 'Computer');

      expect(screen.getByText('Computer Science')).toBeInTheDocument();
      expect(screen.queryByText('Software Engineering')).not.toBeInTheDocument();
    });

    it('should filter subjects when searching', async () => {
      const user = userEvent.setup();
      renderFilterSidebar();

      const subjectSearchInput = screen.getAllByPlaceholderText('Buscar...')[2];
      await user.type(subjectSearchInput, 'Programming');

      expect(screen.getByText('Programming')).toBeInTheDocument();
      expect(screen.queryByText('Databases')).not.toBeInTheDocument();
    });

    it('should clear search when input is cleared', async () => {
      const user = userEvent.setup();
      renderFilterSidebar();

      const schoolSearchInput = screen.getAllByPlaceholderText('Buscar...')[0];
      await user.type(schoolSearchInput, 'ETSINF');
      await user.clear(schoolSearchInput);

      expect(screen.getByText('ETSINF')).toBeInTheDocument();
      expect(screen.getByText('ETSID')).toBeInTheDocument();
    });
  });

  describe('Filter Dependencies', () => {
    it('should show degrees only when schools are selected', async () => {
      mockUseFilterData.mockReturnValue({
        schools: ['ETSINF', 'ETSID'],
        degrees: [],
        semesters: [],
        years: [],
        subjects: [],
        isLoading: false,
        error: null,
      });

      renderFilterSidebar();

      // Initially, degrees should be empty
      expect(screen.queryByText('Computer Science')).not.toBeInTheDocument();

      // Select a school
      const user = userEvent.setup();
      const schoolCheckbox = screen.getByLabelText('ETSINF');
      await user.click(schoolCheckbox);

      // Now degrees should be populated
      mockUseFilterData.mockReturnValue({
        schools: ['ETSINF', 'ETSID'],
        degrees: ['Computer Science', 'Software Engineering'],
        semesters: [],
        years: [],
        subjects: [],
        isLoading: false,
        error: null,
      });

      // Re-render to see updated degrees
      renderFilterSidebar();
      expect(screen.getByText('Computer Science')).toBeInTheDocument();
    });

    it('should show semesters only when schools and degrees are selected', async () => {
      mockUseFilterData.mockReturnValue({
        schools: ['ETSINF'],
        degrees: ['Computer Science'],
        semesters: [],
        years: [],
        subjects: [],
        isLoading: false,
        error: null,
      });

      renderFilterSidebar();

      // Initially, semesters should be empty
      expect(screen.queryByText('1st Semester')).not.toBeInTheDocument();

      // Select school and degree
      const user = userEvent.setup();
      const schoolCheckbox = screen.getByLabelText('ETSINF');
      const degreeCheckbox = screen.getByLabelText('Computer Science');

      await user.click(schoolCheckbox);
      await user.click(degreeCheckbox);

      // Now semesters should be populated
      mockUseFilterData.mockReturnValue({
        schools: ['ETSINF'],
        degrees: ['Computer Science'],
        semesters: ['1st Semester', '2nd Semester'],
        years: [],
        subjects: [],
        isLoading: false,
        error: null,
      });

      // Re-render to see updated semesters
      renderFilterSidebar();
      expect(screen.getByText('1st Semester')).toBeInTheDocument();
    });
  });

  describe('Save Calendar Functionality', () => {
    it('should open save dialog when save button is clicked', async () => {
      const user = userEvent.setup();
      renderFilterSidebar();

      const saveButton = screen.getByText('Guardar Calendario');
      await user.click(saveButton);

      expect(screen.getByText('Guardar Calendario')).toBeInTheDocument();
    });

    it('should handle save calendar success', async () => {
      const { saveUserCalendar } = require('@/actions/user-calendars');
      saveUserCalendar.mockResolvedValue({ success: true });

      const user = userEvent.setup();
      renderFilterSidebar();

      const saveButton = screen.getByText('Guardar Calendario');
      await user.click(saveButton);

      // Fill in calendar name
      const nameInput = screen.getByPlaceholderText('Nombre del calendario');
      await user.type(nameInput, 'My Calendar');

      // Submit the form
      const submitButton = screen.getByText('Guardar');
      await user.click(submitButton);

      await waitFor(() => {
        expect(saveUserCalendar).toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Éxito',
          description: 'Calendario guardado correctamente',
        });
      });
    });

    it('should handle save calendar error', async () => {
      const { saveUserCalendar } = require('@/actions/user-calendars');
      saveUserCalendar.mockRejectedValue(new Error('Save failed'));

      const user = userEvent.setup();
      renderFilterSidebar();

      const saveButton = screen.getByText('Guardar Calendario');
      await user.click(saveButton);

      // Fill in calendar name
      const nameInput = screen.getByPlaceholderText('Nombre del calendario');
      await user.type(nameInput, 'My Calendar');

      // Submit the form
      const submitButton = screen.getByText('Guardar');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Error al guardar el calendario',
          variant: 'destructive',
        });
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state when data is loading', () => {
      mockUseFilterData.mockReturnValue({
        schools: [],
        degrees: [],
        semesters: [],
        years: [],
        subjects: [],
        isLoading: true,
        error: null,
      });

      renderFilterSidebar();

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    });

    it('should show error state when there is an error', () => {
      mockUseFilterData.mockReturnValue({
        schools: [],
        degrees: [],
        semesters: [],
        years: [],
        subjects: [],
        isLoading: false,
        error: 'Failed to load data',
      });

      renderFilterSidebar();

      expect(screen.getByTestId('error-state')).toBeInTheDocument();
      expect(screen.getByText('Error al cargar los filtros')).toBeInTheDocument();
    });
  });

  describe('Filter Clearing', () => {
    it('should clear all filters when clear button is clicked', async () => {
      const user = userEvent.setup();
      renderFilterSidebar();

      // Select some filters
      const schoolCheckbox = screen.getByLabelText('ETSINF');
      const degreeCheckbox = screen.getByLabelText('Computer Science');

      await user.click(schoolCheckbox);
      await user.click(degreeCheckbox);

      // Clear all filters
      const clearButton = screen.getByText('Limpiar Filtros');
      await user.click(clearButton);

      expect(schoolCheckbox).not.toBeChecked();
      expect(degreeCheckbox).not.toBeChecked();
      expect(mockOnFiltersChange).toHaveBeenCalledWith({});
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderFilterSidebar();

      expect(screen.getByRole('button', { name: 'Guardar Calendario' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Limpiar Filtros' })).toBeInTheDocument();
    });

    it('should have proper keyboard navigation', async () => {
      const user = userEvent.setup();
      renderFilterSidebar();

      const schoolCheckbox = screen.getByLabelText('ETSINF');
      
      // Focus the checkbox
      schoolCheckbox.focus();
      expect(schoolCheckbox).toHaveFocus();

      // Toggle with Space key
      await user.keyboard(' ');
      expect(schoolCheckbox).toBeChecked();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty filter data', () => {
      mockUseFilterData.mockReturnValue({
        schools: [],
        degrees: [],
        semesters: [],
        years: [],
        subjects: [],
        isLoading: false,
        error: null,
      });

      renderFilterSidebar();

      expect(screen.getByText('No hay datos disponibles')).toBeInTheDocument();
    });

    it('should handle large filter lists', () => {
      const largeSchoolsList = Array.from({ length: 50 }, (_, i) => `School ${i + 1}`);
      
      mockUseFilterData.mockReturnValue({
        schools: largeSchoolsList,
        degrees: [],
        semesters: [],
        years: [],
        subjects: [],
        isLoading: false,
        error: null,
      });

      renderFilterSidebar();

      // Should render without crashing
      expect(screen.getByText('School 1')).toBeInTheDocument();
      expect(screen.getByText('School 50')).toBeInTheDocument();
    });

    it('should handle special characters in filter names', () => {
      mockUseFilterData.mockReturnValue({
        schools: ['ETSINF', 'ETSID', 'ETSAM'],
        degrees: ['Computer Science & Engineering', 'Software Engineering'],
        semesters: ['1st Semester', '2nd Semester'],
        years: [2024, 2025],
        subjects: ['Programming & Algorithms', 'Databases & SQL'],
        isLoading: false,
        error: null,
      });

      renderFilterSidebar();

      expect(screen.getByText('Computer Science & Engineering')).toBeInTheDocument();
      expect(screen.getByText('Programming & Algorithms')).toBeInTheDocument();
    });
  });
}); 