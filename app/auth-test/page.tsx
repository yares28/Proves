"use client"

import { useState } from "react"
import { AuthDebugger } from "@/components/auth-debugger"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { saveUserCalendar } from "@/actions/user-calendars"
import { extractTokensFromStorage } from "@/lib/auth/token-manager"

export default function AuthTestPage() {
  const { user, syncToken } = useAuth()
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runSaveTest = async () => {
    setIsLoading(true)
    setTestResult(null)
    
    try {
      // First, sync auth tokens to ensure fresh state
      console.log("⏳ Synchronizing auth tokens...");
      await syncToken();
      
      // Get auth tokens using the token manager
      const { accessToken, refreshToken } = extractTokensFromStorage();
      
      if (!accessToken || !refreshToken) {
        setTestResult({
          success: false,
          message: "Failed to extract tokens from localStorage. Please log in again."
        });
        setIsLoading(false);
        return;
      }
      
      if (!user?.id) {
        setTestResult({
          success: false,
          message: "No user ID found. Please log in."
        });
        setIsLoading(false);
        return;
      }
      
      // Attempt to save a test calendar
      const response = await saveUserCalendar({
        name: `Test Calendar ${new Date().toISOString()}`,
        filters: { test: ["true"] },
        userId: user.id,
        accessToken,
        refreshToken
      });
      
      setTestResult({
        success: true,
        message: `Calendar saved successfully! Response: ${JSON.stringify(response)}`
      });
    } catch (error) {
      console.error("Save test error:", error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-8 space-y-8">
      <h1 className="text-3xl font-bold">Authentication Test Page</h1>
      <p className="text-muted-foreground">
        This page helps diagnose authentication issues with server actions.
      </p>
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <AuthDebugger />
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Calendar Save</CardTitle>
              <CardDescription>
                Tests the token-based authentication flow for saving calendars
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Button 
                  onClick={runSaveTest} 
                  disabled={isLoading || !user}
                  className="w-full"
                >
                  {isLoading ? "Testing..." : "Run Save Test"}
                </Button>
                
                {!user && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Please log in to run this test
                  </p>
                )}
              </div>
              
              {testResult && (
                <Alert variant={testResult.success ? "default" : "destructive"}>
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {testResult.success ? "Test Passed" : "Test Failed"}
                  </AlertTitle>
                  <AlertDescription>
                    {testResult.message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Troubleshooting Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                <li>Make sure you're logged in with a valid user account</li>
                <li>Check that both access and refresh tokens are available</li>
                <li>Verify the token expiration time hasn't passed</li>
                <li>Try logging out and back in to refresh tokens</li>
                <li>Clear browser cache/cookies if problems persist</li>
                <li>Check server logs for more detailed error information</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 