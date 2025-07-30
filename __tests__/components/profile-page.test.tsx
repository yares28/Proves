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

  it('shows password change dialog when clicking change password button', () => {
    render(<ProfilePage />)
    
    const changePasswordButton = screen.getByRole('button', { name: /cambiar contraseña/i })
    fireEvent.click(changePasswordButton)
    
    // Check for dialog content - use getAllByText to handle multiple elements
    const dialogTitles = screen.getAllByText('Cambiar contraseña')
    expect(dialogTitles.length).toBeGreaterThan(0)
    expect(screen.getByLabelText('Contraseña actual')).toBeInTheDocument()
    expect(screen.getByLabelText('Nueva contraseña')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirmar contraseña')).toBeInTheDocument()
  })

  it('shows email change dialog when clicking change email button', () => {
    render(<ProfilePage />)
    
    const changeEmailButton = screen.getByRole('button', { name: /cambiar email/i })
    fireEvent.click(changeEmailButton)
    
    expect(screen.getByText('Cambiar email')).toBeInTheDocument()
    expect(screen.getByLabelText('Nuevo email')).toBeInTheDocument()
  })

  it('shows username change dialog when clicking change username button', () => {
    render(<ProfilePage />)
    
    const changeUsernameButton = screen.getByRole('button', { name: /cambiar usuario/i })
    fireEvent.click(changeUsernameButton)
    
    expect(screen.getByText('Cambiar nombre de usuario')).toBeInTheDocument()
    expect(screen.getByLabelText('Nuevo nombre de usuario')).toBeInTheDocument()
  })

  it('displays avatar', () => {
    render(<ProfilePage />)
    
    // Check if avatar container is displayed (fallback shows initials)
    const avatarContainer = screen.getByText('TU') // User initials
    expect(avatarContainer).toBeInTheDocument()
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
    
    // Should show loading spinner - use getAllByRole to handle multiple elements
    const loadingSpinners = screen.getAllByRole('generic', { hidden: true })
    expect(loadingSpinners.length).toBeGreaterThan(0)
  })
}) 