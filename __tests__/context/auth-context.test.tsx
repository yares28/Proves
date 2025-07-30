import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '@/context/auth-context';

// Mock Supabase client
const mockSupabase = {
  auth: {
    getSession: jest.fn(),
    refreshSession: jest.fn(),
    onAuthStateChange: jest.fn(() => ({ 
      data: { 
        subscription: { 
          unsubscribe: jest.fn() 
        } 
      } 
    })),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    signInWithOAuth: jest.fn(),
  },
};

jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(() => mockSupabase),
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

// Mock toast hook
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test component to access auth context
const TestComponent = () => {
  const { user, loading, signIn, signOut, signUp, signInWithProvider, syncToken, refreshSession } = useAuth();
  
  return (
    <div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <button 
        data-testid="sign-in" 
        onClick={() => signIn('test@example.com', 'password')}
      >
        Sign In
      </button>
      <button 
        data-testid="sign-out" 
        onClick={() => signOut()}
      >
        Sign Out
      </button>
      <button 
        data-testid="sign-up" 
        onClick={() => signUp('test@example.com', 'password', 'Test User')}
      >
        Sign Up
      </button>
      <button 
        data-testid="sign-in-provider" 
        onClick={() => signInWithProvider('google')}
      >
        Sign In with Google
      </button>
      <button 
        data-testid="sync-token" 
        onClick={async () => {
          const result = await syncToken();
          console.log('Sync result:', result);
        }}
      >
        Sync Token
      </button>
      <button 
        data-testid="refresh-session" 
        onClick={async () => {
          const result = await refreshSession();
          console.log('Refresh result:', result);
        }}
      >
        Refresh Session
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
  });

  const renderAuthProvider = () => {
    return render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
  };

  describe('Initial State', () => {
    it('should render with initial state', async () => {
      renderAuthProvider();

      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    it('should initialize with user when session exists', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: mockUser,
            access_token: 'access-token',
            refresh_token: 'refresh-token',
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          } 
        },
        error: null,
      });

      renderAuthProvider();

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });
    });
  });

  describe('Sign In', () => {
    it('should sign in successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'token' } },
        error: null,
      });

      renderAuthProvider();

      const signInButton = screen.getByTestId('sign-in');
      await userEvent.click(signInButton);

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password',
        });
      });
    });

    it('should handle sign in error', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      renderAuthProvider();

      const signInButton = screen.getByTestId('sign-in');
      await userEvent.click(signInButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Invalid credentials',
          variant: 'destructive',
        });
      });
    });
  });

  describe('Sign Up', () => {
    it('should sign up successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'token' } },
        error: null,
      });

      renderAuthProvider();

      const signUpButton = screen.getByTestId('sign-up');
      await userEvent.click(signUpButton);

      await waitFor(() => {
        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password',
          options: {
            data: {
              name: 'Test User',
            },
          },
        });
      });
    });

    it('should handle sign up error', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email already exists' },
      });

      renderAuthProvider();

      const signUpButton = screen.getByTestId('sign-up');
      await userEvent.click(signUpButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Email already exists',
          variant: 'destructive',
        });
      });
    });
  });

  describe('Sign Out', () => {
    it('should sign out successfully', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      });

      renderAuthProvider();

      const signOutButton = screen.getByTestId('sign-out');
      await userEvent.click(signOutButton);

      await waitFor(() => {
        expect(mockSupabase.auth.signOut).toHaveBeenCalled();
        expect(localStorageMock.clear).toHaveBeenCalled();
      });
    });

    it('should handle sign out error', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Sign out failed' },
      });

      renderAuthProvider();

      const signOutButton = screen.getByTestId('sign-out');
      await userEvent.click(signOutButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Sign out failed',
          variant: 'destructive',
        });
      });
    });
  });

  describe('Provider Sign In', () => {
    it('should sign in with provider successfully', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { provider: 'google', url: 'https://google.com/auth' },
        error: null,
      });

      renderAuthProvider();

      const providerButton = screen.getByTestId('sign-in-provider');
      await userEvent.click(providerButton);

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'google',
        });
      });
    });

    it('should handle provider sign in error', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { provider: null, url: null },
        error: { message: 'OAuth failed' },
      });

      renderAuthProvider();

      const providerButton = screen.getByTestId('sign-in-provider');
      await userEvent.click(providerButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'OAuth failed',
          variant: 'destructive',
        });
      });
    });
  });

  describe('Session Refresh', () => {
    it('should refresh session successfully', async () => {
      const mockSession = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };

      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      renderAuthProvider();

      const refreshButton = screen.getByTestId('refresh-session');
      await userEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockSupabase.auth.refreshSession).toHaveBeenCalled();
      });
    });

    it('should handle refresh session error', async () => {
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Refresh failed' },
      });

      renderAuthProvider();

      const refreshButton = screen.getByTestId('refresh-session');
      await userEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Refresh failed',
          variant: 'destructive',
        });
      });
    });
  });

  describe('Token Sync', () => {
    it('should sync token successfully', async () => {
      const mockSession = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      renderAuthProvider();

      const syncButton = screen.getByTestId('sync-token');
      await userEvent.click(syncButton);

      await waitFor(() => {
        expect(mockSupabase.auth.getSession).toHaveBeenCalled();
      });
    });

    it('should handle token sync error', async () => {
      mockSupabase.auth.getSession.mockRejectedValue(new Error('Sync error'));

      renderAuthProvider();

      const syncButton = screen.getByTestId('sync-token');
      await userEvent.click(syncButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to sync authentication state',
          variant: 'destructive',
        });
      });
    });
  });

  describe('Auth State Changes', () => {
    it('should handle auth state change to signed in', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      };

      const mockSession = {
        user: mockUser,
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };

      renderAuthProvider();

      // Verify that onAuthStateChange was called
      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled();
    });

    it('should handle auth state change to signed out', async () => {
      renderAuthProvider();

      // Verify that onAuthStateChange was called
      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      mockSupabase.auth.getSession.mockRejectedValue(new Error('Unexpected error'));

      renderAuthProvider();

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'An unexpected error occurred',
          variant: 'destructive',
        });
      });
    });

    it('should handle network errors', async () => {
      mockSupabase.auth.signInWithPassword.mockRejectedValue(new Error('Network error'));

      renderAuthProvider();

      const signInButton = screen.getByTestId('sign-in');
      await userEvent.click(signInButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Network error',
          variant: 'destructive',
        });
      });
    });
  });

  describe('useAuth Hook', () => {
    it('should provide all required methods and state', () => {
      renderAuthProvider();

      expect(screen.getByTestId('sign-in')).toBeInTheDocument();
      expect(screen.getByTestId('sign-out')).toBeInTheDocument();
      expect(screen.getByTestId('sign-up')).toBeInTheDocument();
      expect(screen.getByTestId('sign-in-provider')).toBeInTheDocument();
      expect(screen.getByTestId('sync-token')).toBeInTheDocument();
      expect(screen.getByTestId('refresh-session')).toBeInTheDocument();
    });

    it('should handle loading states correctly', async () => {
      mockSupabase.auth.signInWithPassword.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      renderAuthProvider();

      const signInButton = screen.getByTestId('sign-in');
      await userEvent.click(signInButton);

      // Should show loading state
      expect(screen.getByTestId('loading')).toHaveTextContent('loading');

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
    });
  });
}); 