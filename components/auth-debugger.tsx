"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export function AuthDebugger() {
  const { user } = useAuth()
  const [localStorageData, setLocalStorageData] = useState<any>(null)
  const [cookieData, setCookieData] = useState<string>("")
  const [refreshing, setRefreshing] = useState(false)

  // Load localStorage data
  useEffect(() => {
    try {
      const auth = localStorage.getItem('supabase.auth.token')
      if (auth) {
        const parsed = JSON.parse(auth)
        setLocalStorageData(parsed)
      }
    } catch (e) {
      console.error("Error parsing auth data:", e)
    }
    
    // Show cookies
    setCookieData(document.cookie)
  }, [refreshing])

  // Function to refresh data
  const refreshData = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 100)
  }

  // Format token display
  const formatToken = (token: string | null | undefined) => {
    if (!token) return "Not available"
    return `${token.substring(0, 12)}...${token.substring(token.length - 8)}`
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Authentication Debug
          <Button size="sm" onClick={refreshData}>Refresh</Button>
        </CardTitle>
        <CardDescription>
          Diagnostic information for troubleshooting authentication issues
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
            <TabsTrigger value="cookies">Cookies</TabsTrigger>
            <TabsTrigger value="localStorage">LocalStorage</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">User Status</h3>
                <div className="flex items-center space-x-2">
                  <Badge variant={user ? "default" : "destructive"}>
                    {user ? "Logged In" : "Not Logged In"}
                  </Badge>
                  {user && <Badge variant="outline">{user.email}</Badge>}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Authentication Summary</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>User ID: {user?.id || "Not available"}</li>
                  <li>Email: {user?.email || "Not available"}</li>
                  <li>Auth Method: {localStorageData?.currentSession?.provider_token ? "OAuth" : "Email/Password"}</li>
                  <li>Access Token: {localStorageData?.currentSession?.access_token ? "Available" : "Missing"}</li>
                  <li>Refresh Token: {localStorageData?.currentSession?.refresh_token ? "Available" : "Missing"}</li>
                  <li>Token Expiry: {
                    localStorageData?.currentSession?.expires_at 
                      ? new Date(localStorageData.currentSession.expires_at * 1000).toLocaleString() 
                      : "Unknown"
                  }</li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="tokens">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Access Token</h3>
                <pre className="bg-muted p-2 rounded-md text-xs whitespace-pre-wrap break-all">
                  {formatToken(localStorageData?.currentSession?.access_token)}
                </pre>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Refresh Token</h3>
                <pre className="bg-muted p-2 rounded-md text-xs whitespace-pre-wrap break-all">
                  {formatToken(localStorageData?.currentSession?.refresh_token)}
                </pre>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Token Information</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Provider: {localStorageData?.currentSession?.provider || "Not available"}</li>
                  <li>Expires At: {
                    localStorageData?.currentSession?.expires_at 
                      ? new Date(localStorageData.currentSession.expires_at * 1000).toLocaleString() 
                      : "Unknown"
                  }</li>
                  <li>Issued At: {
                    localStorageData?.currentSession?.created_at 
                      ? new Date(localStorageData.currentSession.created_at * 1000).toLocaleString() 
                      : "Unknown"
                  }</li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="cookies">
            <div>
              <h3 className="text-sm font-medium mb-2">Browser Cookies</h3>
              <pre className="bg-muted p-2 rounded-md text-xs whitespace-pre-wrap">
                {cookieData || "No cookies found"}
              </pre>
            </div>
          </TabsContent>
          
          <TabsContent value="localStorage">
            <div>
              <h3 className="text-sm font-medium mb-2">localStorage Auth Data</h3>
              <pre className="bg-muted p-2 rounded-md text-xs overflow-auto max-h-96">
                {JSON.stringify(localStorageData, null, 2) || "No data found"}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 