import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SettingsProvider, useSettings } from '@/context/settings-context'
import { ThemeProvider } from 'next-themes'

// Mock next-themes
jest.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useTheme: () => ({
    setTheme: jest.fn(),
  }),
}))

// Test component to access settings
function TestComponent() {
  const { settings, updateSettings } = useSettings()
  
  return (
    <div>
      <div data-testid="view-mode">{settings.viewMode}</div>
      <button 
        data-testid="toggle-view" 
        onClick={() => updateSettings({ viewMode: settings.viewMode === 'calendar' ? 'list' : 'calendar' })}
      >
        Toggle View
      </button>
    </div>
  )
}

describe('SettingsContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  it('should provide default settings', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      </ThemeProvider>
    )

    expect(screen.getByTestId('view-mode')).toHaveTextContent('calendar')
  })

  it('should update viewMode when settings are changed', async () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      </ThemeProvider>
    )

    expect(screen.getByTestId('view-mode')).toHaveTextContent('calendar')
    
    fireEvent.click(screen.getByTestId('toggle-view'))
    
    await waitFor(() => {
      expect(screen.getByTestId('view-mode')).toHaveTextContent('list')
    })
  })

  it('should update viewMode to calendar when toggled from list', async () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      </ThemeProvider>
    )

    // First toggle to list
    fireEvent.click(screen.getByTestId('toggle-view'))
    await waitFor(() => {
      expect(screen.getByTestId('view-mode')).toHaveTextContent('list')
    })
    
    // Then toggle back to calendar
    fireEvent.click(screen.getByTestId('toggle-view'))
    await waitFor(() => {
      expect(screen.getByTestId('view-mode')).toHaveTextContent('calendar')
    })
  })
}) 