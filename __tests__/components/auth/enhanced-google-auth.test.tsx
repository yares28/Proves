import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnhancedGoogleAuth } from '@/components/auth/enhanced-google-auth';

// The component calls createClient() at module load, so the mock is self-contained
// (no outer references) and its jest.fn()s are reached via jest.requireMock.
jest.mock('@/utils/supabase/client', () => {
  const auth = {
    signInWithOAuth: jest.fn(),
    onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
  };
  return { createClient: () => ({ auth }), __auth: auth };
});

const mockAuth = (jest.requireMock('@/utils/supabase/client') as any).__auth as Record<string, jest.Mock>;

const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('EnhancedGoogleAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
  });

  it('renders the Google sign-in button', () => {
    render(<EnhancedGoogleAuth />);

    expect(screen.getByRole('button', { name: /Continuar con Google/i })).toBeInTheDocument();
  });

  it('starts a Google OAuth sign-in when clicked', async () => {
    mockAuth.signInWithOAuth.mockResolvedValue({ data: {}, error: null });
    const onSuccess = jest.fn();
    const user = userEvent.setup();
    render(<EnhancedGoogleAuth onSuccess={onSuccess} />);

    await user.click(screen.getByRole('button', { name: /Continuar con Google/i }));

    await waitFor(() =>
      expect(mockAuth.signInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'google' })
      )
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it('surfaces an error and calls onError when sign-in fails', async () => {
    mockAuth.signInWithOAuth.mockResolvedValue({ data: {}, error: { message: 'access_denied' } });
    const onError = jest.fn();
    const user = userEvent.setup();
    render(<EnhancedGoogleAuth onError={onError} />);

    await user.click(screen.getByRole('button', { name: /Continuar con Google/i }));

    expect(
      await screen.findByText('Acceso denegado. Es necesario otorgar permisos para continuar.')
    ).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith(
      'Acceso denegado. Es necesario otorgar permisos para continuar.'
    );
  });
});
