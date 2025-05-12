"use client"

import { useAuth } from "@/context/auth-context"
import { useState } from "react"
import { testServerAuth } from "@/actions/auth-test"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthDebugger } from "@/components/auth-debug"

export default function TestAuthPage() {
  const { user } = useAuth()
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  const runAuthTest = async () => {
    setLoading(true)
    try {
      // Try getting auth token from localStorage for direct testing
      let authToken = null;
      try {
        const storedAuth = localStorage.getItem('supabase.auth.token');
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          if (authData.currentSession?.access_token) {
            authToken = authData.currentSession.access_token;
            console.log("Found auth token:", authData.currentSession.access_token.substring(0, 10) + "...");
          }
        }
      } catch (e) {
        console.error("Error getting token:", e);
      }
      
      // Run the auth test server action with direct token passing
      const testResult = await testServerAuth(authToken);
      setResult(testResult);
    } catch (error) {
      console.error("Error running auth test:", error);
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold">Authentication Test Page</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">User Status:</p>
              <p className="text-lg">{user ? "Logged In" : "Not Logged In"}</p>
              {user && (
                <div className="mt-2">
                  <p className="text-sm">User ID: {user.id}</p>
                  <p className="text-sm">Email: {user.email}</p>
                </div>
              )}
            </div>
            
            <Button 
              onClick={runAuthTest} 
              disabled={loading}
            >
              {loading ? "Testing..." : "Test Server Authentication"}
            </Button>
            
            {result && (
              <div className="mt-4 border rounded-md p-4 bg-muted/20">
                <h3 className="text-sm font-medium mb-2">Test Result:</h3>
                <pre className="text-xs overflow-auto p-2 bg-card rounded border">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <AuthDebugger />
    </div>
  )
} 