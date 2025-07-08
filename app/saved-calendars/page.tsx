"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Eye, Trash2, Clock, MapPin, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getUserCalendars, deleteUserCalendar } from "@/actions/user-calendars"
import { useAuth } from "@/context/auth-context"
import { getExams } from "@/actions/exam-actions"
import { formatDateString, getAcademicYearForMonth, getCurrentYear, detectAcademicYearFromExams } from "@/utils/date-utils"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

// Add a custom window interface
declare global {
  interface Window {
    _didLogExamDate?: boolean;
  }
}

// Simplified data fetching function that uses the fixed getExams function

// Simplified data fetching function
async function fetchCalendarExams(filters: any) {
  console.log("Fetching exams with filters:", filters);
  
  try {
    // Use the existing getExams function - the filtering issues have been fixed
    const exams = await getExams(filters);
    console.log(`Found ${exams.length} exams`);
    return exams;
  } catch (error) {
    console.error("Error fetching exams:", error);
    return [];
  }
}

export default function SavedCalendarsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [calendars, setCalendars] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCalendar, setSelectedCalendar] = useState<any | null>(null)
  const [calendarData, setCalendarData] = useState<Record<string, any[]>>({})
  const [loadingCalendar, setLoadingCalendar] = useState<string | null>(null)
  const [academicYear, setAcademicYear] = useState<{ startYear: number; endYear: number } | null>(null)
  const { toast } = useToast()

  // Generate array of months from September to August (academic year)
  const academicMonths = [
    "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER", 
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST"
  ]

  useEffect(() => {
    async function fetchCalendars() {
      if (!user?.id) {
        setCalendars([])
        setLoading(false)
        return
      }

      try {
        const data = await getUserCalendars(user.id)
        setCalendars(data)
      } catch (error) {
        console.error("Error fetching calendars:", error)
        toast({
          title: "Failed to fetch calendars",
          description: "There was an error loading your saved calendars.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCalendars()
  }, [user?.id, toast])

  async function handleViewCalendar(calendar: any) {
    if (loadingCalendar === calendar.id) return
    
    if (selectedCalendar?.id === calendar.id) {
      // Hide the calendar
      setSelectedCalendar(null)
      setCalendarData({})
      setAcademicYear(null)
      return
    }
    
    setLoadingCalendar(calendar.id)
    setSelectedCalendar(calendar)

    try {
      console.log('📅 Loading calendar:', calendar.name, 'with filters:', calendar.filters);
      const data = await fetchCalendarExams(calendar.filters)
      console.log(`📊 Fetched ${data.length} exams for calendar:`, calendar.name);
      
      // Detect academic year from exam dates
      if (data.length > 0) {
        const uniqueDates = [...new Set(data.map(exam => exam.date))].sort();
        console.log("SavedCalendars - Unique exam dates:", uniqueDates);
        
        const detectedAcademicYear = detectAcademicYearFromExams(uniqueDates);
        console.log("SavedCalendars - Detected academic year:", detectedAcademicYear);
        
        if (detectedAcademicYear) {
          setAcademicYear(detectedAcademicYear);
        } else {
          // Fallback to current year if no academic year detected
          console.log("SavedCalendars - No academic year detected, using current year fallback");
          const currentYear = getCurrentYear();
          setAcademicYear({ startYear: currentYear, endYear: currentYear + 1 });
        }
      } else {
        // No exams, use current year as fallback
        console.log("SavedCalendars - No exams found, using current year fallback");
        const currentYear = getCurrentYear();
        setAcademicYear({ startYear: currentYear, endYear: currentYear + 1 });
      }
      
      setCalendarData({ [calendar.id]: data })
    } catch (error) {
      console.error("Error loading calendar data:", error)
      toast({
        title: "Failed to load calendar",
        description: "There was an error loading the calendar data.",
        variant: "destructive",
      })
    } finally {
      setLoadingCalendar(null)
    }
  }

  async function handleDeleteCalendar(id: string) {
    if (!user?.id) return
    
    try {
      await deleteUserCalendar(id, user.id)
      
      // Clear selected calendar if it was deleted
      if (selectedCalendar?.id === id) {
        setSelectedCalendar(null)
      }
      
      // Remove from calendar data cache
      setCalendarData(prev => {
        const newData = { ...prev }
        delete newData[id]
        return newData
      })
      
      setCalendars(calendars.filter(cal => cal.id !== id))
      toast({
        title: "Calendar deleted",
        description: "Your calendar has been successfully deleted.",
      })
    } catch (error) {
      console.error("Error deleting calendar:", error)
      toast({
        title: "Failed to delete",
        description: "There was an error deleting your calendar.",
        variant: "destructive",
      })
    }
  }

  // Helper function to check if a month has exams
  function monthHasExams(monthName: string, exams: any[]) {
    if (!exams || exams.length === 0) return false
    
    const monthIndex = getMonthIndex(monthName)
    
    return exams.some(exam => {
      if (!exam.date) return false
      
      // Parse the exam date
      const examDate = new Date(exam.date)
      if (isNaN(examDate.getTime())) return false
      
      // Get month (1-12)
      const examMonth = examDate.getMonth() + 1
      return examMonth === monthIndex
    })
  }

  // Helper to get month index (1-12)
  function getMonthIndex(monthName: string) {
    const monthMap: Record<string, number> = {
      "JANUARY": 1, "FEBRUARY": 2, "MARCH": 3, "APRIL": 4, 
      "MAY": 5, "JUNE": 6, "JULY": 7, "AUGUST": 8,
      "SEPTEMBER": 9, "OCTOBER": 10, "NOVEMBER": 11, "DECEMBER": 12
    }
    return monthMap[monthName] || 1
  }

  // Get exams for a specific day with dynamic academic year
  function getExamsForDay(year: number, month: number, day: number, exams: any[]) {
    const targetDate = new Date(year, month - 1, day)
    const targetDateString = targetDate.toISOString().split('T')[0]
    
    return exams.filter(exam => {
      if (!exam.date) return false
      
      // Normalize the exam date to YYYY-MM-DD format
      const examDate = new Date(exam.date)
      if (isNaN(examDate.getTime())) return false
      
      const examDateString = examDate.toISOString().split('T')[0]
      return examDateString === targetDateString
    })
  }

  // Generate calendar days for a month with dynamic academic year
  function generateCalendarDays(monthName: string, exams: any[]) {
    const monthIndex = getMonthIndex(monthName)
    
    // Use detected academic year or fallback to current year logic
    const year = academicYear 
      ? getAcademicYearForMonth(monthIndex, academicYear.startYear)
      : getAcademicYearForMonth(monthIndex)
    
    // Get first day of month and number of days
    const firstDay = new Date(year, monthIndex - 1, 1)
    const daysInMonth = new Date(year, monthIndex, 0).getDate()
    
    // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    // Convert to Monday-first format (0 = Monday, ..., 6 = Sunday)
    let startDay = firstDay.getDay() - 1
    if (startDay === -1) startDay = 6 // Sunday becomes 6 in Monday-first format
    
    // Create calendar grid with empty cells for padding
    const days = []
    
    // Add empty cells for the days before the 1st
    for (let i = 0; i < startDay; i++) {
      days.push({ day: null, exams: [] })
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayExams = getExamsForDay(year, monthIndex, day, exams)
      days.push({ day, exams: dayExams })
    }
    
    return days
  }

  // If not logged in, prompt to log in
  if (!user && !loading) {
    return (
      <div className="container py-10">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <h1 className="text-3xl font-bold">My Calendars</h1>
          <p className="text-muted-foreground">Please log in to view your saved calendars.</p>
          <Button onClick={() => router.push("/")}>
            Return to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-center text-3xl font-bold tracking-tight mb-8">
        MY CALENDARS
        {academicYear && (
          <span className="block text-lg font-normal text-muted-foreground mt-2">
            Academic Year {academicYear.startYear}/{(academicYear.endYear).toString().slice(-2)}
          </span>
        )}
      </h1>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="overflow-hidden border-2">
              <CardContent className="p-0">
                <div className="flex flex-col h-[200px]">
                  <div className="flex-1 flex items-center justify-center p-6">
                    <Skeleton className="h-6 w-3/4" />
                  </div>
                  <div className="bg-muted/30 p-3 flex justify-between items-center">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-20 rounded-md" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : calendars.length === 0 ? (
        <div className="flex flex-col items-center justify-center space-y-4 text-center py-10">
          <p className="text-muted-foreground">You haven't saved any calendars yet.</p>
          <Button onClick={() => router.push("/")}>
            Create a Calendar
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Calendar Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {calendars.map((calendar) => (
              <Card key={calendar.id} className={`overflow-hidden border-2 hover:shadow-md transition-all cursor-pointer ${selectedCalendar?.id === calendar.id ? 'ring-2 ring-primary' : ''}`}>
                <CardContent className="p-0">
                  <div className="flex flex-col h-[200px]">
                    <div className="flex-1 flex items-center justify-center p-6">
                      <h3 className="text-lg font-medium text-center line-clamp-3">{calendar.name}</h3>
                    </div>
                    <div className="bg-muted/30 p-3 flex justify-between items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive/80"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteCalendar(calendar.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={loadingCalendar === calendar.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewCalendar(calendar)
                        }}
                      >
                        {loadingCalendar === calendar.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4 mr-2" />
                        )}
                        {selectedCalendar?.id === calendar.id ? "Hide" : "View"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Calendar View Section */}
          {selectedCalendar && (
            <div className="bg-background rounded-lg border shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <h4 className="text-xl font-medium">Academic Calendar: {selectedCalendar.name}</h4>
                <Button 
                  variant="outline" 
                  onClick={() => router.push(`/?calendar=${selectedCalendar.id}`)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  View Full Calendar
                </Button>
              </div>
              
              {loadingCalendar === selectedCalendar.id ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mr-2" />
                  <span className="text-muted-foreground">Loading calendar data...</span>
                </div>
              ) : (
                <>
                  {/* Show calendar data summary */}
                  {calendarData[selectedCalendar.id] && (
                    <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Found <strong>{calendarData[selectedCalendar.id].length}</strong> exams in this calendar
                      </p>
                    </div>
                  )}
                  
                  {/* Show only months with exams in a responsive grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <TooltipProvider>
                      {academicMonths.map((month) => {
                        const exams = calendarData[selectedCalendar.id] || []
                        const hasExams = monthHasExams(month, exams)
                        
                        // Skip months without exams
                        if (!hasExams) return null
                        
                        const calendarDays = generateCalendarDays(month, exams)
                        const monthIndex = getMonthIndex(month)
                        const year = academicYear 
                          ? getAcademicYearForMonth(monthIndex, academicYear.startYear)
                          : getAcademicYearForMonth(monthIndex)
                        
                        return (
                          <div key={month} className="border rounded-lg shadow-sm overflow-hidden bg-card">
                            <div className="bg-muted/50 py-3 px-4 border-b">
                              <h5 className="text-sm font-semibold text-center">{month} {year}</h5>
                            </div>
                            
                            {/* Calendar Grid */}
                            <div className="p-3">
                              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
                                  <div key={day} className="font-medium py-2 text-muted-foreground">
                                    {day}
                                  </div>
                                ))}
                                
                                {/* Calendar days */}
                                {calendarDays.map((dayData, index) => {
                                  const dayHasExam = dayData.exams.length > 0
                                  
                                  return dayData.day ? (
                                    <Tooltip key={`${month}-${dayData.day}`} delayDuration={300}>
                                      <TooltipTrigger asChild>
                                        <div 
                                          className={`
                                            relative p-2 rounded-md text-sm min-h-[32px] flex items-center justify-center
                                            ${dayHasExam 
                                              ? 'bg-primary/15 text-primary font-medium border border-primary/30 hover:bg-primary/25' 
                                              : 'hover:bg-muted/50'
                                            }
                                            transition-colors cursor-pointer
                                          `}
                                        >
                                          {dayData.day}
                                          {dayHasExam && (
                                            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary"></span>
                                          )}
                                        </div>
                                      </TooltipTrigger>
                                      {dayHasExam && (
                                        <TooltipContent 
                                          side="top" 
                                          align="center" 
                                          className="w-72 p-0 max-h-80 overflow-hidden" 
                                          sideOffset={8}
                                        >
                                          <div className="bg-primary/10 px-4 py-3 text-sm font-medium border-b">
                                            <div className="flex justify-between items-center">
                                              <span>{month} {dayData.day}, {year}</span>
                                              <Badge variant="secondary" className="text-xs">
                                                {dayData.exams.length} exam{dayData.exams.length !== 1 ? 's' : ''}
                                              </Badge>
                                            </div>
                                          </div>
                                          <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
                                            {dayData.exams.map((exam: any) => (
                                              <div 
                                                key={exam.id}
                                                className="bg-card p-3 rounded-md border text-sm space-y-2"
                                              >
                                                <div className="font-semibold text-foreground">{exam.subject}</div>
                                                <div className="flex items-center gap-3 text-muted-foreground text-xs">
                                                  <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {exam.time || 'No time set'}
                                                  </span>
                                                  <span className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {exam.location || 'No location'}
                                                  </span>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                  {exam.school && (
                                                    <Badge variant="outline" className="text-xs">
                                                      {exam.school}
                                                    </Badge>
                                                  )}
                                                  {exam.degree && (
                                                    <Badge variant="outline" className="text-xs">
                                                      {exam.degree}
                                                    </Badge>
                                                  )}
                                                  {exam.year && (
                                                    <Badge variant="outline" className="text-xs">
                                                      Year {exam.year}
                                                    </Badge>
                                                  )}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                  ) : (
                                    <div 
                                      key={`${month}-empty-${index}`}
                                      className="p-2 min-h-[32px]"
                                    ></div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </TooltipProvider>
                  </div>
                  
                  {/* Show message if no months have exams */}
                  {calendarData[selectedCalendar.id] && 
                   calendarData[selectedCalendar.id].length > 0 && 
                   !academicMonths.some(month => monthHasExams(month, calendarData[selectedCalendar.id])) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No exam dates found for the current academic year.</p>
                    </div>
                  )}
                  
                  {/* Show message if no exams at all */}
                  {calendarData[selectedCalendar.id] && calendarData[selectedCalendar.id].length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No exams found matching the saved filters.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 