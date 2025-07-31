import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnhancedGoogleAuth } from '@/components/auth/enhanced-google-auth';

// Mock the Supabase client
const mockSignInWithOAuth = jest.fn();
const mockOnAuthStateChange = jest.fn();
const mockGetSession = jest.fn();

const mockSupabase = {
  auth: {
    signInWithOAuth: mockSignInWithOAuth,
    onAuthStateChange: mockOnAuthStateChange,
    getSession: mockGetSession,
  },
};

jest.mock('@/utils/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

// Mock the toast hook
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
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

// Mock crypto for nonce generation
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: jest.fn(() => new Uint8Array(32)),
    subtle: {
      digest: jest.fn(),
    },
  },
  writable: true,
});

describe('EnhancedGoogleAuth', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
  });

  const renderEnhancedGoogleAuth = (props = {}) => {
    return render(
      <EnhancedGoogleAuth 
        onSuccess={mockOnSuccess}
        onError={mockOnError}
        {...props}
      />
    );
  };

  describe('Rendering', () => {
    it('should render the Google auth button', () => {
      renderEnhancedGoogleAuth();

      expect(screen.getByRole('button', { name: /Continuar con Google/i })).toBeInTheDocument();
    });

    it('should render with default props', () => {
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should render with custom props', () => {
      renderEnhancedGoogleAuth({
        className: 'custom-class',
        variant: 'default',
        size: 'lg',
      });

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should show loading state when isLoading is true', async () => {
      mockSignInWithOAuth.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      const user = userEvent.setup();
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.getByText('Conectando con Google...')).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    it('should hide loading text when showLoadingText is false', async () => {
      mockSignInWithOAuth.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      const user = userEvent.setup();
      renderEnhancedGoogleAuth({ showLoadingText: false });

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.queryByText('Conectando con Google...')).not.toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });

  describe('Google Sign In', () => {
    it('should call signInWithOAuth with correct parameters', async () => {
      const user = userEvent.setup();
      mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null });
      
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          scopes: 'openid email profile',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
    });

    it('should call onSuccess when authentication succeeds', async () => {
      const user = userEvent.setup();
      mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null });
      
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should show success toast when authentication succeeds', async () => {
      const user = userEvent.setup();
      mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null });
      
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Redirigiendo...",
          description: "Te estamos redirigiendo a Google para autenticarte.",
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle oauth_provider_not_supported error', async () => {
      const user = userEvent.setup();
      mockSignInWithOAuth.mockResolvedValue({ 
        data: null, 
        error: { message: 'oauth_provider_not_supported' } 
      });
      
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Google OAuth no está habilitado en este momento')).toBeInTheDocument();
        expect(mockOnError).toHaveBeenCalledWith('Google OAuth no está habilitado en este momento');
      });
    });

    it('should handle access_denied error', async () => {
      const user = userEvent.setup();
      mockSignInWithOAuth.mockResolvedValue({ 
        data: null, 
        error: { message: 'access_denied' } 
      });
      
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Acceso denegado. Es necesario otorgar permisos para continuar.')).toBeInTheDocument();
      });
    });

    it('should handle invalid_request error', async () => {
      const user = userEvent.setup();
      mockSignInWithOAuth.mockResolvedValue({ 
        data: null, 
        error: { message: 'invalid_request' } 
      });
      
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Solicitud inválida. Por favor intenta de nuevo.')).toBeInTheDocument();
      });
    });

    it('should handle server_error error', async () => {
      const user = userEvent.setup();
      mockSignInWithOAuth.mockResolvedValue({ 
        data: null, 
        error: { message: 'server_error' } 
      });
      
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Error del servidor. Por favor intenta más tarde.')).toBeInTheDocument();
      });
    });

    it('should handle popup blocked error', async () => {
      const user = userEvent.setup();
      mockSignInWithOAuth.mockResolvedValue({ 
        data: null, 
        error: { message: 'popup blocked' } 
      });
      
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Por favor permite las ventanas emergentes para este sitio')).toBeInTheDocument();
      });
    });

    it('should handle redirect error', async () => {
      const user = userEvent.setup();
      mockSignInWithOAuth.mockResolvedValue({ 
        data: null, 
        error: { message: 'redirect error' } 
      });
      
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Error de redirección. Verifica la configuración.')).toBeInTheDocument();
      });
    });

    it('should handle generic error', async () => {
      const user = userEvent.setup();
      mockSignInWithOAuth.mockResolvedValue({ 
        data: null, 
        error: { message: 'unknown error' } 
      });
      
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Error en la autenticación con Google')).toBeInTheDocument();
      });
    });

    it('should show error toast when authentication fails', async () => {
      const user = userEvent.setup();
      mockSignInWithOAuth.mockResolvedValue({ 
        data: null, 
        error: { message: 'oauth_provider_not_supported' } 
      });
      
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Error de autenticación",
          description: "Google OAuth no está habilitado en este momento",
          variant: "destructive",
        });
      });
    });

    it('should handle unexpected errors', async () => {
      const user = userEvent.setup();
      mockSignInWithOAuth.mockRejectedValue(new Error('Network error'));
      
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Error inesperado durante la autenticación')).toBeInTheDocument();
        expect(mockOnError).toHaveBeenCalledWith('Error inesperado durante la autenticación');
      });
    });
  });

  describe('Auth State Monitoring', () => {
    it('should set up auth state change listener', () => {
      renderEnhancedGoogleAuth();

      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });

    it('should store provider tokens when available', () => {
      const mockSession = {
        provider_token: 'provider-token',
        provider_refresh_token: 'refresh-token',
      };

      mockOnAuthStateChange.mockImplementation((callback) => {
        // Simulate SIGNED_IN event
        callback('SIGNED_IN', mockSession);
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      renderEnhancedGoogleAuth();

      expect(localStorage.setItem).toHaveBeenCalledWith('oauth_provider_token', 'provider-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('oauth_provider_refresh_token', 'refresh-token');
    });

    it('should show welcome toast on successful sign in', () => {
      const mockSession = { user: { id: 'user-123' } };

      mockOnAuthStateChange.mockImplementation((callback) => {
        // Simulate SIGNED_IN event
        callback('SIGNED_IN', mockSession);
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      renderEnhancedGoogleAuth();

      expect(mockToast).toHaveBeenCalledWith({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión exitosamente con Google.",
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper button attributes', () => {
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null });
      
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      
      // Focus the button
      button.focus();
      expect(button).toHaveFocus();

      // Activate with Enter key
      await user.keyboard('{Enter}');
      expect(mockSignInWithOAuth).toHaveBeenCalled();
    });

    it('should be disabled during loading', async () => {
      const user = userEvent.setup();
      mockSignInWithOAuth.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      await user.click(button);

      expect(button).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing onSuccess callback', async () => {
      const user = userEvent.setup();
      mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null });
      
      render(<EnhancedGoogleAuth onError={mockOnError} />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Should not throw error
      await waitFor(() => {
        expect(mockSignInWithOAuth).toHaveBeenCalled();
      });
    });

    it('should handle missing onError callback', async () => {
      const user = userEvent.setup();
      mockSignInWithOAuth.mockResolvedValue({ 
        data: null, 
        error: { message: 'oauth_provider_not_supported' } 
      });
      
      render(<EnhancedGoogleAuth onSuccess={mockOnSuccess} />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Should not throw error
      await waitFor(() => {
        expect(screen.getByText('Google OAuth no está habilitado en este momento')).toBeInTheDocument();
      });
    });

    it('should handle rapid button clicks', async () => {
      const user = userEvent.setup();
      mockSignInWithOAuth.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      
      // Rapidly click the button
      await user.click(button);
      await user.click(button);
      await user.click(button);

      // Should only call signInWithOAuth once
      expect(mockSignInWithOAuth).toHaveBeenCalledTimes(1);
    });
  });
}); 