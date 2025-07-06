"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, X } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function AuthStatusIndicator() {
  const { user } = useAuth()
  const [showWarning, setShowWarning] = useState(false)
  const [authIssue, setAuthIssue] = useState<string | null>(null)

  useEffect(() => {
    const checkAuthHealth = async () => {
      if (!user) {
        setShowWarning(false)
        return
      }

      try {
        // Check if token is expired
        const { data } = await supabase.auth.getSession()
        
        if (data.session) {
          const expiresAt = data.session.expires_at! * 1000
          const timeUntilExpiry = expiresAt - Date.now()
          
          // Show warning if token expires in less than 5 minutes
          if (timeUntilExpiry < 5 * 60 * 1000) {
            setAuthIssue("Your session is about to expire")
            setShowWarning(true)
            return
          }
        }

        // Test server authentication
        try {
          const response = await fetch('/api/auth/test', {
            method: 'GET',
            credentials: 'include'
          })
          
          if (!response.ok) {
            setAuthIssue("Server authentication failed - some features may not work")
            setShowWarning(true)
            return
          }
        } catch (error) {
          setAuthIssue("Cannot verify server authentication")
          setShowWarning(true)
          return
        }

        // All checks passed
        setShowWarning(false)
        setAuthIssue(null)
        
      } catch (error) {
        setAuthIssue("Authentication system error")
        setShowWarning(true)
      }
    }

    // Check immediately and then every 2 minutes
    checkAuthHealth()
    const interval = setInterval(checkAuthHealth, 2 * 60 * 1000)

    return () => clearInterval(interval)
  }, [user])

  if (!showWarning || !authIssue) {
    return null
  }

  return (
    <Alert className="mb-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-yellow-800 dark:text-yellow-200">
          {authIssue}
        </span>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = '/auth-status'}
            className="text-yellow-800 border-yellow-600 hover:bg-yellow-100 dark:text-yellow-200"
          >
            Fix Issues
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowWarning(false)}
            className="text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
} 