import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthDialog } from '@/components/auth/auth-dialog';

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

// Mock the auth forms
jest.mock('@/components/auth/login-form', () => ({
  LoginForm: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="login-form">
      <input type="email" placeholder="Email" aria-label="Email" />
      <input type="password" placeholder="Contraseña" aria-label="Contraseña" />
      <button type="submit" onClick={onSuccess}>Iniciar Sesión</button>
    </div>
  ),
}));

jest.mock('@/components/auth/register-form', () => ({
  RegisterForm: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="register-form">
      <input type="text" placeholder="Nombre Completo" aria-label="Nombre Completo" />
      <input type="email" placeholder="Email" aria-label="Email" />
      <input type="password" placeholder="Contraseña" aria-label="Contraseña" />
      <input type="password" placeholder="Confirmar Contraseña" aria-label="Confirmar Contraseña" />
      <button type="submit" onClick={onSuccess}>Crear Cuenta</button>
    </div>
  ),
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

      expect(screen.getByText('Bienvenido de nuevo')).toBeInTheDocument();
      expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
      expect(screen.getByText('Registrarse')).toBeInTheDocument();
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

    it('should render with correct title for login tab', () => {
      renderAuthDialog();

      expect(screen.getByText('Bienvenido de nuevo')).toBeInTheDocument();
      expect(screen.getByText('Inicia sesión en tu cuenta para acceder a tu calendario de exámenes')).toBeInTheDocument();
    });

    it('should render login and register tabs', () => {
      renderAuthDialog();

      expect(screen.getByRole('tab', { name: 'Iniciar Sesión' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Registrarse' })).toBeInTheDocument();
    });

    it('should show login form by default', () => {
      renderAuthDialog();

      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      expect(screen.queryByTestId('register-form')).not.toBeInTheDocument();
    });

    it('should render My Calendars button', () => {
      renderAuthDialog();

      expect(screen.getByRole('button', { name: /Mis Calendarios/i })).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to register tab when clicked', async () => {
      const user = userEvent.setup();
      renderAuthDialog();

      const registerTab = screen.getByRole('tab', { name: 'Registrarse' });
      await user.click(registerTab);

      expect(screen.getByText('Crear una cuenta')).toBeInTheDocument();
      expect(screen.getByText('Regístrate para personalizar tu calendario de exámenes')).toBeInTheDocument();
      expect(screen.getByTestId('register-form')).toBeInTheDocument();
      expect(screen.queryByTestId('login-form')).not.toBeInTheDocument();
    });

    it('should switch back to login tab when clicked', async () => {
      const user = userEvent.setup();
      renderAuthDialog();

      // Switch to register tab
      const registerTab = screen.getByRole('tab', { name: 'Registrarse' });
      await user.click(registerTab);

      // Switch back to login tab
      const loginTab = screen.getByRole('tab', { name: 'Iniciar Sesión' });
      await user.click(loginTab);

      expect(screen.getByText('Bienvenido de nuevo')).toBeInTheDocument();
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      expect(screen.queryByTestId('register-form')).not.toBeInTheDocument();
    });

    it('should maintain tab state correctly', async () => {
      const user = userEvent.setup();
      renderAuthDialog();

      // Start on login tab
      expect(screen.getByTestId('login-form')).toBeInTheDocument();

      // Switch to register tab
      const registerTab = screen.getByRole('tab', { name: 'Registrarse' });
      await user.click(registerTab);

      expect(screen.getByTestId('register-form')).toBeInTheDocument();

      // Switch back to login tab
      const loginTab = screen.getByRole('tab', { name: 'Iniciar Sesión' });
      await user.click(loginTab);

      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });
  });

  describe('My Calendars Button', () => {
    it('should navigate to my-calendars when clicked', async () => {
      const user = userEvent.setup();
      renderAuthDialog();

      const myCalendarsButton = screen.getByRole('button', { name: /Mis Calendarios/i });
      await user.click(myCalendarsButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      expect(mockPush).toHaveBeenCalledWith('/my-calendars');
    });

    it('should be disabled when on register tab', async () => {
      const user = userEvent.setup();
      renderAuthDialog();

      // Switch to register tab
      const registerTab = screen.getByRole('tab', { name: 'Registrarse' });
      await user.click(registerTab);

      const myCalendarsButton = screen.getByRole('button', { name: /Mis Calendarios/i });
      expect(myCalendarsButton).toBeDisabled();
    });

    it('should be enabled when on login tab', () => {
      renderAuthDialog();

      const myCalendarsButton = screen.getByRole('button', { name: /Mis Calendarios/i });
      expect(myCalendarsButton).not.toBeDisabled();
    });
  });

  describe('Form Integration', () => {
    it('should handle login form success', async () => {
      const user = userEvent.setup();
      renderAuthDialog();

      const loginForm = screen.getByTestId('login-form');
      const submitButton = loginForm.querySelector('button');
      
      if (submitButton) {
        await user.click(submitButton);
      }

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should handle register form success', async () => {
      const user = userEvent.setup();
      renderAuthDialog();

      // Switch to register tab
      const registerTab = screen.getByRole('tab', { name: 'Registrarse' });
      await user.click(registerTab);

      const registerForm = screen.getByTestId('register-form');
      const submitButton = registerForm.querySelector('button');
      
      if (submitButton) {
        await user.click(submitButton);
      }

      // Should switch back to login tab
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderAuthDialog();

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Iniciar Sesión' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Registrarse' })).toBeInTheDocument();
    });

    it('should have proper keyboard navigation', async () => {
      const user = userEvent.setup();
      renderAuthDialog();

      const registerTab = screen.getByRole('tab', { name: 'Registrarse' });
      
      // Focus the tab
      registerTab.focus();
      expect(registerTab).toHaveFocus();

      // Activate with Enter key
      await user.keyboard('{Enter}');
      expect(screen.getByTestId('register-form')).toBeInTheDocument();
    });

    it('should handle tab navigation with arrow keys', async () => {
      const user = userEvent.setup();
      renderAuthDialog();

      const loginTab = screen.getByRole('tab', { name: 'Iniciar Sesión' });
      const registerTab = screen.getByRole('tab', { name: 'Registrarse' });

      // Focus login tab
      loginTab.focus();
      expect(loginTab).toHaveFocus();

      // Navigate to register tab with arrow key
      await user.keyboard('{ArrowRight}');
      expect(registerTab).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid tab switching', async () => {
      const user = userEvent.setup();
      renderAuthDialog();

      const loginTab = screen.getByRole('tab', { name: 'Iniciar Sesión' });
      const registerTab = screen.getByRole('tab', { name: 'Registrarse' });

      // Rapidly switch tabs
      for (let i = 0; i < 5; i++) {
        await user.click(registerTab);
        await user.click(loginTab);
      }

      // Should still be functional
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
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