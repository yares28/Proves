"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Loader2, Calendar, ExternalLink, CheckCircle, XCircle, AlertTriangle, ChevronDown, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Exam } from "@/types/exam"

interface GoogleCalendar {
  id: string
  summary: string
  description?: string
  primary: boolean
  accessRole: string
  backgroundColor?: string
  foregroundColor?: string
}

interface GoogleCalendarExportDialogProps {
  exams: Exam[]
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultCalendarName?: string
}

interface ExportResult {
  success: boolean
  calendarId?: string
  eventsCreated?: number
  eventsFailed?: number
  totalEvents?: number
  errors?: string[]
  totalErrors?: number
  calendarName?: string
  batchesProcessed?: number
}

export function GoogleCalendarExportDialog({ 
  exams, 
  open, 
  onOpenChange,
  defaultCalendarName
}: GoogleCalendarExportDialogProps) {
  const [step, setStep] = useState<'settings' | 'auth' | 'success' | 'error'>('settings')
  const [loading, setLoading] = useState(false)
  const [loadingCalendars, setLoadingCalendars] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  
  // Export settings
  const [calendarName, setCalendarName] = useState(defaultCalendarName || 'UPV Exams')
  const [useExistingCalendar, setUseExistingCalendar] = useState(false)
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('')
  const [reminderMinutes, setReminderMinutes] = useState<number[]>([24 * 60, 60])
  const [timeZone, setTimeZone] = useState('Europe/Madrid')
  
  // Auth and API state
  const [authUrl, setAuthUrl] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([])
  const [exportResult, setExportResult] = useState<ExportResult>({ success: false })
  
  const { toast } = useToast()

  // Calculate duration statistics from exams
  const durationStats = {
    min: Math.min(...exams.map(e => e.duration_minutes)),
    max: Math.max(...exams.map(e => e.duration_minutes)),
    avg: Math.round(exams.reduce((sum, e) => sum + e.duration_minutes, 0) / exams.length),
    unique: [...new Set(exams.map(e => e.duration_minutes))].sort((a, b) => a - b)
  }

  // Generate auth URL when dialog opens
  useEffect(() => {
    if (open && step === 'auth') {
      generateAuthUrl()
    }
  }, [open, step])

  // Update calendar name when default changes
  useEffect(() => {
    setCalendarName(defaultCalendarName || 'UPV Exams')
  }, [defaultCalendarName])

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

  const fetchCalendars = async () => {
    if (!authCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter the authorization code first",
        variant: "destructive",
      })
      return
    }

    setLoadingCalendars(true)
    try {
      const response = await fetch('/api/google-calendar/calendars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ authCode }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch calendars')
      }

      const result = await response.json()
      if (result.success) {
        setCalendars(result.calendars)
        setUseExistingCalendar(true)
        
        // Auto-select primary calendar
        const primaryCalendar = result.calendars.find((cal: GoogleCalendar) => cal.primary)
        if (primaryCalendar) {
          setSelectedCalendarId(primaryCalendar.id)
        }
      } else {
        throw new Error(result.error || 'Failed to fetch calendars')
      }
    } catch (error) {
      console.error('Error fetching calendars:', error)
      toast({
        title: "Error",
        description: "Failed to fetch your calendars. You can still create a new calendar.",
        variant: "destructive",
      })
    } finally {
      setLoadingCalendars(false)
    }
  }

  const handleExport = async () => {
    if (!authCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter the authorization code",
        variant: "destructive",
      })
      return
    }

    if (useExistingCalendar && !selectedCalendarId) {
      toast({
        title: "Error",
        description: "Please select a calendar",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const exportData = {
        authCode,
        exams,
        calendarName,
        useExistingCalendar,
        existingCalendarId: useExistingCalendar ? selectedCalendarId : undefined,
        reminderMinutes,
        timeZone,
      }

      const response = await fetch('/api/google-calendar/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData),
      })

      const result = await response.json()
      setExportResult(result)
      
      if (result.success) {
        setStep('success')
        const successMessage = result.eventsFailed > 0 
          ? `Exported ${result.eventsCreated}/${result.totalEvents} exams (${result.eventsFailed} failed)`
          : `Successfully exported ${result.eventsCreated} exams to Google Calendar`
        
        toast({
          title: "Export Complete!",
          description: successMessage,
          variant: result.eventsFailed > 0 ? "default" : "default",
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
        errors: [error instanceof Error ? error.message : 'Unknown error']
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
      setStep('settings')
      setAuthCode('')
      setCalendars([])
      setSelectedCalendarId('')
      setUseExistingCalendar(false)
      setAdvancedOpen(false)
      setCalendarName(defaultCalendarName || 'UPV Exams')
      setExportResult({ success: false })
    }, 300)
  }

  const openGoogleCalendar = () => {
    window.open('https://calendar.google.com', '_blank')
  }

  const toggleReminder = (minutes: number) => {
    setReminderMinutes(prev => 
      prev.includes(minutes) 
        ? prev.filter(m => m !== minutes)
        : [...prev, minutes].sort((a, b) => b - a)
    )
  }

  const selectedCalendar = calendars.find(cal => cal.id === selectedCalendarId)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Export to Google Calendar
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {step === 'settings' && (
            <>
              <div className="space-y-4">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Ready to export {exams.length} exam{exams.length !== 1 ? 's' : ''} to Google Calendar.
                  </p>

                  {/* Duration Info Display */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Exam Duration Information</span>
                    </div>
                    <div className="text-xs text-blue-700 space-y-1">
                      <p>Duration range: {durationStats.min}-{durationStats.max} minutes</p>
                      <p>Average duration: {durationStats.avg} minutes</p>
                      <p>Durations in this export: {durationStats.unique.join(', ')} minutes</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="calendar-name">Calendar Name</Label>
                    <Input
                      id="calendar-name"
                      value={calendarName}
                      onChange={(e) => setCalendarName(e.target.value)}
                      placeholder="Enter calendar name"
                      disabled={useExistingCalendar}
                    />
                  </div>

                  {/* Advanced Options Collapsible */}
                  <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Advanced Options
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 mt-4">
                      <div className="space-y-4 p-4 border rounded-md bg-muted/20">
                        <div className="space-y-2">
                          <Label>Event Reminders</Label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { minutes: 15, label: '15 min' },
                              { minutes: 60, label: '1 hour' },
                              { minutes: 24 * 60, label: '1 day' },
                              { minutes: 7 * 24 * 60, label: '1 week' }
                            ].map(({ minutes, label }) => (
                              <div key={minutes} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`reminder-${minutes}`}
                                  checked={reminderMinutes.includes(minutes)}
                                  onCheckedChange={() => toggleReminder(minutes)}
                                />
                                <Label htmlFor={`reminder-${minutes}`} className="text-sm">
                                  {label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="timezone">Time Zone</Label>
                          <Select value={timeZone} onValueChange={setTimeZone}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Europe/Madrid">Europe/Madrid (CET)</SelectItem>
                              <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                              <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                              <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => setStep('auth')} className="w-full sm:w-auto">
                    Continue to Authorization
                  </Button>
                </div>
              </div>
            </>
          )}

          {step === 'auth' && (
            <>
              <div className="space-y-3">
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

                {authCode && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Step 3: Choose Calendar Option</Label>
                      <Button
                        onClick={fetchCalendars}
                        disabled={loadingCalendars || !authCode.trim()}
                        size="sm"
                        variant="outline"
                      >
                        {loadingCalendars ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          'Load My Calendars'
                        )}
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="new-calendar"
                          checked={!useExistingCalendar}
                          onCheckedChange={(checked) => setUseExistingCalendar(!checked)}
                        />
                        <Label htmlFor="new-calendar">Create new calendar: "{calendarName}"</Label>
                      </div>

                      {calendars.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="existing-calendar"
                            checked={useExistingCalendar}
                            onCheckedChange={(checked) => setUseExistingCalendar(!!checked)}
                          />
                          <Label htmlFor="existing-calendar">Use existing calendar</Label>
                        </div>
                      )}

                      {useExistingCalendar && calendars.length > 0 && (
                        <div className="ml-6 space-y-2">
                          <Label>Select Calendar</Label>
                          <Select value={selectedCalendarId} onValueChange={setSelectedCalendarId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a calendar" />
                            </SelectTrigger>
                            <SelectContent>
                              {calendars.map((calendar) => (
                                <SelectItem key={calendar.id} value={calendar.id}>
                                  <div className="flex items-center gap-2">
                                    <span>{calendar.summary}</span>
                                    {calendar.primary && (
                                      <Badge variant="secondary" className="text-xs">
                                        Primary
                                      </Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {selectedCalendar && (
                            <div className="text-sm text-muted-foreground">
                              {selectedCalendar.description && (
                                <p>{selectedCalendar.description}</p>
                              )}
                              <p>Access: {selectedCalendar.accessRole}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Separator />

                <Button 
                  onClick={handleExport}
                  disabled={loading || !authCode.trim() || (useExistingCalendar && !selectedCalendarId)}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Exporting {exams.length} Exams...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Export to Google Calendar
                    </>
                  )}
                </Button>

                <div className="flex justify-start">
                  <Button onClick={() => setStep('settings')} variant="ghost" size="sm">
                    ← Back to Settings
                  </Button>
                </div>
              </div>
            </>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Export Complete!</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {exportResult.eventsCreated && exportResult.totalEvents && (
                    <p>
                      Successfully exported {exportResult.eventsCreated} of {exportResult.totalEvents} exams
                    </p>
                  )}
                  {exportResult.calendarName && (
                    <p>Calendar: "{exportResult.calendarName}"</p>
                  )}
                  {exportResult.eventsFailed && exportResult.eventsFailed > 0 && (
                    <div className="flex items-center justify-center gap-2 text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{exportResult.eventsFailed} events failed to export</span>
                    </div>
                  )}
                </div>
              </div>
              
              {exportResult.errors && exportResult.errors.length > 0 && (
                <div className="text-left p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-sm font-medium text-amber-800 mb-1">Issues encountered:</p>
                  <ul className="text-xs text-amber-700 space-y-1">
                    {exportResult.errors.slice(0, 3).map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                    {exportResult.totalErrors && exportResult.totalErrors > 3 && (
                      <li>• ... and {exportResult.totalErrors - 3} more issues</li>
                    )}
                  </ul>
                </div>
              )}
              
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
                  {exportResult.errors?.[0] || 'An error occurred while exporting exams'}
                </p>
              </div>
              
              {exportResult.errors && exportResult.errors.length > 1 && (
                <div className="text-left p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm font-medium text-red-800 mb-1">Additional errors:</p>
                  <ul className="text-xs text-red-700 space-y-1">
                    {exportResult.errors.slice(1, 4).map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    setStep('settings')
                    setAuthCode('')
                    setCalendars([])
                    setSelectedCalendarId('')
                  }} 
                  className="flex-1"
                >
                  Start Over
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