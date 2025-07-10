"use client"

import { useState } from "react"
import { AuthDebugger } from "@/components/auth-debugger"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert, AlertTriangle } from "lucide-react"

export default function TestAuthPage() {
  // Security check: Only allow access in development environment
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="container py-8 space-y-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <ShieldAlert className="h-5 w-5" />
              Access Restricted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              This debug page is not available in production for security reasons.
              Authentication debugging features are disabled to protect sensitive information.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="mb-6">
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Development Environment</AlertTitle>
          <AlertDescription className="text-yellow-700">
            This is a debug page only available in development. It contains sensitive authentication 
            information and is automatically disabled in production for security.
          </AlertDescription>
        </Alert>
      </div>

      <h1 className="text-3xl font-bold">Test Authentication Page</h1>
      <p className="text-muted-foreground">
        This page provides authentication debugging and testing capabilities for development.
      </p>
      
      <AuthDebugger />
    </div>
  )
} 