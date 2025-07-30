import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '@/components/auth/register-form';

// Mock the auth context
const mockSignUp = jest.fn();
const mockSignInWithProvider = jest.fn();

jest.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    signUp: mockSignUp,
    signInWithProvider: mockSignInWithProvider,
    user: null,
    loading: false,
  }),
}));

// Mock Supabase client
jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      refreshSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  })),
}));

// Mock EnhancedGoogleAuth component
jest.mock('@/components/auth/enhanced-google-auth', () => ({
  EnhancedGoogleAuth: ({ onSuccess, onError }: any) => (
    <button 
      onClick={() => onSuccess()} 
      data-testid="google-auth-button"
    >
      Sign up with Google
    </button>
  ),
}));

describe('RegisterForm', () => {
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSignUp.mockResolvedValue({ error: null });
    mockSignInWithProvider.mockResolvedValue(undefined);
  });

  const renderRegisterForm = () => {
    return render(
      <RegisterForm onSuccess={mockOnSuccess} />
    );
  };

  describe('Rendering', () => {
    it('should render the register form with all required elements', () => {
      renderRegisterForm();

      expect(screen.getByText('Crear Cuenta')).toBeInTheDocument();
      expect(screen.getByLabelText('Nombre Completo')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirmar Contraseña')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Crear Cuenta' })).toBeInTheDocument();
      expect(screen.getByTestId('google-auth-button')).toBeInTheDocument();
    });

    it('should show password toggle buttons for both password fields', () => {
      renderRegisterForm();

      const passwordInput = screen.getByLabelText('Contraseña');
      const confirmPasswordInput = screen.getByLabelText('Confirmar Contraseña');
      const toggleButtons = screen.getAllByRole('button', { name: '' }); // Eye icon buttons

      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
      expect(toggleButtons).toHaveLength(2);
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

    it('should show validation error for password confirmation mismatch', async () => {
      const user = userEvent.setup();
      renderRegisterForm();

      const passwordInput = screen.getByLabelText('Contraseña');
      const confirmPasswordInput = screen.getByLabelText('Confirmar Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Crear Cuenta' });

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

      await user.type(fullNameInput, 'John Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');

      expect(screen.queryByText('El nombre completo debe tener al menos 2 caracteres')).not.toBeInTheDocument();
      expect(screen.queryByText('Por favor ingresa un email válido')).not.toBeInTheDocument();
      expect(screen.queryByText('La contraseña debe tener al menos 6 caracteres')).not.toBeInTheDocument();
      expect(screen.queryByText('Las contraseñas no coinciden')).not.toBeInTheDocument();
    });
  });

  describe('Password Toggle', () => {
    it('should toggle password visibility when eye buttons are clicked', async () => {
      const user = userEvent.setup();
      renderRegisterForm();

      const passwordInput = screen.getByLabelText('Contraseña');
      const confirmPasswordInput = screen.getByLabelText('Confirmar Contraseña');
      const toggleButtons = screen.getAllByRole('button', { name: '' });

      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      // Toggle password field
      await user.click(toggleButtons[0]);
      expect(passwordInput).toHaveAttribute('type', 'text');

      await user.click(toggleButtons[0]);
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Toggle confirm password field
      await user.click(toggleButtons[1]);
      expect(confirmPasswordInput).toHaveAttribute('type', 'text');

      await user.click(toggleButtons[1]);
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Submission', () => {
    it('should call signUp with correct data on successful submission', async () => {
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
        expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123', 'John Doe');
      });
    });

    it('should call onSuccess when signUp is successful', async () => {
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
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should show loading state during submission', async () => {
      mockSignUp.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

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

      expect(screen.getByText('Espera por favor')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Espera por favor' })).toBeDisabled();
    });

    it('should show error message when signUp fails', async () => {
      mockSignUp.mockResolvedValue({ 
        error: { message: 'Email already exists' } 
      });

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
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });
    });

    it('should translate common error messages to Spanish', async () => {
      mockSignUp.mockResolvedValue({ 
        error: { message: 'User already registered' } 
      });

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
        expect(screen.getByText('Usuario ya registrado')).toBeInTheDocument();
      });
    });

    it('should show generic error for unexpected errors', async () => {
      mockSignUp.mockRejectedValue(new Error('Network error'));

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
        expect(screen.getByText('Ocurrió un error inesperado. Por favor intenta de nuevo.')).toBeInTheDocument();
      });
    });
  });

  describe('Google Authentication', () => {
    it('should call signInWithProvider when Google auth is clicked', async () => {
      const user = userEvent.setup();
      renderRegisterForm();

      const googleButton = screen.getByTestId('google-auth-button');
      await user.click(googleButton);

      expect(mockSignInWithProvider).toHaveBeenCalledWith('google');
    });

    it('should show error when Google auth fails', async () => {
      mockSignInWithProvider.mockRejectedValue(new Error('Google auth failed'));

      const user = userEvent.setup();
      renderRegisterForm();

      const googleButton = screen.getByTestId('google-auth-button');
      await user.click(googleButton);

      await waitFor(() => {
        expect(screen.getByText('Error al registrarse con el proveedor. Por favor intenta de nuevo.')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderRegisterForm();

      expect(screen.getByLabelText('Nombre Completo')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirmar Contraseña')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Crear Cuenta' })).toBeInTheDocument();
    });

    it('should disable form inputs during loading', async () => {
      mockSignUp.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

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

      expect(fullNameInput).toBeDisabled();
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(confirmPasswordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Form Reset', () => {
    it('should clear form fields after successful submission', async () => {
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
        expect(fullNameInput).toHaveValue('');
        expect(emailInput).toHaveValue('');
        expect(passwordInput).toHaveValue('');
        expect(confirmPasswordInput).toHaveValue('');
      });
    });
  });
}); 