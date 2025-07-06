"use client"

import { AuthStatusChecker } from "@/components/auth-status-checker"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function AuthStatusPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Authentication Status</h1>
            <p className="text-muted-foreground">
              Verify your login status and diagnose authentication issues
            </p>
          </div>
          
          <AuthStatusChecker />
        </div>
      </main>
      
      <Footer />
    </div>
  )
} 