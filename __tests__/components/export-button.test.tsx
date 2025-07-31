import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportButton } from '@/components/export-button';

// Mock sonner toast
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
};

jest.mock('sonner', () => ({
  toast: mockToast,
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

// Mock window.open
Object.assign(window, {
  open: jest.fn(),
});

// Mock URL.createObjectURL and URL.revokeObjectURL
Object.assign(URL, {
  createObjectURL: jest.fn(() => 'blob:mock-url'),
  revokeObjectURL: jest.fn(),
});

// Mock document.createElement and appendChild
const mockLink = {
  href: '',
  download: '',
  click: jest.fn(),
};
Object.assign(document, {
  createElement: jest.fn(() => mockLink),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
  },
});

describe('ExportButton', () => {
  const mockExams = [
    {
      id: '1',
      subject: 'Programming',
      code: 'PROG101',
      date: '2024-01-15',
      time: '09:00 - 11:00',
      location: 'Room 101',
      school: 'ETSINF',
      degree: 'Computer Science',
      year: 2024,
      semester: '1st Semester',
    },
  ];

  const mockFilters = {
    school: ['ETSINF'],
    degree: ['Computer Science'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderExportButton = (props = {}) => {
    return render(
      <ExportButton 
        exams={mockExams}
        filters={mockFilters}
        {...props}
      />
    );
  };

  describe('Rendering', () => {
    it('should render the export button', () => {
      renderExportButton();

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Exportar')).toBeInTheDocument();
    });

    it('should render with share icon', () => {
      renderExportButton();

      const button = screen.getByRole('button');
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('should have proper button styling', () => {
      renderExportButton();

      const button = screen.getByRole('button');
      expect(button).toHaveClass('flex');
      expect(button).toHaveClass('items-center');
      expect(button).toHaveClass('gap-2');
    });
  });

  describe('Button Interactions', () => {
    it('should open popover when button is clicked', async () => {
      const user = userEvent.setup();
      renderExportButton();

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.getByText('Copiar URL')).toBeInTheDocument();
      expect(screen.getByText('Google Calendar')).toBeInTheDocument();
      expect(screen.getByText('Apple Calendar')).toBeInTheDocument();
      expect(screen.getByText('Descargar .ics')).toBeInTheDocument();
    });

    it('should close popover when clicking outside', async () => {
      const user = userEvent.setup();
      renderExportButton();

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.getByText('Copiar URL')).toBeInTheDocument();

      // Click outside to close
      await user.click(document.body);

      expect(screen.queryByText('Copiar URL')).not.toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('should copy URL when copy button is clicked', async () => {
      const user = userEvent.setup();
      renderExportButton();

      const button = screen.getByRole('button');
      await user.click(button);

      const copyButton = screen.getByText('Copiar URL');
      await user.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(window.location.href);
      expect(mockToast.success).toHaveBeenCalledWith('URL copiada al portapapeles');
    });

    it('should export to Google Calendar when Google Calendar button is clicked', async () => {
      const user = userEvent.setup();
      renderExportButton();

      const button = screen.getByRole('button');
      await user.click(button);

      const googleButton = screen.getByText('Google Calendar');
      await user.click(googleButton);

      expect(window.open).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith('Abriendo Google Calendar');
    });

    it('should export to Apple Calendar when Apple Calendar button is clicked', async () => {
      const user = userEvent.setup();
      renderExportButton();

      const button = screen.getByRole('button');
      await user.click(button);

      const appleButton = screen.getByText('Apple Calendar');
      await user.click(appleButton);

      expect(mockToast.success).toHaveBeenCalledWith('Archivo .ics descargado para Apple Calendar');
    });

    it('should download ICS file when download button is clicked', async () => {
      const user = userEvent.setup();
      renderExportButton();

      const button = screen.getByRole('button');
      await user.click(button);

      const downloadButton = screen.getByText('Descargar .ics');
      await user.click(downloadButton);

      expect(mockToast.success).toHaveBeenCalledWith('Archivo .ics descargado');
    });

    it('should handle empty exams list', async () => {
      const user = userEvent.setup();
      renderExportButton({ exams: [] });

      const button = screen.getByRole('button');
      await user.click(button);

      const googleButton = screen.getByText('Google Calendar');
      await user.click(googleButton);

      expect(mockToast.error).toHaveBeenCalledWith('No hay exámenes para exportar');
    });

    it('should handle clipboard error', async () => {
      navigator.clipboard.writeText.mockRejectedValue(new Error('Clipboard error'));
      
      const user = userEvent.setup();
      renderExportButton();

      const button = screen.getByRole('button');
      await user.click(button);

      const copyButton = screen.getByText('Copiar URL');
      await user.click(copyButton);

      expect(mockToast.error).toHaveBeenCalledWith('Error al copiar URL');
    });
  });

  describe('ICS File Generation', () => {
    it('should generate ICS content correctly', async () => {
      const user = userEvent.setup();
      renderExportButton();

      const button = screen.getByRole('button');
      await user.click(button);

      const downloadButton = screen.getByText('Descargar .ics');
      await user.click(downloadButton);

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe('exams.ics');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should handle multiple exams in ICS file', async () => {
      const multipleExams = [
        {
          id: '1',
          subject: 'Programming',
          code: 'PROG101',
          date: '2024-01-15',
          time: '09:00 - 11:00',
          location: 'Room 101',
          school: 'ETSINF',
          degree: 'Computer Science',
          year: 2024,
          semester: '1st Semester',
        },
        {
          id: '2',
          subject: 'Databases',
          code: 'DB101',
          date: '2024-01-20',
          time: '14:00 - 16:00',
          location: 'Room 102',
          school: 'ETSINF',
          degree: 'Computer Science',
          year: 2024,
          semester: '1st Semester',
        },
      ];

      const user = userEvent.setup();
      renderExportButton({ exams: multipleExams });

      const button = screen.getByRole('button');
      await user.click(button);

      const downloadButton = screen.getByText('Descargar .ics');
      await user.click(downloadButton);

      expect(mockLink.download).toBe('exams.ics');
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderExportButton();

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Exportar calendario');
    });

    it('should support keyboard navigation with Enter key', async () => {
      const user = userEvent.setup();
      renderExportButton();

      const button = screen.getByRole('button');
      
      // Focus the button
      button.focus();
      expect(button).toHaveFocus();

      // Activate with Enter key
      await user.keyboard('{Enter}');
      expect(screen.getByText('Copiar URL')).toBeInTheDocument();
    });

    it('should support keyboard navigation with Space key', async () => {
      const user = userEvent.setup();
      renderExportButton();

      const button = screen.getByRole('button');
      
      // Focus the button
      button.focus();
      expect(button).toHaveFocus();

      // Activate with Space key
      await user.keyboard(' ');
      expect(screen.getByText('Copiar URL')).toBeInTheDocument();
    });

    it('should support Tab navigation in popover', async () => {
      const user = userEvent.setup();
      renderExportButton();

      const button = screen.getByRole('button');
      await user.click(button);

      // Should be able to navigate through popover options
      const copyButton = screen.getByText('Copiar URL');
      const googleButton = screen.getByText('Google Calendar');
      const appleButton = screen.getByText('Apple Calendar');
      const downloadButton = screen.getByText('Descargar .ics');

      expect(copyButton).toBeInTheDocument();
      expect(googleButton).toBeInTheDocument();
      expect(appleButton).toBeInTheDocument();
      expect(downloadButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid button clicks', async () => {
      const user = userEvent.setup();
      renderExportButton();

      const button = screen.getByRole('button');
      
      // Rapidly click the button multiple times
      for (let i = 0; i < 5; i++) {
        await user.click(button);
      }

      // Should still work properly
      expect(screen.getByText('Copiar URL')).toBeInTheDocument();
    });

    it('should handle missing exams prop', () => {
      renderExportButton({ exams: undefined });
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle empty exams array', () => {
      renderExportButton({ exams: [] });
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle missing filters prop', () => {
      renderExportButton({ filters: undefined });
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle malformed exam data', async () => {
      const malformedExams = [
        {
          id: '1',
          subject: 'Programming',
          // Missing required fields
        },
      ];

      const user = userEvent.setup();
      renderExportButton({ exams: malformedExams });

      const button = screen.getByRole('button');
      await user.click(button);

      const downloadButton = screen.getByText('Descargar .ics');
      await user.click(downloadButton);

      // Should still work without crashing
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle clipboard permission denied', async () => {
      navigator.clipboard.writeText.mockRejectedValue(new Error('Permission denied'));
      
      const user = userEvent.setup();
      renderExportButton();

      const button = screen.getByRole('button');
      await user.click(button);

      const copyButton = screen.getByText('Copiar URL');
      await user.click(copyButton);

      expect(mockToast.error).toHaveBeenCalledWith('Error al copiar URL');
    });

    it('should handle window.open failure', async () => {
      window.open.mockReturnValue(null);
      
      const user = userEvent.setup();
      renderExportButton();

      const button = screen.getByRole('button');
      await user.click(button);

      const googleButton = screen.getByText('Google Calendar');
      await user.click(googleButton);

      // Should still show success message even if window.open fails
      expect(mockToast.success).toHaveBeenCalledWith('Abriendo Google Calendar');
    });

    it('should handle blob creation failure', async () => {
      // Mock Blob to throw error
      const originalBlob = global.Blob;
      global.Blob = jest.fn(() => {
        throw new Error('Blob creation failed');
      });

      const user = userEvent.setup();
      renderExportButton();

      const button = screen.getByRole('button');
      await user.click(button);

      const downloadButton = screen.getByText('Descargar .ics');
      await user.click(downloadButton);

      // Should handle the error gracefully
      expect(mockLink.click).toHaveBeenCalled();

      // Restore original Blob
      global.Blob = originalBlob;
    });
  });

  describe('Performance', () => {
    it('should handle large number of exams efficiently', async () => {
      const largeExamList = Array.from({ length: 100 }, (_, i) => ({
        id: i.toString(),
        subject: `Exam ${i + 1}`,
        code: `CODE${i + 1}`,
        date: '2024-01-15',
        time: '09:00 - 11:00',
        location: 'Room 101',
        school: 'ETSINF',
        degree: 'Computer Science',
        year: 2024,
        semester: '1st Semester',
      }));

      const user = userEvent.setup();
      renderExportButton({ exams: largeExamList });

      const button = screen.getByRole('button');
      await user.click(button);

      const downloadButton = screen.getByText('Descargar .ics');
      await user.click(downloadButton);

      // Should work without performance issues
      expect(mockLink.click).toHaveBeenCalled();
    });
  });
}); 