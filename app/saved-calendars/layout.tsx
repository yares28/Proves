import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/context/auth-context"

export default function SavedCalendarsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider defaultTheme="light" storageKey="upv-theme">
      <AuthProvider>
        <div className="flex min-h-screen flex-col bg-background">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <Toaster />
        </div>
      </AuthProvider>
    </ThemeProvider>
  )
} 