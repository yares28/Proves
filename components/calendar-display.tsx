"use client";

import type React from "react";

import { useState, useEffect, useMemo, Suspense } from "react";
import {
  Calendar,
  Download,
  Save,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  List,
  Grid,
  Share2,
  Settings,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { ViewToggle } from "@/components/view-toggle";
import { ExamListView } from "@/components/exam-list-view";
import { SaveCalendarDialog } from "@/components/save-calendar-dialog";
import { toast } from "@/components/ui/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CalendarCheck } from "lucide-react";
import { GoogleCalendarInstructions } from "@/components/ui/google-calendar-instructions";
import { getExams } from "@/actions/exam-actions";
import {
  formatDateString,
  getCurrentYear,
  getAcademicYearForMonth,
  detectAcademicYearFromExams,
  generateAcademicYearMonths,
} from "@/utils/date-utils";
import {
  saveUserCalendar,
  getUserCalendarNames,
} from "@/actions/user-calendars";
import { getCurrentSession, getFreshAuthTokens } from "@/utils/auth-helpers";
import { useAuth } from "@/context/auth-context";
import styles from "@/styles/tooltip.module.css";

const GOOGLE_ICAL_BASE_URL = "https://upv-cal.vercel.app";

export function CalendarDisplay({
  activeFilters = {},
}: {
  activeFilters?: Record<string, string[]>;
}) {
  const [selectedDay, setSelectedDay] = useState<{
    month: string;
    day: number;
  } | null>(null);
  const [selectedExams, setSelectedExams] = useState<any[]>([]);
  const [visibleMonths, setVisibleMonths] = useState<number[]>([
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
  ]); // Show all 12 months by default
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [exams, setExams] = useState<any[]>([]);
  const [months, setMonths] = useState<any[]>([]);
  const [academicYear, setAcademicYear] = useState<{
    startYear: number;
    endYear: number;
  } | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [currentIcalUrl, setCurrentIcalUrl] = useState("");

  const { user, syncToken } = useAuth();

  // Check if ETSINF is in the schools filter
  const hasETSINFFilter = activeFilters?.school?.includes("ETSINF");

  // Log the active filters to debug
  useEffect(() => {
    console.log("CalendarDisplay - Active Filters:", activeFilters);
    console.log("ETSINF Filter Active:", hasETSINFFilter);
  }, [activeFilters, hasETSINFFilter]);

  // Fetch exams when filters change
  useEffect(() => {
    const fetchExams = async () => {
      try {
        console.log(
          "CalendarDisplay - Fetching exams with filters:",
          activeFilters
        );
        // Pass filters directly to getExams
        const data = await getExams(activeFilters);
        console.log(
          `CalendarDisplay - Fetched ${data.length} exams. Sample:`,
          data.slice(0, 2)
        );

        // For debugging - log all unique dates in the exam data
        if (data.length > 0) {
          const uniqueDates = [
            ...new Set(data.map((exam) => exam.date)),
          ].sort();
          console.log("CalendarDisplay - Unique exam dates:", uniqueDates);

          // Detect academic year from exam dates
          const detectedAcademicYear = detectAcademicYearFromExams(uniqueDates);
          console.log(
            "CalendarDisplay - Detected academic year:",
            detectedAcademicYear
          );

          if (detectedAcademicYear) {
            setAcademicYear(detectedAcademicYear);
            // Generate months for the detected academic year
            const academicMonths = generateAcademicYearMonths(
              detectedAcademicYear.startYear
            );
            console.log(
              "CalendarDisplay - Generated academic months:",
              academicMonths.map((m) => `${m.name} ${m.year}`)
            );
            setMonths(academicMonths);
          } else {
            // Fallback to current year if no academic year detected
            console.log(
              "CalendarDisplay - No academic year detected, using current year fallback"
            );
            const currentYear = getCurrentYear();
            const fallbackMonths = generateAcademicYearMonths(currentYear);
            setMonths(fallbackMonths);
            setAcademicYear({
              startYear: currentYear,
              endYear: currentYear + 1,
            });
          }
        } else {
          // No exams, use current year as fallback
          console.log(
            "CalendarDisplay - No exams found, using current year fallback"
          );
          const currentYear = getCurrentYear();
          const fallbackMonths = generateAcademicYearMonths(currentYear);
          setMonths(fallbackMonths);
          setAcademicYear({ startYear: currentYear, endYear: currentYear + 1 });
        }

        setExams(data);
      } catch (error) {
        console.error("CalendarDisplay - Error fetching exams:", error);
        setExams([]);
        // Set fallback months even on error
        const currentYear = getCurrentYear();
        const fallbackMonths = generateAcademicYearMonths(currentYear);
        setMonths(fallbackMonths);
        setAcademicYear({ startYear: currentYear, endYear: currentYear + 1 });
      }
    };

    fetchExams();
  }, [activeFilters]);

  // Fetch existing calendar names when the component mounts or user changes
  useEffect(() => {
    const fetchCalendarNames = async () => {
      if (user?.id) {
        try {
          // Get fresh auth tokens with automatic refresh
          const tokens = await getFreshAuthTokens();

          if (!tokens) {
            console.warn(
              "No valid tokens available for fetching calendar names"
            );
            // setExistingNames([]); // This state was removed, so this line is removed
            return;
          }

          // const names = await getUserCalendarNames( // This function was removed, so this line is removed
          //   user.id,
          //   tokens.accessToken,
          //   tokens.refreshToken
          // );
          // setExistingNames(names); // This state was removed, so this line is removed
        } catch (error) {
          console.error("Error fetching calendar names:", error);
          // setExistingNames([]); // This state was removed, so this line is removed

          // Show error toast for auth issues
          if (error instanceof Error && error.message.includes("auth")) {
            toast({
              title: "Error de Autenticación",
              description: "Por favor inicia sesión para guardar calendarios.",
              variant: "destructive",
            });
          }
        }
      }
    };

    fetchCalendarNames();
  }, [user?.id, toast]);

  const handleDayClick = (month: string, day: number) => {
    const newSelection = { month, day };
    setSelectedDay(newSelection);

    // Find the month data to get the correct year and month number
    const monthData = months.find((m) => m.name === month);
    if (!monthData) {
      console.error("CalendarDisplay - Month data not found for:", month);
      return;
    }

    const dateString = formatDateString(
      monthData.year,
      monthData.monthNumber,
      day
    );
    console.log(`CalendarDisplay - Looking for exams on: ${dateString}`);

    const dayExams = exams.filter((exam) => exam.date === dateString);
    console.log(
      `CalendarDisplay - Found ${dayExams.length} exams for ${dateString}:`,
      dayExams
    );
    setSelectedExams(dayExams);
  };

  const hasExam = (month: string, day: number) => {
    // Find the month data to get the correct year and month number
    const monthData = months.find((m) => m.name === month);
    if (!monthData) {
      return false;
    }

    const dateString = formatDateString(
      monthData.year,
      monthData.monthNumber,
      day
    );
    const hasExamsForDay = exams.some((exam) => exam.date === dateString);
    return hasExamsForDay;
  };

  const showPreviousMonths = () => {
    if (visibleMonths[0] > 0) {
      setVisibleMonths(visibleMonths.map((m) => m - 1));
    }
  };

  const showNextMonths = () => {
    if (visibleMonths[visibleMonths.length - 1] < months.length - 1) {
      setVisibleMonths(visibleMonths.map((m) => m + 1));
    }
  };

  // Open save dialog if user is logged in, otherwise show login toast
  const openSaveDialog = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save calendars",
        variant: "destructive",
      });
      return;
    }
    setSaveDialogOpen(true);
  };

  // Save calendar view function
  const handleSaveCalendar = async (name: string) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para guardar calendarios.",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Debug: Log what we're about to save
      console.log('🔍 [DEBUG] Saving calendar with data:', {
        name,
        activeFilters,
        currentExamsCount: exams.length,
        currentExamDates: exams.slice(0, 5).map(e => ({ subject: e.subject, date: e.date }))
      });

      // Get current session for authentication
      const session = await getCurrentSession();

      if (!session?.access_token) {
        toast({
          title: "Error de Autenticación",
          description: "Por favor inicia sesión nuevamente.",
          variant: "destructive",
        });
        return false;
      }

      const { saveUserCalendar } = await import("@/actions/user-calendars");

      await saveUserCalendar({
        name,
        filters: activeFilters,
        userId: user.id,
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
      });

      toast({
        title: "¡Éxito!",
        description: `Calendario "${name}" guardado correctamente.`,
      });

      // Refresh calendar names
      // const names = await getUserCalendarNames( // This function was removed, so this line is removed
      //   user.id,
      //   session.access_token,
      //   session.refresh_token
      // );
      // setExistingNames(names); // This state was removed, so this line is removed

      return true;
    } catch (error) {
      console.error("Error saving calendar:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al guardar el calendario.",
        variant: "destructive",
      });
      return false;
    }
  };

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
          <h2 className="text-2xl font-bold tracking-tight">
            Calendario de Exámenes
            {academicYear && (
              <span className="text-lg font-normal text-muted-foreground ml-2">
                ({academicYear.startYear}/
                {academicYear.endYear.toString().slice(-2)})
              </span>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">
            Se encontraron {exams.length} exámenes para el período seleccionado
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ViewToggle view={view} onChange={setView} />

          <div className="hidden sm:flex sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-10 gap-1.5 rounded-md"
              onClick={openSaveDialog}
            >
              <Save className="h-4 w-4" />
              <span>Save View</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 gap-1.5 rounded-md"
              disabled={exams.length === 0}
              onClick={async () => {
                try {
                  // Generate UPV-style token URL
                  const { generateUPVTokenUrl } = await import("@/lib/utils");
                  const tokenPath = await generateUPVTokenUrl(activeFilters, "UPV Exams");
                  const icalUrl = `${GOOGLE_ICAL_BASE_URL}${tokenPath}`;

                  // Validate the iCal feed before providing instructions
                  try {
                    const response = await fetch(icalUrl, { method: "HEAD" });
                    if (!response.ok) {
                      throw new Error('Calendar feed is not accessible');
                    }
                  } catch (error) {
                    console.error('❌ Calendar feed validation failed:', error);
                    toast({
                      title: "Error",
                      description: "El calendario no está disponible en este momento. Inténtalo más tarde.",
                      variant: "destructive",
                    });
                    return;
                  }

                  // Copy URL to clipboard for easy pasting
                  try {
                    await navigator.clipboard.writeText(icalUrl);
                    
                    // Show instructions modal instead of alert
                    setCurrentIcalUrl(icalUrl);
                    setInstructionsOpen(true);
                    
                    toast({
                      title: "URL copiada al portapapeles",
                      description: "Se han mostrado las instrucciones para añadir el calendario.",
                    });
                  } catch (clipboardError) {
                    // Fallback if clipboard API is not available
                    console.warn('Clipboard API not available:', clipboardError);
                    
                    // Still show the modal even if clipboard fails
                    setCurrentIcalUrl(icalUrl);
                    setInstructionsOpen(true);
                    
                    toast({
                      title: "Instrucciones mostradas",
                      description: "Copia manualmente la URL del cuadro de diálogo.",
                    });
                  }
                } catch (error) {
                  console.error("Error generating token URL:", error);
                  toast({
                    title: "Error generating calendar link",
                    description: "Please try again later.",
                    variant: "destructive",
                  });
                }
              }}
            >
              <Calendar className="h-4 w-4" />
              <span>Add to Google</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 gap-1.5 rounded-md"
              disabled={exams.length === 0}
              onClick={async () => {
                try {
                  if (
                    window.location.origin.includes("localhost") ||
                    window.location.origin.includes("127.0.0.1")
                  ) {
                    toast({
                      title: "Cannot Export from Localhost",
                      description:
                        "Apple Calendar cannot access localhost. Please use the production site.",
                      variant: "destructive",
                    });
                    return;
                  }

                  // Generate UPV-style token URL
                  const { generateUPVTokenUrl } = await import("@/lib/utils");
                  const tokenPath = await generateUPVTokenUrl(activeFilters, "UPV Exams");
                  const icalUrl = `https://upv-cal.vercel.app${tokenPath}`;
                  const webcalUrl = icalUrl.replace(/^https?:/, "webcal:");
                  window.location.href = webcalUrl;
                } catch (error) {
                  console.error("Error generating token URL:", error);
                  toast({
                    title: "Error generating calendar link",
                    description: "Please try again later.",
                    variant: "destructive",
                  });
                }
              }}
            >
              <Download className="h-4 w-4" />
              <span>Add to Apple</span>
            </Button>
            {/* Direct Download Button */}
            <Button
              variant="outline"
              size="sm"
              className="h-10 gap-1.5 rounded-md"
              disabled={exams.length === 0}
              onClick={async () => {
                try {
                  // Build direct API URL with current filters
                  const params = new URLSearchParams();
                  params.set("name", "UPV Exams");

                  // Add individual filter parameters
                  if (activeFilters.school && activeFilters.school.length > 0) {
                    activeFilters.school.forEach((school) =>
                      params.append("school", school)
                    );
                  }
                  if (activeFilters.degree && activeFilters.degree.length > 0) {
                    activeFilters.degree.forEach((degree) =>
                      params.append("degree", degree)
                    );
                  }
                  if (activeFilters.year && activeFilters.year.length > 0) {
                    activeFilters.year.forEach((year) =>
                      params.append("year", year)
                    );
                  }
                  if (activeFilters.semester && activeFilters.semester.length > 0) {
                    activeFilters.semester.forEach((semester) =>
                      params.append("semester", semester)
                    );
                  }
                  if (activeFilters.subject && activeFilters.subject.length > 0) {
                    activeFilters.subject.forEach((subject) =>
                      params.append("subject", subject)
                    );
                  }

                  const icalUrl = `${GOOGLE_ICAL_BASE_URL}/api/ical?${params.toString()}`;
                  console.log("📥 Downloading from:", icalUrl);

                  // Fetch the iCal content
                  const response = await fetch(icalUrl);
                  if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                  }
                  
                  const icalContent = await response.text();
                  console.log("📄 Downloaded content length:", icalContent.length);
                  
                  // Validate content
                  if (!icalContent.includes("BEGIN:VCALENDAR")) {
                    throw new Error("Invalid iCal content received");
                  }
                  
                  // Create blob and download
                  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `upv-exams-${new Date().toISOString().slice(0, 10)}.ics`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);

                  toast({
                    title: "Download Started",
                    description: `Downloaded ${(icalContent.match(/BEGIN:VEVENT/g) || []).length} exams to your device.`,
                  });
                } catch (error) {
                  console.error("Error downloading iCal:", error);
                  toast({
                    title: "Download Failed",
                    description: error instanceof Error ? error.message : "Please try again later.",
                    variant: "destructive",
                  });
                }
              }}
            >
              <Download className="h-4 w-4" />
              <span>Download .ics</span>
            </Button>
            {/* Development: Manual iCal download */}
            {process.env.NODE_ENV === "development" && (
              <Button
                variant="outline"
                size="sm"
                className="h-10 gap-1.5 rounded-md border-orange-300 text-orange-600"
                disabled={exams.length === 0}
                onClick={() => {
                  import("@/lib/utils").then(
                    ({ generateICalContent, downloadICalFile }) => {
                      const icalContent = generateICalContent(exams, {
                        calendarName: "UPV Exams (Dev)",
                        timeZone: "Europe/Madrid",
                        reminderMinutes: [24 * 60, 60],
                      });
                      downloadICalFile(icalContent, "upv-exams-dev.ics");
                    }
                  );
                }}
                title="Development: Download .ics file for inspection"
              >
                <Download className="h-4 w-4" />
                <span>Dev Download</span>
              </Button>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 sm:hidden">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={openSaveDialog}>
                <Save className="mr-2 h-4 w-4" />
                <span>Save View</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={exams.length === 0}
                onClick={async () => {
                  try {
                    // Generate UPV-style token URL
                    const { generateUPVTokenUrl } = await import("@/lib/utils");
                    const tokenPath = await generateUPVTokenUrl(activeFilters, "UPV Exams");
                    const icalUrl = `${GOOGLE_ICAL_BASE_URL}${tokenPath}`;

                    // Validate the iCal feed before providing instructions
                    try {
                      const response = await fetch(icalUrl, { method: "HEAD" });
                      if (!response.ok) {
                        throw new Error('Calendar feed is not accessible');
                      }
                    } catch (error) {
                      console.error('❌ Calendar feed validation failed:', error);
                      toast({
                        title: "Error",
                        description: "El calendario no está disponible en este momento. Inténtalo más tarde.",
                        variant: "destructive",
                      });
                      return;
                    }

                    // Copy URL to clipboard for easy pasting
                    try {
                      await navigator.clipboard.writeText(icalUrl);
                      
                      // Show instructions modal instead of alert
                      setCurrentIcalUrl(icalUrl);
                      setInstructionsOpen(true);
                      
                      toast({
                        title: "URL copiada al portapapeles",
                        description: "Se han mostrado las instrucciones para añadir el calendario.",
                      });
                    } catch (clipboardError) {
                      // Fallback if clipboard API is not available
                      console.warn('Clipboard API not available:', clipboardError);
                      
                      // Still show the modal even if clipboard fails
                      setCurrentIcalUrl(icalUrl);
                      setInstructionsOpen(true);
                      
                      toast({
                        title: "Instrucciones mostradas",
                        description: "Copia manualmente la URL del cuadro de diálogo.",
                      });
                    }
                  } catch (error) {
                    console.error("Error generating token URL:", error);
                    toast({
                      title: "Error generating calendar link",
                      description: "Please try again later.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <Calendar className="mr-2 h-4 w-4" />
                <span>Add to Google</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={exams.length === 0}
                onClick={async () => {
                  try {
                    if (
                      window.location.origin.includes("localhost") ||
                      window.location.origin.includes("127.0.0.1")
                    ) {
                      toast({
                        title: "Cannot Export from Localhost",
                        description:
                          "Apple Calendar cannot access localhost. Please use the production site.",
                        variant: "destructive",
                      });
                      return;
                    }

                    // Generate UPV-style token URL
                    const { generateUPVTokenUrl } = await import("@/lib/utils");
                    const tokenPath = await generateUPVTokenUrl(activeFilters, "UPV Exams");
                    const icalUrl = `https://upv-cal.vercel.app${tokenPath}`;
                    const webcalUrl = icalUrl.replace(/^https?:/, "webcal:");
                    window.location.href = webcalUrl;
                  } catch (error) {
                    console.error("Error generating token URL:", error);
                    toast({
                      title: "Error generating calendar link",
                      description: "Please try again later.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                <span>Add to Apple</span>
              </DropdownMenuItem>
              {/* Direct Download for Mobile */}
              <DropdownMenuItem
                disabled={exams.length === 0}
                onClick={async () => {
                  try {
                    // Build direct API URL with current filters
                    const params = new URLSearchParams();
                    params.set("name", "UPV Exams");

                    // Add individual filter parameters
                    if (activeFilters.school && activeFilters.school.length > 0) {
                      activeFilters.school.forEach((school) =>
                        params.append("school", school)
                      );
                    }
                    if (activeFilters.degree && activeFilters.degree.length > 0) {
                      activeFilters.degree.forEach((degree) =>
                        params.append("degree", degree)
                      );
                    }
                    if (activeFilters.year && activeFilters.year.length > 0) {
                      activeFilters.year.forEach((year) =>
                        params.append("year", year)
                      );
                    }
                    if (activeFilters.semester && activeFilters.semester.length > 0) {
                      activeFilters.semester.forEach((semester) =>
                        params.append("semester", semester)
                      );
                    }
                    if (activeFilters.subject && activeFilters.subject.length > 0) {
                      activeFilters.subject.forEach((subject) =>
                        params.append("subject", subject)
                      );
                    }

                    const icalUrl = `${GOOGLE_ICAL_BASE_URL}/api/ical?${params.toString()}`;
                    console.log("📥 Mobile downloading from:", icalUrl);

                    // Fetch the iCal content
                    const response = await fetch(icalUrl);
                    if (!response.ok) {
                      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    
                    const icalContent = await response.text();
                    console.log("📄 Mobile downloaded content length:", icalContent.length);
                    
                    // Validate content
                    if (!icalContent.includes("BEGIN:VCALENDAR")) {
                      throw new Error("Invalid iCal content received");
                    }
                    
                    // Create blob and download
                    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `upv-exams-${new Date().toISOString().slice(0, 10)}.ics`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    toast({
                      title: "Download Started",
                      description: `Downloaded ${(icalContent.match(/BEGIN:VEVENT/g) || []).length} exams to your device.`,
                    });
                  } catch (error) {
                    console.error("Error downloading iCal:", error);
                    toast({
                      title: "Download Failed",
                      description: error instanceof Error ? error.message : "Please try again later.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                <span>Download .ics</span>
              </DropdownMenuItem>
              {/* Development: Manual iCal download */}
              {process.env.NODE_ENV === "development" && (
                <DropdownMenuItem
                  disabled={exams.length === 0}
                  onClick={() => {
                    import("@/lib/utils").then(
                      ({ generateICalContent, downloadICalFile }) => {
                        const icalContent = generateICalContent(exams, {
                          calendarName: "UPV Exams (Dev)",
                          timeZone: "Europe/Madrid",
                          reminderMinutes: [24 * 60, 60],
                        });
                        downloadICalFile(icalContent, "upv-exams-dev.ics");
                      }
                    );
                  }}
                  className="text-orange-600"
                >
                  <Download className="mr-2 h-4 w-4" />
                  <span>Dev Download .ics</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Add SaveCalendarDialog component */}
      <SaveCalendarDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        filters={activeFilters}
        onSave={handleSaveCalendar}
        // existingNames={existingNames} // This state was removed, so this line is removed
      />

      <AnimatePresence mode="wait">
        {view === "calendar" ? (
          <motion.div
            key="calendar-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <TooltipProvider>
                {visibleMonths.map((monthIndex) => {
                  const month = months[monthIndex];
                  if (!month) return null;

                  return (
                    <Card
                      key={`${month.name}-${month.year}`}
                      className="overflow-hidden transition-all duration-300 hover:shadow-lg"
                    >
                      <CardHeader className="bg-muted/30 py-4">
                        <CardTitle className="text-center text-lg font-medium tracking-tight">
                          {month.name} {month.year}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium">
                          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(
                            (day) => (
                              <div key={day} className="py-1">
                                {day}
                              </div>
                            )
                          )}
                        </div>
                        <div className="grid grid-cols-7 gap-1.5 text-center text-sm">
                          {Array.from({ length: month.startDay }).map(
                            (_, i) => (
                              <div
                                key={`empty-start-${i}`}
                                className="rounded-md bg-muted/30 p-2"
                              ></div>
                            )
                          )}

                          {Array.from({ length: month.days }).map((_, i) => {
                            const day = i + 1;
                            const isSelected =
                              selectedDay?.month === month.name &&
                              selectedDay?.day === day;
                            const dayHasExam = hasExam(month.name, day);

                            return (
                              <Tooltip key={`day-${day}`} delayDuration={150}>
                                <TooltipTrigger asChild>
                                  <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ duration: 0.1 }}
                                    className={`relative rounded-md p-2 transition-all cursor-pointer ${
                                      isSelected
                                        ? "bg-primary text-primary-foreground shadow-md"
                                        : dayHasExam
                                        ? "bg-primary/10 font-medium text-primary"
                                        : "hover:bg-accent"
                                    }`}
                                    onClick={() =>
                                      handleDayClick(month.name, day)
                                    }
                                    title={`${month.name} ${day}, ${
                                      month.year
                                    }${dayHasExam ? " - Has exams" : ""}`}
                                  >
                                    {day}
                                    {dayHasExam && (
                                      <span className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary"></span>
                                    )}
                                  </motion.div>
                                </TooltipTrigger>
                                {dayHasExam && (
                                  <TooltipContent
                                    side="top"
                                    align="center"
                                    className={styles.examTooltip}
                                    sideOffset={8}
                                    avoidCollisions={true}
                                  >
                                    <div className="p-0">
                                      <div className="bg-primary/10 px-3 py-2 text-xs font-medium text-primary flex items-center justify-between border-b border-primary/10">
                                        <span>
                                          {month.name} {day}, {month.year}
                                        </span>
                                        <span className={styles.examCount}>
                                          {
                                            exams.filter((exam) => {
                                              const dateString =
                                                formatDateString(
                                                  month.year,
                                                  month.monthNumber,
                                                  day
                                                );
                                              return exam.date === dateString;
                                            }).length
                                          }{" "}
                                          exams
                                        </span>
                                      </div>

                                      <div className={styles.scrollArea}>
                                        <div className="p-2">
                                          {exams
                                            .filter((exam) => {
                                              const dateString =
                                                formatDateString(
                                                  month.year,
                                                  month.monthNumber,
                                                  day
                                                );
                                              return exam.date === dateString;
                                            })
                                            .map((exam) => (
                                              <div
                                                key={exam.id}
                                                className={styles.examCard}
                                              >
                                                <div className="mb-1 font-medium">
                                                  {exam.subject}
                                                </div>
                                                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                                                  <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {exam.time}
                                                  </span>
                                                  <span className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {exam.location ||
                                                      "No location"}
                                                  </span>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                  {exam.school && (
                                                    <Badge
                                                      variant="outline"
                                                      className="text-xs"
                                                    >
                                                      {exam.school}
                                                    </Badge>
                                                  )}
                                                  {exam.degree && (
                                                    <Badge
                                                      variant="outline"
                                                      className="text-xs"
                                                    >
                                                      {exam.degree}
                                                    </Badge>
                                                  )}
                                                  <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                  >
                                                    {exam.year || "?"} Year
                                                  </Badge>
                                                  <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                  >
                                                    Sem. {exam.semester || "?"}
                                                  </Badge>
                                                  {exam.code && (
                                                    <Badge
                                                      variant="secondary"
                                                      className="text-xs"
                                                    >
                                                      Code: {exam.code}
                                                    </Badge>
                                                  )}
                                                </div>
                                              </div>
                                            ))}

                                          {exams.filter((exam) => {
                                            const dateString = formatDateString(
                                              month.year,
                                              month.monthNumber,
                                              day
                                            );
                                            return exam.date === dateString;
                                          }).length === 0 && (
                                            <div className="px-3 py-2 text-xs text-muted-foreground">
                                              No exam details available
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            );
                          })}

                          {Array.from({
                            length:
                              (7 - ((month.startDay + month.days) % 7)) % 7,
                          }).map((_, i) => (
                            <div
                              key={`empty-end-${i}`}
                              className="rounded-md bg-muted/30 p-2"
                            ></div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </TooltipProvider>
            </div>

            <div className="mt-8 rounded-lg border bg-card p-5 shadow-sm">
              <h3 className="mb-4 text-lg font-medium">
                Upcoming Exams Summary
              </h3>

              {exams.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {exams
                      .sort(
                        (a, b) =>
                          new Date(a.date).getTime() -
                          new Date(b.date).getTime()
                      ) // Sort by date ascending
                      .slice(0, 6) // Show first 6 upcoming exams
                      .map((exam) => (
                        <div key={exam.id} className={styles.examCard}>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{exam.subject}</span>
                            <Badge variant="outline">
                              {new Date(exam.date).toLocaleDateString()}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {exam.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {exam.location || "No location"}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="secondary" className="text-xs">
                              {exam.year} Year
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Sem. {exam.semester}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>

                  {exams.length > 6 && (
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setView("list")}
                        className="mt-2"
                      >
                        View All {exams.length} Exams
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mb-4 opacity-20" />
                  <p>No exams found for the selected filters.</p>
                  <p className="text-sm mt-2">
                    Try adjusting your filter criteria to see exams.
                  </p>
                </div>
              )}
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
            <ExamListView activeFilters={activeFilters} />
          </motion.div>
        )}
      </AnimatePresence>

      <SaveCalendarDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        filters={activeFilters}
        onSave={handleSaveCalendar}
        // existingNames={existingNames} // This state was removed, so this line is removed
      />
      
      <GoogleCalendarInstructions
        isOpen={instructionsOpen}
        onClose={() => setInstructionsOpen(false)}
        icalUrl={currentIcalUrl}
      />
    </motion.div>
  );
}
