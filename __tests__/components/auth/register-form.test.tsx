import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '@/components/auth/register-form';

// Mock the auth context
const mockSignUp = jest.fn();

jest.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    signUp: mockSignUp,
    user: null,
    loading: false,
  }),
}));

// Mock the enhanced Google auth component
jest.mock('@/components/auth/enhanced-google-auth', () => ({
  EnhancedGoogleAuth: ({ onSuccess, onError, className, variant }: any) => (
    <button 
      data-testid="google-auth-button"
      onClick={() => onSuccess()}
      className={className}
      data-variant={variant}
    >
      Continuar con Google
    </button>
  ),
}));

// Mock setTimeout
jest.useFakeTimers();

describe('RegisterForm', () => {
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  const renderRegisterForm = () => {
    return render(<RegisterForm onSuccess={mockOnSuccess} />);
  };

  describe('Rendering', () => {
    it('should render the register form with all fields', () => {
      renderRegisterForm();

      expect(screen.getByText('Crear Cuenta')).toBeInTheDocument();
      expect(screen.getByText('Completa el formulario para crear tu cuenta')).toBeInTheDocument();
      expect(screen.getByLabelText('Nombre Completo')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirmar Contraseña')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Crear Cuenta' })).toBeInTheDocument();
    });

    it('should render Google auth button', () => {
      renderRegisterForm();

      expect(screen.getByTestId('google-auth-button')).toBeInTheDocument();
      expect(screen.getByText('Continuar con Google')).toBeInTheDocument();
    });

    it('should render password visibility toggles', () => {
      renderRegisterForm();

      const passwordInput = screen.getByLabelText('Contraseña');
      const confirmPasswordInput = screen.getByLabelText('Confirmar Contraseña');
      
      const passwordToggle = passwordInput.parentElement?.querySelector('button');
      const confirmPasswordToggle = confirmPasswordInput.parentElement?.querySelector('button');
      
      expect(passwordToggle).toBeInTheDocument();
      expect(confirmPasswordToggle).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for short full name', async () => {
      const user = userEvent.setup();
      renderRegisterForm();

      const fullNameInput = screen.getByLabelText('Nombre Completo');
      const submitButton = screen.getByRole('button', { name: 'Crear Cuenta' });

      await user.type(fullNameInput, 'A');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('El nombre completo debe tener al menos 2 caracteres')).toBeInTheDocument();
      });
    });

    it('should show validation error for invalid email', async () => {
      const user = userEvent.setup();
      renderRegisterForm();

      const emailInput = screen.getByLabelText('Email');
      const submitButton = screen.getByRole('button', { name: 'Crear Cuenta' });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Por favor ingresa un email válido')).toBeInTheDocument();
      });
    });

    it('should show validation error for short password', async () => {
      const user = userEvent.setup();
      renderRegisterForm();

      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Crear Cuenta' });

      await user.type(passwordInput, '123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('La contraseña debe tener al menos 6 caracteres')).toBeInTheDocument();
      });
    });

    it('should show validation error for mismatched passwords', async () => {
      const user = userEvent.setup();
      renderRegisterForm();

      const fullNameInput = screen.getByLabelText('Nombre Completo');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Contraseña');
      const confirmPasswordInput = screen.getByLabelText('Confirmar Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Crear Cuenta' });

      await user.type(fullNameInput, 'John Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'differentpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
      });
    });

    it('should not show validation errors for valid input', async () => {
      const user = userEvent.setup();
      renderRegisterForm();

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

      await waitFor(() => {
        expect(screen.queryByText('El nombre completo debe tener al menos 2 caracteres')).not.toBeInTheDocument();
        expect(screen.queryByText('Por favor ingresa un email válido')).not.toBeInTheDocument();
        expect(screen.queryByText('La contraseña debe tener al menos 6 caracteres')).not.toBeInTheDocument();
        expect(screen.queryByText('Las contraseñas no coinciden')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call signUp with form data on successful submission', async () => {
      const user = userEvent.setup();
      mockSignUp.mockResolvedValue({ error: null });
      
      renderRegisterForm();

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

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123', 'John Doe');
      });
    });

    it('should show success message after successful registration', async () => {
      const user = userEvent.setup();
      mockSignUp.mockResolvedValue({ error: null });
      
      renderRegisterForm();

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

      await waitFor(() => {
        expect(screen.getByText('¡Cuenta creada exitosamente! Revisa tu email para confirmar tu cuenta.')).toBeInTheDocument();
      });
    });

    it('should call onSuccess after delay on successful registration', async () => {
      const user = userEvent.setup();
      mockSignUp.mockResolvedValue({ error: null });
      
      renderRegisterForm();

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

      await waitFor(() => {
        expect(screen.getByText('¡Cuenta creada exitosamente! Revisa tu email para confirmar tu cuenta.')).toBeInTheDocument();
      });

      // Fast-forward timers
      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      mockSignUp.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderRegisterForm();

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

      expect(screen.getByText('Espera por favor')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message for already registered user', async () => {
      const user = userEvent.setup();
      mockSignUp.mockResolvedValue({ 
        error: { message: 'User already registered' } 
      });
      
      renderRegisterForm();

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

      await waitFor(() => {
        expect(screen.getByText('El usuario ya está registrado')).toBeInTheDocument();
      });
    });

    it('should display error message for invalid email format', async () => {
      const user = userEvent.setup();
      mockSignUp.mockResolvedValue({ 
        error: { message: 'Unable to validate email address' } 
      });
      
      renderRegisterForm();

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

      await waitFor(() => {
        expect(screen.getByText('No se pudo validar la dirección de email')).toBeInTheDocument();
      });
    });

    it('should display generic error for unexpected errors', async () => {
      const user = userEvent.setup();
      mockSignUp.mockRejectedValue(new Error('Network error'));
      
      renderRegisterForm();

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

      await waitFor(() => {
        expect(screen.getByText('Ocurrió un error inesperado. Por favor intenta de nuevo.')).toBeInTheDocument();
      });
    });
  });

  describe('Password Visibility', () => {
    it('should toggle password visibility when eye button is clicked', async () => {
      const user = userEvent.setup();
      renderRegisterForm();

      const passwordInput = screen.getByLabelText('Contraseña');
      const passwordToggle = passwordInput.parentElement?.querySelector('button');

      expect(passwordInput).toHaveAttribute('type', 'password');

      if (passwordToggle) {
        await user.click(passwordToggle);
      }

      expect(passwordInput).toHaveAttribute('type', 'text');

      if (passwordToggle) {
        await user.click(passwordToggle);
      }

      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should toggle confirm password visibility when eye button is clicked', async () => {
      const user = userEvent.setup();
      renderRegisterForm();

      const confirmPasswordInput = screen.getByLabelText('Confirmar Contraseña');
      const confirmPasswordToggle = confirmPasswordInput.parentElement?.querySelector('button');

      expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      if (confirmPasswordToggle) {
        await user.click(confirmPasswordToggle);
      }

      expect(confirmPasswordInput).toHaveAttribute('type', 'text');

      if (confirmPasswordToggle) {
        await user.click(confirmPasswordToggle);
      }

      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Paste Prevention', () => {
    it('should prevent paste in email field', async () => {
      const user = userEvent.setup();
      renderRegisterForm();

      const emailInput = screen.getByLabelText('Email');
      
      // Simulate paste event
      const pasteEvent = new Event('paste', { bubbles: true });
      Object.defineProperty(pasteEvent, 'preventDefault', {
        value: jest.fn(),
        writable: true,
      });

      emailInput.dispatchEvent(pasteEvent);

      expect(pasteEvent.preventDefault).toHaveBeenCalled();
    });

    it('should prevent paste in password fields', async () => {
      const user = userEvent.setup();
      renderRegisterForm();

      const passwordInput = screen.getByLabelText('Contraseña');
      const confirmPasswordInput = screen.getByLabelText('Confirmar Contraseña');
      
      // Simulate paste events
      const passwordPasteEvent = new Event('paste', { bubbles: true });
      const confirmPasswordPasteEvent = new Event('paste', { bubbles: true });
      
      Object.defineProperty(passwordPasteEvent, 'preventDefault', {
        value: jest.fn(),
        writable: true,
      });
      Object.defineProperty(confirmPasswordPasteEvent, 'preventDefault', {
        value: jest.fn(),
        writable: true,
      });

      passwordInput.dispatchEvent(passwordPasteEvent);
      confirmPasswordInput.dispatchEvent(confirmPasswordPasteEvent);

      expect(passwordPasteEvent.preventDefault).toHaveBeenCalled();
      expect(confirmPasswordPasteEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Google Auth Integration', () => {
    it('should call onSuccess when Google auth succeeds', async () => {
      const user = userEvent.setup();
      renderRegisterForm();

      const googleAuthButton = screen.getByTestId('google-auth-button');
      await user.click(googleAuthButton);

      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels and ARIA attributes', () => {
      renderRegisterForm();

      expect(screen.getByLabelText('Nombre Completo')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirmar Contraseña')).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      renderRegisterForm();

      const fullNameInput = screen.getByLabelText('Nombre Completo');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Contraseña');
      const confirmPasswordInput = screen.getByLabelText('Confirmar Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Crear Cuenta' });

      // Tab through form elements
      await user.tab();
      expect(fullNameInput).toHaveFocus();

      await user.tab();
      expect(emailInput).toHaveFocus();

      await user.tab();
      expect(passwordInput).toHaveFocus();

      await user.tab();
      expect(confirmPasswordInput).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid form submissions', async () => {
      const user = userEvent.setup();
      mockSignUp.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderRegisterForm();

      const fullNameInput = screen.getByLabelText('Nombre Completo');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Contraseña');
      const confirmPasswordInput = screen.getByLabelText('Confirmar Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Crear Cuenta' });

      await user.type(fullNameInput, 'John Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');

      // Rapidly click submit button
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      // Should only call signUp once
      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle missing onSuccess prop', () => {
      render(<RegisterForm onSuccess={undefined as any} />);

      expect(screen.getByText('Crear Cuenta')).toBeInTheDocument();
    });
  });
}); 