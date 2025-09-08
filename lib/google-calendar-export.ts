/**
 * Centralized Google Calendar Export Utility
 * 
 * This module provides a consistent, reliable approach to opening Google Calendar
 * subscription links that properly handles browser popup policies and user gesture preservation.
 * 
 * Key architectural decisions:
 * 1. Always use window.open() directly instead of programmatic anchor clicks
 * 2. Preserve user gesture through synchronous URL generation when possible
 * 3. Standardize URL format across all implementations
 * 4. Provide proper error handling and user feedback
 */

export interface GoogleCalendarExportResult {
  success: boolean;
  message: string;
  popupBlocked?: boolean;
}

/**
 * Opens Google Calendar with the provided webcal subscription URL
 * 
 * @param webcalUrl - The webcal:// URL for the calendar subscription
 * @param options - Additional options for the popup window
 * @returns Result object indicating success/failure and user message
 */
export function openGoogleCalendarSubscription(
  webcalUrl: string,
  options: {
    windowFeatures?: string;
    fallbackMessage?: string;
  } = {}
): GoogleCalendarExportResult {
  try {
    // Validate webcal URL format
    if (!webcalUrl.startsWith('webcal://')) {
      throw new Error('Invalid webcal URL format');
    }

    // Use consistent Google Calendar URL pattern
    // /u/0/r is more reliable than /r for multi-account scenarios
    const googleCalendarUrl = `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(webcalUrl)}`;
    
    // Default window features for optimal user experience
    const windowFeatures = options.windowFeatures || 'noopener,noreferrer,width=800,height=600';
    
    console.log(`🔗 Opening Google Calendar: ${googleCalendarUrl}`);
    
    // CRITICAL: Use direct window.open() to preserve user gesture
    const popup = window.open(googleCalendarUrl, '_blank', windowFeatures);
    
    if (popup) {
      console.log('✅ Google Calendar popup opened successfully');
      return {
        success: true,
        message: "Abriendo Google Calendar...",
        popupBlocked: false
      };
    } else {
      console.warn('⚠️ Popup was blocked by browser');
      return {
        success: false,
        message: options.fallbackMessage || "Ventana bloqueada. Por favor permite ventanas emergentes para este sitio.",
        popupBlocked: true
      };
    }
  } catch (error) {
    console.error('❌ Error opening Google Calendar:', error);
    return {
      success: false,
      message: "Error al abrir Google Calendar",
      popupBlocked: false
    };
  }
}

/**
 * Generates webcal URL for calendar export
 * 
 * @param baseUrl - The base URL of the application
 * @param endpoint - The API endpoint path (e.g., '/api/ical')
 * @param params - Query parameters for the calendar subscription
 * @returns Formatted webcal:// URL
 */
export function generateWebcalUrl(
  baseUrl: string,
  endpoint: string,
  params: URLSearchParams
): string {
  const fullUrl = `${baseUrl}${endpoint}?${params.toString()}`;
  return fullUrl.replace(/^https?:/, 'webcal:');
}

/**
 * Builds reminder parameters in ISO-8601 format
 * 
 * @param reminders - Reminder configuration object
 * @returns Array of ISO-8601 duration strings
 */
export function buildReminderParams(reminders: {
  oneWeek?: boolean;
  oneDay?: boolean;
  oneHour?: boolean;
}): string[] {
  const reminderDurations: string[] = [];
  
  if (reminders.oneWeek) reminderDurations.push("-P7D");
  if (reminders.oneDay) reminderDurations.push("-P1D");
  if (reminders.oneHour) reminderDurations.push("-PT1H");
  
  // Provide defaults if no reminders selected
  if (reminderDurations.length === 0) {
    reminderDurations.push("-P1D", "-PT1H");
  }
  
  return reminderDurations;
}

/**
 * Complete Google Calendar export workflow
 * 
 * @param config - Export configuration
 * @returns Export result with success status and user message
 */
export function exportToGoogleCalendar(config: {
  baseUrl: string;
  endpoint: string;
  calendarName: string;
  filters: Record<string, string[]>;
  reminders: { oneWeek?: boolean; oneDay?: boolean; oneHour?: boolean; };
  windowFeatures?: string;
}): GoogleCalendarExportResult {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    params.set("name", config.calendarName);
    
    // Add filter parameters
    const filterKeys = ["school", "degree", "year", "semester", "subject"] as const;
    filterKeys.forEach((key) => {
      const values = config.filters[key];
      if (Array.isArray(values)) {
        values.forEach((value) => value && params.append(key, value));
      }
    });
    
    // Add reminder parameters
    const reminderDurations = buildReminderParams(config.reminders);
    reminderDurations.forEach((duration) => params.append("reminder", duration));
    
    // Generate webcal URL
    const webcalUrl = generateWebcalUrl(config.baseUrl, config.endpoint, params);
    
    // Open Google Calendar
    return openGoogleCalendarSubscription(webcalUrl, {
      windowFeatures: config.windowFeatures
    });
  } catch (error) {
    console.error('❌ Error in exportToGoogleCalendar:', error);
    return {
      success: false,
      message: "Error al procesar la exportación a Google Calendar"
    };
  }
}
