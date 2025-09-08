"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useSettings } from "@/context/settings-context";
import { getUserCalendars, deleteUserCalendar } from "@/actions/user-calendars";
import { getExams } from "@/actions/exam-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Eye,
  EyeOff,
  X,
  Clock,
  MapPin,
  List,
  CalendarDays,
  Loader2,
  Download,
  Copy,
  MoreHorizontal,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { getFreshAuthTokens } from "@/utils/auth-helpers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  ExamTooltipContent,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

interface SavedCalendar {
  id: string;
  name: string;
  filters: Record<string, string[]>;
  createdAt: string;
}

export default function MyCalendarsPage() {
  const { user } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [calendars, setCalendars] = useState<SavedCalendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCalendar, setSelectedCalendar] = useState<any>(null);
  const [selectedExams, setSelectedExams] = useState<any[]>([]);
  const [examsLoading, setExamsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCalendars = async () => {
      if (!user?.id) {
        setCalendars([]);
        setLoading(false);
        return;
      }

      try {
        // Get fresh auth tokens with automatic refresh
        const tokens = await getFreshAuthTokens();

        if (!tokens) {
          console.warn("No valid tokens available for fetching calendars");
          toast({
            title: "Error de Autenticación",
            description: "Por favor inicia sesión para ver tus calendarios.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const userCalendars = await getUserCalendars(
          user.id,
          tokens.accessToken,
          tokens.refreshToken
        );
        // Transform the data to match our interface
        const transformedCalendars = userCalendars.map((cal: any) => {
          // Ensure filters are properly formatted
          let filters = cal.filters || {};

          // Handle case where filters might be stored as a string (shouldn't happen but just in case)
          if (typeof filters === "string") {
            try {
              filters = JSON.parse(filters);
            } catch (e) {
              console.error("Error parsing filters for calendar:", cal.name, e);
              filters = {};
            }
          }

          // Ensure all filter values are arrays
          if (typeof filters === "object" && filters !== null) {
            Object.keys(filters).forEach((key) => {
              if (filters[key] && !Array.isArray(filters[key])) {
                filters[key] = [filters[key]];
              }
              // Remove empty arrays
              if (Array.isArray(filters[key]) && filters[key].length === 0) {
                delete filters[key];
              }
            });
          }

          console.log("🔧 [DEBUG] Transformed calendar filters:", {
            calendarName: cal.name,
            originalFilters: cal.filters,
            transformedFilters: filters,
          });

          return {
            id: cal.id,
            name: cal.name,
            filters: filters,
            createdAt: cal.created_at,
          };
        });
        setCalendars(transformedCalendars);
      } catch (error) {
        console.error("Error fetching calendars:", error);
        toast({
          title: "Error",
          description: "Error al cargar tus calendarios guardados.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCalendars();
  }, [user?.id, toast]);

  async function handleViewCalendar(calendar: any) {
    // If the same calendar is already selected, toggle it off
    if (selectedCalendar?.id === calendar.id) {
      setSelectedCalendar(null);
      setSelectedExams([]);
      return;
    }

    setExamsLoading(true);
    setSelectedCalendar(calendar);

    try {
      console.log(
        "🔄 Fetching exams for calendar:",
        calendar.name,
        "with filters:",
        calendar.filters
      );

      // Debug: Log detailed filter information
      console.log("🔍 [DEBUG] Calendar filter details:", {
        filtersType: typeof calendar.filters,
        filtersKeys: Object.keys(calendar.filters || {}),
        filtersValues: calendar.filters,
        filtersStringified: JSON.stringify(calendar.filters),
      });

      // Ensure filters are in the correct format
      let processedFilters = calendar.filters || {};

      // Validate and clean up filters if needed
      if (typeof processedFilters === "object" && processedFilters !== null) {
        // Ensure all filter values are arrays
        Object.keys(processedFilters).forEach((key) => {
          if (processedFilters[key] && !Array.isArray(processedFilters[key])) {
            processedFilters[key] = [processedFilters[key]];
          }
        });

        console.log("🔧 [DEBUG] Processed filters:", processedFilters);
      }

      const exams = await getExams(processedFilters);
      console.log(
        `✅ Fetched ${exams.length} exams for calendar:`,
        calendar.name
      );

      // Debug: Log sample exam data if no exams found
      if (exams.length === 0) {
        console.log(
          "⚠️ [DEBUG] No exams found - this might indicate a filter issue"
        );
        console.log(
          "🔍 [DEBUG] Trying to fetch all exams without filters for comparison..."
        );

        try {
          const allExams = await getExams({});
          console.log(`📊 [DEBUG] Total exams in database: ${allExams.length}`);
          if (allExams.length > 0) {
            console.log("📋 [DEBUG] Sample exam data:", allExams.slice(0, 3));
          }
        } catch (debugError) {
          console.error("❌ [DEBUG] Error fetching all exams:", debugError);
        }
      }

      setSelectedExams(exams);

      // Scroll to exams section after a short delay
      setTimeout(() => {
        const examsSection = document.getElementById("exams-section");
        if (examsSection) {
          examsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } catch (error) {
      console.error("❌ Error fetching exams for calendar:", error);
      setSelectedExams([]);
    } finally {
      setExamsLoading(false);
    }
  }

  function closeExamsView() {
    setSelectedCalendar(null);
    setSelectedExams([]);
  }

  // Group exams by month for calendar view
  function groupExamsByMonth(exams: any[]) {
    const monthNames = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    const grouped: Record<string, any[]> = {};

    exams.forEach((exam) => {
      const date = new Date(exam.date);
      const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(exam);
    });

    // Sort exams within each month by date
    Object.keys(grouped).forEach((month) => {
      grouped[month].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    });

    return grouped;
  }

  // Generate calendar grid for a specific month and year
  function generateCalendarGrid(year: number, month: number) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Get starting day of week (0 = Sunday, 1 = Monday, etc.)
    // Convert to Monday-first format (0 = Monday, 6 = Sunday)
    let startDay = firstDay.getDay() - 1;
    if (startDay === -1) startDay = 6;

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  }

  // Get exams for a specific date
  function getExamsForDate(
    exams: any[],
    year: number,
    month: number,
    day: number
  ) {
    // Create target date string in YYYY-MM-DD format
    // Note: month is already 0-indexed from indexOf(), so we need to add 1 for the date string
    const monthStr = (month + 1).toString().padStart(2, "0");
    const dayStr = day.toString().padStart(2, "0");
    const targetDate = `${year}-${monthStr}-${dayStr}`;

    console.log("🔍 [DEBUG] getExamsForDate:", {
      year,
      month: month + 1, // Show 1-indexed month for clarity
      day,
      targetDate,
      examDates: exams.slice(0, 3).map((e) => e.date),
    });

    return exams.filter((exam) => exam.date === targetDate);
  }

  const handleDelete = async (calendarId: string, calendarName: string) => {
    if (!user?.id) return;

    setDeletingId(calendarId);
    try {
      // Get fresh auth tokens with automatic refresh
      const tokens = await getFreshAuthTokens();

      if (!tokens) {
        toast({
          title: "Error de Autenticación",
          description: "Por favor inicia sesión nuevamente.",
          variant: "destructive",
        });
        return;
      }

      await deleteUserCalendar(
        calendarId,
        user.id,
        tokens.accessToken,
        tokens.refreshToken
      );

      setCalendars((prev) => prev.filter((cal) => cal.id !== calendarId));
      
      // If the deleted calendar was being viewed, close the view
      if (selectedCalendar?.id === calendarId) {
        setSelectedCalendar(null);
        setSelectedExams([]);
      }
      
      toast({
        title: "¡Éxito!",
        description: `Calendario "${calendarName}" eliminado correctamente.`,
      });
    } catch (error) {
      console.error("Error deleting calendar:", error);
      toast({
        title: "Error",
        description: "Error al eliminar el calendario.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const exportExamsToGoogleCalendar = async (calendar: SavedCalendar) => {
    try {
      console.log("🔄 Starting Google Calendar export for calendar:", calendar.name);

      // Use production domain instead of localhost to prevent Google Calendar refresh loops
      let baseUrl = window.location.origin;

      // If we're in development or localhost, use a production URL
      if (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) {
        // Try to get production URL from environment or use a default
        baseUrl =
          process.env.NEXT_PUBLIC_SITE_URL || "https://upv-cal.vercel.app";
      }

      // Construct iCal calendar feed URL using webcal protocol for better calendar app integration
      const icalUrl = `${baseUrl}/api/calendars/${calendar.id}/ical`;
      const calendarFeed = icalUrl.replace(/^https?:/, "webcal:");

      console.log("📅 Generated iCal URLs:", {
        icalUrl,
        calendarFeed
      });

      // Test the iCal URL first to make sure it's working
      console.log("🧪 Testing iCal URL accessibility:", icalUrl);
      
      try {
        const testResponse = await fetch(icalUrl, { method: 'HEAD' });
        console.log("📊 iCal URL test result:", {
          status: testResponse.status,
          statusText: testResponse.statusText,
          headers: Object.fromEntries(testResponse.headers.entries())
        });
      } catch (testError) {
        console.error("❌ iCal URL test failed:", testError);
        toast({
          title: "Error de Calendario",
          description: "No se pudo acceder al feed del calendario. Verifica que el calendario existe.",
          variant: "destructive",
        });
        return;
      }

      // Multiple Google Calendar URL patterns for compatibility
      const googleCalendarUrls = [
        // Modern pattern (current primary)
        `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(calendarFeed)}`,
        // Alternative modern pattern
        `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(calendarFeed)}`,
        // Direct ICS import pattern
        `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(icalUrl)}`,
      ];

      console.log("🔗 Testing Google Calendar URL patterns:", googleCalendarUrls);

      // Try the primary URL first
      const primaryGoogleCalendarUrl = googleCalendarUrls[0];
      console.log("🔗 Using primary Google Calendar URL:", primaryGoogleCalendarUrl);

      // Use anchor element approach to avoid popup blockers (same as export-button.tsx)
      const openCalendar = () => {
        const link = document.createElement('a');
        link.href = primaryGoogleCalendarUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', `Abrir Google Calendar para suscribirse al calendario ${calendar.name}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Fallback: if the primary doesn't work, provide manual options
        setTimeout(() => {
          if (confirm("¿No se abrió Google Calendar? Haz clic en OK para probar un método alternativo.")) {
            const fallbackLink = document.createElement('a');
            fallbackLink.href = googleCalendarUrls[1];
            fallbackLink.target = '_blank';
            fallbackLink.rel = 'noopener noreferrer';
            document.body.appendChild(fallbackLink);
            fallbackLink.click();
            document.body.removeChild(fallbackLink);
          }
        }, 3000);
      };

      openCalendar();

      toast({
        title: "Redirigiendo a Google Calendar",
        description: "Se abrirá Google Calendar con el enlace de suscripción para " + calendar.name,
      });
    } catch (error) {
      console.error("❌ Error opening Google Calendar:", error);
      toast({
        title: "Error",
        description: "No se pudo abrir Google Calendar.",
        variant: "destructive",
      });
    }
  };

  const handleAppleCalendarExport = async (calendar: SavedCalendar) => {
    try {
      const baseUrl = window.location.origin;
      const icalUrl = `${baseUrl}/api/calendars/${calendar.id}/ical`;
      // Convert http/https to webcal protocol for Apple Calendar
      const webcalUrl = icalUrl.replace(/^https?:/, "webcal:");

      // Try to open with webcal protocol
      window.location.href = webcalUrl;

      toast({
        title: "Abriendo Apple Calendar",
        description:
          "Se intentará abrir Apple Calendar con el enlace de suscripción.",
      });
    } catch (error) {
      console.error("❌ Error opening Apple Calendar:", error);
      toast({
        title: "Error",
        description: "No se pudo abrir Apple Calendar.",
        variant: "destructive",
      });
    }
  };

  const handleDirectDownload = async (calendar: SavedCalendar) => {
    try {
      console.log(
        "📥 Starting direct iCal download for calendar:",
        calendar.name
      );

      // Fetch exams for this calendar
      const exams = await getExams(calendar.filters);

      if (exams.length === 0) {
        toast({
          title: "Sin exámenes",
          description:
            "No hay exámenes para exportar con los filtros actuales.",
          variant: "destructive",
        });
        return;
      }

      // Dynamically import the utils to avoid SSR issues
      const { generateICalContent } = await import("@/lib/utils");

      // Generate UPV-compatible iCal content
      const icalContent = generateICalContent(exams, {
        calendarName: calendar.name,
        useUPVFormat: true, // Use UPV-compatible format
      });

      // Create blob and download
      const blob = new Blob([icalContent], { type: "text/calendar" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${calendar.name
        .replace(/[^\w\s-]/g, "")
        .trim()}-${new Date().toISOString().slice(0, 10)}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "¡Descarga completa!",
        description: `Descargado "${calendar.name}.ics" con ${exams.length} exámenes en formato UPV.`,
      });
    } catch (error) {
      console.error("❌ Error downloading iCal:", error);
      toast({
        title: "Error",
        description: "Error al descargar el archivo iCal.",
        variant: "destructive",
      });
    }
  };

  const handleDevIcalDownload = async (calendar: SavedCalendar) => {
    try {
      console.log(
        "🔧 [DEV] Starting iCal download for calendar:",
        calendar.name
      );

      // Fetch exams for this calendar
      const exams = await getExams(calendar.filters);

      if (exams.length === 0) {
        toast({
          title: "[DEV] Sin exámenes",
          description:
            "No hay exámenes para exportar con los filtros actuales.",
          variant: "destructive",
        });
        return;
      }

      // Dynamically import the utils to avoid SSR issues
      const { generateICalContent, downloadICalFile } = await import(
        "@/lib/utils"
      );

      // Generate iCal content with dev marker
      const icalContent = generateICalContent(exams, {
        calendarName: `${calendar.name} (DEV)`,
        timeZone: "Europe/Madrid",
        reminderMinutes: [24 * 60, 60],
      });

      // Download the file
      downloadICalFile(icalContent, `${calendar.name}-dev.ics`);

      toast({
        title: "🔧 [DEV] ¡Descarga completa!",
        description: `Descargado "${calendar.name}-dev.ics" con ${exams.length} exámenes para inspección.`,
      });
    } catch (error) {
      console.error("❌ [DEV] Error downloading iCal:", error);
      toast({
        title: "[DEV] Error",
        description: "Error al descargar el archivo iCal para desarrollo.",
        variant: "destructive",
      });
    }
  };

  const handleCopyUrl = async (calendar: SavedCalendar) => {
    try {
      // Debug: Log calendar data to understand the filters
      console.log("🔍 [DEBUG] Calendar data for copy URL:", {
        id: calendar.id,
        name: calendar.name,
        filters: calendar.filters,
        filtersType: typeof calendar.filters,
        filtersKeys: Object.keys(calendar.filters || {}),
        createdAt: calendar.createdAt,
      });

      // Use production domain instead of localhost to prevent issues
      let baseUrl = window.location.origin;

      // If we're in development or localhost, use a production URL
      if (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) {
        // Try to get production URL from environment or use a default
        baseUrl =
          process.env.NEXT_PUBLIC_SITE_URL || "https://upv-cal.vercel.app";
      }

      // Generate the iCal subscription URL using the calendar ID to get the specific calendar with its filters
      const icalUrl = `${baseUrl}/api/calendars/${calendar.id}/ical`;

      console.log("🔗 [DEBUG] Generated iCal URL:", icalUrl);

      // Copy to clipboard
      await navigator.clipboard.writeText(icalUrl);

      toast({
        title: "¡URL copiada!",
        description:
          "El enlace de suscripción se ha copiado al portapapeles. Pégalo en Google Calendar para añadir la suscripción.",
      });
    } catch (error) {
      console.error("❌ Error copying URL:", error);
      toast({
        title: "Error",
        description: "No se pudo copiar la URL al portapapeles.",
        variant: "destructive",
      });
    }
  };

  const getFilterSummary = (filters: Record<string, string[]>) => {
    const filterEntries = Object.entries(filters).filter(
      ([_, values]) => values.length > 0
    );
    const totalFilters = filterEntries.reduce(
      (sum, [_, values]) => sum + values.length,
      0
    );

    if (totalFilters === 0) return "Sin filtros";

    const categories = filterEntries.map(([category, values]) => {
      const categoryNames: Record<string, string> = {
        schools: "Escuelas",
        degrees: "Titulaciones",
        years: "Cursos",
        subjects: "Asignaturas",
        departments: "Departamentos",
        types: "Tipos",
      };
      return `${values.length} ${categoryNames[category] || category}`;
    });

    return categories.join(", ");
  };

  // If not logged in, prompt to log in
  if (!user && !loading) {
    return (
      <div className="container py-10">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <h1 className="text-3xl font-bold">Mis Calendarios</h1>
          <p className="text-muted-foreground">
            Por favor inicia sesión para ver tus calendarios guardados.
          </p>
          <Button onClick={() => router.push("/")}>Volver al Inicio</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="opacity-100">
        <h1 className="text-center text-3xl font-bold tracking-tight mb-8">
          MIS CALENDARIOS
        </h1>

        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : calendars.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {calendars.map((calendar) => (
                <motion.div
                  key={calendar.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * calendars.indexOf(calendar) }}
                >
                  <Card
                    className={`overflow-hidden border-2 hover:shadow-md transition-all ${
                      selectedCalendar?.id === calendar.id
                        ? "ring-2 ring-primary ring-offset-2 border-primary"
                        : ""
                    }`}
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col h-[200px]">
                        <div className="flex-1 flex items-center justify-center p-6">
                          <h3 className="text-lg font-medium text-center">
                            {calendar.name}
                          </h3>
                        </div>

                        {/* Action buttons row */}
                        <div className="bg-muted/30 p-3 flex justify-between items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive/80"
                            onClick={() =>
                              handleDelete(calendar.id, calendar.name)
                            }
                            disabled={deletingId === calendar.id}
                          >
                            {deletingId === calendar.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>

                          <div className="flex items-center gap-1">
                            {/* View button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleViewCalendar(calendar)}
                              title={selectedCalendar?.id === calendar.id ? "Ocultar calendario" : "Ver calendario"}
                            >
                              {selectedCalendar?.id === calendar.id ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>

                            {/* Export options dropdown */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  title="Más opciones"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  onClick={() => exportExamsToGoogleCalendar(calendar)}
                                  className="flex items-center gap-2"
                                >
                                  <Image
                                    src="/google-cal.png"
                                    alt="Google Calendar"
                                    width={20}
                                    height={20}
                                    className="w-5 h-5"
                                  />
                                  <span>Google Calendar</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleAppleCalendarExport(calendar)}
                                  className="flex items-center gap-2"
                                >
                                  <Image
                                    src="/apple-cal.png"
                                    alt="Apple Calendar"
                                    width={14}
                                    height={14}
                                    className="w-3.5 h-3.5"
                                  />
                                  <span>Apple Calendar</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleCopyUrl(calendar)}
                                  className="flex items-center gap-2"
                                >
                                  <Copy className="h-4 w-4" />
                                  <span>Copiar URL</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDirectDownload(calendar)}
                                  className="flex items-center gap-2"
                                >
                                  <Download className="h-4 w-4" />
                                  <span>Descargar .ics</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 border rounded-lg bg-muted/10">
              <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-2" />
              <h3 className="text-lg font-medium mb-1">
                No hay calendarios guardados
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Aún no has guardado ningún calendario de exámenes.
              </p>
              <Button onClick={() => router.push("/")}>
                Crear un Calendario
              </Button>
            </div>
          )}
        </div>

        {/* Exams View Section */}
        <AnimatePresence>
          {selectedCalendar && (
            <motion.div
              id="exams-section"
              className="mt-12 space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">
                  Exámenes para "{selectedCalendar.name}"
                </h2>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border rounded-lg p-1">
                    <Button
                      variant={settings.viewMode === "calendar" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => updateSettings({ viewMode: "calendar" })}
                      className="h-8 px-3"
                    >
                      <CalendarDays className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={settings.viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => updateSettings({ viewMode: "list" })}
                      className="h-8 px-3"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" onClick={closeExamsView}>
                    <X className="h-4 w-4 mr-2" />
                    Cerrar
                  </Button>
                </div>
              </div>

              {examsLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : selectedExams.length > 0 ? (
                settings.viewMode === "calendar" ? (
                  <TooltipProvider>
                    <motion.div 
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {Object.entries(groupExamsByMonth(selectedExams)).map(
                        ([month, exams], monthArrayIndex) => {
                          // Extract year and month from the month key
                          const [monthName, yearStr] = month.split(" ");
                          const year = parseInt(yearStr);
                          const monthIndex = [
                            "Enero",
                            "Febrero",
                            "Marzo",
                            "Abril",
                            "Mayo",
                            "Junio",
                            "Julio",
                            "Agosto",
                            "Septiembre",
                            "Octubre",
                            "Noviembre",
                            "Diciembre",
                          ].indexOf(monthName);

                          const calendarDays = generateCalendarGrid(
                            year,
                            monthIndex
                          );
                          const weekDays = [
                            "Lun",
                            "Mar",
                            "Mié",
                            "Jue",
                            "Vie",
                            "Sáb",
                            "Dom",
                          ];

                          return (
                            <motion.div
                              key={month}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ 
                                delay: 0.1 * monthArrayIndex,
                                duration: 0.4,
                                ease: "easeOut"
                              }}
                            >
                              <Card className="overflow-hidden">
                                <CardHeader className="bg-muted/30 pb-2">
                                  <CardTitle className="text-sm font-semibold">
                                    {month}
                                  </CardTitle>
                                  <p className="text-xs text-muted-foreground">
                                    {exams.length}{" "}
                                    {exams.length === 1 ? "examen" : "exámenes"}
                                  </p>
                                </CardHeader>
                                <CardContent className="p-3">
                                  {/* Calendar Header */}
                                  <div className="grid grid-cols-7 gap-0.5 mb-1">
                                    {weekDays.map((day) => (
                                      <div
                                        key={day}
                                        className="text-center text-xs font-medium text-muted-foreground py-0.5"
                                      >
                                        {day}
                                      </div>
                                    ))}
                                  </div>

                                  {/* Calendar Grid */}
                                  <div className="grid grid-cols-7 gap-0.5">
                                    {calendarDays.map((day, index) => {
                                      if (day === null) {
                                        return (
                                          <div
                                            key={`empty-${index}`}
                                            className="h-14 border rounded"
                                          ></div>
                                        );
                                      }

                                      const dayExams = getExamsForDate(
                                        exams,
                                        year,
                                        monthIndex,
                                        day
                                      );
                                      const hasExams = dayExams.length > 0;

                                      const dayContent = (
                                        <div
                                          className={`h-14 border rounded p-0.5 flex flex-col items-center justify-between ${
                                            hasExams
                                              ? "bg-primary/10 border-primary/30"
                                              : "bg-background hover:bg-muted/20"
                                          } transition-colors`}
                                        >
                                          <div className="text-xs font-medium text-center">
                                            {day}
                                          </div>
                                          {hasExams && (
                                            <div className="w-full flex flex-col gap-0.5 min-h-0">
                                              {dayExams
                                                .slice(0, 1)
                                                .map((exam, examIndex) => (
                                                  <div
                                                    key={`${exam.id}-${examIndex}`}
                                                    className="text-xs bg-primary/20 text-primary px-1 py-0.5 rounded truncate text-center w-full"
                                                  >
                                                    {exam.acronym ||
                                                      exam.subject.substring(0, 4)}
                                                  </div>
                                                ))}
                                              {dayExams.length > 1 && (
                                                <div className="text-xs text-muted-foreground px-1 text-center w-full">
                                                  +{dayExams.length - 1}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );

                                      if (hasExams) {
                                        return (
                                          <Tooltip key={day}>
                                            <TooltipTrigger asChild>
                                              {dayContent}
                                            </TooltipTrigger>
                                            <ExamTooltipContent 
                                              side="top" 
                                              date={new Date(year, monthIndex, day)}
                                              exams={dayExams}
                                            />
                                          </Tooltip>
                                        );
                                      }

                                      return dayContent;
                                    })}
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        }
                      )}
                    </motion.div>
                  </TooltipProvider>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupExamsByMonth(selectedExams)).map(
                      ([month, exams]) => (
                        <Card key={month} className="overflow-hidden">
                          <CardHeader className="bg-muted/30">
                            <CardTitle className="text-xl font-semibold">
                              {month}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {exams.length}{" "}
                              {exams.length === 1 ? "examen" : "exámenes"}
                            </p>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="space-y-2">
                              {exams.map((exam, index) => (
                                <div
                                  key={`${exam.id}-${index}`}
                                  className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-muted/20 transition-colors"
                                >
                                  <div className="flex-1">
                                    <h4 className="font-medium text-sm mb-1">
                                      {exam.subject}
                                    </h4>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                      <span className="font-medium">
                                        {new Date(exam.date).toLocaleDateString(
                                          "es-ES",
                                          {
                                            weekday: "long",
                                            day: "numeric",
                                            month: "long",
                                          }
                                        )}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>{exam.time}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        <span>{exam.location}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs font-medium text-muted-foreground">
                                      {exam.school}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {exam.degree}
                                    </div>
                                    {exam.code && (
                                      <div className="text-xs text-muted-foreground">
                                        ({exam.code})
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    )}
                  </div>
                )
              ) : (
                <div className="text-center p-8 border rounded-lg bg-muted/10">
                  <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-2" />
                  <h3 className="text-lg font-medium mb-1">No hay exámenes</h3>
                  <p className="text-sm text-muted-foreground">
                    No se encontraron exámenes para los filtros de este
                    calendario.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
