import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnhancedGoogleAuth } from '@/components/auth/enhanced-google-auth';

// Mock the auth context
const mockSignInWithProvider = jest.fn();

jest.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    signInWithProvider: mockSignInWithProvider,
    loading: false,
  }),
}));

// Mock Supabase client
jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithOAuth: jest.fn(),
    },
  })),
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

describe('EnhancedGoogleAuth', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSignInWithProvider.mockResolvedValue({ error: null });
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

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Continuar con Google')).toBeInTheDocument();
    });

    it('should render with Google icon', () => {
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('should have proper button styling', () => {
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
      expect(button).toHaveClass('justify-center');
    });

    it('should render with custom text when provided', () => {
      renderEnhancedGoogleAuth({ text: 'Sign in with Google' });

      expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
    });

    it('should render with custom variant when provided', () => {
      renderEnhancedGoogleAuth({ variant: 'outline' });

      const button = screen.getByRole('button');
      expect(button).toHaveClass('border');
    });
  });

  describe('Button Interactions', () => {
    it('should call signInWithProvider when button is clicked', async () => {
      const user = userEvent.setup();
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockSignInWithProvider).toHaveBeenCalledWith('google');
    });

    it('should call onSuccess when authentication is successful', async () => {
      const user = userEvent.setup();
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should call onError when authentication fails', async () => {
      mockSignInWithProvider.mockResolvedValue({ 
        error: { message: 'Authentication failed' } 
      });

      const user = userEvent.setup();
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    it('should handle network errors gracefully', async () => {
      mockSignInWithProvider.mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during authentication', async () => {
      mockSignInWithProvider.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      const user = userEvent.setup();
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.getByText('Espera por favor')).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    it('should restore button state after loading', async () => {
      mockSignInWithProvider.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      const user = userEvent.setup();
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      await user.click(button);

      expect(button).toBeDisabled();

      await waitFor(() => {
        expect(button).not.toBeDisabled();
        expect(screen.getByText('Continuar con Google')).toBeInTheDocument();
      });
    });

    it('should handle loading state with custom loading text', async () => {
      mockSignInWithProvider.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      const user = userEvent.setup();
      renderEnhancedGoogleAuth({ loadingText: 'Authenticating...' });

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.getByText('Authenticating...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors with custom error handling', async () => {
      mockSignInWithProvider.mockResolvedValue({ 
        error: { message: 'User cancelled' } 
      });

      const user = userEvent.setup();
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    it('should handle unexpected errors', async () => {
      mockSignInWithProvider.mockRejectedValue(new Error('Unexpected error'));

      const user = userEvent.setup();
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    it('should handle null error gracefully', async () => {
      mockSignInWithProvider.mockResolvedValue({ error: null });

      const user = userEvent.setup();
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Sign in with Google');
    });

    it('should have proper keyboard navigation', async () => {
      const user = userEvent.setup();
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      
      // Focus the button
      button.focus();
      expect(button).toHaveFocus();

      // Activate with Enter key
      await user.keyboard('{Enter}');
      expect(mockSignInWithProvider).toHaveBeenCalledWith('google');
    });

    it('should have proper keyboard navigation with Space key', async () => {
      const user = userEvent.setup();
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      
      // Focus the button
      button.focus();
      expect(button).toHaveFocus();

      // Activate with Space key
      await user.keyboard(' ');
      expect(mockSignInWithProvider).toHaveBeenCalledWith('google');
    });

    it('should be disabled during loading', async () => {
      mockSignInWithProvider.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      const user = userEvent.setup();
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      await user.click(button);

      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Customization', () => {
    it('should render with custom className', () => {
      renderEnhancedGoogleAuth({ className: 'custom-class' });

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should render with custom size', () => {
      renderEnhancedGoogleAuth({ size: 'lg' });

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-12');
    });

    it('should render with custom variant', () => {
      renderEnhancedGoogleAuth({ variant: 'destructive' });

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive');
    });

    it('should render with custom text and loading text', () => {
      renderEnhancedGoogleAuth({ 
        text: 'Custom Google Sign In',
        loadingText: 'Custom Loading...'
      });

      expect(screen.getByText('Custom Google Sign In')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid button clicks', async () => {
      const user = userEvent.setup();
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      
      // Rapidly click the button
      for (let i = 0; i < 5; i++) {
        await user.click(button);
      }

      // Should only call once due to loading state
      expect(mockSignInWithProvider).toHaveBeenCalledTimes(1);
    });

    it('should handle missing onSuccess callback', async () => {
      const user = userEvent.setup();
      renderEnhancedGoogleAuth({ onSuccess: undefined });

      const button = screen.getByRole('button');
      await user.click(button);

      // Should not throw error
      await waitFor(() => {
        expect(mockSignInWithProvider).toHaveBeenCalled();
      });
    });

    it('should handle missing onError callback', async () => {
      mockSignInWithProvider.mockResolvedValue({ 
        error: { message: 'Auth failed' } 
      });

      const user = userEvent.setup();
      renderEnhancedGoogleAuth({ onError: undefined });

      const button = screen.getByRole('button');
      await user.click(button);

      // Should not throw error
      await waitFor(() => {
        expect(mockSignInWithProvider).toHaveBeenCalled();
      });
    });

    it('should handle component unmounting during authentication', async () => {
      mockSignInWithProvider.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      const user = userEvent.setup();
      const { unmount } = renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      await user.click(button);

      // Unmount component during authentication
      unmount();

      // Should not cause errors
      await waitFor(() => {
        expect(mockSignInWithProvider).toHaveBeenCalled();
      });
    });
  });

  describe('Integration with Auth Context', () => {
    it('should use auth context signInWithProvider method', async () => {
      const user = userEvent.setup();
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockSignInWithProvider).toHaveBeenCalledWith('google');
    });

    it('should handle auth context loading state', () => {
      jest.doMock('@/context/auth-context', () => ({
        useAuth: () => ({
          signInWithProvider: mockSignInWithProvider,
          loading: true,
        }),
      }));

      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should handle auth context errors', async () => {
      mockSignInWithProvider.mockRejectedValue(new Error('Auth context error'));

      const user = userEvent.setup();
      renderEnhancedGoogleAuth();

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
      });
    });
  });
}); 