"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Eye, Trash2, Clock, MapPin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getUserCalendars, deleteUserCalendar } from "@/actions/user-calendars"
import { useAuth } from "@/context/auth-context"
import { getExams } from "@/actions/exam-actions"
import { formatDateString, getAcademicYearForMonth, getCurrentYear } from "@/utils/date-utils"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

// Add a custom window interface
declare global {
  interface Window {
    _didLogExamDate?: boolean;
  }
}

// Direct query function that bypasses the problematic getExams function
async function fetchExamsDirectly(filters: any) {
  console.log("DIRECT QUERY: Fetching exams with filters:", filters);
  
  // Special problematic subjects that need extra care
  const SPECIAL_SUBJECTS = ['LTP', 'DCE', 'AVD', 'TIA'];
  
  try {
    // Start with a base query
    let query = supabase
      .from('ETSINF')
      .select('exam_instance_id, exam_date, exam_time, duration_minutes, code, subject, acronym, degree, year, semester, place, comment, school')
      .order('exam_date', { ascending: true });
      
    // Apply non-subject filters
    if (filters.school && filters.school.length) {
      query = query.in('school', filters.school);
    }
    
    if (filters.degree && filters.degree.length) {
      query = query.in('degree', filters.degree);
    }
    
    if (filters.year && filters.year.length) {
      const numericYears = filters.year.map((y: string) => parseInt(y, 10));
      query = query.in('year', numericYears);
    }
    
    if (filters.semester && filters.semester.length) {
      query = query.in('semester', filters.semester);
    }
    
    console.log("DIRECT QUERY: Executing database query for base filters");
    // Execute the query without subject filters first to get all potential matches
    const { data: baseData, error: baseError } = await query;
    
    if (baseError) {
      console.error("Base query error:", baseError);
      return [];
    }
    
    console.log(`DIRECT QUERY: Found ${baseData.length} exams with base filters`);
    
    // Check if any of our problematic subjects are in the filters
    const hasSpecialSubjects = filters.subject && 
      filters.subject.some((s: string) => 
        SPECIAL_SUBJECTS.some(special => 
          s.includes(`(${special})`) || s.includes(special)));
    
    if (hasSpecialSubjects) {
      console.log("DETECTED SPECIAL SUBJECTS - Using specialized filtering logic");
      
      // Log all the acronyms from the database for debugging
      console.log("Available acronyms in database:", 
        [...new Set(baseData.map((exam: any) => exam.acronym))].filter(Boolean).sort());
      
      // Debug log for LTP, DCE, AVD, TIA subjects in the database
      SPECIAL_SUBJECTS.forEach(acronym => {
        const matchingExams = baseData.filter((exam: any) => 
          exam.acronym === acronym || exam.subject.includes(acronym));
        console.log(`Exams with ${acronym}:`, matchingExams.length);
        if (matchingExams.length > 0) {
          console.log(`Example ${acronym} exam:`, {
            subject: matchingExams[0].subject,
            acronym: matchingExams[0].acronym
          });
        }
      });
    }
    
    // If we have subject filters, filter the results in memory
    if (filters.subject && filters.subject.length) {
      console.log("DIRECT QUERY: Filtering by subjects in memory:", filters.subject);
      
      // Extract just the acronyms from the subjects array for easier matching
      const subjectAcronyms = filters.subject.map((s: string) => {
        if (s.includes('(') && s.includes(')')) {
          const match = s.match(/\(([^)]+)\)/);
          return match && match[1] ? match[1] : null;
        }
        return null;
      }).filter(Boolean);
      
      console.log("Extracted acronyms for matching:", subjectAcronyms);
      
      // Filter the results to include only exams that match any of the subjects
      const filteredData = baseData.filter((exam: any) => {
        // Special direct acronym matching for problematic subjects
        if (exam.acronym && subjectAcronyms.includes(exam.acronym)) {
          console.log(`Direct acronym match found: ${exam.acronym} for subject: ${exam.subject}`);
          return true;
        }
        
        // If no subjects match, we need to return false
        if (!filters.subject || filters.subject.length === 0) {
          return false;
        }
        
        // Check if "Select all" was used - in this case, all 11 subjects would be selected
        // In that case, we should just return true for any exam that made it through the base filters
        if (filters.subject.length === 11) {
          console.log("All subjects selected, bypassing subject filtering");
          return true;
        }
        
        return filters.subject.some((subject: string) => {
          // For each subject, check if it matches
          let searchSubject = subject;
          let acronymFromFilter = null;
          
          // If subject has an acronym in parentheses, extract just the name and acronym
          if (subject.includes('(') && subject.includes(')')) {
            searchSubject = subject.split('(')[0].trim();
            const match = subject.match(/\(([^)]+)\)/);
            if (match && match[1]) {
              acronymFromFilter = match[1];
            }
          }
          
          // Debug log for special subjects
          if (acronymFromFilter && SPECIAL_SUBJECTS.includes(acronymFromFilter)) {
            console.log(`Checking special subject: ${subject}`);
            console.log(`  - Search subject: "${searchSubject}"`);
            console.log(`  - Acronym from filter: "${acronymFromFilter}"`);
            console.log(`  - Exam subject: "${exam.subject}"`);
            console.log(`  - Exam acronym: "${exam.acronym}"`);
          }
          
          // Check if the exam subject contains the search subject
          const subjectMatches = exam.subject.toLowerCase().includes(searchSubject.toLowerCase());
          
          // Or if the acronym matches (if the subject has an acronym in parentheses)
          let acronymMatches = false;
          if (acronymFromFilter && exam.acronym) {
            // For special problematic subjects, do exact matching
            if (SPECIAL_SUBJECTS.includes(acronymFromFilter)) {
              acronymMatches = exam.acronym === acronymFromFilter;
            } else {
              // For regular subjects, use more flexible matching
              acronymMatches = exam.acronym.toLowerCase() === acronymFromFilter.toLowerCase();
            }
          }
          
          const matches = subjectMatches || acronymMatches;
          
          // Extra logging for special subjects
          if (acronymFromFilter && SPECIAL_SUBJECTS.includes(acronymFromFilter)) {
            console.log(`  - Subject matches: ${subjectMatches}`);
            console.log(`  - Acronym matches: ${acronymMatches}`);
            console.log(`  - Final result: ${matches}`);
          }
          
          return matches;
        });
      });
      
      console.log(`DIRECT QUERY: Found ${filteredData.length} exams after subject filtering`);
      
      // Map the data to match the format expected by the frontend
      return filteredData.map((exam: any) => ({
        id: exam.exam_instance_id,
        date: exam.exam_date,
        time: exam.exam_time,
        subject: exam.subject,
        code: exam.code?.toString() || '',
        location: exam.place || '',
        year: exam.year?.toString() || '',
        semester: exam.semester || '',
        school: exam.school || '',
        degree: exam.degree || '',
      }));
    }
    
    // If no subject filters, return all the results mapped to the expected format
    return baseData.map((exam: any) => ({
      id: exam.exam_instance_id,
      date: exam.exam_date,
      time: exam.exam_time,
      subject: exam.subject,
      code: exam.code?.toString() || '',
      location: exam.place || '',
      year: exam.year?.toString() || '',
      semester: exam.semester || '',
      school: exam.school || '',
      degree: exam.degree || '',
    }));
  } catch (error) {
    console.error("Error in direct query:", error);
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
    if (selectedCalendar?.id === calendar.id) {
      // If already selected, deselect it
      setSelectedCalendar(null)
      return
    }

    // Set as selected
    setSelectedCalendar(calendar)
    
    // Log the calendar object to inspect its filters
    console.log("Selected calendar:", calendar)
    console.log("Saved filters:", calendar.filters)

    // Don't fetch again if we already have the data
    if (calendarData[calendar.id]) {
      console.log("Using cached data:", calendarData[calendar.id])
      return
    }

    try {
      // Use direct query approach that completely bypasses filter logic issues
      console.log("Using direct query approach for more reliable results")
      const exams = await fetchExamsDirectly(calendar.filters)
      
      console.log(`Direct query returned ${exams.length} exams`)
      
      if (exams.length === 0) {
        // If no exams found, try without subject filters as a fallback
        console.log("No exams found, trying without subject filters")
        const baseFilters = {
          ...calendar.filters,
          subject: undefined
        }
        
        const baseExams = await fetchExamsDirectly(baseFilters)
        console.log(`Found ${baseExams.length} exams without subject filters`)
        
        if (baseExams.length > 0) {
          setCalendarData(prev => ({
            ...prev,
            [calendar.id]: baseExams
          }))
          
          toast({
            title: "Filter adjustment",
            description: "Subject filters were too restrictive. Showing all matching exams.",
          })
          return
        }
      }
      
      setCalendarData(prev => ({
        ...prev,
        [calendar.id]: exams
      }))
    } catch (error) {
      console.error("Error fetching calendar data:", error)
      toast({
        title: "Failed to load calendar",
        description: "There was an error loading the calendar data.",
        variant: "destructive",
      })
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
    const monthIndex = getMonthIndex(monthName)
    
    // Check if there are any exams for this month
    const hasExams = exams.some(exam => {
      // Log a few examples to debug date parsing
      if (monthName === academicMonths[0] && !window._didLogExamDate) {
        console.log("Example exam date:", exam.date);
        console.log("Parsed date:", new Date(exam.date));
        console.log("Month from parsed date:", new Date(exam.date).getMonth() + 1);
        console.log("Expected month index:", monthIndex);
        window._didLogExamDate = true;
      }
      
      const examDate = new Date(exam.date)
      return examDate.getMonth() + 1 === monthIndex
    })
    
    if (monthName === academicMonths[0]) {
      console.log(`Month ${monthName} (index ${monthIndex}) has exams: ${hasExams}`);
    }
    
    return hasExams
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

  // Get exams for a specific day
  function getExamsForDay(year: number, month: number, day: number, exams: any[]) {
    const dateString = formatDateString(year, month, day)
    return exams.filter(exam => exam.date === dateString)
  }

  // Generate calendar days for a month
  function generateCalendarDays(monthName: string, exams: any[]) {
    const monthIndex = getMonthIndex(monthName)
    const year = getAcademicYearForMonth(monthIndex)
    
    console.log(`Generating calendar for ${monthName} ${year} (month index: ${monthIndex})`);
    
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
      <h1 className="text-center text-3xl font-bold tracking-tight mb-8">MY CALENDARS</h1>

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
        <div className="space-y-10">
          {/* Calendar Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {calendars.map((calendar) => (
              <Card key={calendar.id} className={`overflow-hidden border-2 hover:shadow-md transition-all ${selectedCalendar?.id === calendar.id ? 'ring-2 ring-primary' : ''}`}>
                <CardContent className="p-0">
                  <div className="flex flex-col h-[200px]">
                    <div className="flex-1 flex items-center justify-center p-6">
                      <h3 className="text-lg font-medium text-center">{calendar.name}</h3>
                    </div>
                    <div className="bg-muted/30 p-3 flex justify-between items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive/80"
                        onClick={() => handleDeleteCalendar(calendar.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewCalendar(calendar)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
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
            <div className="bg-background rounded-lg border shadow-sm p-6 mt-8">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-xl font-medium">Academic Calendar: {selectedCalendar.name}</h4>
                <Button 
                  variant="outline" 
                  onClick={() => router.push(`/?calendar=${selectedCalendar.id}`)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  View Full Calendar
                </Button>
              </div>
              
              {/* Show only months with exams in a 3-column grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <TooltipProvider>
                  {academicMonths.map((month) => {
                    const exams = calendarData[selectedCalendar.id] || []
                    const hasExams = monthHasExams(month, exams)
                    
                    // Skip months without exams
                    if (!hasExams) return null
                    
                    const calendarDays = generateCalendarDays(month, exams)
                    const monthIndex = getMonthIndex(month)
                    const year = getAcademicYearForMonth(monthIndex)
                    
                    return (
                      <div key={month} className="border rounded-lg shadow-sm overflow-hidden">
                        <div className="bg-muted/30 py-2 px-4">
                          <h5 className="text-md font-medium text-center">{month}</h5>
                        </div>
                        
                        {/* Calendar Grid */}
                        <div className="p-2">
                          <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
                            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
                              <div key={day} className="font-medium py-1">
                                {day}
                              </div>
                            ))}
                            
                            {/* Calendar days */}
                            {calendarDays.map((dayData, index) => {
                              const dayHasExam = dayData.exams.length > 0
                              
                              return dayData.day ? (
                                <Tooltip key={`${month}-${dayData.day}`} delayDuration={150}>
                                  <TooltipTrigger asChild>
                                    <div 
                                      className={`
                                        relative p-1.5 rounded-sm
                                        ${!dayData.day ? 'bg-muted/30' : 'hover:bg-muted hover:cursor-pointer'}
                                        ${dayHasExam ? 'bg-primary/10 text-primary font-medium' : ''}
                                      `}
                                    >
                                      {dayData.day}
                                      {dayHasExam && (
                                        <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary"></span>
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  {dayHasExam && (
                                    <TooltipContent 
                                      side="top" 
                                      align="center" 
                                      className="w-64 p-0 max-h-80 overflow-y-auto" 
                                      sideOffset={5}
                                    >
                                      <div className="bg-primary/10 px-3 py-2 text-xs font-medium border-b">
                                        <div className="flex justify-between items-center">
                                          <span>{month} {dayData.day}, {year}</span>
                                          <span className="bg-primary/20 px-1.5 py-0.5 rounded text-[10px]">
                                            {dayData.exams.length} exam{dayData.exams.length !== 1 ? 's' : ''}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="p-2 space-y-2 max-h-64 overflow-y-auto">
                                        {dayData.exams.map((exam: any) => (
                                          <div 
                                            key={exam.id}
                                            className="bg-card p-2 rounded-sm border text-xs"
                                          >
                                            <div className="font-medium mb-1">{exam.subject}</div>
                                            <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                                              <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {exam.time}
                                              </span>
                                              <span className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {exam.location || 'No location'}
                                              </span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                              {exam.school && (
                                                <Badge variant="outline" className="text-[10px] h-4">
                                                  {exam.school}
                                                </Badge>
                                              )}
                                              {exam.degree && (
                                                <Badge variant="outline" className="text-[10px] h-4">
                                                  {exam.degree}
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
                                  className="bg-muted/30 p-1.5 rounded-sm"
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
            </div>
          )}
        </div>
      )}
    </div>
  )
} 