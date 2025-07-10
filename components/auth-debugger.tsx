"use client"

import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert, AlertTriangle } from "lucide-react"

export function AuthDebugger() {
  // Security: Only show debug information in development
  if (process.env.NODE_ENV === 'production') {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <ShieldAlert className="h-5 w-5" />
            Debug Information Restricted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">
            Authentication debug information is not available in production environments 
            for security reasons. This prevents sensitive data exposure.
          </p>
        </CardContent>
      </Card>
    )
  }

  const { user } = useAuth()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Authentication Debugger
        </CardTitle>
        <CardDescription>
          Development-only debug information. Automatically disabled in production.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Security Notice</AlertTitle>
          <AlertDescription className="text-yellow-700">
            This component exposes sensitive authentication data and is only available 
            in development environments.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">User Information</h4>
            {user ? (
              <div className="space-y-2 text-sm">
                <div><strong>ID:</strong> {user.id}</div>
                <div><strong>Email:</strong> {user.email}</div>
                <div><strong>Email Verified:</strong> {user.email_confirmed_at ? "Yes" : "No"}</div>
                <div><strong>Provider:</strong> {user.app_metadata?.provider || "Unknown"}</div>
                <div><strong>Created:</strong> {user.created_at}</div>
                <div><strong>Auth Status:</strong> 
                  <Badge variant="default" className="ml-2">Authenticated</Badge>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Badge variant="destructive">No user data</Badge>
                <p className="text-sm text-muted-foreground">
                  User is not authenticated or session data is not available
                </p>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-medium mb-2">Security Notice</h4>
            <p className="text-sm text-muted-foreground">
              Detailed session information (tokens, etc.) is not displayed for security reasons, 
              even in development. Only basic user authentication status is shown.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 