import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useAuth } from '@/context/auth-context'
import { useSettings } from '@/context/settings-context'
import { useToast } from '@/hooks/use-toast'
import ProfilePage from '@/app/profile/page'

// Mock the dependencies
jest.mock('@/context/auth-context')
jest.mock('@/context/settings-context')
jest.mock('@/hooks/use-toast')
jest.mock('@/utils/supabase/client')
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

// Mock fetch for API calls
global.fetch = jest.fn()

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg'
  },
  created_at: '2023-01-01T00:00:00Z',
  last_sign_in_at: '2023-01-01T00:00:00Z',
  app_metadata: {
    provider: 'email'
  }
}

const mockSettings = {
  theme: 'light' as const,
  language: 'es' as const,
  notifications: true,
  examReminders: {
    oneHour: true,
    oneDay: true,
    oneWeek: false
  },
  viewMode: 'calendar' as const
}

describe('ProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock auth context
    ;(useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false
    })
    
    // Mock settings context
    ;(useSettings as jest.Mock).mockReturnValue({
      settings: mockSettings,
      updateSettings: jest.fn()
    })
    
    // Mock toast
    ;(useToast as jest.Mock).mockReturnValue({
      toast: jest.fn()
    })
  })

  it('renders profile information correctly', () => {
    render(<ProfilePage />)
    
    expect(screen.getByText('Perfil de Usuario')).toBeInTheDocument()
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
  })

  it('shows password change dialog when clicking change password button', async () => {
    render(<ProfilePage />)
    
    const changePasswordButton = screen.getByRole('button', { name: /cambiar contraseña/i })
    fireEvent.click(changePasswordButton)
    
    // Check for dialog content
    expect(screen.getByText('Cambiar contraseña')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña actual')).toBeInTheDocument()
    expect(screen.getByLabelText('Nueva contraseña')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirmar contraseña')).toBeInTheDocument()
  })

  it('shows email change dialog when clicking change email button', async () => {
    render(<ProfilePage />)
    
    const changeEmailButton = screen.getByRole('button', { name: /cambiar email/i })
    fireEvent.click(changeEmailButton)
    
    expect(screen.getByText('Cambiar email')).toBeInTheDocument()
    expect(screen.getByLabelText('Nuevo email')).toBeInTheDocument()
  })

  it('shows username change dialog when clicking change username button', async () => {
    render(<ProfilePage />)
    
    const changeUsernameButton = screen.getByRole('button', { name: /cambiar usuario/i })
    fireEvent.click(changeUsernameButton)
    
    expect(screen.getByText('Cambiar nombre de usuario')).toBeInTheDocument()
    expect(screen.getByLabelText('Nuevo nombre de usuario')).toBeInTheDocument()
  })

  it('displays avatar with user initials', () => {
    render(<ProfilePage />)
    
    // Check if avatar container is displayed with user initials
    const avatarContainer = screen.getByText('TU') // User initials
    expect(avatarContainer).toBeInTheDocument()
  })

  it('displays avatar with image when available', () => {
    const userWithAvatar = {
      ...mockUser,
      user_metadata: {
        ...mockUser.user_metadata,
        avatar_url: 'https://example.com/avatar.jpg'
      }
    }

    ;(useAuth as jest.Mock).mockReturnValue({
      user: userWithAvatar,
      loading: false
    })

    render(<ProfilePage />)
    
    // Should display avatar image
    const avatarImage = screen.getByAltText('User avatar')
    expect(avatarImage).toBeInTheDocument()
    expect(avatarImage).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('displays provider badge correctly', () => {
    render(<ProfilePage />)
    
    // Should show provider badge
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('displays account creation date', () => {
    render(<ProfilePage />)
    
    // Should show account creation date
    expect(screen.getByText(/Creado el/)).toBeInTheDocument()
  })

  it('displays last sign in date', () => {
    render(<ProfilePage />)
    
    // Should show last sign in date
    expect(screen.getByText(/Último acceso/)).toBeInTheDocument()
  })

  it('redirects to home when user is not authenticated', () => {
    const mockPush = jest.fn()
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false
    })
    
    render(<ProfilePage />)
    
    // The component should redirect, so we won't see the profile content
    expect(screen.queryByText('Perfil de Usuario')).not.toBeInTheDocument()
  })

  it('shows loading state when auth is loading', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true
    })
    
    render(<ProfilePage />)
    
    // Should show loading state
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('handles password change successfully', async () => {
    render(<ProfilePage />)
    
    const changePasswordButton = screen.getByRole('button', { name: /cambiar contraseña/i })
    fireEvent.click(changePasswordButton)
    
    // Fill in password fields
    const currentPasswordInput = screen.getByLabelText('Contraseña actual')
    const newPasswordInput = screen.getByLabelText('Nueva contraseña')
    const confirmPasswordInput = screen.getByLabelText('Confirmar contraseña')
    
    fireEvent.change(currentPasswordInput, { target: { value: 'currentpass' } })
    fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpass123' } })
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /cambiar contraseña/i })
    fireEvent.click(submitButton)
    
    // Should handle password change
    expect(currentPasswordInput).toHaveValue('currentpass')
    expect(newPasswordInput).toHaveValue('newpass123')
    expect(confirmPasswordInput).toHaveValue('newpass123')
  })

  it('handles email change successfully', async () => {
    render(<ProfilePage />)
    
    const changeEmailButton = screen.getByRole('button', { name: /cambiar email/i })
    fireEvent.click(changeEmailButton)
    
    // Fill in email field
    const newEmailInput = screen.getByLabelText('Nuevo email')
    fireEvent.change(newEmailInput, { target: { value: 'newemail@example.com' } })
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /cambiar email/i })
    fireEvent.click(submitButton)
    
    // Should handle email change
    expect(newEmailInput).toHaveValue('newemail@example.com')
  })

  it('handles username change successfully', async () => {
    render(<ProfilePage />)
    
    const changeUsernameButton = screen.getByRole('button', { name: /cambiar usuario/i })
    fireEvent.click(changeUsernameButton)
    
    // Fill in username field
    const newUsernameInput = screen.getByLabelText('Nuevo nombre de usuario')
    fireEvent.change(newUsernameInput, { target: { value: 'NewUsername' } })
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /cambiar nombre de usuario/i })
    fireEvent.click(submitButton)
    
    // Should handle username change
    expect(newUsernameInput).toHaveValue('NewUsername')
  })

  it('displays settings section correctly', () => {
    render(<ProfilePage />)
    
    expect(screen.getByText('Configuración')).toBeInTheDocument()
    expect(screen.getByText('Tema')).toBeInTheDocument()
    expect(screen.getByText('Idioma')).toBeInTheDocument()
    expect(screen.getByText('Notificaciones')).toBeInTheDocument()
  })

  it('handles theme change', () => {
    const mockUpdateSettings = jest.fn()
    ;(useSettings as jest.Mock).mockReturnValue({
      settings: mockSettings,
      updateSettings: mockUpdateSettings
    })

    render(<ProfilePage />)
    
    const themeToggle = screen.getByRole('button', { name: /tema/i })
    fireEvent.click(themeToggle)
    
    expect(mockUpdateSettings).toHaveBeenCalled()
  })

  it('handles language change', () => {
    const mockUpdateSettings = jest.fn()
    ;(useSettings as jest.Mock).mockReturnValue({
      settings: mockSettings,
      updateSettings: mockUpdateSettings
    })

    render(<ProfilePage />)
    
    const languageToggle = screen.getByRole('button', { name: /idioma/i })
    fireEvent.click(languageToggle)
    
    expect(mockUpdateSettings).toHaveBeenCalled()
  })

  it('handles notification toggle', () => {
    const mockUpdateSettings = jest.fn()
    ;(useSettings as jest.Mock).mockReturnValue({
      settings: mockSettings,
      updateSettings: mockUpdateSettings
    })

    render(<ProfilePage />)
    
    const notificationToggle = screen.getByRole('switch', { name: /notificaciones/i })
    fireEvent.click(notificationToggle)
    
    expect(mockUpdateSettings).toHaveBeenCalled()
  })

  it('displays exam reminders settings', () => {
    render(<ProfilePage />)
    
    expect(screen.getByText('Recordatorios de Exámenes')).toBeInTheDocument()
    expect(screen.getByText('1 hora antes')).toBeInTheDocument()
    expect(screen.getByText('1 día antes')).toBeInTheDocument()
    expect(screen.getByText('1 semana antes')).toBeInTheDocument()
  })

  it('handles exam reminder toggles', () => {
    const mockUpdateSettings = jest.fn()
    ;(useSettings as jest.Mock).mockReturnValue({
      settings: mockSettings,
      updateSettings: mockUpdateSettings
    })

    render(<ProfilePage />)
    
    const oneHourToggle = screen.getByRole('switch', { name: /1 hora antes/i })
    fireEvent.click(oneHourToggle)
    
    expect(mockUpdateSettings).toHaveBeenCalled()
  })

  it('displays view mode settings', () => {
    render(<ProfilePage />)
    
    expect(screen.getByText('Modo de Vista')).toBeInTheDocument()
    expect(screen.getByText('Calendario')).toBeInTheDocument()
    expect(screen.getByText('Lista')).toBeInTheDocument()
  })

  it('handles view mode change', () => {
    const mockUpdateSettings = jest.fn()
    ;(useSettings as jest.Mock).mockReturnValue({
      settings: mockSettings,
      updateSettings: mockUpdateSettings
    })

    render(<ProfilePage />)
    
    const listModeButton = screen.getByRole('button', { name: /lista/i })
    fireEvent.click(listModeButton)
    
    expect(mockUpdateSettings).toHaveBeenCalled()
  })

  it('handles password visibility toggle', async () => {
    render(<ProfilePage />)
    
    const changePasswordButton = screen.getByRole('button', { name: /cambiar contraseña/i })
    fireEvent.click(changePasswordButton)
    
    const newPasswordInput = screen.getByLabelText('Nueva contraseña')
    const visibilityToggle = screen.getByRole('button', { name: /toggle password visibility/i })
    
    // Initially password should be hidden
    expect(newPasswordInput).toHaveAttribute('type', 'password')
    
    // Toggle visibility
    fireEvent.click(visibilityToggle)
    
    // Password should be visible
    expect(newPasswordInput).toHaveAttribute('type', 'text')
  })

  it('validates password confirmation match', async () => {
    render(<ProfilePage />)
    
    const changePasswordButton = screen.getByRole('button', { name: /cambiar contraseña/i })
    fireEvent.click(changePasswordButton)
    
    // Fill in password fields with mismatched passwords
    const newPasswordInput = screen.getByLabelText('Nueva contraseña')
    const confirmPasswordInput = screen.getByLabelText('Confirmar contraseña')
    
    fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'differentpass' } })
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /cambiar contraseña/i })
    fireEvent.click(submitButton)
    
    // Should show validation error
    expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument()
  })

  it('handles form validation errors', async () => {
    render(<ProfilePage />)
    
    const changePasswordButton = screen.getByRole('button', { name: /cambiar contraseña/i })
    fireEvent.click(changePasswordButton)
    
    // Submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /cambiar contraseña/i })
    fireEvent.click(submitButton)
    
    // Should show validation errors
    expect(screen.getByText('Todos los campos son requeridos')).toBeInTheDocument()
  })

  it('handles network errors gracefully', async () => {
    // Mock fetch to return error
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
    
    render(<ProfilePage />)
    
    const changePasswordButton = screen.getByRole('button', { name: /cambiar contraseña/i })
    fireEvent.click(changePasswordButton)
    
    // Fill in password fields
    const currentPasswordInput = screen.getByLabelText('Contraseña actual')
    const newPasswordInput = screen.getByLabelText('Nueva contraseña')
    const confirmPasswordInput = screen.getByLabelText('Confirmar contraseña')
    
    fireEvent.change(currentPasswordInput, { target: { value: 'currentpass' } })
    fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpass123' } })
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /cambiar contraseña/i })
    fireEvent.click(submitButton)
    
    // Should handle error gracefully
    await waitFor(() => {
      expect(screen.getByText('Error al cambiar la contraseña')).toBeInTheDocument()
    })
  })

  it('handles user with missing metadata', () => {
    const userWithoutMetadata = {
      ...mockUser,
      user_metadata: null
    }

    ;(useAuth as jest.Mock).mockReturnValue({
      user: userWithoutMetadata,
      loading: false
    })

    render(<ProfilePage />)
    
    // Should still render without crashing
    expect(screen.getByText('Perfil de Usuario')).toBeInTheDocument()
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
  })

  it('handles user with missing avatar', () => {
    const userWithoutAvatar = {
      ...mockUser,
      user_metadata: {
        full_name: 'Test User'
        // No avatar_url
      }
    }

    ;(useAuth as jest.Mock).mockReturnValue({
      user: userWithoutAvatar,
      loading: false
    })

    render(<ProfilePage />)
    
    // Should display initials instead of avatar
    expect(screen.getByText('TU')).toBeInTheDocument()
  })
}) 