"use client"

import React, { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { syncAuthState, isAuthenticated } from "@/lib/auth/token-manager"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AuthDebugger() {
  const { user, syncToken } = useAuth()
  const [authStatus, setAuthStatus] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(false)
  
  // Function to check cookies in the browser
  const checkBrowserCookies = () => {
    const cookies = document.cookie.split(';').map(c => c.trim())
    const authCookies = cookies.filter(c => 
      c.startsWith('sb-') || c.startsWith('sb:')
    )
    
    setAuthStatus(prev => ({
      ...prev,
      browserCookies: authCookies
    }))
  }
  
  // Function to check local authentication state
  const checkLocalAuth = async () => {
    setIsLoading(true)
    
    try {
      const isAuth = await isAuthenticated()
      
      setAuthStatus(prev => ({
        ...prev,
        isAuthenticated: isAuth,
        user: user ? {
          id: user.id,
          email: user.email
        } : null
      }))
    } catch (error) {
      console.error("Error checking auth:", error)
      setAuthStatus(prev => ({
        ...prev,
        error: String(error)
      }))
    } finally {
      setIsLoading(false)
    }
  }
  
  // Function to sync auth tokens
  const handleSyncTokens = async () => {
    setIsLoading(true)
    
    try {
      // Use the auth context's syncToken method
      const success = await syncToken()
      
      setAuthStatus(prev => ({
        ...prev,
        syncResult: success ? "Success" : "Failed"
      }))
      
      // Refresh cookie info after sync
      checkBrowserCookies()
    } catch (error) {
      console.error("Error syncing tokens:", error)
      setAuthStatus(prev => ({
        ...prev,
        syncError: String(error)
      }))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Authentication Debugger</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={checkLocalAuth} 
              disabled={isLoading}
              variant="outline"
            >
              Check Local Auth
            </Button>
            
            <Button 
              onClick={checkBrowserCookies} 
              disabled={isLoading}
              variant="outline"
            >
              Check Browser Cookies
            </Button>
            
            <Button 
              onClick={handleSyncTokens} 
              disabled={isLoading}
              variant="default"
            >
              Sync Auth Tokens
            </Button>
          </div>
          
          <div className="mt-4 border rounded-md p-4 bg-muted/20">
            <h3 className="text-sm font-medium mb-2">Auth Status:</h3>
            <pre className="text-xs overflow-auto p-2 bg-card rounded border">
              {JSON.stringify(authStatus, null, 2)}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 