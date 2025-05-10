"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Calendar, Download, Save, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { ViewToggle } from "@/components/view-toggle"
import { ExamListView } from "@/components/exam-list-view"
import { getExams } from "@/actions/exam-actions"

// Generate month data dynamically
const generateMonths = () => {
  const currentYear = new Date().getFullYear();
  const months = [];
  
  for (let month = 0; month < 12; month++) {
    const firstDayOfMonth = new Date(currentYear, month, 1);
    const daysInMonth = new Date(currentYear, month + 1, 0).getDate();
    
    // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    // Convert to Monday-first format (0 = Monday, ..., 6 = Sunday)
    let startDay = firstDayOfMonth.getDay() - 1;
    if (startDay === -1) startDay = 6; // Sunday becomes 6 in Monday-first format
    
    months.push({
      name: firstDayOfMonth.toLocaleString('default', { month: 'long' }),
      days: daysInMonth,
      startDay: startDay
    });
  }
  
  return months;
};

export function CalendarDisplay() {
  const [selectedDay, setSelectedDay] = useState<{ month: string; day: number } | null>(null)
  const [selectedExams, setSelectedExams] = useState<any[]>([])
  const [visibleMonths, setVisibleMonths] = useState<number[]>([0, 1, 2])
  const [view, setView] = useState<"calendar" | "list">("calendar")
  const [exams, setExams] = useState<any[]>([])
  const [months, setMonths] = useState(generateMonths().slice(0, 6)) // First 6 months by default
  
  useEffect(() => {
    const fetchExams = async () => {
      const data = await getExams()
      setExams(data)
    }
    
    fetchExams()
  }, [])

  const handleDayClick = (month: string, day: number) => {
    const newSelection = { month, day }
    setSelectedDay(newSelection)

    // Find exams for this day
    const formattedDay = day.toString().padStart(2, "0")
    const monthIndex = months.findIndex((m) => m.name === month) + 1
    const formattedMonth = monthIndex.toString().padStart(2, "0")
    const dateString = `${new Date().getFullYear()}-${formattedMonth}-${formattedDay}`

    const dayExams = exams.filter((exam) => exam.date === dateString)
    setSelectedExams(dayExams)
  }

  const hasExam = (month: string, day: number) => {
    const monthIndex = months.findIndex((m) => m.name === month) + 1
    const formattedMonth = monthIndex.toString().padStart(2, "0")
    const formattedDay = day.toString().padStart(2, "0")
    const dateString = `${new Date().getFullYear()}-${formattedMonth}-${formattedDay}`

    return exams.some((exam) => exam.date === dateString)
  }

  const showPreviousMonths = () => {
    if (visibleMonths[0] > 0) {
      setVisibleMonths(visibleMonths.map((m) => m - 1))
    }
  }

  const showNextMonths = () => {
    if (visibleMonths[visibleMonths.length - 1] < months.length - 1) {
      setVisibleMonths(visibleMonths.map((m) => m + 1))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Exam Calendar</h2>
          <p className="text-sm text-muted-foreground">Found {exams.length} exams for the selected period</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ViewToggle view={view} onChange={setView} />

          <div className="hidden sm:flex sm:gap-2">
            <Button variant="outline" size="sm" className="h-10 gap-1.5 rounded-md">
              <Save className="h-4 w-4" />
              <span>Save View</span>
            </Button>
            <Button variant="outline" size="sm" className="h-10 gap-1.5 rounded-md">
              <Calendar className="h-4 w-4" />
              <span>Google Calendar</span>
            </Button>
            <Button variant="outline" size="sm" className="h-10 gap-1.5 rounded-md">
              <Download className="h-4 w-4" />
              <span>iCal Export</span>
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 sm:hidden">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Save className="mr-2 h-4 w-4" />
                <span>Save View</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Calendar className="mr-2 h-4 w-4" />
                <span>Google Calendar</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                <span>iCal Export</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === "calendar" ? (
          <motion.div
            key="calendar-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between rounded-lg border bg-card p-3 shadow-sm">
              <Button
                variant="ghost"
                size="icon"
                onClick={showPreviousMonths}
                disabled={visibleMonths[0] === 0}
                className="h-8 w-8 rounded-full"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous months</span>
              </Button>
              <div className="text-sm font-medium">
                {months[visibleMonths[0]].name} - {months[visibleMonths[visibleMonths.length - 1]].name} 2024
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={showNextMonths}
                disabled={visibleMonths[visibleMonths.length - 1] === months.length - 1}
                className="h-8 w-8 rounded-full"
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next months</span>
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <TooltipProvider>
                {visibleMonths.map((monthIndex) => {
                  const month = months[monthIndex]
                  return (
                    <Card key={month.name} className="overflow-hidden transition-all duration-300 hover:shadow-lg">
                      <CardHeader className="bg-muted/30 py-4">
                        <CardTitle className="text-center text-lg font-medium tracking-tight">{month.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium">
                          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
                            <div key={day} className="py-1">
                              {day}
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1.5 text-center text-sm">
                          {Array.from({ length: month.startDay }).map((_, i) => (
                            <div key={`empty-start-${i}`} className="rounded-md bg-muted/30 p-2"></div>
                          ))}

                          {Array.from({ length: month.days }).map((_, i) => {
                            const day = i + 1
                            const isSelected = selectedDay?.month === month.name && selectedDay?.day === day
                            const dayHasExam = hasExam(month.name, day)

                            return (
                              <Tooltip key={`day-${day}`}>
                                <TooltipTrigger asChild>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`relative rounded-md p-2 transition-all ${
                                      isSelected
                                        ? "bg-primary text-primary-foreground shadow-md"
                                        : dayHasExam
                                          ? "bg-primary/10 font-medium text-primary"
                                          : "hover:bg-accent"
                                    }`}
                                    onClick={() => handleDayClick(month.name, day)}
                                  >
                                    {day}
                                    {dayHasExam && (
                                      <span className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary"></span>
                                    )}
                                  </motion.button>
                                </TooltipTrigger>
                                {dayHasExam && (
                                  <TooltipContent
                                    side="top"
                                    align="center"
                                    className="max-w-xs border-primary/20 p-0 shadow-lg"
                                    sideOffset={5}
                                  >
                                    <div className="max-h-64 space-y-1 overflow-y-auto p-1">
                                      <div className="rounded-t-md bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
                                        {month.name} {day}, 2024
                                      </div>
                                      {exams
                                        .filter((exam) => {
                                          const monthIndex = months.findIndex((m) => m.name === month.name) + 1
                                          const formattedMonth = monthIndex.toString().padStart(2, "0")
                                          const formattedDay = day.toString().padStart(2, "0")
                                          const dateString = `${new Date().getFullYear()}-${formattedMonth}-${formattedDay}`
                                          return exam.date === dateString
                                        })
                                        .map((exam) => (
                                          <div
                                            key={exam.id}
                                            className="rounded-md border border-border/50 bg-card p-3 text-left shadow-sm"
                                          >
                                            <div className="mb-1 font-medium">{exam.subject}</div>
                                            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                                              <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {exam.time}
                                              </span>
                                              <span className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {exam.location}
                                              </span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                              <Badge variant="outline" className="text-xs">
                                                {exam.year}
                                              </Badge>
                                              <Badge variant="outline" className="text-xs">
                                                {exam.semester}
                                              </Badge>
                                            </div>
                                          </div>
                                        ))}
                                    </div>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            )
                          })}

                          {Array.from({ length: (7 - ((month.startDay + month.days) % 7)) % 7 }).map((_, i) => (
                            <div key={`empty-end-${i}`} className="rounded-md bg-muted/30 p-2"></div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </TooltipProvider>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ExamListView />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function MoreHorizontal(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  )
}

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
