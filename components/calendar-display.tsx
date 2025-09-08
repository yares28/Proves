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
import { ViewToggle } from "@/components/view-toggle";
import { ExamListView } from "@/components/exam-list-view";
import { getExams } from "@/actions/exam-actions";
import {
  formatDateString,
  getCurrentYear,
  getAcademicYearForMonth,
  detectAcademicYearFromExams,
  generateAcademicYearMonths,
} from "@/utils/date-utils";
import { SaveCalendarDialog } from "@/components/save-calendar-dialog";
import { ExportCalendarDialog } from "@/components/export-calendar-dialog";

import { useAuth } from "@/context/auth-context";
import { useSettings } from "@/context/settings-context";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import styles from "@/styles/tooltip.module.css";
import {
  saveUserCalendar,
  getUserCalendarNames,
} from "@/actions/user-calendars";
import { getCurrentSession, getFreshAuthTokens } from "@/utils/auth-helpers";
import type { Exam } from "@/types/exam";

// Default URL for SSR - will be updated on client
const DEFAULT_GOOGLE_ICAL_BASE_URL = "https://upv-cal.vercel.app";

export function CalendarDisplay({
  activeFilters = {},
  onExamsChange,
}: {
  activeFilters?: Record<string, string[]>;
  onExamsChange?: (exams: any[]) => void;
}) {
  const [selectedDay, setSelectedDay] = useState<{
    month: string;
    day: number;
  } | null>(null);
  const [selectedExams, setSelectedExams] = useState<any[]>([]);
  const [visibleMonths, setVisibleMonths] = useState<number[]>([
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
  ]); // Show all 12 months by default
  const [exams, setExams] = useState<any[]>([]);
  const [months, setMonths] = useState<any[]>([]);
  const [academicYear, setAcademicYear] = useState<{
    startYear: number;
    endYear: number;
  } | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [existingNames, setExistingNames] = useState<string[]>([]);
  const [googleIcalBaseUrl, setGoogleIcalBaseUrl] = useState(DEFAULT_GOOGLE_ICAL_BASE_URL);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, syncToken } = useAuth();
  const { settings, updateSettings } = useSettings();
  const { toast } = useToast();

  // Set the correct URL on client-side to avoid hydration mismatch
  useEffect(() => {
    const isLocalhost = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1');
    const baseUrl = isLocalhost ? window.location.origin : DEFAULT_GOOGLE_ICAL_BASE_URL;
    setGoogleIcalBaseUrl(baseUrl);
  }, []);

  // Check if ETSINF is in the schools filter
  const hasETSINFFilter = activeFilters?.school?.includes("ETSINF");

  // Log the active filters to debug
  useEffect(() => {
    console.log("CalendarDisplay - Active Filters:", activeFilters);
    console.log("ETSINF Filter Active:", hasETSINFFilter);
  }, [activeFilters, hasETSINFFilter]);

  // Notify parent component when exams change
  useEffect(() => {
    if (onExamsChange) {
      onExamsChange(exams);
    }
  }, [exams, onExamsChange]);

  // Check if filters are meaningful (beyond just school/degree)
  const hasMeaningfulFilters = () => {
    if (!activeFilters || Object.keys(activeFilters).length === 0) {
      return false;
    }
    
    // Check if there are any filters other than school and degree
    const meaningfulFilterKeys = Object.keys(activeFilters).filter(key => 
      key !== 'school' && key !== 'degree' && 
      activeFilters[key] && activeFilters[key].length > 0
    );
    
    return meaningfulFilterKeys.length > 0;
  };

  // Fetch exams when filters change
  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true);
      setError(null);
      
      // Only fetch exams if we have meaningful filters
      if (!hasMeaningfulFilters()) {
        console.log("CalendarDisplay - No meaningful filters selected, clearing exams");
        setExams([]);
        // Set up default months for current academic year
        const currentYear = getCurrentYear();
        const fallbackMonths = generateAcademicYearMonths(currentYear);
        setMonths(fallbackMonths);
        setAcademicYear({ startYear: currentYear, endYear: currentYear + 1 });
        setLoading(false);
        return;
      }

      try {
        console.log(
          "CalendarDisplay - Fetching exams with filters:",
          activeFilters
        );
        // Pass filters directly to getExams
        const data = (await getExams(activeFilters)) as Exam[];
        console.log(
          `CalendarDisplay - Fetched ${data.length} exams. Sample:`,
          data.slice(0, 2)
        );

        // For debugging - log all unique dates in the exam data
        if (data.length > 0) {
          const uniqueDates: string[] = [
            ...new Set(data.map((exam: Exam) => exam.date)),
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
        setError("Error al cargar los exámenes");
        setExams([]);
        // Set fallback months even on error
        const currentYear = getCurrentYear();
        const fallbackMonths = generateAcademicYearMonths(currentYear);
        setMonths(fallbackMonths);
        setAcademicYear({ startYear: currentYear, endYear: currentYear + 1 });
      } finally {
        setLoading(false);
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
            setExistingNames([]);
            return;
          }

          const names = await getUserCalendarNames(
            user.id,
            tokens.accessToken,
            tokens.refreshToken
          );
          setExistingNames(names);
        } catch (error) {
          console.error("Error fetching calendar names:", error);
          setExistingNames([]);

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
      const names = await getUserCalendarNames(
        user.id,
        session.access_token,
        session.refresh_token
      );
      setExistingNames(names);

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

  // Export to Google Calendar with modern URL pattern
  const exportToGoogleCalendar = async (calendarName: string) => {
    try {
      console.log("🔄 Starting Google Calendar export with name:", calendarName);
      console.log("🔍 Active filters:", activeFilters);
      console.log("🔍 Active filters details:", {
        totalCategories: Object.keys(activeFilters).length,
        schools: activeFilters.school?.length || 0,
        degrees: activeFilters.degree?.length || 0,
        years: activeFilters.year?.length || 0,
        semesters: activeFilters.semester?.length || 0,
        subjects: activeFilters.subject?.length || 0,
        hasAnyFilters: Object.values(activeFilters).some(arr => arr && arr.length > 0)
      });

      // Generate UPV-style token URL
      const { generateUPVTokenUrl } = await import("@/lib/utils");
      console.log("📦 Utils imported successfully");
      
      const tokenPath = await generateUPVTokenUrl(activeFilters, calendarName);
      console.log("🔑 Generated token path:", tokenPath);
      
      const icalUrl = `${googleIcalBaseUrl}${tokenPath}`;
      console.log("🌐 Full iCal URL:", icalUrl);

      // Skip HEAD request validation due to serverless token storage limitations
      // The token storage uses in-memory Map which doesn't persist across serverless function instances
      console.log("⚡ Skipping HEAD request validation for serverless compatibility");
      console.log("🌐 Generated iCal URL:", icalUrl);
      console.log("📱 This URL will be used directly for Google Calendar subscription");

      // Construct calendar feed URL using webcal protocol for better calendar app integration
      const calendarFeed = icalUrl.replace(/^https?:/, "webcal:");
      console.log("📱 Calendar feed URL:", calendarFeed);

      // Use consistent Google Calendar URL pattern with /u/0/r
      const googleCalendarUrl = `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(
        calendarFeed
      )}`;
      console.log("🔗 Final Google Calendar URL:", googleCalendarUrl);

      // CRITICAL: Use consistent popup approach with user gesture preservation
      const popup = window.open(googleCalendarUrl, "_blank", "noopener,noreferrer,width=800,height=600");
      
      if (popup) {
        console.log("✅ Google Calendar popup opened successfully");
        toast({
          title: "Abriendo Google Calendar",
          description: "Se abrirá Google Calendar con el enlace de suscripción.",
        });
      } else {
        console.warn("⚠️ Popup was blocked");
        toast({
          title: "Ventana bloqueada",
          description: "Por favor permite ventanas emergentes para este sitio y vuelve a intentar.",
          variant: "destructive",
        });
      }
      
      console.log("✅ Google Calendar export completed successfully");
    } catch (error) {
      console.error("❌ Error in exportToGoogleCalendar:", error);
      console.error("📋 Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      
      toast({
        title: "Error de exportación",
        description: error instanceof Error ? error.message : "No se pudo abrir Google Calendar.",
        variant: "destructive",
      });
      
      // Re-throw the error so the ExportCalendarDialog can handle it
      throw error;
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
                          <ViewToggle view={settings.viewMode} onChange={(view) => updateSettings({ viewMode: view })} />
          
          <Button
            variant="outline"
            size="sm"
            className="h-10 px-3 py-1.5 gap-2 rounded-sm text-sm font-medium"
            disabled={exams.length === 0}
            onClick={() => setExportDialogOpen(true)}
          >
            <Share2 className="h-4 w-4" />
            <span>Exportar</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-10 px-3 py-1.5 gap-2 rounded-sm text-sm font-medium"
            disabled={exams.length === 0}
            onClick={openSaveDialog}
          >
            <Save className="h-4 w-4" />
            <span>Guardar</span>
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando exámenes...</span>
        </div>
      )}

      {/* Add SaveCalendarDialog component */}
        <SaveCalendarDialog
          open={saveDialogOpen}
          onOpenChange={setSaveDialogOpen}
          filters={activeFilters}
          onSave={handleSaveCalendar}
          existingNames={existingNames}
        />

        {/* Add ExportCalendarDialog component */}
        <ExportCalendarDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          onExport={exportToGoogleCalendar}
        />

      <AnimatePresence mode="wait">
        {settings.viewMode === "calendar" ? (
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

                  // Check if this month has any exams
                  const monthHasExams = exams.some((exam) => {
                    const examDate = new Date(exam.date);
                    return examDate.getMonth() === month.monthNumber - 1 && 
                           examDate.getFullYear() === month.year;
                  });

                  // Skip rendering if month has no exams
                  if (!monthHasExams) return null;

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
                                                <div className="flex justify-between mb-1">
                                                  <span className="font-medium">{exam.name || exam.subject}</span>
                                                  <Badge variant="outline" className="text-xs">
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
                                                    {exam.year || "?"} Year
                                                  </Badge>
                                                  <Badge variant="secondary" className="text-xs">
                                                    Sem. {exam.semester || "?"}
                                                  </Badge>
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
            <Card className="mt-8 border bg-card/60 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/50">
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle className="text-base font-medium">Próximos exámenes</CardTitle>
                {exams.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{exams.length}</Badge>
                )}
              </CardHeader>
              <CardContent className="p-5">
                {exams.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {exams
                        .sort(
                          (a, b) =>
                            new Date(a.date).getTime() -
                            new Date(b.date).getTime()
                        )
                        .slice(0, 6)
                        .map((exam) => (
                          <div
                            key={exam.id}
                            className="group rounded-lg border bg-background/50 p-4 transition-colors hover:bg-accent"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <span className="font-medium leading-tight">
                                {exam.name || exam.subject}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {new Date(exam.date).toLocaleDateString()}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
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
                              <Badge variant="secondary" className="text-xs">{exam.year} Year</Badge>
                              <Badge variant="secondary" className="text-xs">Sem. {exam.semester}</Badge>
                            </div>
                          </div>
                        ))}
                    </div>

                    {exams.length > 6 && (
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateSettings({ viewMode: "list" })}
                          className="mt-2"
                        >
                          Ver los {exams.length} exámenes
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <Calendar className="h-12 w-12 mb-4 opacity-20" />
                    {!hasMeaningfulFilters() ? (
                      <>
                        <p>Selecciona tus criterios para ver el calendario</p>
                        <p className="text-sm mt-2">
                          Elige tu curso, cuatrimestre o asignaturas para ver tus exámenes.
                        </p>
                      </>
                    ) : (
                      <>
                        <p>No se han encontrado exámenes con los filtros seleccionados.</p>
                        <p className="text-sm mt-2">Prueba a ajustar los filtros.</p>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
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
    </motion.div>
  );
}


