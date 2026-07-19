import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '@/components/auth/register-form';

const mockSignUp = jest.fn();
jest.mock('@/context/auth-context', () => ({
  useAuth: () => ({ signUp: mockSignUp }),
}));

jest.mock('@/components/auth/enhanced-google-auth', () => ({
  EnhancedGoogleAuth: () => <div data-testid="google-auth" />,
}));

describe('RegisterForm', () => {
  const onSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setup = () => {
    const user = userEvent.setup();
    const { container } = render(<RegisterForm onSuccess={onSuccess} />);
    // Both password fields are wrapped in a div (for the show/hide button), so
    // select them by type and order rather than by label.
    const [passwordInput, confirmInput] = Array.from(
      container.querySelectorAll('input[type="password"]')
    ) as HTMLInputElement[];
    return { user, passwordInput, confirmInput };
  };

  const fillValid = async (user: ReturnType<typeof userEvent.setup>, pw: HTMLInputElement, confirm: HTMLInputElement) => {
    await user.type(screen.getByLabelText('Nombre Completo'), 'Test User');
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(pw, 'password123');
    await user.type(confirm, 'password123');
  };

  it('renders all fields, the submit button and the Google option', () => {
    const { passwordInput, confirmInput } = setup();

    expect(screen.getByLabelText('Nombre Completo')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(confirmInput).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear Cuenta' })).toBeInTheDocument();
    expect(screen.getByTestId('google-auth')).toBeInTheDocument();
  });

  it('shows a validation error and does not submit when the form is empty', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: 'Crear Cuenta' }));

    expect(
      await screen.findByText('El nombre completo debe tener al menos 2 caracteres')
    ).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('rejects mismatched passwords', async () => {
    const { user, passwordInput, confirmInput } = setup();

    await user.type(screen.getByLabelText('Nombre Completo'), 'Test User');
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmInput, 'different123');
    await user.click(screen.getByRole('button', { name: 'Crear Cuenta' }));

    expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('calls signUp with email, password and full name', async () => {
    mockSignUp.mockResolvedValue({ error: null });
    const { user, passwordInput, confirmInput } = setup();

    await fillValid(user, passwordInput, confirmInput);
    await user.click(screen.getByRole('button', { name: 'Crear Cuenta' }));

    await waitFor(() =>
      expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User')
    );
  });

  it('shows a success message once the account is created', async () => {
    mockSignUp.mockResolvedValue({ error: null });
    const { user, passwordInput, confirmInput } = setup();

    await fillValid(user, passwordInput, confirmInput);
    await user.click(screen.getByRole('button', { name: 'Crear Cuenta' }));

    expect(await screen.findByText(/Cuenta creada exitosamente/i)).toBeInTheDocument();
  });

  it('shows a translated error when the email is already registered', async () => {
    mockSignUp.mockResolvedValue({ error: { message: 'User already registered' } });
    const { user, passwordInput, confirmInput } = setup();

    await fillValid(user, passwordInput, confirmInput);
    await user.click(screen.getByRole('button', { name: 'Crear Cuenta' }));

    expect(await screen.findByText('El usuario ya está registrado')).toBeInTheDocument();
  });
});
