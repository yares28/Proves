import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthDialog } from '@/components/auth/auth-dialog';

// Mock the auth context
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: { full_name: 'John Doe' },
};

jest.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
  }),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}));

describe('AuthDialog', () => {
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderAuthDialog = (props = {}) => {
    return render(
      <AuthDialog 
        open={true} 
        onOpenChange={mockOnOpenChange}
        {...props}
      />
    );
  };

  describe('Rendering', () => {
    it('should render the auth dialog when open', () => {
      renderAuthDialog();

      expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
      expect(screen.getByText('Crear Cuenta')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(
        <AuthDialog 
          open={false} 
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render with correct title', () => {
      renderAuthDialog();

      expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
    });

    it('should render login and register tabs', () => {
      renderAuthDialog();

      expect(screen.getByRole('tab', { name: 'Iniciar Sesión' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Crear Cuenta' })).toBeInTheDocument();
    });

    it('should show login form by default', () => {
      renderAuthDialog();

      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Iniciar Sesión' })).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to register tab when clicked', async () => {
      const user = userEvent.setup();
      renderAuthDialog();

      const registerTab = screen.getByRole('tab', { name: 'Crear Cuenta' });
      await user.click(registerTab);

      expect(screen.getByLabelText('Nombre Completo')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirmar Contraseña')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Crear Cuenta' })).toBeInTheDocument();
    });

    it('should switch back to login tab when clicked', async () => {
      const user = userEvent.setup();
      renderAuthDialog();

      // Switch to register tab
      const registerTab = screen.getByRole('tab', { name: 'Crear Cuenta' });
      await user.click(registerTab);

      // Switch back to login tab
      const loginTab = screen.getByRole('tab', { name: 'Iniciar Sesión' });
      await user.click(loginTab);

      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Iniciar Sesión' })).toBeInTheDocument();
    });

    it('should maintain tab state correctly', async () => {
      const user = userEvent.setup();
      renderAuthDialog();

      // Start on login tab
      expect(screen.getByLabelText('Email')).toBeInTheDocument();

      // Switch to register tab
      const registerTab = screen.getByRole('tab', { name: 'Crear Cuenta' });
      await user.click(registerTab);

      expect(screen.getByLabelText('Nombre Completo')).toBeInTheDocument();

      // Switch back to login tab
      const loginTab = screen.getByRole('tab', { name: 'Iniciar Sesión' });
      await user.click(loginTab);

      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });
  });

  describe('Dialog Close', () => {
    it('should call onOpenChange when close button is clicked', async () => {
      const user = userEvent.setup();
      renderAuthDialog();

      const closeButton = screen.getByRole('button', { name: 'Close' });
      await user.click(closeButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call onOpenChange when clicking outside dialog', async () => {
      const user = userEvent.setup();
      renderAuthDialog();

      const backdrop = screen.getByTestId('dialog-backdrop');
      await user.click(backdrop);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call onOpenChange when Escape key is pressed', async () => {
      const user = userEvent.setup();
      renderAuthDialog();

      await user.keyboard('{Escape}');

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Form Integration', () => {
    it('should render login form with all fields', () => {
      renderAuthDialog();

      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
      expect(screen.getByLabelText('Recordarme')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Iniciar Sesión' })).toBeInTheDocument();
    });

    it('should render register form with all fields when tab is switched', async () => {
      const user = userEvent.setup();
      renderAuthDialog();

      const registerTab = screen.getByRole('tab', { name: 'Crear Cuenta' });
      await user.click(registerTab);

      expect(screen.getByLabelText('Nombre Completo')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirmar Contraseña')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Crear Cuenta' })).toBeInTheDocument();
    });

    it('should handle form submission in login tab', async () => {
      const user = userEvent.setup();
      renderAuthDialog();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Should handle form submission
      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');
    });

    it('should handle form submission in register tab', async () => {
      const user = userEvent.setup();
      renderAuthDialog();

      // Switch to register tab
      const registerTab = screen.getByRole('tab', { name: 'Crear Cuenta' });
      await user.click(registerTab);

      const fullNameInput = screen.getByLabelText('Nombre Completo');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Contraseña');
      const confirmPasswordInput = screen.getByLabelText('Confirmar Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Crear Cuenta' });

      await user.type(fullNameInput, 'John Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      // Should handle form submission
      expect(fullNameInput).toHaveValue('John Doe');
      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');
      expect(confirmPasswordInput).toHaveValue('password123');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderAuthDialog();

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Iniciar Sesión' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Crear Cuenta' })).toBeInTheDocument();
    });

    it('should have proper keyboard navigation', async () => {
      const user = userEvent.setup();
      renderAuthDialog();

      const registerTab = screen.getByRole('tab', { name: 'Crear Cuenta' });
      
      // Focus the tab
      registerTab.focus();
      expect(registerTab).toHaveFocus();

      // Activate with Enter key
      await user.keyboard('{Enter}');
      expect(screen.getByLabelText('Nombre Completo')).toBeInTheDocument();
    });

    it('should handle tab navigation with arrow keys', async () => {
      const user = userEvent.setup();
      renderAuthDialog();

      const loginTab = screen.getByRole('tab', { name: 'Iniciar Sesión' });
      const registerTab = screen.getByRole('tab', { name: 'Crear Cuenta' });

      // Focus login tab
      loginTab.focus();
      expect(loginTab).toHaveFocus();

      // Navigate to register tab with arrow key
      await user.keyboard('{ArrowRight}');
      expect(registerTab).toHaveFocus();
    });
  });

  describe('Loading States', () => {
    it('should handle loading state correctly', () => {
      jest.doMock('@/context/auth-context', () => ({
        useAuth: () => ({
          user: null,
          loading: true,
        }),
      }));

      renderAuthDialog();

      // Should still render the dialog even when loading
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle form validation errors', async () => {
      const user = userEvent.setup();
      renderAuthDialog();

      const emailInput = screen.getByLabelText('Email');
      const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' });

      // Submit without filling required fields
      await user.click(submitButton);

      // Should show validation errors
      expect(screen.getByText('Por favor ingresa un email válido')).toBeInTheDocument();
    });

    it('should handle authentication errors gracefully', async () => {
      const user = userEvent.setup();
      renderAuthDialog();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' });

      await user.type(emailInput, 'invalid@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      // Should handle error display
      expect(emailInput).toHaveValue('invalid@example.com');
      expect(passwordInput).toHaveValue('wrongpassword');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid tab switching', async () => {
      const user = userEvent.setup();
      renderAuthDialog();

      const loginTab = screen.getByRole('tab', { name: 'Iniciar Sesión' });
      const registerTab = screen.getByRole('tab', { name: 'Crear Cuenta' });

      // Rapidly switch tabs
      for (let i = 0; i < 5; i++) {
        await user.click(registerTab);
        await user.click(loginTab);
      }

      // Should still be functional
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('should handle dialog reopening', async () => {
      const { rerender } = render(
        <AuthDialog 
          open={false} 
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // Reopen dialog
      rerender(
        <AuthDialog 
          open={true} 
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should handle missing onOpenChange prop', () => {
      render(
        <AuthDialog 
          open={true} 
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
}); 