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
  getFilteredAcronymsAndSubjects: jest.fn(),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
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
      expect(screen.getByText('Escuela')).toBeInTheDocument();
      expect(screen.getByText('Carrera')).toBeInTheDocument();
      expect(screen.getByText('Buscar por acrónimo o asignatura')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Buscar Exámenes' })).toBeInTheDocument();
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

    it('should show no schools message when schools list is empty', async () => {
      const { getSchools } = require('@/actions/exam-actions');
      getSchools.mockResolvedValue([]);

      renderFindExamCard();

      await waitFor(() => {
        expect(screen.getByText('No se encontraron escuelas')).toBeInTheDocument();
      });
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
        expect(screen.getByText('No se encontraron carreras para esta escuela')).toBeInTheDocument();
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

  describe('Acronym and Subject Search', () => {
    it('should enable acronym search when school and degree are selected', async () => {
      const { getSchools, getDegrees, getFilteredAcronymsAndSubjects } = require('@/actions/exam-actions');
      const mockSchools = ['ETSINF'];
      const mockDegrees = ['Computer Science'];
      const mockOptions = [
        { value: 'MAD', type: 'acronym' },
        { value: 'Programming', type: 'subject' }
      ];
      
      getSchools.mockResolvedValue(mockSchools);
      getDegrees.mockResolvedValue(mockDegrees);
      getFilteredAcronymsAndSubjects.mockResolvedValue(mockOptions);

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

      // Acronym search should be enabled
      await waitFor(() => {
        expect(screen.getByText('Ej. MAD, Introducción a la Programación, ...')).toBeInTheDocument();
      });
    });

    it('should show placeholder when school and degree are not selected', () => {
      renderFindExamCard();

      expect(screen.getByText('Selecciona escuela y carrera primero')).toBeInTheDocument();
    });

    it('should handle acronym selection', async () => {
      const { getSchools, getDegrees, getFilteredAcronymsAndSubjects } = require('@/actions/exam-actions');
      const mockSchools = ['ETSINF'];
      const mockDegrees = ['Computer Science'];
      const mockOptions = [
        { value: 'MAD', type: 'acronym' },
        { value: 'Programming', type: 'subject' }
      ];
      
      getSchools.mockResolvedValue(mockSchools);
      getDegrees.mockResolvedValue(mockDegrees);
      getFilteredAcronymsAndSubjects.mockResolvedValue(mockOptions);

      const user = userEvent.setup();
      renderFindExamCard();

      await waitFor(() => {
        expect(screen.getByText('ETSINF')).toBeInTheDocument();
      });

      // Select school and degree
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

      // Open acronym search
      await waitFor(() => {
        const acronymButton = screen.getByRole('button', { name: /Ej\. MAD/ });
        user.click(acronymButton);
      });

      // Should show search input
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Buscar acrónimo o asignatura...')).toBeInTheDocument();
      });
    });
  });

  describe('Search Submission', () => {
    it('should navigate to search results when search button is clicked', async () => {
      const { getSchools, getDegrees, getFilteredAcronymsAndSubjects } = require('@/actions/exam-actions');
      const mockSchools = ['ETSINF'];
      const mockDegrees = ['Computer Science'];
      const mockOptions = [
        { value: 'MAD', type: 'acronym' },
        { value: 'Programming', type: 'subject' }
      ];
      
      getSchools.mockResolvedValue(mockSchools);
      getDegrees.mockResolvedValue(mockDegrees);
      getFilteredAcronymsAndSubjects.mockResolvedValue(mockOptions);

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

      // Open acronym search and select an option
      await waitFor(() => {
        const acronymButton = screen.getByRole('button', { name: /Ej\. MAD/ });
        user.click(acronymButton);
      });

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Buscar acrónimo o asignatura...');
        user.type(searchInput, 'MAD');
      });

      // Select the acronym
      await waitFor(() => {
        const madOption = screen.getByText('MAD');
        user.click(madOption);
      });

      // Submit search
      const searchButton = screen.getByRole('button', { name: 'Buscar Exámenes' });
      await user.click(searchButton);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('/exams?school=ETSINF&degree=Computer Science&acronyms=MAD')
      );
    });

    it('should handle search with multiple selections', async () => {
      const { getSchools, getDegrees, getFilteredAcronymsAndSubjects } = require('@/actions/exam-actions');
      const mockSchools = ['ETSINF'];
      const mockDegrees = ['Computer Science'];
      const mockOptions = [
        { value: 'MAD', type: 'acronym' },
        { value: 'Programming', type: 'subject' }
      ];
      
      getSchools.mockResolvedValue(mockSchools);
      getDegrees.mockResolvedValue(mockDegrees);
      getFilteredAcronymsAndSubjects.mockResolvedValue(mockOptions);

      const user = userEvent.setup();
      renderFindExamCard();

      await waitFor(() => {
        expect(screen.getByText('ETSINF')).toBeInTheDocument();
      });

      // Select school and degree
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

      // Open acronym search and select multiple options
      await waitFor(() => {
        const acronymButton = screen.getByRole('button', { name: /Ej\. MAD/ });
        user.click(acronymButton);
      });

      // Select MAD
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Buscar acrónimo o asignatura...');
        user.type(searchInput, 'MAD');
      });

      await waitFor(() => {
        const madOption = screen.getByText('MAD');
        user.click(madOption);
      });

      // Select Programming
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Buscar acrónimo o asignatura...');
        user.type(searchInput, 'Programming');
      });

      await waitFor(() => {
        const programmingOption = screen.getByText('Programming');
        user.click(programmingOption);
      });

      // Submit search
      const searchButton = screen.getByRole('button', { name: 'Buscar Exámenes' });
      await user.click(searchButton);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('/exams?school=ETSINF&degree=Computer Science&acronyms=MAD&subjects=Programming')
      );
    });

    it('should disable search button when no selections are made', async () => {
      const { getSchools } = require('@/actions/exam-actions');
      const mockSchools = ['ETSINF'];
      getSchools.mockResolvedValue(mockSchools);

      renderFindExamCard();

      await waitFor(() => {
        expect(screen.getByText('ETSINF')).toBeInTheDocument();
      });

      const searchButton = screen.getByRole('button', { name: 'Buscar Exámenes' });
      expect(searchButton).toBeDisabled();
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for invalid acronym', async () => {
      const { getSchools, getDegrees, getFilteredAcronymsAndSubjects } = require('@/actions/exam-actions');
      const mockSchools = ['ETSINF'];
      const mockDegrees = ['Computer Science'];
      const mockOptions = [
        { value: 'MAD', type: 'acronym' },
        { value: 'Programming', type: 'subject' }
      ];
      
      getSchools.mockResolvedValue(mockSchools);
      getDegrees.mockResolvedValue(mockDegrees);
      getFilteredAcronymsAndSubjects.mockResolvedValue(mockOptions);

      const user = userEvent.setup();
      renderFindExamCard();

      await waitFor(() => {
        expect(screen.getByText('ETSINF')).toBeInTheDocument();
      });

      // Select school and degree
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

      // Open acronym search and try to add invalid acronym
      await waitFor(() => {
        const acronymButton = screen.getByRole('button', { name: /Ej\. MAD/ });
        user.click(acronymButton);
      });

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Buscar acrónimo o asignatura...');
        user.type(searchInput, 'INVALID-ACRONYM');
      });

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText('El acrónimo debe tener entre 2 y 10 caracteres y contener solo letras y números')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderFindExamCard();

      expect(screen.getByRole('combobox', { name: 'Escuela' })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'Carrera' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Buscar Exámenes' })).toBeInTheDocument();
    });

    it('should have proper keyboard navigation', async () => {
      const user = userEvent.setup();
      renderFindExamCard();

      const schoolSelect = screen.getByRole('combobox', { name: 'Escuela' });
      
      // Focus the select
      schoolSelect.focus();
      expect(schoolSelect).toHaveFocus();

      // Open with Enter key
      await user.keyboard('{Enter}');
      expect(screen.getByText('Seleccionar escuela')).toBeInTheDocument();
    });

    it('should handle Enter key submission', async () => {
      const { getSchools, getDegrees, getFilteredAcronymsAndSubjects } = require('@/actions/exam-actions');
      const mockSchools = ['ETSINF'];
      const mockDegrees = ['Computer Science'];
      const mockOptions = [
        { value: 'MAD', type: 'acronym' }
      ];
      
      getSchools.mockResolvedValue(mockSchools);
      getDegrees.mockResolvedValue(mockDegrees);
      getFilteredAcronymsAndSubjects.mockResolvedValue(mockOptions);

      const user = userEvent.setup();
      renderFindExamCard();

      await waitFor(() => {
        expect(screen.getByText('ETSINF')).toBeInTheDocument();
      });

      // Select school and degree
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

      // Open acronym search and select an option
      await waitFor(() => {
        const acronymButton = screen.getByRole('button', { name: /Ej\. MAD/ });
        user.click(acronymButton);
      });

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Buscar acrónimo o asignatura...');
        user.type(searchInput, 'MAD');
      });

      await waitFor(() => {
        const madOption = screen.getByText('MAD');
        user.click(madOption);
      });

      // Submit with Enter key
      const searchButton = screen.getByRole('button', { name: 'Buscar Exámenes' });
      await user.click(searchButton);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('/exams?school=ETSINF&degree=Computer Science&acronyms=MAD')
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
        expect(screen.getByText('No se encontraron escuelas')).toBeInTheDocument();
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
      const { getSchools, getDegrees, getFilteredAcronymsAndSubjects } = require('@/actions/exam-actions');
      const mockSchools = ['ETSINF'];
      const mockDegrees = ['Computer Science'];
      const mockOptions = [
        { value: 'MAD', type: 'acronym' }
      ];
      
      getSchools.mockResolvedValue(mockSchools);
      getDegrees.mockResolvedValue(mockDegrees);
      getFilteredAcronymsAndSubjects.mockResolvedValue(mockOptions);

      const user = userEvent.setup();
      renderFindExamCard();

      await waitFor(() => {
        expect(screen.getByText('ETSINF')).toBeInTheDocument();
      });

      // Select school and degree
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

      // Open acronym search
      await waitFor(() => {
        const acronymButton = screen.getByRole('button', { name: /Ej\. MAD/ });
        user.click(acronymButton);
      });

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Buscar acrónimo o asignatura...');
        
        // Rapidly type
        for (let i = 0; i < 10; i++) {
          user.type(searchInput, 'a');
          user.clear(searchInput);
        }
      });

      // Should not crash or cause excessive re-renders
      expect(screen.getByPlaceholderText('Buscar acrónimo o asignatura...')).toBeInTheDocument();
    });
  });
}); 