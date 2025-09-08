import { NextRequest, NextResponse } from "next/server";
import { getExams } from "@/actions/exam-actions";
import { generateICalContent } from "@/lib/utils";

// Build filters object from query params
function buildFilters(searchParams: URLSearchParams): Record<string, string[]> {
  const multiParams = ["school", "degree", "year", "semester", "subject", "acronym"] as const;
  const filters: Record<string, string[]> = {};
  for (const key of multiParams) {
    const values = searchParams.getAll(key);
    if (values && values.length > 0) filters[key] = values.filter(Boolean);
  }
  return filters;
}

// Parse reminder durations like -P7D, -P1D, -PT2H, -PT30M
function parseReminderDurations(searchParams: URLSearchParams): number[] | undefined {
  const reminders = searchParams.getAll("reminder");
  if (!reminders || reminders.length === 0) return undefined;

  const minutes: number[] = [];
  for (const iso of reminders) {
    // Expect negative ISO-8601 durations; ignore positives
    if (!iso || !iso.startsWith("-P")) continue;
    // Strip leading '-'
    const dur = iso.slice(1);
    // Very small ISO-8601 parser for days/hours/minutes
    // Supports PnD, PTnH, PTnM, PTnHnM combinations
    const dMatch = dur.match(/P(\d+)D/i);
    const tMatch = dur.match(/T([0-9HMS]+)/i);
    let totalMinutes = 0;
    if (dMatch) totalMinutes += parseInt(dMatch[1], 10) * 24 * 60;
    if (tMatch) {
      const t = tMatch[1];
      const h = t.match(/(\d+)H/i);
      const m = t.match(/(\d+)M/i);
      if (h) totalMinutes += parseInt(h[1], 10) * 60;
      if (m) totalMinutes += parseInt(m[1], 10);
    }
    if (totalMinutes > 0) minutes.push(totalMinutes);
  }
  // Deduplicate and sort descending so larger lead times appear first
  return Array.from(new Set(minutes)).sort((a, b) => b - a);
}

// Handle CORS preflight requests
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    const calendarName = params.get("name") || "Recordatorios de exámenes";
    const filters = buildFilters(params);
    const reminderMinutes = parseReminderDurations(params);

    // Fetch exams matching filters
    const exams = await getExams(filters as any);

    // Generate ICS with VALARMs and Madrid timezone
    const ics = generateICalContent(exams as any, {
      calendarName,
      timeZone: "Europe/Madrid",
      // Fall back to defaults if none provided
      reminderMinutes: reminderMinutes ?? undefined,
      useUPVFormat: false,
    });

    return new NextResponse(ics, {
      status: 200,
      headers: {
        // Essential iCal headers
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `inline; filename=upv-exams.ics`,
        
        // Cache control for dynamic calendar content
        "Cache-Control": "no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        
        // CORS headers for cross-origin calendar subscription
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
        
        // Calendar-specific headers for better client recognition
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow",
        
        // Support for both webcal and https protocols
        "Link": `<webcal://${req.headers.get('host')}${req.nextUrl.pathname}${req.nextUrl.search}>; rel="alternate"; type="text/calendar"`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate ICS" },
      { status: 500 }
    );
  }
}


