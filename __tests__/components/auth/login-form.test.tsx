import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/auth/login-form';

// Mock the auth context
const mockSignIn = jest.fn();
const mockSignInWithProvider = jest.fn();

jest.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signInWithProvider: mockSignInWithProvider,
    user: null,
    loading: false,
  }),
}));

// Mock the Supabase client
const mockSupabase = {
  auth: {
    getSession: jest.fn(),
  },
};

jest.mock('@/utils/supabase/client', () => ({
  createClient: () => mockSupabase,
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

// Mock the auth performance monitor
jest.mock('@/components/auth-performance-monitor', () => ({
  AuthPerformanceMonitor: () => <div data-testid="auth-performance-monitor" />,
}));

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

describe('LoginForm', () => {
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
    });
  });

  const renderLoginForm = () => {
    return render(<LoginForm onSuccess={mockOnSuccess} />);
  };

  describe('Rendering', () => {
    it('should render the login form with all fields', () => {
      renderLoginForm();

      expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
      expect(screen.getByLabelText('Recordarme')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Iniciar Sesión' })).toBeInTheDocument();
    });

    it('should render Google auth button', () => {
      renderLoginForm();

      expect(screen.getByTestId('google-auth-button')).toBeInTheDocument();
      expect(screen.getByText('Continuar con Google')).toBeInTheDocument();
    });

    it('should render auth performance monitor', () => {
      renderLoginForm();

      expect(screen.getByTestId('auth-performance-monitor')).toBeInTheDocument();
    });

    it('should render password visibility toggle', () => {
      renderLoginForm();

      const passwordInput = screen.getByLabelText('Contraseña');
      const toggleButton = passwordInput.parentElement?.querySelector('button');
      
      expect(toggleButton).toBeInTheDocument();
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
      const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Por favor ingresa un email válido')).not.toBeInTheDocument();
        expect(screen.queryByText('La contraseña debe tener al menos 6 caracteres')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call signIn with form data on successful submission', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ error: null });
      
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

    it('should call onSuccess after successful login', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ error: null });
      
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

    it('should store session in localStorage on successful login', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ error: null });
      
      renderLoginForm();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith(
          'supabase.auth.token',
          JSON.stringify({ currentSession: { access_token: 'test-token' } })
        );
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderLoginForm();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      expect(screen.getByText('Espera por favor')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message for invalid credentials', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ 
        error: { message: 'Invalid login credentials' } 
      });
      
      renderLoginForm();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Credenciales de inicio de sesión incorrectas')).toBeInTheDocument();
      });
    });

    it('should display error message for unconfirmed email', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ 
        error: { message: 'Email not confirmed' } 
      });
      
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

    it('should display generic error for unexpected errors', async () => {
      const user = userEvent.setup();
      mockSignIn.mockRejectedValue(new Error('Network error'));
      
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

  describe('Password Visibility', () => {
    it('should toggle password visibility when eye button is clicked', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const passwordInput = screen.getByLabelText('Contraseña');
      const toggleButton = passwordInput.parentElement?.querySelector('button');

      expect(passwordInput).toHaveAttribute('type', 'password');

      if (toggleButton) {
        await user.click(toggleButton);
      }

      expect(passwordInput).toHaveAttribute('type', 'text');

      if (toggleButton) {
        await user.click(toggleButton);
      }

      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Remember Me Checkbox', () => {
    it('should be checked by default', () => {
      renderLoginForm();

      const rememberMeCheckbox = screen.getByLabelText('Recordarme');
      expect(rememberMeCheckbox).toBeChecked();
    });

    it('should be toggleable', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const rememberMeCheckbox = screen.getByLabelText('Recordarme');
      
      await user.click(rememberMeCheckbox);
      expect(rememberMeCheckbox).not.toBeChecked();

      await user.click(rememberMeCheckbox);
      expect(rememberMeCheckbox).toBeChecked();
    });
  });

  describe('Google Auth Integration', () => {
    it('should call onSuccess when Google auth succeeds', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const googleAuthButton = screen.getByTestId('google-auth-button');
      await user.click(googleAuthButton);

      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels and ARIA attributes', () => {
      renderLoginForm();

      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
      expect(screen.getByLabelText('Recordarme')).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' });

      // Tab through form elements
      await user.tab();
      expect(emailInput).toHaveFocus();

      await user.tab();
      expect(passwordInput).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid form submissions', async () => {
      const user = userEvent.setup();
      mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderLoginForm();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      // Rapidly click submit button
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      // Should only call signIn once
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle missing onSuccess prop', () => {
      render(<LoginForm onSuccess={undefined as any} />);

      expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
    });
  });
}); 