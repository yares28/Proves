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
import { useTranslations } from "@/hooks/use-translations"
import { LOCALE_LABELS, type Locale } from "@/lib/i18n"

/** Valencià is a co-official language at UPV, not a translation afterthought. */
const LOCALE_MENU: Array<{ locale: Locale; flag: string; label: string }> = [
  { locale: "es", flag: "🇪🇸", label: LOCALE_LABELS.es },
  { locale: "va", flag: "🎗️", label: LOCALE_LABELS.va },
  { locale: "en", flag: "🇬🇧", label: LOCALE_LABELS.en },
]

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const { settings, updateSettings } = useSettings()
  const t = useTranslations()

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

  const handleLanguageChange = (newLanguage: Locale) => {
    updateSettings({ language: newLanguage })
  }

  // Determine which logo to use based on theme
  const getHeaderLogo = () => {
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
            src={getHeaderLogo()} 
            alt="UPV Calendario de Exámenes" 
            width={140} 
            height={40}
            className="h-10 w-auto"
            priority
          />
        </Link>

        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t("header.changeLanguage")}>
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {LOCALE_MENU.map(({ locale, flag, label }) => (
                <DropdownMenuItem
                  key={locale}
                  onClick={() => handleLanguageChange(locale)}
                  className={settings.language === locale ? "bg-accent" : ""}
                >
                  {flag} {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={t("header.changeTheme")}>
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
              <Button variant="outline" size="icon" className="hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">{t("header.toggleMenu")}</span>
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
