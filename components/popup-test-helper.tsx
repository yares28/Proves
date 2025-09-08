"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ExternalLink,
  TestTube,
  Clock,
  Zap
} from "lucide-react"
import { toast } from "sonner"
import { exportToGoogleCalendarAdvanced, preOpenPopupWindow } from "@/lib/google-calendar-export"

interface TestResult {
  name: string
  success: boolean
  message: string
  timing: number
}

export function PopupTestHelper() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runTest = async (testName: string, testFn: () => Promise<boolean>): Promise<TestResult> => {
    const startTime = Date.now()
    try {
      const success = await testFn()
      const timing = Date.now() - startTime
      return {
        name: testName,
        success,
        message: success ? "✅ Passed" : "❌ Failed",
        timing
      }
    } catch (error) {
      const timing = Date.now() - startTime
      return {
        name: testName,
        success: false,
        message: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timing
      }
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setTestResults([])
    
    const tests = [
      {
        name: "Direct window.open()",
        fn: async () => {
          const popup = window.open('about:blank', '_blank', 'width=400,height=300')
          if (popup) {
            popup.close()
            return true
          }
          return false
        }
      },
      {
        name: "Pre-popup strategy",
        fn: async () => {
          const popup = preOpenPopupWindow({ windowFeatures: 'width=400,height=300' })
          if (popup) {
            popup.close()
            return true
          }
          return false
        }
      },
      {
        name: "After toast notification",
        fn: async () => {
          toast.info("Testing popup after toast...")
          await new Promise(resolve => setTimeout(resolve, 100))
          const popup = window.open('about:blank', '_blank', 'width=400,height=300')
          if (popup) {
            popup.close()
            return true
          }
          return false
        }
      },
      {
        name: "After DOM manipulation",
        fn: async () => {
          const div = document.createElement('div')
          document.body.appendChild(div)
          document.body.removeChild(div)
          const popup = window.open('about:blank', '_blank', 'width=400,height=300')
          if (popup) {
            popup.close()
            return true
          }
          return false
        }
      },
      {
        name: "Advanced export function",
        fn: async () => {
          const { popup, complete } = exportToGoogleCalendarAdvanced({
            baseUrl: window.location.origin,
            endpoint: "/api/ical",
            calendarName: "Test Calendar",
            filters: { school: ["ETSINF"] },
            reminders: { oneDay: true }
          })
          
          if (popup) {
            const result = complete()
            popup.close()
            return result.success
          }
          return false
        }
      }
    ]

    const results: TestResult[] = []
    for (const test of tests) {
      const result = await runTest(test.name, test.fn)
      results.push(result)
      setTestResults([...results])
      await new Promise(resolve => setTimeout(resolve, 500)) // Small delay between tests
    }
    
    setIsRunning(false)
  }

  const getBrowserInfo = () => {
    const ua = navigator.userAgent
    if (ua.includes('Chrome')) return 'Chrome'
    if (ua.includes('Firefox')) return 'Firefox'
    if (ua.includes('Safari')) return 'Safari'
    if (ua.includes('Edge')) return 'Edge'
    return 'Unknown'
  }

  const successCount = testResults.filter(r => r.success).length
  const totalTests = testResults.length

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Popup Blocker Test Suite
        </CardTitle>
        <CardDescription>
          Test Google Calendar export popup behavior across different scenarios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="outline">{getBrowserInfo()}</Badge>
            <span className="text-sm text-muted-foreground">
              {totalTests > 0 && `${successCount}/${totalTests} tests passed`}
            </span>
          </div>
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Run Tests
              </>
            )}
          </Button>
        </div>

        {totalTests > 0 && (
          <Alert className={successCount === totalTests ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {successCount === totalTests 
                ? "🎉 All tests passed! Popup blocking is not affecting this browser configuration."
                : `⚠️ ${totalTests - successCount} test(s) failed. Some popup scenarios may be blocked.`
              }
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          {testResults.map((result, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-3">
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="font-medium">{result.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{result.timing}ms</span>
                <Badge variant={result.success ? "secondary" : "destructive"}>
                  {result.success ? "Pass" : "Fail"}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">Troubleshooting Tips</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Enable pop-ups for this site in browser settings</li>
            <li>• Disable popup blocking extensions temporarily</li>
            <li>• Try in incognito/private browsing mode</li>
            <li>• Check if "Redirect Blocking" is enabled</li>
            <li>• Ensure JavaScript is enabled</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
