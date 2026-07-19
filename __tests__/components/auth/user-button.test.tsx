import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserButton } from '@/components/auth/user-button';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), prefetch: jest.fn(), refresh: jest.fn() }),
}));

const mockSignOut = jest.fn();
// Controllable auth value; each test sets mockAuthValue before rendering.
let mockAuthValue: any = { user: null, signOut: mockSignOut, loading: false };
jest.mock('@/context/auth-context', () => ({
  useAuth: () => mockAuthValue,
}));

jest.mock('@/components/auth/auth-dialog', () => ({
  AuthDialog: ({ open }: any) => (open ? <div data-testid="auth-dialog" /> : null),
}));

const signedIn = (metadata: Record<string, unknown>, email?: string) => ({
  user: { id: 'u1', email, user_metadata: metadata },
  signOut: mockSignOut,
  loading: false,
});

describe('UserButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthValue = { user: null, signOut: mockSignOut, loading: false };
  });

  describe('signed out', () => {
    it('shows a sign-in button and opens the auth dialog when clicked', async () => {
      const user = userEvent.setup();
      render(<UserButton />);

      expect(screen.queryByTestId('auth-dialog')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button'));

      expect(screen.getByTestId('auth-dialog')).toBeInTheDocument();
    });
  });

  describe('signed in — avatar initials', () => {
    it('uses the full name initials', async () => {
      mockAuthValue = signedIn({ full_name: 'John Doe' }, 'john@example.com');
      render(<UserButton />);

      expect(await screen.findByText('JD')).toBeInTheDocument();
    });

    it('falls back to the first two email characters when there is no name', async () => {
      mockAuthValue = signedIn({}, 'test@example.com');
      render(<UserButton />);

      expect(await screen.findByText('TE')).toBeInTheDocument();
    });

    it('falls back to "U" when there is neither name nor email', async () => {
      mockAuthValue = signedIn({}, undefined);
      render(<UserButton />);

      expect(await screen.findByText('U')).toBeInTheDocument();
    });
  });

  describe('signed in — dropdown menu', () => {
    beforeEach(() => {
      mockAuthValue = signedIn({ full_name: 'John Doe' }, 'john@example.com');
    });

    it('opens the menu with profile, calendars and sign-out items', async () => {
      const user = userEvent.setup();
      render(<UserButton />);

      await user.click(screen.getByRole('button'));

      expect(await screen.findByText('Perfil')).toBeInTheDocument();
      expect(screen.getByText('Mis Calendarios')).toBeInTheDocument();
      expect(screen.getByText('Cerrar Sesión')).toBeInTheDocument();
    });

    it('navigates to the profile page', async () => {
      const user = userEvent.setup();
      render(<UserButton />);

      await user.click(screen.getByRole('button'));
      await user.click(await screen.findByText('Perfil'));

      expect(mockPush).toHaveBeenCalledWith('/profile');
    });

    it('signs out when the sign-out item is clicked', async () => {
      mockSignOut.mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<UserButton />);

      await user.click(screen.getByRole('button'));
      await user.click(await screen.findByText('Cerrar Sesión'));

      expect(mockSignOut).toHaveBeenCalled();
    });
  });
});
