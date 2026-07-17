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
import { hasMeaningfulFilters } from "@/lib/filter-params";
import { examSubject, LOCALE_TAGS } from "@/lib/i18n";
import { useTranslations } from "@/hooks/use-translations";
import { detectConflicts } from "@/lib/exam-conflicts";
import { ExamConflictsBanner } from "@/components/exam-conflicts-banner";

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
import { openInGoogleCalendar, remindersToIso } from "@/lib/calendar-export";
import type { Exam } from "@/types/exam";

/**
 * Renders exams; it does not fetch them. The page resolves the filters in the
 * URL on the server and passes the results down, so the first paint already has
 * the calendar in it.
 */
export function CalendarDisplay({
  activeFilters = {},
  exams = [],
  loading = false,
  onExamsChange,
}: {
  activeFilters?: Record<string, string[]>;
  exams?: Exam[];
  loading?: boolean;
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
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [existingNames, setExistingNames] = useState<string[]>([]);
  const { user, syncToken } = useAuth();
  const { settings, updateSettings } = useSettings();
  const t = useTranslations();

  // month.name stays the internal identifier (used to match selected days); the
  // localized name is display-only, so switching language never breaks matching.
  const monthLabel = (monthNumber: number, year: number) =>
    new Date(year, monthNumber - 1, 1).toLocaleString(LOCALE_TAGS[settings.language], { month: "long" });
  const { toast } = useToast();

  // Check if ETSINF is in the schools filter
  const hasETSINFFilter = activeFilters?.school?.includes("ETSINF");

  // Notify parent component when exams change
  useEffect(() => {
    if (onExamsChange) {
      onExamsChange(exams);
    }
  }, [exams, onExamsChange]);

  // The calendar spans the academic year the exams actually fall in, which is
  // read from the data rather than the clock: browsing next year's exams in July
  // should not render last year's grid. With nothing selected there is no data
  // to read, so the current course is the sensible frame.
  const academicYear = useMemo(() => {
    const dates = [...new Set(exams.map((exam) => exam.date))].sort();
    const detected = dates.length ? detectAcademicYearFromExams(dates) : null;
    if (detected) return detected;
    const currentYear = getCurrentYear();
    return { startYear: currentYear, endYear: currentYear + 1 };
  }, [exams]);

  const months = useMemo(
    () => generateAcademicYearMonths(academicYear.startYear),
    [academicYear.startYear]
  );

  // Meaningful here specifically because it's expensive to get wrong: only
  // once filters are narrow (a semester + subjects, not a whole degree) does
  // "these exams clash" describe one student's real schedule.
  const conflicts = useMemo(
    () => (hasMeaningfulFilters(activeFilters) ? detectConflicts(exams) : []),
    [exams, activeFilters]
  );

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

  // Keyed by date so a day cell can be colored by its worst conflict without
  // re-scanning `conflicts` on every cell.
  const conflictByDate = useMemo(() => {
    const map = new Map<string, (typeof conflicts)[number]["severity"]>();
    for (const conflict of conflicts) map.set(conflict.date, conflict.severity);
    return map;
  }, [conflicts]);

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

  // Open Google Calendar with the current filters as a subscribable feed.
  const handleExport = () => {
    if (exams.length === 0) {
      toast({
        title: "No hay exámenes",
        description: "Selecciona tus filtros para generar tu calendario.",
        variant: "destructive",
      });
      return;
    }

    openInGoogleCalendar(activeFilters, {
      name: "Exámenes UPV",
      reminders: remindersToIso(settings.examReminders),
    });

    toast({
      title: "Abriendo Google Calendar",
      description: "Confirma en Google Calendar para añadir tus exámenes a tu cuenta.",
    });
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
            {t("calendar.title")}
            {academicYear && (
              <span className="text-lg font-normal text-muted-foreground ml-2">
                ({academicYear.startYear}/
                {academicYear.endYear.toString().slice(-2)})
              </span>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("calendar.found", { count: exams.length })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
                          <ViewToggle view={settings.viewMode} onChange={(view) => updateSettings({ viewMode: view })} />
          
          <Button
            variant="outline"
            size="sm"
            className="h-10 px-3 py-1.5 gap-2 rounded-sm text-sm font-medium"
            disabled={exams.length === 0}
            onClick={handleExport}
          >
            <Share2 className="h-4 w-4" />
            <span>{t("calendar.export")}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-10 px-3 py-1.5 gap-2 rounded-sm text-sm font-medium"
            disabled={exams.length === 0}
            onClick={openSaveDialog}
          >
            <Save className="h-4 w-4" />
            <span>{t("calendar.save")}</span>
          </Button>
        </div>
      </div>

      <ExamConflictsBanner conflicts={conflicts} />

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">{t("calendar.loading")}</span>
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
                          <span className="capitalize">{monthLabel(month.monthNumber, month.year)}</span> {month.year}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium">
                          {[t("day.mon"), t("day.tue"), t("day.wed"), t("day.thu"), t("day.fri"), t("day.sat"), t("day.sun")].map(
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
                            const dateString = formatDateString(
                              month.year,
                              month.monthNumber,
                              day
                            );
                            const conflictSeverity = conflictByDate.get(dateString);

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
                                    } ${
                                      conflictSeverity === "overlap"
                                        ? "ring-2 ring-destructive ring-inset"
                                        : conflictSeverity
                                        ? "ring-2 ring-amber-500/70 ring-inset"
                                        : ""
                                    }`}
                                    onClick={() =>
                                      handleDayClick(month.name, day)
                                    }
                                    title={`${month.name} ${day}, ${
                                      month.year
                                    }${dayHasExam ? " - Has exams" : ""}${
                                      conflictSeverity ? " - Conflicto de horario" : ""
                                    }`}
                                  >
                                    {day}
                                    {dayHasExam && (
                                      <span
                                        className={`absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${
                                          conflictSeverity === "overlap"
                                            ? "bg-destructive"
                                            : conflictSeverity
                                            ? "bg-amber-500"
                                            : "bg-primary"
                                        }`}
                                      ></span>
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
                                                  <span className="font-medium">{examSubject(exam, settings.language)}</span>
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
                <CardTitle className="text-base font-medium">{t("calendar.upcoming")}</CardTitle>
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
                                {examSubject(exam, settings.language)}
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
                    {!hasMeaningfulFilters(activeFilters) ? (
                      <>
                        <p>{t("calendar.selectCriteria")}</p>
                        <p className="text-sm mt-2">
                          {t("calendar.selectCriteriaHint")}
                        </p>
                      </>
                    ) : (
                      <>
                        <p>{t("calendar.noExams")}</p>
                        <p className="text-sm mt-2">{t("calendar.tryAdjust")}</p>
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
            <ExamListView exams={exams} isLoading={loading} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


