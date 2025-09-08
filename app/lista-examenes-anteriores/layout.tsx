"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function ListaExamenesAnterioresLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}





