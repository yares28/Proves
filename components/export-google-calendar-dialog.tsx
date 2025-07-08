"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Calendar, ExternalLink, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Exam } from "@/types/exam"

interface GoogleCalendarExportDialogProps {
  exams: Exam[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GoogleCalendarExportDialog({ 
  exams, 
  open, 
  onOpenChange 
}: GoogleCalendarExportDialogProps) {
  const [step, setStep] = useState<'auth' | 'export' | 'success' | 'error'>('auth')
  const [loading, setLoading] = useState(false)
  const [calendarName, setCalendarName] = useState('UPV Exams')
  const [authUrl, setAuthUrl] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [exportResult, setExportResult] = useState<{
    success: boolean
    calendarId?: string
    error?: string
  }>({ success: false })
  const { toast } = useToast()

  // Generate auth URL when dialog opens
  useEffect(() => {
    if (open && step === 'auth') {
      generateAuthUrl()
    }
  }, [open, step])

  const generateAuthUrl = async () => {
    try {
      const response = await fetch('/api/google-calendar/auth-url', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate auth URL')
      }
      
      const data = await response.json()
      setAuthUrl(data.authUrl)
    } catch (error) {
      console.error('Error generating auth URL:', error)
      toast({
        title: "Error",
        description: "Failed to generate Google authorization URL",
        variant: "destructive",
      })
    }
  }

  const handleAuthComplete = async () => {
    if (!authCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter the authorization code",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/google-calendar/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authCode,
          exams,
          calendarName,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to export exams')
      }

      const result = await response.json()
      setExportResult(result)
      
      if (result.success) {
        setStep('success')
        toast({
          title: "Success!",
          description: `Successfully exported ${exams.length} exams to Google Calendar`,
          variant: "default",
        })
      } else {
        setStep('error')
        toast({
          title: "Export Failed",
          description: result.error || "Failed to export exams",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error exporting exams:', error)
      setStep('error')
      setExportResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      toast({
        title: "Export Failed",
        description: "Failed to export exams to Google Calendar",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset state when dialog closes
    setTimeout(() => {
      setStep('auth')
      setAuthCode('')
      setCalendarName('UPV Exams')
      setExportResult({ success: false })
    }, 300)
  }

  const openGoogleCalendar = () => {
    window.open('https://calendar.google.com', '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Export to Google Calendar
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {step === 'auth' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="calendar-name">Calendar Name</Label>
                <Input
                  id="calendar-name"
                  value={calendarName}
                  onChange={(e) => setCalendarName(e.target.value)}
                  placeholder="Enter calendar name"
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Ready to export {exams.length} exam{exams.length !== 1 ? 's' : ''} to Google Calendar.
                </p>
                
                <div className="space-y-2">
                  <Label>Step 1: Authorize Google Calendar Access</Label>
                  {authUrl ? (
                    <Button
                      onClick={() => window.open(authUrl, '_blank')}
                      className="w-full"
                      variant="outline"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Google Authorization
                    </Button>
                  ) : (
                    <Button disabled className="w-full" variant="outline">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating authorization URL...
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auth-code">Step 2: Enter Authorization Code</Label>
                  <Input
                    id="auth-code"
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value)}
                    placeholder="Paste the authorization code here"
                  />
                  <p className="text-xs text-muted-foreground">
                    Copy the authorization code from Google and paste it here.
                  </p>
                </div>

                <Button 
                  onClick={handleAuthComplete}
                  disabled={loading || !authCode.trim()}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Exporting Exams...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Export to Google Calendar
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Export Successful!</h3>
                <p className="text-sm text-muted-foreground">
                  Successfully exported {exams.length} exams to "{calendarName}"
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={openGoogleCalendar} className="flex-1">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Google Calendar
                </Button>
                <Button onClick={handleClose} variant="outline" className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center space-y-4">
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Export Failed</h3>
                <p className="text-sm text-muted-foreground">
                  {exportResult.error || 'An error occurred while exporting exams'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    setStep('auth')
                    setAuthCode('')
                  }} 
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button onClick={handleClose} variant="outline" className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 