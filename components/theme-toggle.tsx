"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSettings } from "@/context/settings-context"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const { settings, updateSettings } = useSettings()

  // Only render after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    // Determine the next theme based on current settings
    let nextTheme: 'light' | 'dark' | 'system'
    
    if (settings.theme === 'system') {
      // If system, toggle between light and dark
      const currentTheme = theme === 'dark' ? 'dark' : 'light'
      nextTheme = currentTheme === 'dark' ? 'light' : 'dark'
    } else if (settings.theme === 'light') {
      nextTheme = 'dark'
    } else {
      nextTheme = 'light'
    }
    
    // Update both the theme and settings
    setTheme(nextTheme)
    updateSettings({ theme: nextTheme })
  }

  // Get the current effective theme for display
  const getCurrentTheme = () => {
    if (settings.theme === 'system') {
      return theme === 'dark' ? 'dark' : 'light'
    }
    return settings.theme
  }

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button 
        variant="outline" 
        size="icon" 
        className="h-9 w-9"
        disabled
      >
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Cambiar tema</span>
      </Button>
    )
  }

  const currentTheme = getCurrentTheme()

  return (
    <Button 
      variant="outline" 
      size="icon" 
      className="h-9 w-9"
      onClick={toggleTheme}
      aria-label="Cambiar tema"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Cambiar tema</span>
    </Button>
  )
}
