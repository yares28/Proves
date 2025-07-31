import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserButton } from '@/components/auth/user-button';

// Mock Next.js navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock the auth context
const mockSignOut = jest.fn();

jest.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    user: null,
    signOut: mockSignOut,
    loading: false,
  }),
}));

// Mock the AuthDialog component
jest.mock('@/components/auth/auth-dialog', () => ({
  AuthDialog: ({ open, onOpenChange }: any) => (
    open ? (
      <div data-testid="auth-dialog">
        <button onClick={() => onOpenChange(false)}>Close Dialog</button>
      </div>
    ) : null
  ),
}));

describe('UserButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('When user is not authenticated', () => {
    it('should render login button with user icon', () => {
      render(<UserButton />);

      const loginButton = screen.getByRole('button');
      expect(loginButton).toBeInTheDocument();
      expect(loginButton).toHaveClass('h-8', 'w-8', 'rounded-full');
    });

    it('should open auth dialog when login button is clicked', async () => {
      const user = userEvent.setup();
      render(<UserButton />);

      const loginButton = screen.getByRole('button');
      await user.click(loginButton);

      expect(screen.getByTestId('auth-dialog')).toBeInTheDocument();
    });

    it('should close auth dialog when onOpenChange is called', async () => {
      const user = userEvent.setup();
      render(<UserButton />);

      const loginButton = screen.getByRole('button');
      await user.click(loginButton);

      expect(screen.getByTestId('auth-dialog')).toBeInTheDocument();

      const closeButton = screen.getByText('Close Dialog');
      await user.click(closeButton);

      expect(screen.queryByTestId('auth-dialog')).not.toBeInTheDocument();
    });
  });

  describe('When user is authenticated', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: {
        full_name: 'John Doe',
        avatar_url: 'https://example.com/avatar.jpg',
      },
    };

    beforeEach(() => {
      jest.doMock('@/context/auth-context', () => ({
        useAuth: () => ({
          user: mockUser,
          signOut: mockSignOut,
          loading: false,
        }),
      }));
    });

    it('should render user avatar with initials', () => {
      render(<UserButton />);

      const avatarButton = screen.getByRole('button');
      expect(avatarButton).toBeInTheDocument();
      expect(avatarButton).toHaveClass('h-8', 'w-8', 'rounded-full');
    });

    it('should display user initials when no avatar is available', () => {
      const userWithoutAvatar = {
        ...mockUser,
        user_metadata: {
          full_name: 'John Doe',
        },
      };

      jest.doMock('@/context/auth-context', () => ({
        useAuth: () => ({
          user: userWithoutAvatar,
          signOut: mockSignOut,
          loading: false,
        }),
      }));

      render(<UserButton />);

      // Should show initials "JD" for "John Doe"
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should display email initials when no full name is available', () => {
      const userWithoutName = {
        ...mockUser,
        user_metadata: {},
      };

      jest.doMock('@/context/auth-context', () => ({
        useAuth: () => ({
          user: userWithoutName,
          signOut: mockSignOut,
          loading: false,
        }),
      }));

      render(<UserButton />);

      // Should show initials "TE" for "test@example.com"
      expect(screen.getByText('TE')).toBeInTheDocument();
    });

    it('should display fallback "U" when no user info is available', () => {
      const userWithoutInfo = {
        id: 'user-123',
        email: null,
        user_metadata: {},
      };

      jest.doMock('@/context/auth-context', () => ({
        useAuth: () => ({
          user: userWithoutInfo,
          signOut: mockSignOut,
          loading: false,
        }),
      }));

      render(<UserButton />);

      expect(screen.getByText('U')).toBeInTheDocument();
    });

    it('should open dropdown menu when avatar is clicked', async () => {
      const user = userEvent.setup();
      render(<UserButton />);

      const avatarButton = screen.getByRole('button');
      await user.click(avatarButton);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('Perfil')).toBeInTheDocument();
      expect(screen.getByText('Mis Calendarios')).toBeInTheDocument();
      expect(screen.getByText('Cerrar Sesión')).toBeInTheDocument();
    });

    it('should navigate to profile when profile menu item is clicked', async () => {
      const user = userEvent.setup();
      render(<UserButton />);

      const avatarButton = screen.getByRole('button');
      await user.click(avatarButton);

      const profileMenuItem = screen.getByText('Perfil');
      await user.click(profileMenuItem);

      expect(mockPush).toHaveBeenCalledWith('/profile');
    });

    it('should navigate to my-calendars when calendar menu item is clicked', async () => {
      const user = userEvent.setup();
      render(<UserButton />);

      const avatarButton = screen.getByRole('button');
      await user.click(avatarButton);

      const calendarMenuItem = screen.getByText('Mis Calendarios');
      await user.click(calendarMenuItem);

      expect(mockPush).toHaveBeenCalledWith('/my-calendars');
    });

    it('should call signOut when logout menu item is clicked', async () => {
      const user = userEvent.setup();
      mockSignOut.mockResolvedValue(undefined);
      
      render(<UserButton />);

      const avatarButton = screen.getByRole('button');
      await user.click(avatarButton);

      const logoutMenuItem = screen.getByText('Cerrar Sesión');
      await user.click(logoutMenuItem);

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should show loading state during sign out', async () => {
      const user = userEvent.setup();
      mockSignOut.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<UserButton />);

      const avatarButton = screen.getByRole('button');
      await user.click(avatarButton);

      const logoutMenuItem = screen.getByText('Cerrar Sesión');
      await user.click(logoutMenuItem);

      expect(screen.getByText('Cerrando...')).toBeInTheDocument();
      expect(logoutMenuItem).toBeDisabled();
    });

    it('should handle sign out errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockSignOut.mockRejectedValue(new Error('Sign out failed'));
      
      render(<UserButton />);

      const avatarButton = screen.getByRole('button');
      await user.click(avatarButton);

      const logoutMenuItem = screen.getByText('Cerrar Sesión');
      await user.click(logoutMenuItem);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Sign out error:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for unauthenticated state', () => {
      render(<UserButton />);

      const loginButton = screen.getByRole('button');
      expect(loginButton).toBeInTheDocument();
    });

    it('should have proper ARIA attributes for authenticated state', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'John Doe',
        },
      };

      jest.doMock('@/context/auth-context', () => ({
        useAuth: () => ({
          user: mockUser,
          signOut: mockSignOut,
          loading: false,
        }),
      }));

      render(<UserButton />);

      const avatarButton = screen.getByRole('button');
      expect(avatarButton).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<UserButton />);

      const loginButton = screen.getByRole('button');
      
      // Focus the button
      loginButton.focus();
      expect(loginButton).toHaveFocus();

      // Activate with Enter key
      await user.keyboard('{Enter}');
      expect(screen.getByTestId('auth-dialog')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing user metadata gracefully', () => {
      const userWithoutMetadata = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: null,
      };

      jest.doMock('@/context/auth-context', () => ({
        useAuth: () => ({
          user: userWithoutMetadata,
          signOut: mockSignOut,
          loading: false,
        }),
      }));

      render(<UserButton />);

      expect(screen.getByText('TE')).toBeInTheDocument();
    });

    it('should handle empty full name gracefully', () => {
      const userWithEmptyName = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {
          full_name: '',
        },
      };

      jest.doMock('@/context/auth-context', () => ({
        useAuth: () => ({
          user: userWithEmptyName,
          signOut: mockSignOut,
          loading: false,
        }),
      }));

      render(<UserButton />);

      expect(screen.getByText('TE')).toBeInTheDocument();
    });

    it('should handle single word names', () => {
      const userWithSingleName = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'John',
        },
      };

      jest.doMock('@/context/auth-context', () => ({
        useAuth: () => ({
          user: userWithSingleName,
          signOut: mockSignOut,
          loading: false,
        }),
      }));

      render(<UserButton />);

      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('should handle multiple word names', () => {
      const userWithMultipleNames = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'John Michael Doe',
        },
      };

      jest.doMock('@/context/auth-context', () => ({
        useAuth: () => ({
          user: userWithMultipleNames,
          signOut: mockSignOut,
          loading: false,
        }),
      }));

      render(<UserButton />);

      expect(screen.getByText('JMD')).toBeInTheDocument();
    });
  });
}); 