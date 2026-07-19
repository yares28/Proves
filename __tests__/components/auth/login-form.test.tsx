import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/auth/login-form';

const mockSignIn = jest.fn();
jest.mock('@/context/auth-context', () => ({
  useAuth: () => ({ signIn: mockSignIn }),
}));

// The Google button and the perf monitor are exercised by their own tests.
jest.mock('@/components/auth/enhanced-google-auth', () => ({
  EnhancedGoogleAuth: () => <div data-testid="google-auth" />,
}));
jest.mock('@/components/auth-performance-monitor', () => ({
  AuthPerformanceMonitor: () => null,
}));

describe('LoginForm', () => {
  const onSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setup = () => {
    const user = userEvent.setup();
    const { container } = render(<LoginForm onSuccess={onSuccess} />);
    // The password Input is wrapped in a div (for the show/hide button), so its
    // label isn't directly associated — select it by type instead.
    const passwordInput = container.querySelector('input[type="password"]') as HTMLInputElement;
    return { user, passwordInput };
  };

  it('renders email, password and submit controls', () => {
    const { passwordInput } = setup();

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Iniciar Sesión' })).toBeInTheDocument();
    expect(screen.getByTestId('google-auth')).toBeInTheDocument();
  });

  it('shows validation errors and does not sign in when the form is empty', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));

    expect(await screen.findByText('Por favor ingresa un email válido')).toBeInTheDocument();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('calls signIn with the entered credentials', async () => {
    mockSignIn.mockResolvedValue({ error: null });
    const { user, passwordInput } = setup();

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));

    await waitFor(() =>
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    );
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it('shows a translated error when the credentials are rejected', async () => {
    mockSignIn.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
    const { user, passwordInput } = setup();

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));

    expect(
      await screen.findByText('Credenciales de inicio de sesión incorrectas')
    ).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
