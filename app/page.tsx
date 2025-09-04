"use client"

import { Suspense, useState } from "react"
import { CalendarDisplay } from "@/components/calendar-display"
import { FilterSidebar } from "@/components/filter-sidebar"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { StatisticsSection } from "@/components/statistics-section"
import { FAQSection } from "@/components/faq-section"
import { FilterConnection } from "@/components/filter-connection"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { useAuth } from "@/context/auth-context"
import { AuthRequiredCheck } from "@/components/auth-required-check"
import { AuthStatusIndicator } from "@/components/auth-status-indicator"

export default function Home() {
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const { user } = useAuth()
  
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <div className="container mx-auto px-4">
        <AuthStatusIndicator />
      </div>
      <main className="flex-1">
        <HeroSection />
        <Suspense fallback={null}>
          <AuthRequiredCheck />
        </Suspense>
        
        <section className="container mx-auto px-4 py-16 md:px-6 md:py-24 lg:py-32">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Encuentra tus <span className="text-primary">Exámenes</span>
          </h2>
          <FilterConnection />
        </section>
        
        {/* Statistics Section */}
        <StatisticsSection />
        
        {/* FAQ Section */}
        <FAQSection />
      </main>
      <Footer />
      
      {/* Authentication Dialog */}
      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </div>
  )
}
