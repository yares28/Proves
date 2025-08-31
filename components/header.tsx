"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, Globe, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { UserButton } from "@/components/auth/user-button"
import { useSettings } from "@/context/settings-context"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const { settings, updateSettings } = useSettings()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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

  const handleLanguageChange = (newLanguage: 'es' | 'en') => {
    updateSettings({ language: newLanguage })
  }

  // Determine which logoY icon to use based on theme
  const getLogoYIcon = () => {
    if (!mounted) return "/logoYdark.png" // Default fallback during SSR
    const currentTheme = settings.theme === 'system' ? theme : settings.theme
    return currentTheme === "light" ? "/logoYWhite.png" : "/logoYdark.png"
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-200 ${
        isScrolled ? "shadow-sm" : ""
      }`}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap">
          <Image 
            src={getLogoYIcon()} 
            alt="UPV Icon" 
            width={56} 
            height={56}
            className="h-14 w-14"
            priority
            key={mounted ? 'mounted' : 'unmounted'}
          />

        </Link>

        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Cambiar idioma">
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => handleLanguageChange("es")}
                className={settings.language === "es" ? "bg-accent" : ""}
              >
                🇪🇸 Español
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleLanguageChange("en")}
                className={settings.language === "en" ? "bg-accent" : ""}
              >
                🇺🇸 English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Cambiar tema">
            {!mounted ? (
              <Sun className="h-4 w-4" />
            ) : (settings.theme === 'system' ? theme : settings.theme) === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          <UserButton />

          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Alternar menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4">
                {/* Navigation items removed */}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
