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
 * Pre-opens a popup window immediately to preserve user gesture, then navigates to final URL
 * This is the most reliable approach for modern browsers with strict popup policies
 * 
 * @param options - Popup window configuration
 * @returns Popup window object or null if blocked
 */
export function preOpenPopupWindow(options: {
  windowFeatures?: string;
  loadingUrl?: string;
} = {}): Window | null {
  const windowFeatures = options.windowFeatures || 'noopener,noreferrer,width=800,height=600';
  const loadingUrl = options.loadingUrl || 'about:blank';
  
  console.log('🚀 Pre-opening popup window to preserve user gesture');
  
  // CRITICAL: Open popup immediately while user gesture is still active
  const popup = window.open(loadingUrl, '_blank', windowFeatures);
  
  if (popup) {
    console.log('✅ Popup pre-opened successfully');
    
    // Optional: Show loading content
    if (loadingUrl === 'about:blank') {
      popup.document.write(`
        <html>
          <head><title>Cargando Google Calendar...</title></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align: center; padding: 50px;">
            <div>
              <h2>🔄 Abriendo Google Calendar</h2>
              <p>Espera un momento mientras preparamos tu calendario...</p>
            </div>
          </body>
        </html>
      `);
    }
  } else {
    console.warn('⚠️ Popup was blocked during pre-opening');
  }
  
  return popup;
}

/**
 * Navigates a pre-opened popup to the Google Calendar subscription URL
 * 
 * @param popup - The pre-opened popup window
 * @param webcalUrl - The webcal:// URL for the calendar subscription
 * @returns Success status
 */
export function navigatePopupToGoogleCalendar(
  popup: Window | null, 
  webcalUrl: string
): GoogleCalendarExportResult {
  try {
    if (!popup || popup.closed) {
      return {
        success: false,
        message: "Ventana cerrada antes de completar la navegación",
        popupBlocked: true
      };
    }

    // Validate webcal URL format
    if (!webcalUrl.startsWith('webcal://')) {
      throw new Error('Invalid webcal URL format');
    }

    // Use consistent Google Calendar URL pattern
    const googleCalendarUrl = `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(webcalUrl)}`;
    
    console.log(`🔗 Navigating popup to Google Calendar: ${googleCalendarUrl}`);
    
    // Navigate the pre-opened popup to the final URL
    popup.location.href = googleCalendarUrl;
    
    return {
      success: true,
      message: "Abriendo Google Calendar...",
      popupBlocked: false
    };
  } catch (error) {
    console.error('❌ Error navigating popup to Google Calendar:', error);
    
    // Try to close the popup if there was an error
    if (popup && !popup.closed) {
      popup.close();
    }
    
    return {
      success: false,
      message: "Error al abrir Google Calendar",
      popupBlocked: false
    };
  }
}

/**
 * Opens Google Calendar with the provided webcal subscription URL
 * Uses pre-popup strategy for maximum browser compatibility
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
  // Immediate popup opening to preserve user gesture
  const popup = preOpenPopupWindow({
    windowFeatures: options.windowFeatures
  });
  
  if (!popup) {
    console.warn('⚠️ Popup was blocked by browser');
    return {
      success: false,
      message: options.fallbackMessage || "Ventana bloqueada. Por favor permite ventanas emergentes para este sitio.",
      popupBlocked: true
    };
  }
  
  // Navigate to final URL (can be done after DOM operations)
  return navigatePopupToGoogleCalendar(popup, webcalUrl);
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
 * Advanced Google Calendar export with pre-popup strategy
 * Opens popup immediately to preserve user gesture, then handles URL generation
 * 
 * @param config - Export configuration  
 * @returns Object with popup window and completion promise
 */
export function exportToGoogleCalendarAdvanced(config: {
  baseUrl: string;
  endpoint: string;
  calendarName: string;
  filters: Record<string, string[]>;
  reminders: { oneWeek?: boolean; oneDay?: boolean; oneHour?: boolean; };
  windowFeatures?: string;
}): {
  popup: Window | null;
  complete: () => GoogleCalendarExportResult;
} {
  // CRITICAL: Open popup IMMEDIATELY before any other operations
  const popup = preOpenPopupWindow({
    windowFeatures: config.windowFeatures
  });
  
  if (!popup) {
    return {
      popup: null,
      complete: () => ({
        success: false,
        message: "Ventana bloqueada. Por favor permite ventanas emergentes para este sitio.",
        popupBlocked: true
      })
    };
  }
  
  // Return completion function that can be called after DOM operations
  const complete = (): GoogleCalendarExportResult => {
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
      
      // Navigate the pre-opened popup
      return navigatePopupToGoogleCalendar(popup, webcalUrl);
    } catch (error) {
      console.error('❌ Error completing Google Calendar export:', error);
      
      // Close popup on error
      if (popup && !popup.closed) {
        popup.close();
      }
      
      return {
        success: false,
        message: "Error al procesar la exportación a Google Calendar"
      };
    }
  };
  
  return { popup, complete };
}

/**
 * Complete Google Calendar export workflow (legacy version for backward compatibility)
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
