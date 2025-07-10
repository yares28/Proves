"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

interface AuthStatus {
  isAuthenticated: boolean
  user?: any
  clientSession?: any
  tokenInfo?: {
    accessToken?: string
    refreshToken?: string
    expiresAt?: Date
    isExpired?: boolean
  }
  cookies?: string[]
  localStorage?: any
  serverTest?: {
    success: boolean
    message: string
    details?: any
  }
}

const supabase = createClient()

export function AuthStatusChecker() {
  const { user, loading: contextLoading, syncToken } = useAuth()
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    isAuthenticated: false
  })
  const [loading, setLoading] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  // Comprehensive authentication check
  const performAuthCheck = async () => {
    setLoading(true)
    
    try {
      const status: AuthStatus = { isAuthenticated: false }

      // 1. Check client-side session
      const { data: sessionData } = await supabase.auth.getSession()
      status.clientSession = sessionData.session
      status.isAuthenticated = !!sessionData.session
      status.user = sessionData.session?.user

      // 2. Extract token information
      if (sessionData.session) {
        status.tokenInfo = {
          accessToken: sessionData.session.access_token?.substring(0, 20) + "...",
          refreshToken: sessionData.session.refresh_token ? "Available" : "Missing",
          expiresAt: new Date(sessionData.session.expires_at! * 1000),
          isExpired: sessionData.session.expires_at! * 1000 < Date.now()
        }
      }

      // 3. Check browser cookies
      const cookies = document.cookie.split(';').map(c => c.trim())
      status.cookies = cookies.filter(c => 
        c.startsWith('sb-') || c.startsWith('sb:') || c.includes('auth')
      )

      // 4. Check localStorage
      try {
        const stored = localStorage.getItem('supabase.auth.token')
        if (stored) {
          status.localStorage = JSON.parse(stored)
        }
      } catch (e) {
        status.localStorage = { error: "Failed to parse localStorage" }
      }

      // 5. Test server authentication
      try {
        const response = await fetch('/api/auth/test', {
          method: 'GET',
          credentials: 'include'
        })
        
        if (response.ok) {
          const result = await response.json()
          status.serverTest = {
            success: true,
            message: "Server authentication successful",
            details: result
          }
        } else {
          status.serverTest = {
            success: false,
            message: `Server authentication failed: ${response.status} ${response.statusText}`
          }
        }
      } catch (error) {
        status.serverTest = {
          success: false,
          message: `Server test error: ${error}`
        }
      }

      setAuthStatus(status)
      setLastCheck(new Date())
    } catch (error) {
      console.error("Auth check failed:", error)
      setAuthStatus({
        isAuthenticated: false,
        serverTest: {
          success: false,
          message: `Check failed: ${error}`
        }
      })
    } finally {
      setLoading(false)
    }
  }

  // Fix authentication issues
  const fixAuthIssues = async () => {
    setLoading(true)
    
    try {
      console.log("🔄 Attempting to repair authentication...")
      
      // 1. Refresh the session using Supabase's built-in refresh
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError || !refreshData.session) {
        console.error("Failed to refresh session:", refreshError)
        throw new Error("No session available after refresh")
      }

      // 2. Let server handle secure session storage via httpOnly cookies
      // Send session to server for secure storage
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: refreshData.session.access_token,
          refresh_token: refreshData.session.refresh_token,
          expires_at: refreshData.session.expires_at
        }),
        credentials: 'include' // Important for httpOnly cookies
      });

      if (!response.ok) {
        throw new Error('Failed to store session securely');
      }

      // 3. Sync with auth context
      if (syncToken) {
        await syncToken()
      }

      console.log("✅ Authentication repair completed securely")
      
      // Re-check status
      await performAuthCheck()
      
    } catch (error) {
      console.error("❌ Authentication repair failed:", error)
      setAuthStatus(prev => ({
        ...prev,
        serverTest: {
          success: false,
          message: `Repair failed: ${error}`
        }
      }))
    } finally {
      setLoading(false)
    }
  }

  // Clear all authentication data securely
  const clearAuthData = async () => {
    setLoading(true)
    
    try {
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Clear server-side session via API
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      // Refresh the page to clear all state
      window.location.reload()
      
    } catch (error) {
      console.error("Failed to clear auth data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-check on mount
  useEffect(() => {
    if (!contextLoading) {
      performAuthCheck()
    }
  }, [contextLoading])

  const getStatusIcon = (success: boolean | undefined) => {
    if (success === true) return <CheckCircle2 className="h-4 w-4 text-green-500" />
    if (success === false) return <XCircle className="h-4 w-4 text-red-500" />
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />
  }

  const getStatusBadge = (success: boolean | undefined) => {
    if (success === true) return <Badge variant="default" className="bg-green-500">Connected</Badge>
    if (success === false) return <Badge variant="destructive">Disconnected</Badge>
    return <Badge variant="secondary">Unknown</Badge>
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Authentication Status Checker
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={performAuthCheck}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Comprehensive authentication diagnostics and repair tools
          {lastCheck && (
            <span className="block text-xs text-muted-foreground mt-1">
              Last checked: {lastCheck.toLocaleTimeString()}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Quick Status Overview */}
        <div className="mb-6 p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Overall Status</h3>
            {getStatusBadge(authStatus.isAuthenticated)}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              {getStatusIcon(authStatus.isAuthenticated)}
              <span>Client Auth: {authStatus.isAuthenticated ? "Active" : "Inactive"}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {getStatusIcon(!authStatus.tokenInfo?.isExpired)}
              <span>Token: {authStatus.tokenInfo?.isExpired ? "Expired" : "Valid"}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {getStatusIcon(authStatus.serverTest?.success)}
              <span>Server: {authStatus.serverTest?.success ? "Connected" : "Failed"}</span>
            </div>
          </div>

          {authStatus.user && (
            <div className="mt-4 p-3 bg-muted/20 rounded">
              <div className="text-sm">
                <strong>User:</strong> {authStatus.user.email} (ID: {authStatus.user.id})
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-6">
          <Button 
            onClick={fixAuthIssues}
            disabled={loading}
            className="flex-1"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Fix Authentication Issues
          </Button>
          
          <Button 
            variant="outline"
            onClick={clearAuthData}
            disabled={loading}
          >
            Clear All Auth Data
          </Button>
        </div>

        {/* Detailed Information Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
            <TabsTrigger value="storage">Storage</TabsTrigger>
            <TabsTrigger value="server">Server</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Authentication Summary</h4>
              <ul className="text-sm space-y-1">
                <li>Status: {authStatus.isAuthenticated ? "✅ Authenticated" : "❌ Not Authenticated"}</li>
                <li>User ID: {authStatus.user?.id || "Not available"}</li>
                <li>Email: {authStatus.user?.email || "Not available"}</li>
                <li>Provider: {authStatus.clientSession?.user?.app_metadata?.provider || "Unknown"}</li>
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="tokens" className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Token Information</h4>
              {authStatus.tokenInfo ? (
                <ul className="text-sm space-y-1">
                  <li>Access Token: {authStatus.tokenInfo.accessToken || "Not available"}</li>
                  <li>Refresh Token: {authStatus.tokenInfo.refreshToken || "Not available"}</li>
                  <li>Expires At: {authStatus.tokenInfo.expiresAt?.toLocaleString() || "Unknown"}</li>
                  <li>Is Expired: {authStatus.tokenInfo.isExpired ? "❌ Yes" : "✅ No"}</li>
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No token information available</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="storage" className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Browser Storage</h4>
              
              <div className="space-y-3">
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground">Cookies ({authStatus.cookies?.length || 0})</h5>
                  <div className="max-h-32 overflow-auto text-xs bg-muted/20 p-2 rounded">
                    {authStatus.cookies?.length ? (
                      authStatus.cookies.map((cookie, i) => (
                        <div key={i}>{cookie}</div>
                      ))
                    ) : (
                      <div>No auth cookies found</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground">LocalStorage</h5>
                  <div className="max-h-32 overflow-auto text-xs bg-muted/20 p-2 rounded">
                    <pre>{JSON.stringify(authStatus.localStorage, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="server" className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Server Authentication Test</h4>
              {authStatus.serverTest ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(authStatus.serverTest.success)}
                    <span className="text-sm">{authStatus.serverTest.message}</span>
                  </div>
                  
                  {authStatus.serverTest.details && (
                    <div className="max-h-32 overflow-auto text-xs bg-muted/20 p-2 rounded">
                      <pre>{JSON.stringify(authStatus.serverTest.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Server test not completed</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Alerts for specific issues */}
        {authStatus.tokenInfo?.isExpired && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Token Expired</AlertTitle>
            <AlertDescription>
              Your authentication token has expired. Click "Fix Authentication Issues" to refresh it.
            </AlertDescription>
          </Alert>
        )}

        {authStatus.isAuthenticated && !authStatus.serverTest?.success && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Server Authentication Failed</AlertTitle>
            <AlertDescription>
              You're authenticated on the client but the server can't verify your session. This might cause issues with protected actions.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
} 