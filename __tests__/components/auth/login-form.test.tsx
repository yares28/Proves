import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/auth/login-form';
import { AuthProvider } from '@/context/auth-context';

// Mock the auth context
const mockSignIn = jest.fn();
const mockSignInWithProvider = jest.fn();

jest.mock('@/context/auth-context', () => ({
  ...jest.requireActual('@/context/auth-context'),
  useAuth: () => ({
    signIn: mockSignIn,
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
      Sign in with Google
    </button>
  ),
}));

// Mock AuthPerformanceMonitor component
jest.mock('@/components/auth-performance-monitor', () => ({
  AuthPerformanceMonitor: () => <div data-testid="auth-performance-monitor" />,
}));

describe('LoginForm', () => {
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSignIn.mockResolvedValue({ error: null });
    mockSignInWithProvider.mockResolvedValue(undefined);
  });

  const renderLoginForm = () => {
    return render(
      <LoginForm onSuccess={mockOnSuccess} />
    );
  };

  describe('Rendering', () => {
    it('should render the login form with all required elements', () => {
      renderLoginForm();

      expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
      expect(screen.getByLabelText('Recordarme')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Iniciar Sesión' })).toBeInTheDocument();
      expect(screen.getByTestId('google-auth-button')).toBeInTheDocument();
      expect(screen.getByTestId('auth-performance-monitor')).toBeInTheDocument();
    });

    it('should show password toggle button', () => {
      renderLoginForm();

      const passwordInput = screen.getByLabelText('Contraseña');
      const toggleButton = screen.getByRole('button', { name: '' }); // Eye icon button

      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(toggleButton).toBeInTheDocument();
    });

    it('should have remember me checkbox checked by default', () => {
      renderLoginForm();

      const rememberMeCheckbox = screen.getByLabelText('Recordarme');
      expect(rememberMeCheckbox).toBeChecked();
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for invalid email', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const emailInput = screen.getByLabelText('Email');
      const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Por favor ingresa un email válido')).toBeInTheDocument();
      });
    });

    it('should show validation error for short password', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, '123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('La contraseña debe tener al menos 6 caracteres')).toBeInTheDocument();
      });
    });

    it('should not show validation errors for valid input', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Contraseña');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      expect(screen.queryByText('Por favor ingresa un email válido')).not.toBeInTheDocument();
      expect(screen.queryByText('La contraseña debe tener al menos 6 caracteres')).not.toBeInTheDocument();
    });
  });

  describe('Password Toggle', () => {
    it('should toggle password visibility when eye button is clicked', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const passwordInput = screen.getByLabelText('Contraseña');
      const toggleButton = screen.getByRole('button', { name: '' });

      expect(passwordInput).toHaveAttribute('type', 'password');

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Submission', () => {
    it('should call signIn with correct data on successful submission', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should call onSuccess when signIn is successful', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should show loading state during submission', async () => {
      mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const user = userEvent.setup();
      renderLoginForm();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      expect(screen.getByText('Espera por favor')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Espera por favor' })).toBeDisabled();
    });

    it('should show error message when signIn fails', async () => {
      mockSignIn.mockResolvedValue({ 
        error: { message: 'Invalid login credentials' } 
      });

      const user = userEvent.setup();
      renderLoginForm();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Credenciales de inicio de sesión incorrectas')).toBeInTheDocument();
      });
    });

    it('should translate common error messages to Spanish', async () => {
      mockSignIn.mockResolvedValue({ 
        error: { message: 'Email not confirmed' } 
      });

      const user = userEvent.setup();
      renderLoginForm();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email no confirmado')).toBeInTheDocument();
      });
    });

    it('should show generic error for unexpected errors', async () => {
      mockSignIn.mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();
      renderLoginForm();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Ocurrió un error inesperado. Por favor intenta de nuevo.')).toBeInTheDocument();
      });
    });
  });

  describe('Google Authentication', () => {
    it('should call signInWithProvider when Google auth is clicked', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const googleButton = screen.getByTestId('google-auth-button');
      await user.click(googleButton);

      expect(mockSignInWithProvider).toHaveBeenCalledWith('google');
    });

    it('should show error when Google auth fails', async () => {
      mockSignInWithProvider.mockRejectedValue(new Error('Google auth failed'));

      const user = userEvent.setup();
      renderLoginForm();

      const googleButton = screen.getByTestId('google-auth-button');
      await user.click(googleButton);

      await waitFor(() => {
        expect(screen.getByText('Error al iniciar sesión con el proveedor. Por favor intenta de nuevo.')).toBeInTheDocument();
      });
    });
  });

  describe('Remember Me Functionality', () => {
    it('should include remember me value in form data', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const rememberMeCheckbox = screen.getByLabelText('Recordarme');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' });

      // Uncheck remember me
      await user.click(rememberMeCheckbox);
      expect(rememberMeCheckbox).not.toBeChecked();

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderLoginForm();

      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
      expect(screen.getByLabelText('Recordarme')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Iniciar Sesión' })).toBeInTheDocument();
    });

    it('should disable form inputs during loading', async () => {
      mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const user = userEvent.setup();
      renderLoginForm();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });
}); 