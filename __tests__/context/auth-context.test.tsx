import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '@/context/auth-context';

// auth-context calls createClient() at module load, so the Supabase mock must be
// self-contained (no outer references) to avoid a temporal-dead-zone error. The
// jest.fn()s are reached from the tests through jest.requireMock.
jest.mock('@/utils/supabase/client', () => {
  const auth = {
    getSession: jest.fn(),
    refreshSession: jest.fn(),
    onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    signInWithOAuth: jest.fn(),
  };
  const client = { auth };
  return { createClient: () => client, __client: client };
});

const mockSupabase = (jest.requireMock('@/utils/supabase/client') as any).__client as {
  auth: Record<string, jest.Mock>;
};

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), prefetch: jest.fn(), refresh: jest.fn() }),
}));

const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const TestComponent = () => {
  const { user, loading, signIn, signOut, signUp, signInWithProvider, refreshSession } = useAuth();
  return (
    <div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <button data-testid="sign-in" onClick={() => signIn('test@example.com', 'password')}>in</button>
      <button data-testid="sign-out" onClick={() => signOut()}>out</button>
      <button data-testid="sign-up" onClick={() => signUp('test@example.com', 'password', 'Test User')}>up</button>
      <button data-testid="sign-in-provider" onClick={() => signInWithProvider('google').catch(() => {})}>google</button>
      <button data-testid="refresh-session" onClick={() => refreshSession()}>refresh</button>
    </div>
  );
};

const renderAuthProvider = () =>
  render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );

describe('AuthContext', () => {
  beforeAll(() => {
    // The provider is intentionally chatty; keep test output readable.
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
  });

  describe('Initial state', () => {
    it('renders with no user and finishes loading', async () => {
      renderAuthProvider();

      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('not-loading'));
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });

    it('initializes with the user when a session already exists', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123', email: 'test@example.com' },
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          },
        },
        error: null,
      });

      renderAuthProvider();

      await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('test@example.com'));
    });
  });

  describe('signIn', () => {
    it('calls signInWithPassword with the credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: {}, error: null });
      renderAuthProvider();

      await userEvent.click(screen.getByTestId('sign-in'));

      await waitFor(() =>
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password',
        })
      );
    });

    it('does not throw when sign-in returns an error (the caller surfaces it)', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {},
        error: { message: 'Invalid credentials' },
      });
      renderAuthProvider();

      await userEvent.click(screen.getByTestId('sign-in'));

      await waitFor(() => expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled());
    });
  });

  describe('signUp', () => {
    it('calls signUp with full_name in the user metadata', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({ data: {}, error: null });
      renderAuthProvider();

      await userEvent.click(screen.getByTestId('sign-up'));

      await waitFor(() =>
        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password',
          options: { data: { full_name: 'Test User' } },
        })
      );
    });
  });

  describe('signOut', () => {
    it('signs out, clears the server session and redirects home', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });
      renderAuthProvider();

      await userEvent.click(screen.getByTestId('sign-out'));

      await waitFor(() => {
        expect(mockSupabase.auth.signOut).toHaveBeenCalled();
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({ method: 'POST' }));
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('signInWithProvider', () => {
    it('starts an OAuth sign-in for google', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({ data: {}, error: null });
      renderAuthProvider();

      await userEvent.click(screen.getByTestId('sign-in-provider'));

      await waitFor(() =>
        expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith(
          expect.objectContaining({ provider: 'google' })
        )
      );
    });
  });

  describe('refreshSession', () => {
    it('calls supabase refreshSession', async () => {
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: { user: { id: 'u', email: 'test@example.com' } } },
        error: null,
      });
      renderAuthProvider();

      await userEvent.click(screen.getByTestId('refresh-session'));

      await waitFor(() => expect(mockSupabase.auth.refreshSession).toHaveBeenCalled());
    });
  });

  describe('useAuth', () => {
    it('throws when used outside an AuthProvider', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      const Orphan = () => {
        useAuth();
        return null;
      };
      expect(() => render(<Orphan />)).toThrow('useAuth must be used within an AuthProvider');
    });
  });
});
