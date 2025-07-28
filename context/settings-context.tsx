"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useTheme } from "next-themes"

interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  language: 'es' | 'en'
  notifications: boolean
  examReminders: {
    oneHour: boolean
    oneDay: boolean
    oneWeek: boolean
  }
  viewMode: 'calendar' | 'list'
}

interface SettingsContextProps {
  settings: AppSettings
  updateSettings: (newSettings: Partial<AppSettings>) => void
  resetSettings: () => void
}

const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'es',
  notifications: true,
  examReminders: {
    oneHour: true,
    oneDay: true,
    oneWeek: false
  },
  viewMode: 'calendar'
}

const SettingsContext = createContext<SettingsContextProps | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme()
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('app-settings')
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings)
          setSettings(prev => ({ ...prev, ...parsed }))
        } catch (error) {
          console.error('Error parsing saved settings:', error)
        }
      }
    }
  }, [])

  // Apply theme when settings change
  useEffect(() => {
    setTheme(settings.theme)
  }, [settings.theme, setTheme])

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-settings', JSON.stringify(updatedSettings))
    }
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('app-settings')
    }
  }

  const value = {
    settings,
    updateSettings,
    resetSettings
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
} 