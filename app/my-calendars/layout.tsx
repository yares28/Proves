"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function MyCalendarsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-8 px-4">
        {children}
      </main>
      <Footer />
    </div>
  )
} 