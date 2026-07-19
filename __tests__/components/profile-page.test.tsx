import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ProfilePage from '@/app/profile/page';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), refresh: jest.fn() }),
}));

// Controllable auth state.
let mockAuthValue: { user: any; loading: boolean } = { user: null, loading: false };
jest.mock('@/context/auth-context', () => ({
  useAuth: () => mockAuthValue,
}));

const mockUpdateSettings = jest.fn();
jest.mock('@/context/settings-context', () => ({
  useSettings: () => ({
    settings: {
      theme: 'system',
      language: 'es',
      viewMode: 'calendar',
      examReminders: { oneHour: true, oneDay: true, oneWeek: false },
    },
    updateSettings: mockUpdateSettings,
  }),
}));

jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: jest.fn() }) }));

// Supabase client is created at module load; a self-contained mock avoids a TDZ.
jest.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      updateUser: jest.fn().mockResolvedValue({ data: {}, error: null }),
    },
    storage: {
      from: () => ({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/a.png' } }),
      }),
    },
  }),
}));

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: { full_name: 'John Doe' },
  app_metadata: { provider: 'email' },
  created_at: '2024-01-01T00:00:00.000Z',
  last_sign_in_at: '2024-06-01T00:00:00.000Z',
};

describe('ProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    mockAuthValue = { user: null, loading: false };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows a loading state (no profile content) while auth initializes', () => {
    mockAuthValue = { user: null, loading: true };
    render(<ProfilePage />);

    expect(
      screen.queryByText('Gestiona tu información personal y configuración')
    ).not.toBeInTheDocument();
  });

  it('redirects home when there is no authenticated user', async () => {
    mockAuthValue = { user: null, loading: false };
    render(<ProfilePage />);

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'));
  });

  it('renders the profile for an authenticated user', () => {
    mockAuthValue = { user: mockUser, loading: false };
    render(<ProfilePage />);

    expect(
      screen.getByText('Gestiona tu información personal y configuración')
    ).toBeInTheDocument();
    // The email is shown in a (disabled) input, so assert on its value.
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
  });

  it('renders the settings controls for an authenticated user', () => {
    mockAuthValue = { user: mockUser, loading: false };
    render(<ProfilePage />);

    expect(screen.getByText('Idioma')).toBeInTheDocument();
    expect(screen.getByText('Modo de visualización')).toBeInTheDocument();
  });
});
