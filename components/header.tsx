"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserButton } from "@/components/auth/user-button"
import { useAuth } from "@/context/auth-context"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navigateToMyCalendars = () => {
    // Try different variations of the route to see which one works
    try {
      // Option 1: Try the JS version
      router.push("/my-calendars/page")
    } catch (e) {
      console.error("Navigation failed:", e)
      // Fallback
      window.location.href = "/my-calendars"
    }
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80"
          : "bg-transparent"
      }`}
    >
      <div className="container flex h-20 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
              <path d="M12 11h4" />
              <path d="M12 16h4" />
              <path d="M8 11h.01" />
              <path d="M8 16h.01" />
            </svg>
            <span className="text-lg font-bold tracking-tight">UPV Exam Calendar</span>
          </Link>
        </div>

        <nav className="hidden md:flex md:items-center md:gap-8">
          <Link href="/" className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground">
            Exams
          </Link>
          
          {/* Use a simple anchor tag for My Calendars */}
          {user && (
            <a 
              href="/saved-calendars" 
              className="flex items-center gap-1.5 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              <Calendar className="h-4 w-4" />
              My Calendars
            </a>
          )}
          
          <Link href="#" className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground">
            Features
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <UserButton />

          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4">
                <Link href="/" className="text-lg font-medium" onClick={() => setIsMenuOpen(false)}>
                  Exams
                </Link>
                
                {/* Use a simple anchor tag in mobile menu too */}
                {user && (
                  <a 
                    href="/saved-calendars" 
                    className="flex items-center gap-2 text-lg font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Calendar className="h-5 w-5" />
                    My Calendars
                  </a>
                )}
                
                <Link href="#" className="text-lg font-medium" onClick={() => setIsMenuOpen(false)}>
                  Features
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
