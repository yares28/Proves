import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthDialog } from '@/components/auth/auth-dialog';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), prefetch: jest.fn(), refresh: jest.fn() }),
}));

// The forms have their own tests; stub them so this suite covers only the dialog.
jest.mock('@/components/auth/login-form', () => ({
  LoginForm: () => <div data-testid="login-form" />,
}));
jest.mock('@/components/auth/register-form', () => ({
  RegisterForm: () => <div data-testid="register-form" />,
}));

describe('AuthDialog', () => {
  const onOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the login view when open', () => {
    render(<AuthDialog open onOpenChange={onOpenChange} />);

    expect(screen.getByText('Bienvenido de nuevo')).toBeInTheDocument();
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Iniciar Sesión' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Registrarse' })).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    render(<AuthDialog open={false} onOpenChange={onOpenChange} />);

    expect(screen.queryByText('Bienvenido de nuevo')).not.toBeInTheDocument();
    expect(screen.queryByTestId('login-form')).not.toBeInTheDocument();
  });

  it('navigates to my-calendars and closes when the shortcut is clicked', async () => {
    const user = userEvent.setup();
    render(<AuthDialog open onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole('button', { name: /Mis Calendarios/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(mockPush).toHaveBeenCalledWith('/my-calendars');
  });

  it('switches to the register view and disables the calendars shortcut', async () => {
    const user = userEvent.setup();
    render(<AuthDialog open onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole('tab', { name: 'Registrarse' }));

    expect(await screen.findByText('Crear una cuenta')).toBeInTheDocument();
    expect(screen.getByTestId('register-form')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mis Calendarios/i })).toBeDisabled();
  });
});
