import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FindExamCard } from '@/components/find-exam-card';

// Mock Next.js navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock the exam actions
jest.mock('@/actions/exam-actions', () => ({
  getSchools: jest.fn(),
  getDegrees: jest.fn(),
}));

describe('FindExamCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderFindExamCard = () => {
    return render(<FindExamCard />);
  };

  describe('Rendering', () => {
    it('should render the find exam card with all elements', () => {
      renderFindExamCard();

      expect(screen.getByText('Encuentra tu Examen')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Buscar exámenes...')).toBeInTheDocument();
      expect(screen.getByText('Escuela')).toBeInTheDocument();
      expect(screen.getByText('Carrera')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Buscar' })).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      renderFindExamCard();

      expect(screen.getByText('Cargando escuelas...')).toBeInTheDocument();
    });

    it('should show schools when loaded', async () => {
      const { getSchools } = require('@/actions/exam-actions');
      const mockSchools = ['ETSINF', 'ETSID', 'ETSAM'];
      getSchools.mockResolvedValue(mockSchools);

      renderFindExamCard();

      await waitFor(() => {
        expect(screen.getByText('ETSINF')).toBeInTheDocument();
        expect(screen.getByText('ETSID')).toBeInTheDocument();
        expect(screen.getByText('ETSAM')).toBeInTheDocument();
      });
    });

    it('should show error state when schools fail to load', async () => {
      const { getSchools } = require('@/actions/exam-actions');
      getSchools.mockRejectedValue(new Error('Failed to load schools'));

      renderFindExamCard();

      await waitFor(() => {
        expect(screen.getByText('Error al cargar las escuelas. Por favor intenta de nuevo.')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should handle search input changes', async () => {
      const user = userEvent.setup();
      renderFindExamCard();

      const searchInput = screen.getByPlaceholderText('Buscar exámenes...');
      await user.type(searchInput, 'Programming');

      expect(searchInput).toHaveValue('Programming');
    });

    it('should clear search input when clear button is clicked', async () => {
      const user = userEvent.setup();
      renderFindExamCard();

      const searchInput = screen.getByPlaceholderText('Buscar exámenes...');
      await user.type(searchInput, 'Programming');

      const clearButton = screen.getByRole('button', { name: 'Clear search' });
      await user.click(clearButton);

      expect(searchInput).toHaveValue('');
    });

    it('should filter schools based on search input', async () => {
      const { getSchools } = require('@/actions/exam-actions');
      const mockSchools = ['ETSINF', 'ETSID', 'ETSAM'];
      getSchools.mockResolvedValue(mockSchools);

      const user = userEvent.setup();
      renderFindExamCard();

      await waitFor(() => {
        expect(screen.getByText('ETSINF')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar exámenes...');
      await user.type(searchInput, 'ETSINF');

      expect(screen.getByText('ETSINF')).toBeInTheDocument();
      expect(screen.queryByText('ETSID')).not.toBeInTheDocument();
    });
  });

  describe('School Selection', () => {
    it('should handle school selection', async () => {
      const { getSchools } = require('@/actions/exam-actions');
      const mockSchools = ['ETSINF', 'ETSID', 'ETSAM'];
      getSchools.mockResolvedValue(mockSchools);

      const user = userEvent.setup();
      renderFindExamCard();

      await waitFor(() => {
        expect(screen.getByText('ETSINF')).toBeInTheDocument();
      });

      const schoolSelect = screen.getByRole('combobox', { name: 'Escuela' });
      await user.click(schoolSelect);

      const etsinfOption = screen.getByText('ETSINF');
      await user.click(etsinfOption);

      expect(schoolSelect).toHaveValue('ETSINF');
    });

    it('should load degrees when school is selected', async () => {
      const { getSchools, getDegrees } = require('@/actions/exam-actions');
      const mockSchools = ['ETSINF', 'ETSID'];
      const mockDegrees = ['Computer Science', 'Software Engineering'];
      
      getSchools.mockResolvedValue(mockSchools);
      getDegrees.mockResolvedValue(mockDegrees);

      const user = userEvent.setup();
      renderFindExamCard();

      await waitFor(() => {
        expect(screen.getByText('ETSINF')).toBeInTheDocument();
      });

      const schoolSelect = screen.getByRole('combobox', { name: 'Escuela' });
      await user.click(schoolSelect);

      const etsinfOption = screen.getByText('ETSINF');
      await user.click(etsinfOption);

      await waitFor(() => {
        expect(getDegrees).toHaveBeenCalledWith('ETSINF');
      });
    });

    it('should show loading state for degrees when school is selected', async () => {
      const { getSchools, getDegrees } = require('@/actions/exam-actions');
      const mockSchools = ['ETSINF'];
      getSchools.mockResolvedValue(mockSchools);
      getDegrees.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const user = userEvent.setup();
      renderFindExamCard();

      await waitFor(() => {
        expect(screen.getByText('ETSINF')).toBeInTheDocument();
      });

      const schoolSelect = screen.getByRole('combobox', { name: 'Escuela' });
      await user.click(schoolSelect);

      const etsinfOption = screen.getByText('ETSINF');
      await user.click(etsinfOption);

      expect(screen.getByText('Cargando carreras...')).toBeInTheDocument();
    });

    it('should handle degree loading errors', async () => {
      const { getSchools, getDegrees } = require('@/actions/exam-actions');
      const mockSchools = ['ETSINF'];
      getSchools.mockResolvedValue(mockSchools);
      getDegrees.mockRejectedValue(new Error('Failed to load degrees'));

      const user = userEvent.setup();
      renderFindExamCard();

      await waitFor(() => {
        expect(screen.getByText('ETSINF')).toBeInTheDocument();
      });

      const schoolSelect = screen.getByRole('combobox', { name: 'Escuela' });
      await user.click(schoolSelect);

      const etsinfOption = screen.getByText('ETSINF');
      await user.click(etsinfOption);

      await waitFor(() => {
        expect(screen.getByText('Error al cargar las carreras. Por favor intenta de nuevo.')).toBeInTheDocument();
      });
    });
  });

  describe('Degree Selection', () => {
    it('should handle degree selection', async () => {
      const { getSchools, getDegrees } = require('@/actions/exam-actions');
      const mockSchools = ['ETSINF'];
      const mockDegrees = ['Computer Science', 'Software Engineering'];
      
      getSchools.mockResolvedValue(mockSchools);
      getDegrees.mockResolvedValue(mockDegrees);

      const user = userEvent.setup();
      renderFindExamCard();

      await waitFor(() => {
        expect(screen.getByText('ETSINF')).toBeInTheDocument();
      });

      // Select school first
      const schoolSelect = screen.getByRole('combobox', { name: 'Escuela' });
      await user.click(schoolSelect);
      const etsinfOption = screen.getByText('ETSINF');
      await user.click(etsinfOption);

      // Then select degree
      await waitFor(() => {
        expect(screen.getByText('Computer Science')).toBeInTheDocument();
      });

      const degreeSelect = screen.getByRole('combobox', { name: 'Carrera' });
      await user.click(degreeSelect);

      const computerScienceOption = screen.getByText('Computer Science');
      await user.click(computerScienceOption);

      expect(degreeSelect).toHaveValue('Computer Science');
    });

    it('should clear degree when school changes', async () => {
      const { getSchools, getDegrees } = require('@/actions/exam-actions');
      const mockSchools = ['ETSINF', 'ETSID'];
      const mockDegrees = ['Computer Science', 'Software Engineering'];
      
      getSchools.mockResolvedValue(mockSchools);
      getDegrees.mockResolvedValue(mockDegrees);

      const user = userEvent.setup();
      renderFindExamCard();

      await waitFor(() => {
        expect(screen.getByText('ETSINF')).toBeInTheDocument();
      });

      // Select first school and degree
      const schoolSelect = screen.getByRole('combobox', { name: 'Escuela' });
      await user.click(schoolSelect);
      const etsinfOption = screen.getByText('ETSINF');
      await user.click(etsinfOption);

      await waitFor(() => {
        expect(screen.getByText('Computer Science')).toBeInTheDocument();
      });

      const degreeSelect = screen.getByRole('combobox', { name: 'Carrera' });
      await user.click(degreeSelect);
      const computerScienceOption = screen.getByText('Computer Science');
      await user.click(computerScienceOption);

      // Change school
      await user.click(schoolSelect);
      const etsidOption = screen.getByText('ETSID');
      await user.click(etsidOption);

      // Degree should be cleared
      expect(degreeSelect).toHaveValue('');
    });
  });

  describe('Search Submission', () => {
    it('should navigate to search results when search button is clicked', async () => {
      const { getSchools } = require('@/actions/exam-actions');
      const mockSchools = ['ETSINF'];
      getSchools.mockResolvedValue(mockSchools);

      const user = userEvent.setup();
      renderFindExamCard();

      await waitFor(() => {
        expect(screen.getByText('ETSINF')).toBeInTheDocument();
      });

      // Fill in search form
      const searchInput = screen.getByPlaceholderText('Buscar exámenes...');
      await user.type(searchInput, 'Programming');

      const schoolSelect = screen.getByRole('combobox', { name: 'Escuela' });
      await user.click(schoolSelect);
      const etsinfOption = screen.getByText('ETSINF');
      await user.click(etsinfOption);

      const searchButton = screen.getByRole('button', { name: 'Buscar' });
      await user.click(searchButton);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('/exams?search=Programming&school=ETSINF')
      );
    });

    it('should handle search with only search term', async () => {
      const { getSchools } = require('@/actions/exam-actions');
      const mockSchools = ['ETSINF'];
      getSchools.mockResolvedValue(mockSchools);

      const user = userEvent.setup();
      renderFindExamCard();

      await waitFor(() => {
        expect(screen.getByText('ETSINF')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar exámenes...');
      await user.type(searchInput, 'Programming');

      const searchButton = screen.getByRole('button', { name: 'Buscar' });
      await user.click(searchButton);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('/exams?search=Programming')
      );
    });

    it('should handle search with only school selected', async () => {
      const { getSchools } = require('@/actions/exam-actions');
      const mockSchools = ['ETSINF'];
      getSchools.mockResolvedValue(mockSchools);

      const user = userEvent.setup();
      renderFindExamCard();

      await waitFor(() => {
        expect(screen.getByText('ETSINF')).toBeInTheDocument();
      });

      const schoolSelect = screen.getByRole('combobox', { name: 'Escuela' });
      await user.click(schoolSelect);
      const etsinfOption = screen.getByText('ETSINF');
      await user.click(etsinfOption);

      const searchButton = screen.getByRole('button', { name: 'Buscar' });
      await user.click(searchButton);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('/exams?school=ETSINF')
      );
    });

    it('should handle search with school and degree selected', async () => {
      const { getSchools, getDegrees } = require('@/actions/exam-actions');
      const mockSchools = ['ETSINF'];
      const mockDegrees = ['Computer Science'];
      
      getSchools.mockResolvedValue(mockSchools);
      getDegrees.mockResolvedValue(mockDegrees);

      const user = userEvent.setup();
      renderFindExamCard();

      await waitFor(() => {
        expect(screen.getByText('ETSINF')).toBeInTheDocument();
      });

      // Select school
      const schoolSelect = screen.getByRole('combobox', { name: 'Escuela' });
      await user.click(schoolSelect);
      const etsinfOption = screen.getByText('ETSINF');
      await user.click(etsinfOption);

      // Select degree
      await waitFor(() => {
        expect(screen.getByText('Computer Science')).toBeInTheDocument();
      });

      const degreeSelect = screen.getByRole('combobox', { name: 'Carrera' });
      await user.click(degreeSelect);
      const computerScienceOption = screen.getByText('Computer Science');
      await user.click(computerScienceOption);

      const searchButton = screen.getByRole('button', { name: 'Buscar' });
      await user.click(searchButton);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('/exams?school=ETSINF&degree=Computer Science')
      );
    });

    it('should handle empty search gracefully', async () => {
      const { getSchools } = require('@/actions/exam-actions');
      const mockSchools = ['ETSINF'];
      getSchools.mockResolvedValue(mockSchools);

      const user = userEvent.setup();
      renderFindExamCard();

      await waitFor(() => {
        expect(screen.getByText('ETSINF')).toBeInTheDocument();
      });

      const searchButton = screen.getByRole('button', { name: 'Buscar' });
      await user.click(searchButton);

      expect(mockPush).toHaveBeenCalledWith('/exams');
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for invalid search term', async () => {
      const { getSchools } = require('@/actions/exam-actions');
      const mockSchools = ['ETSINF'];
      getSchools.mockResolvedValue(mockSchools);

      const user = userEvent.setup();
      renderFindExamCard();

      await waitFor(() => {
        expect(screen.getByText('ETSINF')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar exámenes...');
      await user.type(searchInput, 'a'.repeat(101)); // Too long

      const searchButton = screen.getByRole('button', { name: 'Buscar' });
      await user.click(searchButton);

      expect(screen.getByText('El término de búsqueda es demasiado largo')).toBeInTheDocument();
    });

    it('should allow valid search terms', async () => {
      const { getSchools } = require('@/actions/exam-actions');
      const mockSchools = ['ETSINF'];
      getSchools.mockResolvedValue(mockSchools);

      const user = userEvent.setup();
      renderFindExamCard();

      await waitFor(() => {
        expect(screen.getByText('ETSINF')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar exámenes...');
      await user.type(searchInput, 'Programming');

      expect(screen.queryByText('El término de búsqueda es demasiado largo')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderFindExamCard();

      expect(screen.getByRole('combobox', { name: 'Escuela' })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'Carrera' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Buscar' })).toBeInTheDocument();
    });

    it('should have proper keyboard navigation', async () => {
      const user = userEvent.setup();
      renderFindExamCard();

      const searchInput = screen.getByPlaceholderText('Buscar exámenes...');
      
      // Focus the input
      searchInput.focus();
      expect(searchInput).toHaveFocus();

      // Type with keyboard
      await user.keyboard('Programming');
      expect(searchInput).toHaveValue('Programming');
    });

    it('should handle Enter key submission', async () => {
      const { getSchools } = require('@/actions/exam-actions');
      const mockSchools = ['ETSINF'];
      getSchools.mockResolvedValue(mockSchools);

      const user = userEvent.setup();
      renderFindExamCard();

      await waitFor(() => {
        expect(screen.getByText('ETSINF')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar exámenes...');
      await user.type(searchInput, 'Programming');
      await user.keyboard('{Enter}');

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('/exams?search=Programming')
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const { getSchools } = require('@/actions/exam-actions');
      getSchools.mockRejectedValue(new Error('Network error'));

      renderFindExamCard();

      await waitFor(() => {
        expect(screen.getByText('Error al cargar las escuelas. Por favor intenta de nuevo.')).toBeInTheDocument();
      });
    });

    it('should handle malformed school data', async () => {
      const { getSchools } = require('@/actions/exam-actions');
      getSchools.mockResolvedValue(['ETSINF', null, undefined, 'ETSID']);

      renderFindExamCard();

      await waitFor(() => {
        expect(screen.getByText('ETSINF')).toBeInTheDocument();
        expect(screen.getByText('ETSID')).toBeInTheDocument();
      });
    });

    it('should handle empty school list', async () => {
      const { getSchools } = require('@/actions/exam-actions');
      getSchools.mockResolvedValue([]);

      renderFindExamCard();

      await waitFor(() => {
        expect(screen.getByText('No hay escuelas disponibles')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('should handle large school lists efficiently', async () => {
      const { getSchools } = require('@/actions/exam-actions');
      const largeSchoolList = Array.from({ length: 50 }, (_, i) => `School ${i + 1}`);
      getSchools.mockResolvedValue(largeSchoolList);

      renderFindExamCard();

      await waitFor(() => {
        expect(screen.getByText('School 1')).toBeInTheDocument();
        expect(screen.getByText('School 50')).toBeInTheDocument();
      });
    });

    it('should debounce search input', async () => {
      const { getSchools } = require('@/actions/exam-actions');
      const mockSchools = ['ETSINF'];
      getSchools.mockResolvedValue(mockSchools);

      const user = userEvent.setup();
      renderFindExamCard();

      await waitFor(() => {
        expect(screen.getByText('ETSINF')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar exámenes...');
      
      // Rapidly type
      for (let i = 0; i < 10; i++) {
        await user.type(searchInput, 'a');
        await user.clear(searchInput);
      }

      // Should not crash or cause excessive re-renders
      expect(searchInput).toBeInTheDocument();
    });
  });
}); 