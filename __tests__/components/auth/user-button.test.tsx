import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserButton } from '@/components/auth/user-button';

// Mock the auth context
const mockSignOut = jest.fn();

jest.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    user: null,
    signOut: mockSignOut,
    loading: false,
  }),
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

// Mock AuthDialog component
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
    mockSignOut.mockResolvedValue({ error: null });
  });

  describe('When user is not authenticated', () => {
    it('should render sign in button', () => {
      render(<UserButton />);

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });

    it('should open auth dialog when sign in button is clicked', async () => {
      const user = userEvent.setup();
      render(<UserButton />);

      const signInButton = screen.getByRole('button');
      await user.click(signInButton);

      expect(screen.getByTestId('auth-dialog')).toBeInTheDocument();
    });

    it('should close auth dialog when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<UserButton />);

      const signInButton = screen.getByRole('button');
      await user.click(signInButton);

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

    it('should render user avatar with initials when no avatar URL', () => {
      const userWithoutAvatar = {
        ...mockUser,
        user_metadata: { full_name: 'John Doe' },
      };

      jest.doMock('@/context/auth-context', () => ({
        useAuth: () => ({
          user: userWithoutAvatar,
          signOut: mockSignOut,
          loading: false,
        }),
      }));

      render(<UserButton />);

      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should render user avatar with email initials when no full name', () => {
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

      expect(screen.getByText('TE')).toBeInTheDocument();
    });

    it('should render user avatar with single letter when only one name', () => {
      const userWithSingleName = {
        ...mockUser,
        user_metadata: { full_name: 'John' },
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

    it('should render user avatar with avatar URL when available', () => {
      const userWithAvatar = {
        ...mockUser,
        user_metadata: {
          full_name: 'John Doe',
          avatar_url: 'https://example.com/avatar.jpg',
        },
      };

      jest.doMock('@/context/auth-context', () => ({
        useAuth: () => ({
          user: userWithAvatar,
          signOut: mockSignOut,
          loading: false,
        }),
      }));

      render(<UserButton />);

      const avatarImage = screen.getByAltText('User avatar');
      expect(avatarImage).toBeInTheDocument();
      expect(avatarImage).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('should open dropdown menu when avatar is clicked', async () => {
      const user = userEvent.setup();
      render(<UserButton />);

      const avatarButton = screen.getByRole('button');
      await user.click(avatarButton);

      expect(screen.getByText('Mi Perfil')).toBeInTheDocument();
      expect(screen.getByText('Mis Calendarios')).toBeInTheDocument();
      expect(screen.getByText('Cerrar Sesión')).toBeInTheDocument();
    });

    it('should call signOut when logout is clicked', async () => {
      const user = userEvent.setup();
      render(<UserButton />);

      const avatarButton = screen.getByRole('button');
      await user.click(avatarButton);

      const logoutButton = screen.getByText('Cerrar Sesión');
      await user.click(logoutButton);

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should show loading state during sign out', async () => {
      mockSignOut.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const user = userEvent.setup();
      render(<UserButton />);

      const avatarButton = screen.getByRole('button');
      await user.click(avatarButton);

      const logoutButton = screen.getByText('Cerrar Sesión');
      await user.click(logoutButton);

      expect(screen.getByText('Cerrando sesión...')).toBeInTheDocument();
    });

    it('should handle sign out errors gracefully', async () => {
      mockSignOut.mockResolvedValue({ error: { message: 'Sign out failed' } });

      const user = userEvent.setup();
      render(<UserButton />);

      const avatarButton = screen.getByRole('button');
      await user.click(avatarButton);

      const logoutButton = screen.getByText('Cerrar Sesión');
      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });

    it('should navigate to profile page when profile is clicked', async () => {
      const mockPush = jest.fn();
      jest.doMock('next/navigation', () => ({
        useRouter: () => ({
          push: mockPush,
        }),
      }));

      const user = userEvent.setup();
      render(<UserButton />);

      const avatarButton = screen.getByRole('button');
      await user.click(avatarButton);

      const profileButton = screen.getByText('Mi Perfil');
      await user.click(profileButton);

      expect(mockPush).toHaveBeenCalledWith('/profile');
    });

    it('should navigate to calendars page when calendars is clicked', async () => {
      const mockPush = jest.fn();
      jest.doMock('next/navigation', () => ({
        useRouter: () => ({
          push: mockPush,
        }),
      }));

      const user = userEvent.setup();
      render(<UserButton />);

      const avatarButton = screen.getByRole('button');
      await user.click(avatarButton);

      const calendarsButton = screen.getByText('Mis Calendarios');
      await user.click(calendarsButton);

      expect(mockPush).toHaveBeenCalledWith('/my-calendars');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for unauthenticated state', () => {
      render(<UserButton />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Sign in');
    });

    it('should have proper ARIA labels for authenticated state', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'John Doe' },
      };

      jest.doMock('@/context/auth-context', () => ({
        useAuth: () => ({
          user: mockUser,
          signOut: mockSignOut,
          loading: false,
        }),
      }));

      render(<UserButton />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'User menu');
    });

    it('should have proper keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<UserButton />);

      const button = screen.getByRole('button');
      
      // Focus the button
      button.focus();
      expect(button).toHaveFocus();

      // Open dropdown with Enter key
      await user.keyboard('{Enter}');
      expect(screen.getByText('Mi Perfil')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should handle loading state correctly', () => {
      jest.doMock('@/context/auth-context', () => ({
        useAuth: () => ({
          user: null,
          signOut: mockSignOut,
          loading: true,
        }),
      }));

      render(<UserButton />);

      // Should still render the button even when loading
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle sign out errors gracefully', async () => {
      mockSignOut.mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();
      render(<UserButton />);

      const avatarButton = screen.getByRole('button');
      await user.click(avatarButton);

      const logoutButton = screen.getByText('Cerrar Sesión');
      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });

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

      // Should render with email initials
      expect(screen.getByText('TE')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with empty email', () => {
      const userWithEmptyEmail = {
        id: 'user-123',
        email: '',
        user_metadata: {},
      };

      jest.doMock('@/context/auth-context', () => ({
        useAuth: () => ({
          user: userWithEmptyEmail,
          signOut: mockSignOut,
          loading: false,
        }),
      }));

      render(<UserButton />);

      // Should render with fallback initials
      expect(screen.getByText('U')).toBeInTheDocument();
    });

    it('should handle user with special characters in name', () => {
      const userWithSpecialChars = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'José María' },
      };

      jest.doMock('@/context/auth-context', () => ({
        useAuth: () => ({
          user: userWithSpecialChars,
          signOut: mockSignOut,
          loading: false,
        }),
      }));

      render(<UserButton />);

      // Should render with proper initials
      expect(screen.getByText('JM')).toBeInTheDocument();
    });

    it('should handle user with multiple spaces in name', () => {
      const userWithMultipleSpaces = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'John   Doe' },
      };

      jest.doMock('@/context/auth-context', () => ({
        useAuth: () => ({
          user: userWithMultipleSpaces,
          signOut: mockSignOut,
          loading: false,
        }),
      }));

      render(<UserButton />);

      // Should render with proper initials
      expect(screen.getByText('JD')).toBeInTheDocument();
    });
  });
}); 